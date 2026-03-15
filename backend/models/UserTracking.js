const mongoose = require("mongoose");

const UserTrackingSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganizationRegistration", required: true },
    userEmail: { type: String, required: true },
    userName: { type: String },
    userPhone: { type: String },

    currentStatus: { type: String, required: true },
    previousStatus: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserTracking", UserTrackingSchema);
