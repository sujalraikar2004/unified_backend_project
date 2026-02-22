import { Gallery } from "../models/gallery.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

// Create a new gallery item
const createGalleryItem = asyncHandler(async (req, res) => {
    const { title, description, category, tags, mediaType } = req.body;

    // Validate required fields
    if (!title || !mediaType) {
        throw new ApiError(400, "Title and media type are required");
    }

    // Validate media type
    if (!["image", "video"].includes(mediaType)) {
        throw new ApiError(400, "Media type must be either 'image' or 'video'");
    }

    // Check if file is uploaded
    if (!req.file) {
        throw new ApiError(400, "Media file is required");
    }

    const localFilePath = req.file.path;

    try {
        // Upload to Cloudinary
        const uploadedFile = await uploadOnCloudinary(localFilePath, {
            resource_type: mediaType === "video" ? "video" : "image",
            folder: "gallery",
        });

        if (!uploadedFile) {
            throw new ApiError(500, "Failed to upload media to cloud storage");
        }

        // Parse tags if provided as string
        let parsedTags = [];
        if (tags) {
            parsedTags = typeof tags === "string" ? tags.split(",").map(tag => tag.trim()) : tags;
        }

        // Create gallery item
        const galleryItem = await Gallery.create({
            title,
            description,
            mediaType,
            mediaUrl: uploadedFile.secure_url,
            thumbnailUrl: uploadedFile.thumbnail_url || uploadedFile.secure_url,
            publicId: uploadedFile.public_id,
            category: category || "general",
            tags: parsedTags,
            uploadedBy: req.user?._id,
            metadata: {
                width: uploadedFile.width,
                height: uploadedFile.height,
                format: uploadedFile.format,
                size: uploadedFile.bytes,
                duration: uploadedFile.duration, // for videos
            },
        });

        return res
            .status(201)
            .json(new ApiResponse(201, galleryItem, "Gallery item created successfully"));
    } catch (error) {
        // Clean up local file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw error;
    }
});

// Get all gallery items with filtering and pagination
const getAllGalleryItems = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 40,
        category,
        mediaType,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
        isActive = true,
    } = req.query;

    // Build filter object
    const filter = {};

    if (isActive !== undefined) {
        filter.isActive = isActive === "true" || isActive === true;
    }

    if (category && category !== "all") {
        filter.category = category;
    }

    if (mediaType && mediaType !== "all") {
        filter.mediaType = mediaType;
    }

    // Text search
    if (search) {
        filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const [galleryItems, total] = await Promise.all([
        Gallery.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate("uploadedBy", "fullName email")
            .lean(),
        Gallery.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                galleryItems,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1,
                },
            },
            "Gallery items retrieved successfully"
        )
    );
});

// Get single gallery item by ID
const getGalleryItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const galleryItem = await Gallery.findById(id)
        .populate("uploadedBy", "fullName email");

    if (!galleryItem) {
        throw new ApiError(404, "Gallery item not found");
    }

    // Increment view count
    await galleryItem.incrementViewCount();

    return res
        .status(200)
        .json(new ApiResponse(200, galleryItem, "Gallery item retrieved successfully"));
});

// Update gallery item
const updateGalleryItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, category, tags, isActive } = req.body;

    const galleryItem = await Gallery.findById(id);

    if (!galleryItem) {
        throw new ApiError(404, "Gallery item not found");
    }

    // Update fields
    if (title !== undefined) galleryItem.title = title;
    if (description !== undefined) galleryItem.description = description;
    if (category !== undefined) galleryItem.category = category;
    if (isActive !== undefined) galleryItem.isActive = isActive;
    
    if (tags !== undefined) {
        galleryItem.tags = typeof tags === "string" ? tags.split(",").map(tag => tag.trim()) : tags;
    }

    // Handle media replacement
    if (req.file) {
        const localFilePath = req.file.path;

        try {
            // Delete old media from cloudinary
            await deleteFromCloudinary(galleryItem.publicId);

            // Upload new media
            const uploadedFile = await uploadOnCloudinary(localFilePath, {
                resource_type: galleryItem.mediaType === "video" ? "video" : "image",
                folder: "gallery",
            });

            if (!uploadedFile) {
                throw new ApiError(500, "Failed to upload new media");
            }

            galleryItem.mediaUrl = uploadedFile.secure_url;
            galleryItem.thumbnailUrl = uploadedFile.thumbnail_url || uploadedFile.secure_url;
            galleryItem.publicId = uploadedFile.public_id;
            galleryItem.metadata = {
                width: uploadedFile.width,
                height: uploadedFile.height,
                format: uploadedFile.format,
                size: uploadedFile.bytes,
                duration: uploadedFile.duration,
            };
        } catch (error) {
            // Clean up local file
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
            throw error;
        }
    }

    await galleryItem.save();

    return res
        .status(200)
        .json(new ApiResponse(200, galleryItem, "Gallery item updated successfully"));
});

