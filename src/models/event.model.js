import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Event name is required"],
            trim: true,
            minlength: [3, "Event name must be at least 3 characters"],
            maxlength: [100, "Event name must not exceed 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Event description is required"],
            trim: true,
            maxlength: [2000, "Description must not exceed 2000 characters"],
        },
        category: {
            type: [String],
            required: [true, "At least one category is required"],
            validate: {
                validator: function(categories) {
                    return categories && categories.length > 0;
                },
                message: "Event must have at least one category",
            },
        },
        date: {
            type: Date,
            required: [true, "Event date is required"],
        },
        startTime: {
            type: String,
            required: [true, "Start time is required"],
        },
        endTime: {
            type: String,
            required: [true, "End time is required"],
        },
        location: {
            type: String,
            required: [true, "Event location is required"],
            trim: true,
        },
        maxSeats: {
            type: Number,
            required: [true, "Maximum seats is required"],
            min: [1, "Maximum seats must be at least 1"],
        },
        minTeamSize: {
            type: Number,
            default: 1,
            min: [1, "Minimum team size must be at least 1"],
        },
        maxTeamSize: {
            type: Number,
            default: null,
            validate: {
                validator: function(value) {
                    if (value === null) return true;
                    return value >= this.minTeamSize;
                },
                message: "Maximum team size must be greater than or equal to minimum team size",
            },
        },
        posterImage: {
            type: String,
            required: [true, "Event poster image is required"],
        },
        registeredTeams: [{
            team: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Team",
            },
            registeredAt: {
                type: Date,
                default: Date.now,
            },
        }],
        status: {
            type: String,
            enum: ["upcoming", "live", "expired", "cancelled"],
            default: "upcoming",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ name: 'text', description: 'text' });
eventSchema.index({ category: 1 });

// Virtual for available seats
eventSchema.virtual('availableSeats').get(function() {
    return this.maxSeats - this.registeredTeams.length;
});

// Virtual for registration status
eventSchema.virtual('isFull').get(function() {
    return this.registeredTeams.length >= this.maxSeats;
});

// Method to check if registration is open
eventSchema.methods.canRegister = function() {
    return this.status === 'live' && !this.isFull && this.isActive;
};

// Method to check if team size is valid
eventSchema.methods.isValidTeamSize = function(teamSize) {
    if (teamSize < this.minTeamSize) return false;
    if (this.maxTeamSize !== null && teamSize > this.maxTeamSize) return false;
    return true;
};

// Ensure virtuals are included in JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

export const Event = mongoose.model("Event", eventSchema);
