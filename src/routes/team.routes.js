import { Router } from "express";
import {
    createTeam,
    getMyTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
} from "../controllers/team.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Team CRUD operations
router.post("/", createTeam);
router.get("/", getMyTeams);
router.get("/:teamId", getTeamById);
router.put("/:teamId", updateTeam);
router.delete("/:teamId", deleteTeam);

export default router;
