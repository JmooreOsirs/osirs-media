import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    // Clear error message for unauthenticated requests
    if (!userId) {
      return Response.json(
        { error: "Unauthorized - Please log in to upload files" },
        { status: 401 }
      );
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return Response.json(
        { error: "Blob storage not configured (missing BLOB_READ_WRITE_TOKEN)" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File;
    
    if (!file) {
      return Response.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check file size (500MB limit)
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    if (file.size > MAX_SIZE) {
      return Response.json(
        { error: `File too large. Maximum size is 500MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 413 }
      );
    }

    // Check file type
    const ALLOWED_TYPES = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/tiff",
      "image/svg+xml",
      "application/pdf",
      "video/mp4",
      "video/quicktime", // .mov
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `File type not allowed. Supported: PNG, JPG, GIF, TIFF, SVG, PDF, MP4, MOV. Got: ${file.type}` },
        { status: 415 }
      );
    }

    const blob = await put(file.name, file, {
      access: "public",
      token: blobToken,
    });

    return Response.json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Upload error:", message);
    return Response.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
