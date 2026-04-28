import { head } from "@vercel/blob";
const ADMIN_SECRET = "IAPP_2024_ULTRA_SECURE_KEY_bWFzdGVyX2FkbWlub25seQ";
const DB_PATH = 'database.json';

export default async function handler(req, res) {
  const { admin } = req.query;
  if (admin !== ADMIN_SECRET) return res.status(401).json({ error: "Unauthorized" });

  try {
    // محاولة قراءة قاعدة البيانات من Blob
    let db = { files: [] };
    const existingDb = await head(DB_PATH);
    if (existingDb) {
      const response = await fetch(existingDb.url);
      if (response.ok) db = await response.json();
    }
    return res.status(200).json({ files: db.files || [] });
  } catch (err) {
    console.error("Files error:", err);
    return res.status(500).json({ error: err.message });
  }
}
