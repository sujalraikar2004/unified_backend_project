import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

const uploadonCloudinary = async (filepath, options = {}) => {
    // Validate file path
    if (!filepath) {
        throw new Error("File path is required for upload");
    }

    // Check if file exists before attempting upload
    if (!fs.existsSync(filepath)) {
        throw new Error(`File not found at path: ${filepath}`);
    }

    // Force the correct Cloudinary configuration (override system env vars)
    const cloudinaryConfig = {
        cloud_name: "derz8ikfc",
        api_key: "561939495576736",
        api_secret: "k0ZD40fMhllYhoqqmhJXwPoKKgU"
    };

    console.log("Cloudinary Upload Debug:");
    console.log("File path:", filepath);
    console.log("File exists:", fs.existsSync(filepath));
    console.log("Using cloud_name:", cloudinaryConfig.cloud_name);
    console.log("Environment:", process.env.VERCEL ? "Vercel" : "Local");

    cloudinary.config(cloudinaryConfig);

    try {
        const uploadOptions = {
            resource_type: options.resource_type || "auto", // Automatically detect the resource type (image, video, etc.)
            folder: options.folder || "",
            ...options
        };

        console.log("Starting upload to Cloudinary...");
        const response = await cloudinary.uploader.upload(filepath, uploadOptions);

        console.log("✅ File uploaded to cloudinary:", response.url);
        
        // Clean up local file after successful upload
        try {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log("✅ Temporary file cleaned up:", filepath);
            }
        } catch (cleanupError) {
            console.error("⚠️ Error cleaning up temp file:", cleanupError);
            // Don't throw - upload was successful
        }
        
        return response;
    } catch (error) {
        console.error("❌ Cloudinary upload error:", error);
        
        // Clean up local file on error
        try {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log("🧹 Temporary file cleaned up after error");
            }
        } catch (cleanupError) {
            console.error("⚠️ Error cleaning up temp file after error:", cleanupError);
        }
        
        throw error;
    }
}

const deleteFromCloudinary = async (publicId) => {
    const cloudinaryConfig = {
        cloud_name: "derz8ikfc",
        api_key: "561939495576736",
        api_secret: "k0ZD40fMhllYhoqqmhJXwPoKKgU"
    };

    cloudinary.config(cloudinaryConfig);

    try {
        // Try to delete as image first
        let response = await cloudinary.uploader.destroy(publicId);
        
        // If not found as image, try as video
        if (response.result === 'not found') {
            response = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        }
        
        console.log("File deleted from cloudinary:", publicId);
        return response;
    } catch (error) {
        console.error("Error deleting from cloudinary:", error);
        throw error;
    }
}

// Export both old and new naming conventions for compatibility
export { uploadonCloudinary, uploadonCloudinary as uploadOnCloudinary, deleteFromCloudinary };



