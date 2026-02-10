import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

// Cache the database connection for serverless environments
let cachedDb = null;
let isConnecting = false;

const dbconnect = async () => {
    // If we have a cached connection and it's ready, return it
    if (cachedDb && mongoose.connection.readyState === 1) {
        console.log("Using cached database connection");
        return cachedDb;
    }

    // If connection is in progress, wait for it
    if (isConnecting) {
        console.log("Connection in progress, waiting...");
        while (isConnecting) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return cachedDb;
    }

    try {
        isConnecting = true;
        
        // Close any existing connections in wrong state
        if (mongoose.connection.readyState !== 0 && mongoose.connection.readyState !== 1) {
            await mongoose.connection.close();
        }

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`, {
            // Optimized options for serverless environments
            maxPoolSize: 10,
            minPoolSize: 1,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            // Prevent buffering in serverless
            bufferCommands: false,
            // Auto index for better performance
            autoIndex: true,
        })
        
        cachedDb = connectionInstance;
        isConnecting = false;
        console.log("mongodb connected\n", connectionInstance.connection.host, connectionInstance.connection.name);
        return connectionInstance;
    } catch (error) {
        isConnecting = false;
        console.log("mongodb error", error);
        cachedDb = null;
        throw error;
    }
}

// Middleware to ensure DB connection for each request
export const ensureDbConnection = async (req, res, next) => {
    try {
        await dbconnect();
        next();
    } catch (error) {
        console.error("Database connection failed:", error);
        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: "Database connection failed",
            errors: [error.message]
        });
    }
};

export default dbconnect
