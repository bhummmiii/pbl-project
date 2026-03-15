const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ success: false, message: "No token provided" });

  const token = authHeader.split(" ")[1]; // Expect "Bearer <token>"
  if (!token)
    return res.status(401).json({ success: false, message: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    // Attach decoded user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    const message =
      error.name === "TokenExpiredError"
        ? "Token has expired"
        : "Token is not valid";
    return res.status(403).json({ success: false, message });
  }
};

module.exports = verifyToken;
