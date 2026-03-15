const express = require("express");
const multer = require("multer");
const path = require("path");
const Device = require("../models/Devices");
const User = require("../models/User");
const OrganizationRegistration = require("../models/OrganizationRegistration");
const verifyToken = require("../middleware/userAuthMiddleware"); // JWT auth middleware
const router = express.Router();

// ---------------- MULTER CONFIG ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage });

// ---------------- ROUTES ----------------

// @route   POST /api/devices
// @desc    Create new device entry with images (linked to logged-in user)
router.post(
  "/",
  verifyToken, // ✅ require login
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "sideImage", maxCount: 1 },
    { name: "topImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        deviceType,
        brandModel,
        condition,
        purchaseYear,
        option,
        organization, // org _id from frontend
        fullName,
        email,
        phoneNumber,
        address,
        pickupTime,
        price,
      } = req.body;

      // Validation
      if (option === "Recycle" && !organization) {
        return res.status(400).json({ message: "Organization must be selected for recycling." });
      }
      if (option === "Sell" && !price) {
        return res.status(400).json({ message: "Price must be provided for selling." });
      }

      // Verify organization exists if option is Recycle
      let orgDoc = null;
      if (option === "Recycle") {
        orgDoc = await OrganizationRegistration.findById(organization);
        if (!orgDoc) {
          return res.status(404).json({ message: "Selected organization not found." });
        }
      }

      // Create new device document
      const newDevice = new Device({
        deviceType,
        brandModel,
        condition,
        purchaseYear,
        option,
        organization: orgDoc ? orgDoc._id : null,
        price: option === "Sell" ? price : null,
        fullName,
        email,
        phoneNumber,
        address,
        pickupTime: pickupTime ? new Date(pickupTime) : null,
        images: {
          front: req.files["frontImage"] ? `/uploads/${req.files["frontImage"][0].filename}` : null,
          side: req.files["sideImage"] ? `/uploads/${req.files["sideImage"][0].filename}` : null,
          top: req.files["topImage"] ? `/uploads/${req.files["topImage"][0].filename}` : null,
        },
        user: req.user.id, // ✅ link device to logged-in user
      });

      await newDevice.save();

      // Push device reference into user's devices array
      await User.findByIdAndUpdate(req.user.id, {
        $push: { devices: { deviceId: newDevice._id, status: "Pending", name: brandModel } },
      });

      // Populate organization details for response
      const deviceWithOrg = await Device.findById(newDevice._id).populate(
        "organization",
        "name email contact address"
      );

      res.status(201).json({ message: "Device submitted successfully!", device: deviceWithOrg });
    } catch (err) {
      console.error("Error saving device:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// @route   GET /api/devices
// @desc    Get all devices
router.get("/", async (req, res) => {
  try {
    const devices = await Device.find().populate("organization", "name email contact address");
    res.json(devices);
  } catch (err) {
    console.error("Error fetching devices:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🆕 @route   GET /api/devices/my
// 🆕 @desc    Get devices of the logged-in user
router.get("/my", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const myDevices = await Device.find({ user: userId })
      .populate("organization", "name email contact address")
      .sort({ createdAt: -1 });

    res.status(200).json(myDevices);
  } catch (err) {
    console.error("Error fetching user devices:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   GET /api/devices/:id
// @desc    Get single device by ID
router.get("/:id", async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate(
      "organization",
      "name email contact address"
    );
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  } catch (err) {
    console.error("Error fetching device:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// @route   PATCH /api/devices/:id/status
// @desc    Update device status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("organization", "name email contact address");

    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json({ message: "Status updated", device });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(400).json({ message: err.message });
  }
});

// @route   PATCH /api/devices/:id/assign
// @desc    Assign delivery boy
router.patch("/:id/assign", async (req, res) => {
  try {
    const { deliveryBoy } = req.body;
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { assignedDeliveryBoy: deliveryBoy },
      { new: true }
    ).populate("organization", "name email contact address");

    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json({ message: "Delivery boy assigned", device });
  } catch (err) {
    console.error("Error assigning delivery boy:", err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
