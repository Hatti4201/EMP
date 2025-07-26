// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/onboarding", require("./routes/onboardingRoutes"));
// app.use("/api/hr", require("./routes/hrRoutes"));
// app.use("/api/visa-status", require("./routes/visaRoutes"));
// app.use("/api/upload", require("./routes/uploadRoutes"));

// connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
