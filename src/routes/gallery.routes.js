import { Router } from "express";
import {
    createGalleryItem,
    getAllGalleryItems,
    getGalleryItemById,
    updateGalleryItem,
    deleteGalleryItem,
    getGalleryCategories,
    getGalleryStats,
    bulkDeleteGalleryItems,
} from "../controllers/gallery.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes (no authentication required)
router.route("/").get(getAllGalleryItems);
router.route("/categories").get(getGalleryCategories);
router.route("/:id").get(getGalleryItemById);

// Protected routes (authentication required)
router.route("/create").post(verifyJWT, upload.single("media"), createGalleryItem);
router.route("/update/:id").patch(verifyJWT, upload.single("media"), updateGalleryItem);
router.route("/delete/:id").delete(verifyJWT, deleteGalleryItem);
router.route("/stats").get(verifyJWT, getGalleryStats);
router.route("/bulk-delete").post(verifyJWT, bulkDeleteGalleryItems);

export default router;
