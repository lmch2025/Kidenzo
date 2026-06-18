import { NextRequest, NextResponse } from 'next/server'

// ImgBB API key - fallback to hardcoded value if env var is missing
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '3ca1301a4e529153d12db10659925594'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const base64String = body.image

    if (!base64String) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 })
    }

    // Prepare payload for ImgBB
    const imgbbFormData = new FormData()
    imgbbFormData.append('key', IMGBB_API_KEY)
    imgbbFormData.append('image', base64String)

    // Call ImgBB API
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: imgbbFormData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('ImgBB error:', errorData)
      return NextResponse.json(
        { error: 'Failed to upload image to ImgBB' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Return the URL
    return NextResponse.json({ url: data.data.url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error during upload' },
      { status: 500 }
    )
  }
}
