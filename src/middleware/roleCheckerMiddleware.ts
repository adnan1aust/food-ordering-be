import { Request, Response, NextFunction } from "express";
import { AuthenticatedUser } from "../types/auth";

const authorizedRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthenticatedUser;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          error: "USER_NOT_AUTHENTICATED",
        });
      }

      if (!user.role) {
        return res.status(403).json({
          success: false,
          message: "User role not found",
          error: "ROLE_NOT_FOUND",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        console.warn(
          `Access denied for user ${user.userId} with role ${
            user.role
          }. Required roles: ${allowedRoles.join(", ")}`,
        );

        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
          error: "INSUFFICIENT_PERMISSIONS",
        });
      }

      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during authorization",
        error: "AUTHORIZATION_ERROR",
      });
    }
  };
};

export default authorizedRoles;
