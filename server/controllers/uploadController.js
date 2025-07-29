exports.uploadFile = (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const fileUrl = `/files/${req.file.filename}`;
  res.status(200).json({ url: fileUrl });
};