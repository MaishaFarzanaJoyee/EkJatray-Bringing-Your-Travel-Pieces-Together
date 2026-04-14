import app from "./app.js";
import connectDB from "./config/db.js";

// Connect MongoDB first so the app can use the database.
connectDB();

// Server port number.
const PORT = 5000;

// Start the Express server.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});