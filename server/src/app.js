import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import budgetRoutes from "./modules/budget/budget.routes.js";

// Create the Express app.
const app = express();

// Get the current file path so we can find the frontend folder.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Frontend folder path.
const frontendPath = path.resolve(__dirname, "../../frontend");

// This lets the app read JSON request bodies.
app.use(express.json()); // allow JSON data req

// This serves CSS, HTML, and other frontend files.
app.use(express.static(frontendPath));

// This serves images and other assets from the root asset folder.
app.use("/asset", express.static(path.resolve(__dirname, "../../asset")));

// Home page route.
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Login page route.
app.get("/login", (req, res) => {
  res.sendFile(path.join(frontendPath, "login.html"));
});

// Register page route.
app.get("/register", (req, res) => {
  res.sendFile(path.join(frontendPath, "register.html"));
});

// Budget page route.
app.get("/budget", (req, res) => {
  res.sendFile(path.join(frontendPath, "budget.html"));
});

// Connect budget API routes.
app.use("/api/budget", budgetRoutes);

export default app;