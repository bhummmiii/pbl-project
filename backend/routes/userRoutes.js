const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyToken = require("../middleware/userAuthMiddleware");
const Device = require("../models/Devices");

const router = express.Router();

// JWT generation
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET || "secretkey",
    { expiresIn: "1d" }
  );
};

// --------- Register ---------
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const newUser = await User.create({ name, email, phone, password });
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --------- Login ---------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });

    const token = generateToken(user);
    res.json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --------- Protected Profile ---------
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =======================================================
// ✅ Add Device + Link it to Logged-in User
// =======================================================
router.post("/devices", verifyToken, async (req, res) => {
  try {
    // 1️⃣ Create new device with user reference
    const newDevice = await Device.create({
      ...req.body,
      user: req.user.id,
    });

    // 2️⃣ Push device details into user's devices array
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        devices: {
          deviceId: newDevice._id,
          status: newDevice.status,
          name: newDevice.deviceType,
          updatedAt: new Date(),
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Device added successfully",
      device: newDevice,
    });
  } catch (err) {
    console.error("Error adding device:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =======================================================
// ✅ Get All Devices for Logged-in User
// =======================================================
router.get("/devices", verifyToken, async (req, res) => {
  try {
    // Populate user's devices with full device details
    const user = await User.findById(req.user.id).populate("devices.deviceId");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // Format devices array with updated status from Device collection
    const devicesWithStatus = user.devices.map((d) => ({
      deviceId: d.deviceId._id,
      name: d.name,
      status: d.deviceId.status,
      updatedAt: d.deviceId.updatedAt,
    }));

    res.json({ success: true, devices: devicesWithStatus });
  } catch (err) {
    console.error("Error fetching user devices:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =======================================================
// ✅ Get Single Device from User's Devices Array
// =======================================================
router.get("/me/devices/:deviceId", verifyToken, async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Populate user's devices with full device details
    const user = await User.findById(req.user.id).populate("devices.deviceId");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const device = user.devices.find(
      (d) => d.deviceId._id.toString() === deviceId
    );

    if (!device)
      return res.status(404).json({ success: false, message: "Device not found" });

    res.json({
      success: true,
      device: {
        deviceId: device.deviceId._id,
        name: device.name,
        status: device.deviceId.status,
        updatedAt: device.deviceId.updatedAt,
        fullDetails: device.deviceId, // optional: send full device document
      },
    });
  } catch (err) {
    console.error("Error fetching user eevice:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =======================================================
// ✅ Get All Recycling Devices for Logged-in User
// =======================================================
router.get("/devices/recycle", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch only devices with option "Recycle" for this user
    const recycleDevices = await Device.find({ user: userId, option: "Recycle" })
      .populate("organization", "name email contact address");

    if (recycleDevices.length === 0) {
      return res.json({ success: true, devices: [], message: "No recycling devices found." });
    }

    // Optional: format similar to your existing /devices route
    const devicesWithStatus = recycleDevices.map((device) => ({
      deviceId: device._id,
      name: device.deviceType || device.brandModel || "Unnamed Device",
      status: device.status,
      updatedAt: device.updatedAt,
      fullDetails: device, // optional: send full device document
    }));

    res.json({ success: true, devices: devicesWithStatus });
  } catch (err) {
    console.error("Error fetching recycling devices:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Get all devices for sale (excluding current user's devices)
router.get("/devices/sell", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all devices with option "Sell" but exclude devices added by current user
    const sellingDevices = await Device.find({ option: "Sell", user: { $ne: userId } });

    if (sellingDevices.length === 0) {
      return res.json({ success: true, devices: [], message: "No devices for sale." });
    }

    const devicesFormatted = sellingDevices.map((device) => ({
      deviceId: device._id,
      name: device.deviceType || device.brandModel || "Unnamed Device",
      brandModel: device.brandModel || "",
      condition: device.condition || "Unknown",
      purchaseYear: device.purchaseYear || "Unknown",
      price: device.price || "Contact seller",
      sellerName: device.fullName || "Unknown",
      sellerEmail: device.email || "",
      sellerPhone: device.phoneNumber || "",
      image: device.images?.[0] || "https://via.placeholder.com/400x200",
    }));

    res.json({ success: true, devices: devicesFormatted });
  } catch (err) {
    console.error("Error fetching selling devices:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
