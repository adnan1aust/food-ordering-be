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
    return res.status(400).json({
      success: false,
      message: "Invalid token",
      error: "INVALID_TOKEN",
    });
  }
};

export default verifyToken;
