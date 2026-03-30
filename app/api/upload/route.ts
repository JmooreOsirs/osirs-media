import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return Response.json({ error: "Blob storage not configured (missing BLOB_READ_WRITE_TOKEN)" }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("file") as File;
    if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

    const blob = await put(file.name, file, {
      access: "public",
      token: blobToken,
    });

    return Response.json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Upload error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
