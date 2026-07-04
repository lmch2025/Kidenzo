/**
 * cron-job.org API Client
 * Gère la création, mise à jour et consultation des cron jobs
 * pour les rappels de remboursement automatiques.
 *
 * API Docs: https://docs.cron-job.org/rest-api.html
 * - Endpoint: https://api.cron-job.org/
 * - Auth: Bearer token via CRONJOB_ORG_API_KEY
 * - Create: PUT /jobs
 * - Update: PATCH /jobs/<jobId>
 * - Delete: DELETE /jobs/<jobId>
 * - List:   GET /jobs
 * - History: GET /jobs/<jobId>/history
 *
 * Schedule format:
 *   hours: [-1] = every hour, [8, 12, 18] = specific hours
 *   minutes: [0] = at minute 0
 *   mdays: [-1] = every day
 *   months: [-1] = every month
 *   wdays: [-1] = every weekday
 */

const API_BASE = 'https://api.cron-job.org'

function getHeaders(): Record<string, string> {
  const apiKey = process.env.CRONJOB_ORG_API_KEY
  if (!apiKey) throw new Error('CRONJOB_ORG_API_KEY manquant dans .env')
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

// ─── Types ─────────────────────────────────────────────────────────────

export interface CronJobSchedule {
  timezone: string
  expiresAt: number
  hours: number[]
  mdays: number[]
  minutes: number[]
  months: number[]
  wdays: number[]
}

export interface CronJobData {
  jobId?: number
  enabled?: boolean
  title?: string
  url?: string
  saveResponses?: boolean
  lastStatus?: number
  lastDuration?: number
  lastExecution?: number
  nextExecution?: number
  schedule?: CronJobSchedule
  requestMethod?: number // 0=GET, 1=POST, 2=OPTIONS, 3=HEAD, 4=PUT, 5=DELETE, 6=TRACE, 7=CONNECT, 8=PATCH
  extendedData?: {
    headers?: Record<string, string>
    body?: string
  }
  requestTimeout?: number
  redirectSuccess?: boolean
  folderId?: number
  notification?: {
    onFailure?: boolean
    onSuccess?: boolean
    onDisable?: boolean
  }
}

export interface CronJobHistory {
  jobLogId: number
  jobId: number
  identifier: string
  date: number
  datePlanned: number
  url: string
  duration: number
  status: number
  statusText: string
  httpStatus: number
}

// ─── API Functions ─────────────────────────────────────────────────────

/**
 * Lister tous les cron jobs du compte
 */
export async function listCronJobs(): Promise<CronJobData[]> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`cron-job.org API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.jobs || []
}

/**
 * Récupérer les détails d'un cron job
 */
export async function getCronJob(jobId: number): Promise<CronJobData | null> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!res.ok) {
    if (res.status === 404) return null
    const text = await res.text()
    throw new Error(`cron-job.org API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.jobDetails || null
}

/**
 * Créer un nouveau cron job pour les rappels wallet
 *
 * @param appUrl - L'URL de base de l'application (ex: https://kidenzo.com)
 * @param cronSecret - Le secret pour sécuriser l'endpoint
 * @param hours - Les heures d'exécution (ex: [8, 12, 18] pour 3 rappels/jour)
 */
export async function createWalletCronJob(
  appUrl: string,
  cronSecret: string,
  hours: number[] = [8, 12, 18]
): Promise<number> {
  const url = `${appUrl}/api/wallet/cron?secret=${encodeURIComponent(cronSecret)}`

  const payload = {
    job: {
      url,
      enabled: true,
      title: 'Kidenzo Wallet - Rappels Remboursement',
      saveResponses: true,
      schedule: {
        timezone: 'Africa/Douala', // WAT (UTC+1) — Cameroun
        expiresAt: 0,
        hours,
        mdays: [-1],   // Tous les jours du mois
        minutes: [0],   // À la minute 0
        months: [-1],   // Tous les mois
        wdays: [-1],    // Tous les jours de la semaine
      },
      requestMethod: 0, // GET
      requestTimeout: 60,
      redirectSuccess: true,
      notification: {
        onFailure: true,
        onSuccess: false,
        onDisable: true,
      },
    },
  }

  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Impossible de créer le cron job: ${text}`)
  }

  const data = await res.json()
  return data.jobId
}

/**
 * Mettre à jour un cron job existant
 */
export async function updateCronJob(
  jobId: number,
  updates: Partial<CronJobData>
): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ job: updates }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Impossible de mettre à jour le cron job: ${text}`)
  }
}

/**
 * Supprimer un cron job
 */
export async function deleteCronJob(jobId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Impossible de supprimer le cron job: ${text}`)
  }
}

/**
 * Récupérer l'historique d'exécution d'un cron job
 */
export async function getCronJobHistory(jobId: number): Promise<{
  history: CronJobHistory[]
  predictions: number[]
}> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/history`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Erreur lors de la récupération de l'historique: ${text}`)
  }

  return await res.json()
}

/**
 * Cherche le cron job Wallet existant dans le compte ou le crée
 */
export async function ensureWalletCronJob(
  appUrl: string,
  cronSecret: string,
  hours: number[] = [8, 12, 18]
): Promise<{ jobId: number; created: boolean }> {
  // Cherche un job existant avec notre titre
  const jobs = await listCronJobs()
  const existingJob = jobs.find(j => j.title === 'Kidenzo Wallet - Rappels Remboursement')

  if (existingJob && existingJob.jobId) {
    // Mettre à jour l'URL et les heures si nécessaire
    const url = `${appUrl}/api/wallet/cron?secret=${encodeURIComponent(cronSecret)}`
    await updateCronJob(existingJob.jobId, {
      url,
      enabled: true,
      schedule: {
        timezone: 'Africa/Douala',
        expiresAt: 0,
        hours,
        mdays: [-1],
        minutes: [0],
        months: [-1],
        wdays: [-1],
      },
    })
    return { jobId: existingJob.jobId, created: false }
  }

  // Créer un nouveau job
  const jobId = await createWalletCronJob(appUrl, cronSecret, hours)
  return { jobId, created: true }
}