// Delete gallery item
const deleteGalleryItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const galleryItem = await Gallery.findById(id);

    if (!galleryItem) {
        throw new ApiError(404, "Gallery item not found");
    }

    // Delete from cloudinary
    await deleteFromCloudinary(galleryItem.publicId);

    // Delete from database
    await Gallery.findByIdAndDelete(id);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Gallery item deleted successfully"));
});

// Get gallery categories
const getGalleryCategories = asyncHandler(async (req, res) => {
    const categories = await Gallery.distinct("category");

    return res
        .status(200)
        .json(new ApiResponse(200, categories, "Categories retrieved successfully"));
});

// Get gallery statistics
const getGalleryStats = asyncHandler(async (req, res) => {
    const stats = await Gallery.aggregate([
        {
            $facet: {
                totalItems: [{ $count: "count" }],
                activeItems: [{ $match: { isActive: true } }, { $count: "count" }],
                inactiveItems: [{ $match: { isActive: false } }, { $count: "count" }],
                imageCount: [{ $match: { mediaType: "image" } }, { $count: "count" }],
                videoCount: [{ $match: { mediaType: "video" } }, { $count: "count" }],
                totalViews: [{ $group: { _id: null, total: { $sum: "$viewCount" } } }],
                categoryCounts: [
                    { $group: { _id: "$category", count: { $count: {} } } },
                    { $sort: { count: -1 } },
                ],
                recentItems: [
                    { $sort: { createdAt: -1 } },
                    { $limit: 5 },
                    {
                        $project: {
                            title: 1,
                            mediaType: 1,
                            category: 1,
                            viewCount: 1,
                            createdAt: 1,
                        },
                    },
                ],
            },
        },
    ]);

    const formattedStats = {
        totalItems: stats[0].totalItems[0]?.count || 0,
        activeItems: stats[0].activeItems[0]?.count || 0,
        inactiveItems: stats[0].inactiveItems[0]?.count || 0,
        imageCount: stats[0].imageCount[0]?.count || 0,
        videoCount: stats[0].videoCount[0]?.count || 0,
        totalViews: stats[0].totalViews[0]?.total || 0,
        categoryCounts: stats[0].categoryCounts,
        recentItems: stats[0].recentItems,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, formattedStats, "Gallery statistics retrieved successfully"));
});

// Bulk delete gallery items
const bulkDeleteGalleryItems = asyncHandler(async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new ApiError(400, "Please provide an array of gallery item IDs");
    }

    // Get all items to delete
    const items = await Gallery.find({ _id: { $in: ids } });

    if (items.length === 0) {
        throw new ApiError(404, "No gallery items found");
    }

    // Delete from cloudinary
    const deletePromises = items.map((item) => deleteFromCloudinary(item.publicId));
    await Promise.all(deletePromises);

    // Delete from database
    const result = await Gallery.deleteMany({ _id: { $in: ids } });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { deletedCount: result.deletedCount },
                `${result.deletedCount} gallery items deleted successfully`
            )
        );
});

export {
    createGalleryItem,
    getAllGalleryItems,
    getGalleryItemById,
    updateGalleryItem,
    deleteGalleryItem,
    getGalleryCategories,
    getGalleryStats,
    bulkDeleteGalleryItems,
};
