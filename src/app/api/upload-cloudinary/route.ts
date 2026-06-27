import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configuration is picked up automatically from CLOUDINARY_URL in .env
cloudinary.config({
  secure: true
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Since the client sends the base64 string without the data URI prefix, we add it back.
    const base64Data = `data:image/webp;base64,${image}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: "recopay",
      format: "webp",
      quality: "auto",
      fetch_format: "auto",
    });

    return NextResponse.json({ 
      success: true, 
      url: result.secure_url 
    });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image to Cloudinary" },
      { status: 500 }
    );
  }
}
