import { put } from "@vercel/blob";
const ADMIN_SECRET = "IAPP_2024_ULTRA_SECURE_KEY_bWFzdGVyX2FkbWlub25seQ";
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { admin } = req.query;
  if (admin !== ADMIN_SECRET) return res.status(401).json({ error: "Unauthorized" });
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const contentType = req.headers["content-type"] || "";
    const boundary = contentType.split("boundary=")[1];
    if (!boundary) return res.status(400).json({ error: "No file" });
    const parts = buffer.toString().split("--" + boundary);
    let result = null;
    for (const part of parts) {
      if (!part.includes("filename=")) continue;
      const match = part.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : "file";
      const start = part.indexOf("\r\n\r\n") + 4;
      const end = part.lastIndexOf("\r\n--");
      const fileData = part.substring(start, end);
      const blob = await put(filename, Buffer.from(fileData, "binary"), { access: "public", addRandomSuffix: true });
      const filesStore = JSON.parse(process.env.FILES_STORE || "[]");
      const newFile = {
        id: Date.now() + "_" + Math.random().toString(36).substr(2, 8),
        name: filename,
        url: blob.url,
        downloadUrl: (process.env.VERCEL_URL || "https://your-project.vercel.app") + "/api/download?id=" + Date.now() + "_" + Math.random().toString(36).substr(2, 8),
        sizeFormatted: formatSize(fileData.length),
        downloads: 0,
        date: new Date().toLocaleDateString("ar-EG")
      };
      filesStore.push(newFile);
      process.env.FILES_STORE = JSON.stringify(filesStore);
      result = newFile;
      break;
    }
    if (result) return res.status(200).json({ success: true, file: result });
    return res.status(400).json({ error: "No file" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
function formatSize(b) { if (!b) return "0 Bytes"; const k = 1024, s = ["Bytes", "KB", "MB", "GB"]; const i = Math.floor(Math.log(b) / Math.log(k)); return parseFloat((b / Math.pow(k, i)).toFixed(2)) + " " + s[i]; }
EOF 
