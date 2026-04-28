import { del, head } from "@vercel/blob";
const ADMIN_SECRET = "IAPP_2024_ULTRA_SECURE_KEY_bWFzdGVyX2FkbWlub25seQ";
const DB_PATH = 'database.json';

export default async function handler(req, res) {
  const { admin, id } = req.query;
  if (admin !== ADMIN_SECRET) return res.status(401).json({ error: "Unauthorized" });
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    // قراءة قاعدة البيانات
    let db = { files: [] };
    const existingDb = await head(DB_PATH);
    if (existingDb) {
      const response = await fetch(existingDb.url);
      if (response.ok) db = await response.json();
    }

    const fileIndex = db.files.findIndex(f => f.id === id);
    if (fileIndex === -1) return res.status(404).json({ error: "File not found" });
    const file = db.files[fileIndex];

    // حذف الملف الفعلي من Blob
    if (file.url) await del(file.url);

    // إزالة الملف من قاعدة البيانات وحفظها
    db.files.splice(fileIndex, 1);
    await put(DB_PATH, JSON.stringify(db, null, 2), { access: "public" });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ error: err.message });
  }
}
