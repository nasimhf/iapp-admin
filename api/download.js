export default function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });
  const files = JSON.parse(process.env.FILES_STORE || "[]");
  const file = files.find(f => f.id === id);
  if (!file) return res.status(404).json({ error: "Not found" });
  file.downloads++;
  process.env.FILES_STORE = JSON.stringify(files);
  return res.redirect(302, file.url);
}
