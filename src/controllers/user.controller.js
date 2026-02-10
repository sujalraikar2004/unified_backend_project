import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
} from "../utils/nodemailer.js";
import jwt from "jsonwebtoken";

// Cookie options for development and production
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    path: '/',
};

// Password validation function with detailed error messages
const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }

    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }

    if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number");
    }

    if (!/[@$!%*?&]/.test(password)) {
        errors.push("Password must contain at least one special character (@$!%*?&)");
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        message: errors.length > 0 
            ? `Password requirements not met: ${errors.join("; ")}`
            : "Password is valid"
    };
};

// Register user
export const registerUser = asyncHandler(async (req, res, next) => {
    const { fullName, email, password, usn, semester, department } = req.body;

    // Validate all fields
    if (
        !fullName ||
        !email ||
        !password ||
        !usn ||
        !semester ||
        !department
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        throw new ApiError(
            400,
            passwordValidation.message,
            passwordValidation.errors
        );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { usn: usn.toUpperCase() }],
    });

    if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
            throw new ApiError(409, "User with this email already exists");
        }
        if (existingUser.usn === usn.toUpperCase()) {
            throw new ApiError(409, "User with this USN already exists");
        }
    }

    // Create user
    const user = new User({
        fullName,
        email: email.toLowerCase(),
        password,
        usn: usn.toUpperCase(),
        semester,
        department,
    });

    // Generate OTP
    const otp = user.generateOTP();

    // Save user
    await user.save();

    // Send verification email
    try {
        await sendVerificationEmail(user.email, user.fullName, otp);
    } catch (error) {
        // Delete user if email fails to send
        await User.findByIdAndDelete(user._id);
        throw new ApiError(
            500,
            "Failed to send verification email. Please try again."
        );
    }

    // Return response
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { userId: user._id, email: user.email },
                "User registered successfully! Please check your email for verification OTP."
            )
        );
});

// Verify email
export const verifyEmail = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if already verified
    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    // Check if OTP exists
    if (!user.emailVerificationOTP) {
        throw new ApiError(400, "No OTP found. Please request a new OTP.");
    }

    // Check if OTP is expired
    if (user.otpExpiry < new Date()) {
        throw new ApiError(400, "OTP has expired. Please request a new OTP.");
    }

    // Verify OTP
    if (user.emailVerificationOTP !== otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    // Mark user as verified
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { email: user.email },
                "Email verified successfully! You can now login."
            )
        );
});

// Resend OTP
export const resendOTP = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    // Validate input
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if already verified
    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send verification email
    try {
        await sendVerificationEmail(user.email, user.fullName, otp);
    } catch (error) {
        throw new ApiError(500, "Failed to send verification email");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { email: user.email },
                "OTP sent successfully! Please check your email."
            )
        );
});

// Login user
export const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new ApiError(404, "Invalid email or password");
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
        throw new ApiError(
            403,
            "Please verify your email before logging in. Check your email for the OTP."
        );
    }

    // Check password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Get user without sensitive data
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationOTP -otpExpiry -passwordResetOTP -passwordResetExpiry"
    );

    // Set cookies and return response
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully"
            )
        );
});

// Logout user
export const logoutUser = asyncHandler(async (req, res, next) => {
    // Clear refresh token from database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    // Clear cookies
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Forgot password
export const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    // Validate input
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        // Don't reveal if user exists or not for security
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "If the email exists, a password reset OTP has been sent."
                )
            );
    }

    // Generate password reset OTP
    const otp = user.generatePasswordResetOTP();
    await user.save();

    // Send password reset email
    try {
        await sendPasswordResetEmail(user.email, user.fullName, otp);
    } catch (error) {
        // Clear OTP if email fails
        user.passwordResetOTP = undefined;
        user.passwordResetExpiry = undefined;
        await user.save();
        throw new ApiError(500, "Failed to send password reset email");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset OTP sent successfully! Please check your email."
            )
        );
});

// Reset password
export const resetPassword = asyncHandler(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    // Validate input
    if (!email || !otp || !newPassword) {
        throw new ApiError(400, "Email, OTP, and new password are required");
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        throw new ApiError(
            400,
            passwordValidation.message,
            passwordValidation.errors
        );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if OTP exists
    if (!user.passwordResetOTP) {
        throw new ApiError(
            400,
            "No password reset OTP found. Please request a new one."
        );
    }

    // Check if OTP is expired
    if (user.passwordResetExpiry < new Date()) {
        throw new ApiError(
            400,
            "OTP has expired. Please request a new password reset."
        );
    }

    // Verify OTP
    if (user.passwordResetOTP !== otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    // Update password
    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetExpiry = undefined;
    user.refreshToken = undefined; // Invalidate all sessions
    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset successfully! You can now login with your new password."
            )
        );
});

// Refresh access token
export const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        // Generate new tokens
        const accessToken = user.generateAccessToken();
        const newRefreshToken = user.generateRefreshToken();

        user.refreshToken = newRefreshToken;
        await user.save();

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// Get current user
export const getCurrentUser = asyncHandler(async (req, res, next) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "User fetched successfully")
        );
});
