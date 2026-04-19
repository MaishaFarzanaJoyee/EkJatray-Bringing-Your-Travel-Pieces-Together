import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import budgetRoutes from "./modules/budget/budget.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import transportRoutes from "./modules/transport/transport.routes.js";

// Create the Express app.
const app = express();

// Get the current file path so we can find the frontend folder.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Frontend folder path.
const frontendPath = path.resolve(__dirname, "../../frontend");
const frontendDistPath = path.join(frontendPath, "dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

// This lets the app read JSON request bodies.
app.use(express.json()); // allow JSON data req

// This serves images and other assets from the root asset folder.
app.use("/asset", express.static(path.resolve(__dirname, "../../asset")));

// Connect budget API routes.
app.use("/api/budget", budgetRoutes);

// Connect transport API routes.
app.use("/api/transport", transportRoutes);

// Connect auth API routes.
app.use("/api/auth", authRoutes);

if (hasFrontendBuild) {
  // Serve React production build files.
  app.use(express.static(frontendDistPath));

  // SPA fallback: let React Router handle non-API routes.
  app.use((req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API route not found" });
    }

    return res.sendFile(frontendIndexPath);
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      message: "Frontend build not found. Run 'npm run build' inside frontend and restart the server.",
    });
  });
}

export default app;