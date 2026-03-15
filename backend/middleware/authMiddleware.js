const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    // Attach decoded info directly
    req.user = decoded; // ✅ { id, role }
    next();
  } catch (err) {
    console.error("❌ Auth error:", err);
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;
