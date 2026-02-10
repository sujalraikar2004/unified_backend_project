import { Router } from "express";
import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    registerTeamForEvent,
    unregisterTeamFromEvent,
    getMyRegisteredEvents,
} from "../controllers/event.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes (no auth required)
router.get("/", getAllEvents);
router.get("/:eventId", getEventById);

// Protected routes (auth required)
router.use(verifyJWT);

// Event CRUD (Admin functions)
router.post("/", upload.single("posterImage"), createEvent);
router.put("/:eventId", upload.single("posterImage"), updateEvent);
router.delete("/:eventId", deleteEvent);

// Event registration
router.post("/:eventId/register", registerTeamForEvent);
router.delete("/:eventId/unregister/:teamId", unregisterTeamFromEvent);
router.get("/my/registered", getMyRegisteredEvents);

export default router;
