const express = require("express");
const authRoutes = require("./authRoutes");
const applicationRoutes = require("./applicationRoutes");
const userApplicationRoutes = require("./userApplicationRoutes");
const paymentRoutes = require("./paymentRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

// API Routes
router.use("/auth", authRoutes);
router.use("/applications", applicationRoutes);
router.use("/user-applications", userApplicationRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);

// API Info
router.get("/", (req, res) => {
  res.json({
    message: "Online Forms API",
    version: process.env.API_VERSION || "v1",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/auth",
      applications: "/applications",
      userApplications: "/user-applications",
      payments: "/payments",
      admin: "/admin",
    },
  });
});

module.exports = router;
