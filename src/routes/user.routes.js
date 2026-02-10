import { Router } from "express";
import {
    registerUser,
    verifyEmail,
    resendOTP,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    refreshAccessToken,
    getCurrentUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.route("/register").post(registerUser);
router.route("/verify-email").post(verifyEmail);
router.route("/resend-otp").post(resendOTP);
router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);

export default router;
