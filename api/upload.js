import { put } from "@vercel/blob";
const ADMIN_SECRET = "IAPP_2024_ULTRA_SECURE_KEY_bWFzdGVyX2FkbWlub25seQ";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // السماح بطلبات OPTIONS لـ CORS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  const { admin } = req.query;
  if (admin !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    // قراءة الملف من الطلب
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // استخراج اسم الملف والمحتوى من multipart form data
    const contentType = req.headers["content-type"] || "";
    const boundary = contentType.split("boundary=")[1];
    
    if (!boundary) {
      return res.status(400).json({ error: "No boundary found" });
    }
    
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
    
    if (!fileData) {
      return res.status(400).json({ error: "No file data found" });
    }
    
    // رفع الملف إلى Vercel Blob
    const blob = await put(filename, Buffer.from(fileData, "binary"), {
      access: "public",
      addRandomSuffix: true,
    });
    
    // جلب الملفات المخزنة حالياً
    let filesStore = [];
    try {
      const existing = process.env.FILES_STORE;
      if (existing && existing !== "undefined") {
        filesStore = JSON.parse(existing);
      }
    } catch (e) {
      filesStore = [];
    }
    
    // إنشاء سجل للملف الجديد
    const newFile = {
      id: Date.now() + "_" + Math.random().toString(36).substr(2, 8),
      name: filename,
      url: blob.url,
      downloadUrl: blob.url,
      sizeFormatted: formatSize(fileData.length),
      downloads: 0,
      date: new Date().toLocaleDateString("ar-EG")
    };
    
    filesStore.push(newFile);
    process.env.FILES_STORE = JSON.stringify(filesStore);
    
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
