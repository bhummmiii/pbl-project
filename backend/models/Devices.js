const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    deviceType: { type: String, required: true },
    brandModel: { type: String, required: true },
    condition: { type: String, required: true },
    purchaseYear: { type: Number, required: true },

    images: {
      front: { type: String },
      side: { type: String },
      top: { type: String },
    },

    option: {
      type: String,
      enum: ["Recycle", "Sell"],
      required: true,
    },
    
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Organization reference (only for Recycle)
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrganizationRegistration",
      required: function () {
        return this.option === "Recycle";
      },
    },

    // Price (only for Sell)
    price: {
      type: Number,
      required: function () {
        return this.option === "Sell";
      },
    },

    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },

    pickupTime: { type: Date },

    status: {
      type: String,
      enum: [
        "Accept",             // ✅ Added
        "Under Review",
        "Pickup Pending",
        "On the Way",
        "At Recycling Center",
        "Disposed",
      ],
      default: "Under Review", // better than "Pending" since you already renamed
    },

    // Assign delivery boy (store ObjectId if you want separate deliveryBoy collection)
    assignedDeliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy", // optional future model
      required: false,
    },

    // History tracking (optional: to audit status changes)
    statusHistory: [
      {
        status: String,
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "OrganizationRegistration" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema);
