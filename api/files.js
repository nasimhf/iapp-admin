export default function handler(req, res) {
  return res.status(200).json({ 
    files: [
      {
        id: '1',
        name: 'test.txt',
        sizeFormatted: '1 KB',
        downloads: 0,
        downloadUrl: 'https://example.com/download'
      }
    ]
  });
}
