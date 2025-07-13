import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedUser } from "../types/auth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
        error: "NO_TOKEN",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as AuthenticatedUser;

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
        error: "TOKEN_EXPIRED",
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format.",
        error: "INVALID_TOKEN_FORMAT",
      });
    }

    if (error instanceof jwt.NotBeforeError) {
      return res.status(401).json({
        success: false,
        message: "Token not active yet.",
        error: "TOKEN_NOT_ACTIVE",
      });
    }

    // Generic error for other cases
    return res.status(400).json({
      success: false,
      message: "Token verification failed.",
      error: "TOKEN_VERIFICATION_FAILED",
    });
  }
};

export default verifyToken;
