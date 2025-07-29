const VisaStatus = require("../models/VisaStatus");

exports.approveVisaDoc = async (req, res) => {
  const { employeeId } = req.params;
  const { type, status, feedback } = req.body;

  try {
    const record = await VisaStatus.findOne({ user: employeeId });
    if (!record) return res.status(404).json({ message: "Visa record not found" });

    const step = record.steps.find((s) => s.type === type);
    if (!step) return res.status(404).json({ message: "Step not found" });

    step.status = status;
    step.feedback = feedback || "";
    await record.save();

    res.json({ message: "Status updated" });
  } catch (err) {
    console.error("❌ Visa approval error:", err);
    res.status(500).json({ message: "Approval failed" });
  }
};
