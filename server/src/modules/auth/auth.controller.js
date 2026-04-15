import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./user.model.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isAdminEmail = (email) => getAdminEmails().includes((email || "").toLowerCase().trim());

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || "user",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const getAuthResponse = (user) => {
  const token = createToken(user);

  return {
    message: "Authentication successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
    },
  };
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: isAdminEmail(normalizedEmail) ? "admin" : "user",
    });

    return res.status(201).json(getAuthResponse(user));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (isAdminEmail(normalizedEmail) && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    return res.json(getAuthResponse(user));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
    },
  });
};
