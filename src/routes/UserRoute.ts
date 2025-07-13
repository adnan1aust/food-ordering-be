import express from "express";
import UserController from "../controllers/UserController";
import verifyToken from "../middleware/authMiddleware";
import authorizedRoles from "../middleware/roleCheckerMiddleware";

const router = express.Router();

router.get(
  "/admin",
  verifyToken,
  authorizedRoles("admin"),
  UserController.checkAdminRoute,
);
router.get(
  "/manager",
  verifyToken,
  authorizedRoles("admin", "manager"),
  UserController.checkManagerRoute,
);
router.get(
  "/user",
  verifyToken,
  authorizedRoles("admin", "manager", "user"),
  UserController.checkUserRoute,
);

export default router;
