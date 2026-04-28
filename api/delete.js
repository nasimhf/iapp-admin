import { del } from "@vercel/blob";
const ADMIN_SECRET = "IAPP_2024_ULTRA_SECURE_KEY_bWFzdGVyX2FkbWlub25seQ";
export default async function handler(req, res) {
  const { admin, id } = req.query;
  if (admin !== ADMIN_SECRET) return res.status(401).json({ error: "Unauthorized" });
  if (!id) return res.status(400).json({ error: "Missing id" });
  let files = JSON.parse(process.env.FILES_STORE || "[]");
  const file = files.find(f => f.id === id);
  if (!file) return res.status(404).json({ error: "Not found" });
  if (file.url) await del(file.url);
  files = files.filter(f => f.id !== id);
  process.env.FILES_STORE = JSON.stringify(files);
  return res.status(200).json({ success: true });
}
