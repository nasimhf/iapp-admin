const ADMIN_SECRET = "IAPP_2024_ULTRA_SECURE_KEY_bWFzdGVyX2FkbWlub25seQ";

export default function handler(req, res) {
  const { admin } = req.query;
  
  if (admin !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    let files = [];
    const existing = process.env.FILES_STORE;
    if (existing && existing !== "undefined") {
      files = JSON.parse(existing);
    }
    return res.status(200).json({ files });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
