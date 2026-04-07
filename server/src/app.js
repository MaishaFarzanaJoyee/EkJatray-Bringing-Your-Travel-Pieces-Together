import express from "express";
import budgetRoutes from "./modules/budget/budget.routes.js";

const app = express();

app.use(express.json()); // allow JSON data req

// test route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// connect budget routes
app.use("/api/budget", budgetRoutes);

export default app;