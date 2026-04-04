import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const requestedFolder = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required." },
        { status: 400 },
      );
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Cloudinary server credentials are missing." },
        { status: 500 },
      );
    }

    const folder =
      (typeof requestedFolder === "string" && requestedFolder) ||
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER ||
      "swachh-city/reports";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, uploaded) => {
          if (error || !uploaded?.secure_url || !uploaded.public_id) {
            reject(error ?? new Error("Cloudinary upload failed."));
            return;
          }

          resolve({
            secure_url: uploaded.secure_url,
            public_id: uploaded.public_id,
          });
        },
      );

      upload.end(buffer);
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to upload image to Cloudinary right now." },
      { status: 500 },
    );
  }
}
