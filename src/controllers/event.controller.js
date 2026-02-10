import { Event } from "../models/event.model.js";
import { Team } from "../models/team.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

// Create event (Admin only)
export const createEvent = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        category,
        date,
        startTime,
        endTime,
        location,
        maxSeats,
        minTeamSize,
        maxTeamSize,
        status,
    } = req.body;

    console.log("📝 Creating new event:", { name, hasFile: !!req.file });
    
    // Validate required fields
    if (!name || !description || !category || !date || !startTime || !endTime || !location || !maxSeats) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Parse category if it's a string (from form data)
    let parsedCategory = category;
    if (typeof category === 'string') {
        try {
            parsedCategory = JSON.parse(category);
        } catch (e) {
            // If not JSON, treat as comma-separated string
            parsedCategory = category.split(',').map(c => c.trim());
        }
    }

    // Validate category is array
    if (!Array.isArray(parsedCategory) || parsedCategory.length === 0) {
        throw new ApiError(400, "Category must be a non-empty array");
    }

    // Handle poster image upload
    let posterImageUrl = null;
    if (req.file) {
        console.log("📸 Uploading poster image to Cloudinary:", req.file.path);
        try {
            const cloudinaryResponse = await uploadonCloudinary(req.file.path, {
                folder: "uniconnect/events",
                resource_type: "image"
            });
            posterImageUrl = cloudinaryResponse.secure_url;
            console.log("✅ Image uploaded successfully:", posterImageUrl);
        } catch (error) {
            console.error("❌ Cloudinary upload failed:", error);
            // Clean up file if upload fails
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            throw new ApiError(500, "Failed to upload poster image");
        }
    } else {
        console.log("ℹ️ No poster image provided");
    }

    // Create event
    const event = await Event.create({
        name,
        description,
        category: parsedCategory,
        date,
        startTime,
        endTime,
        location,
        maxSeats,
        minTeamSize: minTeamSize || 1,
        maxTeamSize: maxTeamSize || null,
        posterImage: posterImageUrl,
        status: status || 'upcoming',
        createdBy: req.user._id,
    });

    await event.populate('createdBy', '-password -refreshToken -emailVerificationOTP -passwordResetOTP');

    console.log("✅ Event created successfully:", event._id);
    
    res.status(201).json(
        new ApiResponse(201, event, "Event created successfully")
    );
});

// Get all events with filters
export const getAllEvents = asyncHandler(async (req, res) => {
    const { status, category, search, page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };

    // Filter by status
    if (status && ['upcoming', 'live', 'expired', 'cancelled'].includes(status)) {
        filter.status = status;
    }

    // Filter by category
    if (category) {
        filter.category = { $in: [category] };
    }

    // Search by name or description
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(filter)
        .populate('createdBy', 'fullName email')
        .sort({ date: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.status(200).json(
        new ApiResponse(200, {
            events,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        }, "Events fetched successfully")
    );
});

// Get event by ID
export const getEventById = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    const event = await Event.findById(eventId)
        .populate('createdBy', 'fullName email')
        .populate({
            path: 'registeredTeams.team',
            populate: {
                path: 'teamLeader',
                select: 'fullName email',
            },
        });

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    res.status(200).json(
        new ApiResponse(200, event, "Event fetched successfully")
    );
});

// Update event (Admin only)
export const updateEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const updateData = req.body;

    console.log("📝 Updating event:", eventId, { hasFile: !!req.file });

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    const event = await Event.findById(eventId);

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Handle poster image upload if provided
    if (req.file) {
        console.log("📸 Uploading updated poster image to Cloudinary:", req.file.path);
        try {
            const cloudinaryResponse = await uploadonCloudinary(req.file.path, {
                folder: "uniconnect/events",
                resource_type: "image"
            });
            updateData.posterImage = cloudinaryResponse.secure_url;
            console.log("✅ Image uploaded successfully:", updateData.posterImage);
        } catch (error) {
            console.error("❌ Cloudinary upload failed:", error);
            // Clean up file if upload fails
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            throw new ApiError(500, "Failed to upload poster image");
        }
    }

    // Parse category if it's a string (from form data)
    if (updateData.category && typeof updateData.category === 'string') {
        try {
            updateData.category = JSON.parse(updateData.category);
        } catch (e) {
            // If not JSON, treat as comma-separated string
            updateData.category = updateData.category.split(',').map(c => c.trim());
        }
    }

    // Update allowed fields
    const allowedUpdates = [
        'name', 'description', 'category', 'date', 'startTime', 'endTime',
        'location', 'maxSeats', 'minTeamSize', 'maxTeamSize', 'posterImage', 'status'
    ];

    allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
            event[field] = updateData[field];
        }
    });

    await event.save();
    await event.populate('createdBy', 'fullName email');

    console.log("✅ Event updated successfully:", event._id);

    res.status(200).json(
        new ApiResponse(200, event, "Event updated successfully")
    );
});

