import { list } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { blobs } = await list();
  return Response.json({ blobs });
}
