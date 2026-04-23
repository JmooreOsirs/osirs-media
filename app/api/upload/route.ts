import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";

const ALLOWED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/tiff",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/octet-stream",
];

const MAX_BYTES = 2 * 1024 * 1024 * 1024;

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const { userId } = await auth();
        if (!userId) {
          throw new Error("Unauthorized - Please log in to upload files");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId, pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Upload completed:", blob.url);
      },
    });

    return Response.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Upload error:", message);
    return Response.json({ error: message }, { status: 400 });
  }
}
