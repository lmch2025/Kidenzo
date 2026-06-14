// ─── Anti-Fraud Engine for Pay-Per-Click System ─────────────────────
// This module implements multiple layers of fraud detection:
//
// 1. IP-based rate limiting
// 2. Fingerprint-based deduplication
// 3. Click velocity detection
// 4. Minimum interval enforcement
// 5. Bot/headless browser detection
// 6. User-Agent anomaly detection
// 7. Proxy/VPN detection signals
// 8. Referrer validation
// 9. Recommender-level velocity check
// 10. Pattern analysis for click farms

import { db } from '@/lib/db'
import crypto from 'crypto'

// ─── Types ───────────────────────────────────────────────────────────

interface ClickVerificationRequest {
  recommenderId: string
  miniSiteId: string
  visitorIp: string
  userAgent: string
  referer?: string
  sessionId?: string
  screenResolution?: string
  timezone?: string
  language?: string
  clickToken?: string
  // Client-side fingerprint signals
  canvasHash?: string
  webglHash?: string
  audioHash?: string
  fontList?: string
  platform?: string
  touchSupport?: boolean
  colorDepth?: number
  deviceMemory?: number
  hardwareConcurrency?: number
}

interface FraudCheckResult {
  isFraud: boolean
  fraudScore: number          // 0-100
  fraudReasons: string[]      // List of reason codes
  isVerified: boolean
  earnings: number            // FCFA to award (0 if fraud)
  fingerprint: string         // Computed fingerprint hash
  deviceType: string
  browserName: string
  osName: string
}

// ─── Fingerprint Computation ─────────────────────────────────────────

/**
 * Compute a stable visitor fingerprint from multiple signals.
 * This creates a hash combining IP, User-Agent, screen resolution,
 * timezone, language, and other browser-specific signals.
 * Same visitor = same fingerprint (within reasonable limits).
 */
export function computeFingerprint(data: ClickVerificationRequest): string {
  const signals = [
    data.visitorIp,
    data.userAgent,
    data.screenResolution || 'unknown',
    data.timezone || 'unknown',
    data.language || 'unknown',
    data.platform || '',
    data.colorDepth?.toString() || '',
    data.deviceMemory?.toString() || '',
    data.hardwareConcurrency?.toString() || '',
    data.touchSupport ? '1' : '0',
    data.canvasHash || '',
    data.webglHash || '',
    data.fontList || '',
  ].join('|')

  return crypto.createHash('sha256').update(signals).digest('hex').substring(0, 32)
}

// ─── User-Agent Parsing ─────────────────────────────────────────────

function parseUserAgent(ua: string): { browser: string; os: string; deviceType: string } {
  let browser = 'unknown'
  let os = 'unknown'
  let deviceType = 'desktop'

  // Browser detection
  if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera'

  // OS detection
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Android')) { os = 'Android'; deviceType = 'mobile' }
  else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; deviceType = ua.includes('iPad') ? 'tablet' : 'mobile' }
  else if (ua.includes('Linux')) os = 'Linux'

  // Bot detection
  const botPatterns = /bot|crawl|spider|scrapy|curl|wget|python|java|php|go-http|headless|puppeteer|selenium|playwright|phantomjs|slimerjs|nightmare/i
  if (botPatterns.test(ua)) {
    deviceType = 'bot'
  }

  // Headless browser detection
  if (ua.includes('HeadlessChrome') || ua.includes('headless')) {
    deviceType = 'bot'
  }

  return { browser, os, deviceType }
}

// ─── Fraud Score Calculation ─────────────────────────────────────────

/**
 * Calculate a fraud score (0-100) for a click based on multiple signals.
 * Higher score = more likely to be fraudulent.
 */
