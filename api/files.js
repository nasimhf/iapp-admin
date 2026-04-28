const ADMIN_SECRET = "IAPP_2024_ULTRA_SECURE_KEY_bWFzdGVyX2FkbWlub25seQ";
export default function handler(req, res) {
  const { admin } = req.query;
  if (admin !== ADMIN_SECRET) return res.status(401).json({ error: "Unauthorized" });
  const files = JSON.parse(process.env.FILES_STORE || "[]");
  return res.status(200).json({ files });
}
