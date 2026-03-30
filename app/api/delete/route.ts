import { del } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  await del(url);
  return Response.json({ ok: true });
}
