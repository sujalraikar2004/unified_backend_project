import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please provide a valid email address",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long"],
        },
        usn: {
            type: String,
            required: [true, "USN is required"],
            unique: true,
            trim: true,
            uppercase: true,
        },
        semester: {
            type: String,
            required: [true, "Semester is required"],
        },
        department: {
            type: String,
            required: [true, "Department is required"],
            trim: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationOTP: {
            type: String,
        },
        otpExpiry: {
            type: Date,
        },
        passwordResetOTP: {
            type: String,
        },
        passwordResetExpiry: {
            type: Date,
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
        }
    );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
        }
    );
};

// Generate OTP
userSchema.methods.generateOTP = function () {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.emailVerificationOTP = otp;
    // OTP expires in 10 minutes
    this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    return otp;
};

// Generate password reset OTP
userSchema.methods.generatePasswordResetOTP = function () {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.passwordResetOTP = otp;
    // OTP expires in 10 minutes
    this.passwordResetExpiry = new Date(Date.now() + 10 * 60 * 1000);
    return otp;
};

export const User = mongoose.model("User", userSchema);