// Delete event (Admin only)
export const deleteEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    const event = await Event.findById(eventId);

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Soft delete
    event.isActive = false;
    await event.save();

    res.status(200).json(
        new ApiResponse(200, null, "Event deleted successfully")
    );
});

// Register team for event
export const registerTeamForEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { teamId } = req.body;
    const userId = req.user._id;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    // Fetch event and team
    const event = await Event.findById(eventId);
    const team = await Team.findById(teamId);

    if (!event) {
        throw new ApiError(404, "Event not found");
    }
    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    // Check if user is the team leader
    if (team.teamLeader.toString() !== userId.toString()) {
        throw new ApiError(403, "Only team leader can register the team for events");
    }

    // Check if event is live
    if (event.status !== 'live') {
        throw new ApiError(400, `Cannot register for ${event.status} events. Registration is only open for live events.`);
    }

    // Check if event is active
    if (!event.isActive) {
        throw new ApiError(400, "This event is no longer active");
    }

    // Check if event is full
    if (event.isFull) {
        throw new ApiError(400, "Event is full. No more registrations accepted.");
    }

    // Check if team size is valid
    if (!event.isValidTeamSize(team.teamSize)) {
        const maxMsg = event.maxTeamSize ? ` and maximum ${event.maxTeamSize}` : '';
        throw new ApiError(
            400,
            `Team size must be minimum ${event.minTeamSize}${maxMsg} members. Your team has ${team.teamSize} members.`
        );
    }

    // Check if team is already registered
    const alreadyRegistered = event.registeredTeams.some(
        rt => rt.team.toString() === teamId
    );

    if (alreadyRegistered) {
        throw new ApiError(400, "Team is already registered for this event");
    }

    // Register team
    event.registeredTeams.push({
        team: teamId,
        registeredAt: new Date(),
    });
    await event.save();

    // Add event to team's registered events
    if (!team.registeredEvents.includes(eventId)) {
        team.registeredEvents.push(eventId);
        await team.save();
    }

    await event.populate('registeredTeams.team');

    res.status(200).json(
        new ApiResponse(200, event, "Team registered successfully")
    );
});

// Unregister team from event
export const unregisterTeamFromEvent = asyncHandler(async (req, res) => {
    const { eventId, teamId } = req.params;
    const userId = req.user._id;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    // Fetch event and team
    const event = await Event.findById(eventId);
    const team = await Team.findById(teamId);

    if (!event) {
        throw new ApiError(404, "Event not found");
    }
    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    // Check if user is the team leader
    if (team.teamLeader.toString() !== userId.toString()) {
        throw new ApiError(403, "Only team leader can unregister the team from events");
    }

    // Check if team is registered
    const registrationIndex = event.registeredTeams.findIndex(
        rt => rt.team.toString() === teamId
    );

    if (registrationIndex === -1) {
        throw new ApiError(400, "Team is not registered for this event");
    }

    // Unregister team
    event.registeredTeams.splice(registrationIndex, 1);
    await event.save();

    // Remove event from team's registered events
    team.registeredEvents = team.registeredEvents.filter(
        e => e.toString() !== eventId
    );
    await team.save();

    res.status(200).json(
        new ApiResponse(200, null, "Team unregistered successfully")
    );
});

// Get registered events for user's teams
export const getMyRegisteredEvents = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find all teams where user is leader
    const teams = await Team.find({
        teamLeader: userId,
        isActive: true,
    }).select('_id');

    const teamIds = teams.map(t => t._id);

    // Find events where these teams are registered
    const events = await Event.find({
        'registeredTeams.team': { $in: teamIds },
        isActive: true,
    })
    .populate('createdBy', 'fullName email')
    .sort({ date: 1 });

    res.status(200).json(
        new ApiResponse(200, events, "Registered events fetched successfully")
    );
});
