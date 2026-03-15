const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Models
const OrganizationRegistration = require("../models/OrganizationRegistration");
const Organization = require("../models/Organization");
const Device = require("../models/Devices");
const UserTracking = require("../models/UserTracking"); // ✅ Tracking model

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ---------------- Ensure upload folder exists ----------------
const uploadDir = path.join(__dirname, "..", "uploads", "organizations");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📂 Created uploads/organizations folder");
}

// ---------------- Multer Setup ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ---------------- REGISTER ORGANIZATION ----------------
router.post("/register", async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existing = await OrganizationRegistration.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const org = new OrganizationRegistration({
      name: fullname,
      email,
      password: hashedPassword,
      role: role || "organization",
    });

    await org.save();

    // ✅ Create initial tracking record for the organization
    await UserTracking.create({
      organizationId: org._id,
      organizationName: fullname,
      organizationStatus: "Pending",
      createdAt: new Date(),
    });

    res
      .status(201)
      .json({ success: true, message: "Organization registered successfully!", organizationId: org._id });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- LOGIN ORGANIZATION ----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const org = await OrganizationRegistration.findOne({ email });
    if (!org) {
      return res.status(401).json({ success: false, message: "Email not found" });
    }

    const validPassword = await bcrypt.compare(password, org.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: org._id, role: org.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    res.json({ success: true, token, organizationId: org._id, message: "Login successful" });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- SAVE / UPDATE ORGANIZATION PROFILE ----------------
router.post(
  "/profile",
  authMiddleware,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "companyImages", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const organizationId = req.user.id;
      const { contact, hours, address, status } = req.body;

      if (!contact || !address) {
        return res.status(400).json({ success: false, message: "Required fields missing" });
      }

      const logoPath = req.files?.logo
        ? `/uploads/organizations/${req.files.logo[0].filename}`
        : null;

      const companyImages = req.files?.companyImages
        ? req.files.companyImages.map(f => `/uploads/organizations/${f.filename}`)
        : [];

      let profile = await Organization.findOne({ organizationId });

      if (!profile) {
        profile = new Organization({
          organizationId,
          contact,
          hours,
          address,
          status: status || "Pending",
          logo: logoPath,
          companyImages,
        });
      } else {
        profile.contact = contact || profile.contact;
        profile.hours = hours || profile.hours;
        profile.address = address || profile.address;
        if (status) profile.status = status;
        if (logoPath) profile.logo = logoPath;
        if (companyImages.length > 0) profile.companyImages = companyImages;
      }

      await profile.save();

      // ✅ Reflect status change in user tracking module
      if (status) {
        await UserTracking.updateOne(
          { organizationId },
          {
            $set: {
              organizationStatus: status,
              lastUpdated: new Date(),
            },
          },
          { upsert: true }
        );
      }

      res.json({ success: true, profile });
    } catch (err) {
      console.error("❌ Error saving organization profile:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ---------------- GET ORGANIZATION PROFILE ----------------
router.get("/profile/:organizationId", authMiddleware, async (req, res) => {
  try {
    const { organizationId } = req.params;

    if (req.user.id.toString() !== organizationId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const profile = await Organization.findOne({ organizationId });
    res.json({ success: true, profile: profile || null });
  } catch (err) {
    console.error("❌ Error fetching organization profile:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- GET DEVICES ASSIGNED TO ORGANIZATION ----------------
router.get("/devices", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user.id;
    const devices = await Device.find({ organization: organizationId }).populate(
      "organization",
      "name email contact address"
    );
    res.json({ success: true, devices });
  } catch (err) {
    console.error("❌ Error fetching organization devices:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- GET ALL REGISTERED ORGANIZATIONS ----------------
// ---------------- GET ALL REGISTERED ORGANIZATIONS ----------------
router.get("/", async (req, res) => {
  try {
    // Aggregate OrganizationRegistration + Organization profile
    const orgs = await OrganizationRegistration.aggregate([
      {
        $lookup: {
          from: "organizations",        // MongoDB collection name for profiles
          localField: "_id",            // _id in OrganizationRegistration
          foreignField: "organizationId", // organizationId in Organization
          as: "profile"
        }
      },
      {
        $unwind: { path: "$profile", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          contact: "$profile.contact",
          hours: "$profile.hours",
          address: "$profile.address",
          logo: "$profile.logo",
          companyImages: "$profile.companyImages",
          coordinates: "$profile.coordinates" // optional for future map use
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.json(orgs);
  } catch (err) {
    console.error("❌ Error fetching organizations:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});



// =======================================================
// ✅ UPDATE DEVICE STATUS + REFLECT IN TRACKING + USER MODEL
// =======================================================
router.put("/devices/:deviceId/status", authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { status, deliveryBoyId } = req.body;
    const organizationId = req.user.id;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    const previousStatus = device.status;
    device.status = status;

    if (deliveryBoyId) device.assignedDeliveryBoy = deliveryBoyId;

    device.statusHistory.push({
      status,
      updatedBy: organizationId,
      updatedAt: new Date(),
    });

    await device.save();

    // ✅ Reflect status change in user tracking collection
    await UserTracking.findOneAndUpdate(
      { deviceId: device._id },
      {
        $set: {
          organizationId,
          userEmail: device.email,
          userName: device.fullName,
          userPhone: device.phoneNumber,
          previousStatus,
          currentStatus: status,
          lastUpdated: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // ✅ Reflect status change in User model
    const User = require("../models/User");
    const user = await User.findOne({ email: device.email });

    if (user) {
      if (!user.devices) user.devices = [];

      const existingDevice = user.devices.find(
        d => d.deviceId.toString() === device._id.toString()
      );

      if (existingDevice) {
        existingDevice.status = status;
      } else {
        user.devices.push({
          deviceId: device._id,
          status,
          name: device.deviceName || "Unnamed Device",
          updatedAt: new Date(),
        });
      }

      await user.save();
    }

    res.json({ success: true, message: "Status updated successfully", device });
  } catch (err) {
    console.error("❌ Error updating device status:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
