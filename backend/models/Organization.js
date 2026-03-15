const mongoose = require("mongoose");

const OrganizationProfileSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "OrganizationRegistration", 
    required: true, 
    unique: true // ✅ one profile per registered org
  },
  contact: { 
    type: String, 
    trim: true, 
    default: "" 
  },
  hours: { 
    type: String, 
    trim: true, 
    default: "" 
  },
  address: { 
    type: String, 
    trim: true, 
    default: "" 
  },
  logo: { 
    type: String, 
    default: "" 
  },
  companyImages: { 
    type: [String], 
    default: [], 
    validate: {
      validator: function(v) {
        return v.length <= 10; // ✅ limit to 10 images
      },
      message: "Maximum 10 company images are allowed"
    }
  }
}, { timestamps: true });

// ✅ Ensure old indexes (like email_1) are gone
OrganizationProfileSchema.index({ organizationId: 1 }, { unique: true });

module.exports = mongoose.model("Organization", OrganizationProfileSchema);
