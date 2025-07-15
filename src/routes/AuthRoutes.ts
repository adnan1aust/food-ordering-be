import express from "express";
import authController from "../controllers/AuthController";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/generate-magic-link", authController.generateMagicLink);
router.get("/verify-magic-link", authController.verifyMagicLink);
router.post("/google", authController.googleAuth);

export default router;