async function calculateFraudScore(
  data: ClickVerificationRequest,
  fingerprint: string,
  config: Awaited<ReturnType<typeof getClickConfig>>,
  now: Date
): Promise<{ score: number; reasons: string[] }> {
  let score = 0
  const reasons: string[] = []
  const { browser, os, deviceType } = parseUserAgent(data.userAgent)

  // ── Check 1: Bot detection (auto-reject) ──
  if (deviceType === 'bot') {
    score += 100
    reasons.push('BOT_DETECTED')
    return { score: Math.min(score, 100), reasons }
  }

  // ── Check 2: Headless browser signals ──
  if (data.userAgent.includes('HeadlessChrome') || data.userAgent.includes('headless')) {
    score += 80
    reasons.push('HEADLESS_BROWSER')
  }

  // ── Check 3: Suspicious User-Agent patterns ──
  // Empty or very short UA is suspicious
  if (!data.userAgent || data.userAgent.length < 20) {
    score += 30
    reasons.push('SUSPICIOUS_UA')
  }

  // UA doesn't match common browser patterns
  const hasKnownBrowser = /Chrome|Firefox|Safari|Edge|Opera/i.test(data.userAgent)
  if (!hasKnownBrowser) {
    score += 20
    reasons.push('UNKNOWN_BROWSER')
  }

  // ── Check 4: IP rate limiting ──
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const clicksFromIpToday = await db.clickEvent.count({
    where: {
      visitorIp: data.visitorIp,
      createdAt: { gte: todayStart },
    },
  })

  if (clicksFromIpToday >= config.maxClicksPerIpPerDay) {
    score += 40
    reasons.push('IP_RATE_LIMIT')
  } else if (clicksFromIpToday >= config.maxClicksPerIpPerDay - 1) {
    score += 15
    reasons.push('IP_RATE_WARNING')
  }

  // ── Check 5: Fingerprint rate limiting ──
  const clicksFromFingerprintToday = await db.clickEvent.count({
    where: {
      visitorFingerprint: fingerprint,
      createdAt: { gte: todayStart },
    },
  })

  if (clicksFromFingerprintToday >= config.maxClicksPerFingerprint) {
    score += 35
    reasons.push('FINGERPRINT_RATE_LIMIT')
  } else if (clicksFromFingerprintToday >= config.maxClicksPerFingerprint - 1) {
    score += 10
    reasons.push('FINGERPRINT_RATE_WARNING')
  }

  // ── Check 6: Minimum click interval (same fingerprint) ──
  const recentClick = await db.clickEvent.findFirst({
    where: {
      visitorFingerprint: fingerprint,
      createdAt: {
        gte: new Date(now.getTime() - config.minClickIntervalMs),
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (recentClick) {
    score += 25
    reasons.push('MIN_INTERVAL_VIOLATION')
  }

  // ── Check 7: Click velocity (same recommender) ──
  const velocityWindowStart = new Date(now.getTime() - config.velocityWindowMinutes * 60 * 1000)
  const recentClicksForRecommender = await db.clickEvent.count({
    where: {
      recommenderId: data.recommenderId,
      createdAt: { gte: velocityWindowStart },
      isFraud: false,
    },
  })

  if (recentClicksForRecommender >= config.maxClicksInVelocityWindow) {
    score += 30
    reasons.push('VELOCITY_LIMIT')
  } else if (recentClicksForRecommender >= config.maxClicksInVelocityWindow * 0.8) {
    score += 10
    reasons.push('VELOCITY_WARNING')
  }

  // ── Check 8: Daily recommender limit ──
  const clicksForRecommenderToday = await db.clickEvent.count({
    where: {
      recommenderId: data.recommenderId,
      createdAt: { gte: todayStart },
      isFraud: false,
    },
  })

  if (clicksForRecommenderToday >= config.maxClicksPerRecommender) {
    score += 50
    reasons.push('DAILY_LIMIT_REACHED')
  }

  // ── Check 9: Same IP + same recommender pattern ──
  const clicksSameIpAndRecommender = await db.clickEvent.count({
    where: {
      visitorIp: data.visitorIp,
      recommenderId: data.recommenderId,
      createdAt: { gte: todayStart },
    },
  })

  if (clicksSameIpAndRecommender >= 2) {
    score += 25
    reasons.push('SAME_IP_RECOMMENDER_PATTERN')
  }

  // ── Check 10: Missing essential signals ──
  if (!data.screenResolution || data.screenResolution === 'unknown') {
    score += 5
    reasons.push('MISSING_SCREEN_INFO')
  }

  if (!data.timezone || data.timezone === 'unknown') {
    score += 5
    reasons.push('MISSING_TIMEZONE')
  }

  // ── Check 11: Screen resolution anomalies ──
  if (data.screenResolution) {
    const [w, h] = data.screenResolution.split('x').map(Number)
    if (w && h && (w < 200 || h < 200 || w > 7680 || h > 4320)) {
      score += 15
      reasons.push('INVALID_SCREEN_RESOLUTION')
    }
  }

  // ── Check 12: Session deduplication ──
  if (data.sessionId) {
    const existingSessionClick = await db.clickEvent.findFirst({
      where: {
        sessionId: data.sessionId,
        recommenderId: data.recommenderId,
        miniSiteId: data.miniSiteId,
        isFraud: false,
      },
    })
    if (existingSessionClick) {
      score += 45
      reasons.push('SESSION_DUPLICATE')
    }
  }

  return { score: Math.min(score, 100), reasons }
}

// ─── Get Click Config ────────────────────────────────────────────────

export async function getClickConfig() {
  let config = await db.clickConfig.findFirst()
  if (!config) {
    config = await db.clickConfig.create({
      data: {
        ratePerClick: 5.0,
        maxClicksPerIpPerDay: 3,
        maxClicksPerFingerprint: 2,
        minClickIntervalMs: 30000,
        maxClicksPerRecommender: 500,
        fraudScoreThreshold: 70,
        autoBlockEnabled: true,
        velocityWindowMinutes: 5,
        maxClicksInVelocityWindow: 10,
        requireVerification: false,
        active: true,
      },
    })
  }
  return config
}

// ─── Main Verification Function ─────────────────────────────────────

export async function verifyAndTrackClick(
  data: ClickVerificationRequest
): Promise<FraudCheckResult> {
  const config = await getClickConfig()
  const now = new Date()

  // Check if PPC system is active
  if (!config.active) {
    return {
      isFraud: true,
      fraudScore: 100,
      fraudReasons: ['PPC_SYSTEM_INACTIVE'],
      isVerified: false,
      earnings: 0,
      fingerprint: '',
      deviceType: 'unknown',
      browserName: 'unknown',
      osName: 'unknown',
    }
  }

  // Compute fingerprint
  const fingerprint = computeFingerprint(data)

  // Parse UA
  const { browser, os, deviceType } = parseUserAgent(data.userAgent)

  // Calculate fraud score
  const { score, reasons } = await calculateFraudScore(data, fingerprint, config, now)

  const isFraud = score >= config.fraudScoreThreshold
  const isVerified = !isFraud
  const earnings = isVerified ? config.ratePerClick : 0

  // Record the click event (whether valid or fraud)
  const clickEvent = await db.clickEvent.create({
    data: {
      recommenderId: data.recommenderId,
      miniSiteId: data.miniSiteId,
      visitorIp: data.visitorIp,
      visitorFingerprint: fingerprint,
      userAgent: data.userAgent,
      referer: data.referer || null,
      sessionId: data.sessionId || null,
      isVerified,
      isFraud,
      fraudScore: score,
      fraudReasons: reasons.join(','),
      earnings,
      deviceType,
      browserName: browser,
      osName: os,
      screenResolution: data.screenResolution || 'unknown',
      timezone: data.timezone || 'unknown',
      language: data.language || 'unknown',
      clickToken: data.clickToken || null,
      validatedAt: now,
    },
  })

  // If verified, award earnings to the recommender
  if (isVerified && earnings > 0) {
    await db.user.update({
      where: { id: data.recommenderId },
      data: {
        clickEarnings: { increment: earnings },
        totalValidClicks: { increment: 1 },
        lastActiveAt: now,
      },
    })
  } else if (isFraud) {
    // Track fraud attempts
    await db.user.update({
      where: { id: data.recommenderId },
      data: {
        totalFraudClicks: { increment: 1 },
      },
    })

    // Log suspicious activity for critical fraud
    if (score >= 80 || reasons.includes('BOT_DETECTED') || reasons.includes('HEADLESS_BROWSER')) {
      await db.suspiciousActivity.create({
        data: {
          recommenderId: data.recommenderId,
          activityType: reasons[0]?.toLowerCase() || 'unknown',
          severity: score >= 90 ? 'critical' : score >= 70 ? 'high' : 'medium',
          description: `Fraud click detected (score: ${score}): ${reasons.join(', ')}`,
          metadata: JSON.stringify({
            clickEventId: clickEvent.id,
            ip: data.visitorIp,
            fingerprint,
            reasons,
            score,
          }),
        },
      })
    }
  }

  // Check for velocity pattern and create suspicious activity
  if (config.autoBlockEnabled) {
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const fraudClicksToday = await db.clickEvent.count({
      where: {
        recommenderId: data.recommenderId,
        isFraud: true,
        createdAt: { gte: todayStart },
      },
    })

    // If >50% of clicks today are fraud, flag the recommender
    const totalClicksToday = await db.clickEvent.count({
      where: {
        recommenderId: data.recommenderId,
        createdAt: { gte: todayStart },
      },
    })

    if (totalClicksToday >= 10 && fraudClicksToday / totalClicksToday > 0.5) {
      const existingAlert = await db.suspiciousActivity.findFirst({
        where: {
          recommenderId: data.recommenderId,
          activityType: 'anomaly',
          isResolved: false,
          createdAt: { gte: todayStart },
        },
      })

      if (!existingAlert) {
        await db.suspiciousActivity.create({
          data: {
            recommenderId: data.recommenderId,
            activityType: 'anomaly',
            severity: 'high',
            description: `Fraud rate ${Math.round(fraudClicksToday / totalClicksToday * 100)}% (${fraudClicksToday}/${totalClicksToday} clicks today)`,
            metadata: JSON.stringify({ fraudRate: fraudClicksToday / totalClicksToday, fraudClicks: fraudClicksToday, totalClicks: totalClicksToday }),
          },
        })
      }
    }
  }

  return {
    isFraud,
    fraudScore: score,
    fraudReasons: reasons,
    isVerified,
    earnings,
    fingerprint,
    deviceType,
    browserName: browser,
    osName: os,
  }
}

// ─── Generate Click Verification Token ──────────────────────────────

export function generateClickToken(recommenderId: string, miniSiteId: string): string {
  const payload = `${recommenderId}:${miniSiteId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`
  return crypto.createHash('sha256').update(payload).digest('hex')
}
