import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

// Cache the database connection for serverless environments
let cachedDb = null;

const dbconnect = async () => {
    // If we have a cached connection and it's ready, return it
    if (cachedDb && mongoose.connection.readyState === 1) {
        console.log("Using cached database connection");
        return cachedDb;
    }

    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`, {
            // These options help with serverless environments
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        })
        cachedDb = connectionInstance;
        console.log("mongodb connected\n", connectionInstance.connection.host, connectionInstance.connection.name);
        return connectionInstance;
    } catch (error) {
        console.log("mongodb error", error);
        throw error;
    }
}

export default dbconnect
