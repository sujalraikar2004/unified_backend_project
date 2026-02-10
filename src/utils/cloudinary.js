import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

const uploadonCloudinary = async (filepath, options = {}) => {
    // Force the correct Cloudinary configuration (override system env vars)
    const cloudinaryConfig = {
        cloud_name: "derz8ikfc",
        api_key: "561939495576736",
        api_secret: "k0ZD40fMhllYhoqqmhJXwPoKKgU"
    };

    console.log("Cloudinary Config Debug:");
    console.log("Using cloud_name:", cloudinaryConfig.cloud_name);
    console.log("Using api_key:", cloudinaryConfig.api_key);
    console.log("Using api_secret:", cloudinaryConfig.api_secret ? "***SET***" : "NOT SET");

    cloudinary.config(cloudinaryConfig);

    try {
        const uploadOptions = {
            resource_type: options.resource_type || "auto", // Automatically detect the resource type (image, video, etc.)
            folder: options.folder || "",
            ...options
        };

        const response = await cloudinary.uploader.upload(filepath, uploadOptions);

        console.log("file uploaded to cloudinary", response.url);
        
        // Clean up local file after successful upload
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
        
        return response;
    } catch (error) {
        // Clean up local file on error
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
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



