const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const helmet = require("helmet");

dotenv.config();
const app = express();

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // parse urlencoded bodies
app.use(morgan("dev"));

// ✅ Helmet CSP allowing Bootstrap & FontAwesome CDNs
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
        ],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
        ],
        "img-src": ["'self'", "data:", "https:", "blob:"],
        "connect-src": ["'self'", "https:"],
        "font-src": [
          "'self'",
          "data:",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
        ],
        "object-src": ["'none'"],
        "frame-ancestors": ["'self'"],
      },
    },
    crossOriginResourcePolicy: false,
  })
);

// ---------- UPLOADS ----------
const uploadPath = path.join(__dirname, "uploads");

// Create uploads folder if it doesn't exist
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// Create organizations folder inside uploads
const orgUploadPath = path.join(uploadPath, "organizations");
if (!fs.existsSync(orgUploadPath)) fs.mkdirSync(orgUploadPath, { recursive: true });

// Serve uploads folder statically
app.use("/uploads", express.static(uploadPath));

// ---------- FRONTEND ----------
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "org_dashboard.html"));
});

// ---------- ROUTES ----------
const userRoutes = require("./routes/userRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const organizationRoutes = require("./routes/organizationRoutes");

// Use routes
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/organizations", organizationRoutes);

// ---------- ERROR HANDLER ----------
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ---------- DATABASE ----------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------- SERVER ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at: http://localhost:${PORT}`)
);
