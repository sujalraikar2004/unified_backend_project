import dotenv from "dotenv";
import connectdb from "./db/db.js";
import app from "./app.js";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

// Debug: Log the loaded environment variables (don't log sensitive data in production)
if (process.env.NODE_ENV !== 'production') {
    console.log("Environment variables loaded:");
    console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
    console.log("PORT:", process.env.PORT);
}

// Set mongoose to not buffer commands in serverless
mongoose.set('bufferCommands', false);

// For Vercel serverless function
if (process.env.VERCEL) {
    console.log("Running in Vercel serverless mode");
    // Don't connect here - let middleware handle it per request
    // This prevents cold start issues
} else {
    // For local development
    console.log("Running in local development mode");
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
            process.exit(1);
        })
}

// Export for Vercel serverless function
export default app;
