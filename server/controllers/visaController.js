const VisaStatus = require("../models/VisaStatus");

exports.getVisaSteps = async (req, res) => {
  try {
    const record = await VisaStatus.findOne({ user: req.user.id });
    if (!record) return res.json({ steps: [] });
    res.json({ steps: record.steps });
  } catch (err) {
    res.status(500).json({ message: "Error fetching status" });
  }
};

exports.uploadVisaDoc = async (req, res) => {
  const { type } = req.body;
  const file = req.file?.filename;

  if (!file || !type) return res.status(400).json({ message: "Missing type or file" });

  try {
    let record = await VisaStatus.findOne({ user: req.user.id });
    const step = {
      type,
      file: `/files/${file}`,
      status: "pending",
      uploadedAt: new Date(),
    };

    if (!record) {
      record = await VisaStatus.create({ user: req.user.id, steps: [step] });
    } else {
      // 替换或添加
      const index = record.steps.findIndex((s) => s.type === type);
      if (index !== -1) {
        record.steps[index] = step;
      } else {
        record.steps.push(step);
      }
      await record.save();
    }

    res.json({ message: "Document uploaded" });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};
