import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
        },
        mediaType: {
            type: String,
            enum: ["image", "video"],
            required: [true, "Media type is required"],
        },
        mediaUrl: {
            type: String,
            required: [true, "Media URL is required"],
        },
        thumbnailUrl: {
            type: String,
        },
        publicId: {
            type: String,
            required: [true, "Public ID is required"],
        },
        category: {
            type: String,
            trim: true,
            default: "general",
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
        metadata: {
            width: Number,
            height: Number,
            format: String,
            size: Number,
            duration: Number, // for videos
        },
    },
    {
        timestamps: true,
    }
);

// Index for better search performance
gallerySchema.index({ title: "text", description: "text", tags: "text" });
gallerySchema.index({ category: 1, createdAt: -1 });
gallerySchema.index({ isActive: 1, createdAt: -1 });

// Method to increment view count
gallerySchema.methods.incrementViewCount = async function () {
    this.viewCount += 1;
    return await this.save();
};

export const Gallery = mongoose.model("Gallery", gallerySchema);
