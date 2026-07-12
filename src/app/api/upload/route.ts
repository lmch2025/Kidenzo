import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

// cloudinary auto-configures from CLOUDINARY_URL env var
// Format: cloudinary://api_key:api_secret@cloud_name
cloudinary.config({ secure: true })

export const dynamic = 'force-dynamic'

/**
 * POST /api/upload
 * Accepts a multipart form with a "file" field (image).
 * Optimizes with sharp (resize + WebP conversion) then uploads to Cloudinary.
 * Returns { url, publicId, width, height, success }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 })
    }

    // Validate MIME type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Seules les images sont acceptées.' }, { status: 400 })
    }

    // Validate size (max 10MB raw)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image trop volumineuse (max 10MB).' }, { status: 400 })
    }

    // 1. Read buffer
    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    // 2. Optimize with sharp: resize to max 1200px wide, convert to WebP quality 82
    const optimizedBuffer = await sharp(inputBuffer)
      .resize({ width: 1200, withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 82, effort: 4 })
      .toBuffer()

    // 3. Build a clean public_id from the original filename (no extension)
    const baseName = (file.name || 'image')
      .replace(/\.[^.]+$/, '')           // remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '-')  // sanitize
      .slice(0, 60)                       // max length
    const publicId = `recopay/${baseName}-${Date.now()}`

    // 4. Upload to Cloudinary via upload_stream (supports Buffers)
    const uploadResult = await new Promise<{
      secure_url: string
      public_id: string
      width: number
      height: number
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'image',
          format: 'webp',          // ensure Cloudinary stores as webp
          overwrite: false,
          folder: 'recopay',
          quality: 'auto:good',    // Cloudinary side optimization on delivery
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error) return reject(error)
          if (!result) return reject(new Error('Empty Cloudinary response'))
          resolve(result as any)
        }
      )
      stream.end(optimizedBuffer)
    })

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      success: true,
    })
  } catch (error) {
    console.error('[/api/upload] Cloudinary upload error:', error)
    return NextResponse.json(
      { error: 'Échec du téléchargement. Vérifiez la configuration Cloudinary.' },
      { status: 500 }
    )
  }
}
