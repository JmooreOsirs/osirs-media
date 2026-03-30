import { del } from "@vercel/blob";


export async function DELETE(req: Request) {

  const { url } = await req.json();
  await del(url);
  return Response.json({ ok: true });
}
