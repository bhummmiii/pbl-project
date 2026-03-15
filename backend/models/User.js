const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// ✅ Device tracking sub-schema (enhanced with more info)
const userDeviceSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
    status: { type: String, default: "Pending" },
    name: { type: String, default: "" }, // ✅ store device name
    updatedAt: { type: Date, default: Date.now }, // ✅ track last update time
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, match: [/^\d{10}$/, "Enter valid 10-digit phone"] },
    password: { type: String, required: true, minlength: 6 },

    // ✅ New field to store devices and their statuses
    devices: [userDeviceSchema],
  },
  { timestamps: true }
);

// ✅ Hash password before saving (original logic preserved)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare entered password with hashed password (original logic preserved)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Force collection name to "users"
module.exports = mongoose.model("User", userSchema, "users");
