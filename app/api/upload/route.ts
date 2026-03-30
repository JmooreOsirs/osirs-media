import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const blob = await put(file.name, file, { access: "public" });
  return Response.json({ url: blob.url, pathname: blob.pathname });
}
