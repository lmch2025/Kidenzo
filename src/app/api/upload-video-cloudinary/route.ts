import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configuration is picked up automatically from CLOUDINARY_URL in .env
cloudinary.config({
  secure: true
});

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: "videoUrl is required" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary directly from the external URL
    const result = await cloudinary.uploader.upload(videoUrl, {
      folder: "recopay/videos",
      resource_type: "video",
    });

    return NextResponse.json({ 
      success: true, 
      url: result.secure_url 
    });
  } catch (error: any) {
    console.error("Cloudinary video upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload video to Cloudinary" },
      { status: 500 }
    );
  }
}
