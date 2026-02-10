import dotenv from "dotenv";
import connectdb from "./db/db.js";
import app from "./app.js";

// Load environment variables
dotenv.config();

// Debug: Log the loaded environment variables
console.log("Environment variables loaded:");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
console.log("PORT:", process.env.PORT);

// For Vercel serverless function
if (process.env.VERCEL) {
    // Connect to database once (Vercel will cache this)
    connectdb().catch((error) => {
        console.log("mongodb error", error);
    });
} else {
    // For local development
    connectdb()
        .then(() => {
            app.listen(process.env.PORT || 8000, () => {
                console.log(`server is running on port ${process.env.PORT}`);
            })
            app.on("error", (err) => {
                console.log("server error", err);
            })
        })
        .catch((error) => {
            console.log("mongodb error", error);
        })
}

// Export for Vercel serverless function
export default app;
