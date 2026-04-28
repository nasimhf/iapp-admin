import { head } from "@vercel/blob";
const DB_PATH = 'database.json';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    // قراءة قاعدة البيانات
    let db = { files: [] };
    const existingDb = await head(DB_PATH);
    if (existingDb) {
      const response = await fetch(existingDb.url);
      if (response.ok) db = await response.json();
    }

    const file = db.files.find(f => f.id === id);
    if (!file) return res.status(404).json({ error: "File not found" });

    // تحديث عدد التحميلات (يمكن تحسينه لاحقًا)
    file.downloads++;
    await put(DB_PATH, JSON.stringify(db, null, 2), { access: "public" });

    return res.redirect(302, file.url);
  } catch (err) {
    console.error("Download error:", err);
    return res.status(500).json({ error: err.message });
  }
}
