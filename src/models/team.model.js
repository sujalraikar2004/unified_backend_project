import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Member full name is required"],
        trim: true,
    },
    usn: {
        type: String,
        required: [true, "Member USN is required"],
        trim: true,
        uppercase: true,
    },
    currentSemester: {
        type: Number,
        required: [true, "Member semester is required"],
        min: 1,
        max: 8,
    },
    department: {
        type: String,
        required: [true, "Member department is required"],
        trim: true,
    },
});

const teamSchema = new mongoose.Schema(
    {
        teamName: {
            type: String,
            required: [true, "Team name is required"],
            trim: true,
            minlength: [3, "Team name must be at least 3 characters"],
            maxlength: [50, "Team name must not exceed 50 characters"],
        },
        teamLeader: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Team leader is required"],
        },
        members: {
            type: [teamMemberSchema],
            required: [true, "At least one team member is required"],
            validate: {
                validator: function(members) {
                    return members && members.length > 0;
                },
                message: "Team must have at least one member",
            },
        },
        registeredEvents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
teamSchema.index({ teamLeader: 1 });
teamSchema.index({ teamName: 1, teamLeader: 1 });

// Virtual for team size
teamSchema.virtual('teamSize').get(function() {
    return this.members.length;
});

// Ensure virtuals are included in JSON
teamSchema.set('toJSON', { virtuals: true });
teamSchema.set('toObject', { virtuals: true });

export const Team = mongoose.model("Team", teamSchema);
