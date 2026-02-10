import { Team } from "../models/team.model.js";
import { Event } from "../models/event.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// Create a new team
export const createTeam = asyncHandler(async (req, res) => {
    const { teamName, members } = req.body;
    const teamLeaderId = req.user._id;

    // Validate input
    if (!teamName || !members || !Array.isArray(members) || members.length === 0) {
        throw new ApiError(400, "Team name and at least one member are required");
    }

    // Validate each member
    for (const member of members) {
        if (!member.fullName || !member.usn || !member.currentSemester || !member.department) {
            throw new ApiError(400, "All member fields are required (fullName, usn, currentSemester, department)");
        }
        if (member.currentSemester < 1 || member.currentSemester > 8) {
            throw new ApiError(400, "Semester must be between 1 and 8");
        }
    }

    // Check if team name already exists for this leader
    const existingTeam = await Team.findOne({
        teamLeader: teamLeaderId,
        teamName: { $regex: new RegExp(`^${teamName}$`, 'i') },
        isActive: true,
    });

    if (existingTeam) {
        throw new ApiError(409, "You already have a team with this name");
    }

    // Create team
    const team = await Team.create({
        teamName,
        teamLeader: teamLeaderId,
        members,
    });

    // Populate team leader details
    await team.populate('teamLeader', '-password -refreshToken -emailVerificationOTP -passwordResetOTP');

    res.status(201).json(
        new ApiResponse(201, team, "Team created successfully")
    );
});

// Get all teams of the logged-in user
export const getMyTeams = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const teams = await Team.find({
        teamLeader: userId,
        isActive: true,
    })
    .populate('teamLeader', '-password -refreshToken -emailVerificationOTP -passwordResetOTP')
    .populate('registeredEvents')
    .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, teams, "Teams fetched successfully")
    );
});

// Get team by ID
export const getTeamById = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    const team = await Team.findById(teamId)
        .populate('teamLeader', '-password -refreshToken -emailVerificationOTP -passwordResetOTP')
        .populate('registeredEvents');

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    // Check if user is the team leader
    if (team.teamLeader._id.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to view this team");
    }

    res.status(200).json(
        new ApiResponse(200, team, "Team fetched successfully")
    );
});

// Update team
export const updateTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { teamName, members } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    const team = await Team.findById(teamId);

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    // Check if user is the team leader
    if (team.teamLeader.toString() !== userId.toString()) {
        throw new ApiError(403, "Only team leader can update the team");
    }

    // Update fields
    if (teamName) {
        // Check if new name conflicts with existing team
        const existingTeam = await Team.findOne({
            _id: { $ne: teamId },
            teamLeader: userId,
            teamName: { $regex: new RegExp(`^${teamName}$`, 'i') },
            isActive: true,
        });

        if (existingTeam) {
            throw new ApiError(409, "You already have another team with this name");
        }

        team.teamName = teamName;
    }

    if (members && Array.isArray(members) && members.length > 0) {
        // Validate members
        for (const member of members) {
            if (!member.fullName || !member.usn || !member.currentSemester || !member.department) {
                throw new ApiError(400, "All member fields are required");
            }
            if (member.currentSemester < 1 || member.currentSemester > 8) {
                throw new ApiError(400, "Semester must be between 1 and 8");
            }
        }
        team.members = members;
    }

    await team.save();
    await team.populate('teamLeader', '-password -refreshToken -emailVerificationOTP -passwordResetOTP');
    await team.populate('registeredEvents');

    res.status(200).json(
        new ApiResponse(200, team, "Team updated successfully")
    );
});

// Delete team
export const deleteTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    }

    const team = await Team.findById(teamId);

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    // Check if user is the team leader
    if (team.teamLeader.toString() !== userId.toString()) {
        throw new ApiError(403, "Only team leader can delete the team");
    }

    // Check if team is registered for any events
    if (team.registeredEvents && team.registeredEvents.length > 0) {
        throw new ApiError(400, "Cannot delete team that is registered for events. Please unregister first.");
    }

    // Soft delete
    team.isActive = false;
    await team.save();

    res.status(200).json(
        new ApiResponse(200, null, "Team deleted successfully")
    );
});
