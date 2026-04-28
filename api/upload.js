import { put, head, del } from "@vercel/blob";
const ADMIN_SECRET = "IAPP_2024_ULTRA_SECURE_KEY_bWFzdGVyX2FkbWlub25seQ";
const DB_PATH = 'database.json';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { admin } = req.query;
  if (admin !== ADMIN_SECRET) return res.status(401).json({ error: "Unauthorized" });

  try {
    // --- 1. قراءة الملف المرفوع ---
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const contentType = req.headers["content-type"] || "";
    const boundary = contentType.split("boundary=")[1];
    if (!boundary) return res.status(400).json({ error: "No boundary found" });

    const parts = buffer.toString().split("--" + boundary);
    let filename = "file";
    let fileData = null;
    for (const part of parts) {
      if (part.includes("filename=")) {
        const match = part.match(/filename="([^"]+)"/);
        if (match) filename = match[1];
        const start = part.indexOf("\r\n\r\n") + 4;
        const end = part.lastIndexOf("\r\n--");
        fileData = part.substring(start, end);
        break;
      }
    }
    if (!fileData) return res.status(400).json({ error: "No file data found" });

    // --- 2. رفع الملف إلى Blob ---
    const blob = await put(filename, Buffer.from(fileData, "binary"), { access: "public", addRandomSuffix: true });
    
    // --- 3. قراءة قاعدة البيانات الحالية من Blob (إذا وجدت) ---
    let db = { files: [] };
    try {
      const existingDb = await head(DB_PATH);
      if (existingDb) {
        const response = await fetch(existingDb.url);
        if (response.ok) db = await response.json();
      }
    } catch (error) {
      // تجاهل الخطأ إذا كانت قاعدة البيانات غير موجودة
      console.log("Database not found, creating a new one.");
    }

    // --- 4. إضافة الملف الجديد إلى قاعدة البيانات ---
    const newFile = {
      id: Date.now() + "_" + Math.random().toString(36).substr(2, 8),
      name: filename,
      url: blob.url,
      downloadUrl: blob.url,
      sizeFormatted: formatSize(fileData.length),
      downloads: 0,
      date: new Date().toLocaleDateString("ar-EG")
    };
    db.files.push(newFile);

    // --- 5. حفظ قاعدة البيانات المحدثة في Blob ---
    await put(DB_PATH, JSON.stringify(db, null, 2), { access: "public" });

    return res.status(200).json({ success: true, file: newFile });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.message });
  }
}

function formatSize(bytes) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
