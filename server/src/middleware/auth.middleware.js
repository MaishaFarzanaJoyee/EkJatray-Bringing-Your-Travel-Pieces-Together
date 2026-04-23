import jwt from "jsonwebtoken";
import User from "../modules/auth/user.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-me";

if (!process.env.JWT_SECRET) {
  console.warn("[auth] JWT_SECRET is missing. Using a temporary development secret.");
}

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Login required" });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        message: user.suspensionReason
          ? `Account suspended: ${user.suspensionReason}`
          : "Account suspended",
      });
    }

    req.user = decoded;
    req.user.isSuspended = user.isSuspended;

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  return next();
};
