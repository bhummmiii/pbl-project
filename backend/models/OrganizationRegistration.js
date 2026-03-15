const mongoose = require("mongoose");

const OrganizationRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: "organization" }
}, { timestamps: true });

module.exports = mongoose.model("OrganizationRegistration", OrganizationRegistrationSchema);

