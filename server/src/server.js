import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const [{ default: app }, { default: connectDB }] = await Promise.all([
  import("./app.js"),
  import("./config/db.js"),
]);

// Connect MongoDB first so the app can use the database.
await connectDB();

// Server port number.
const PORT = Number(process.env.PORT || 5000);

// Start the Express server.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
