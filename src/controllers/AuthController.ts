import { Request, Response } from "express";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthenticatedUser } from "../types/auth";
import { sendMagicLink } from "../utility/sendEmail";
import { verifyGoogleToken } from "../utility/googleAuth";

const register = async (req: Request, res: Response) => {
  try {
    const { userName, password, role, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      userName,
      password: hashedPassword,
      role,
      email,
    });
    await newUser.save();
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Error registering user!" });
  }
};

const login = async (req: Request, res: Response) => {
  const { userName, email, password } = req.body;
  const user = await User.findOne({ $or: [{ userName }, { email }] });
  if (!user) {
    return res.status(404).json({ message: "User not found!" });
  }

  if (!user.password) {
    return res.status(400).json({
      message: "Missing password for user. Use Google login instead.",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid password!" });
  }
  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "3600" },
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET as string),
    { expiresIn: "7d" },
  );

  res.status(200).json({
    message: "Login successful",
    token,
    refreshToken,
    expiresIn: 3600,
    user: {
      userName: user.userName,
      email: user.email,
      role: user.role,
    },
  });
};

const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
        error: "NO_REFRESH_TOKEN",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET as string),
    ) as AuthenticatedUser;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
    }

    const newToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" },
    );

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
      expiresIn: 3600,
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has expired. Please login again.",
        error: "REFRESH_TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
      error: "INVALID_REFRESH_TOKEN",
    });
  }
};

const generateMagicLink = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        error: "EMAIL_REQUIRED",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" },
    );

    const magicLink = `${process.env.FRONTEND_URL}/auth/magic-link?token=${token}`;

    const emailSent = await sendMagicLink(email, magicLink, user.userName);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send magic link email",
        error: "EMAIL_SEND_FAILED",
      });
    }

    res.status(200).json({
      success: true,
      message: "Magic link sent successfully",
    });
  } catch (error) {
    console.error("Error generating magic link:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "INTERNAL_ERROR",
    });
  }
};

const verifyMagicLink = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid or missing token!" });
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as AuthenticatedUser;
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    const newToken = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" },
    );
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET as string),
      { expiresIn: "7d" },
    );
    res.status(200).json({
      message: "Magic link verified successfully",
      token: newToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error verifying magic link:", error);
    return res.status(500).json({ message: "Error verifying magic link!" });
  }
};

const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required",
        error: "ID_TOKEN_REQUIRED",
      });
    }

    // Verify Google ID token
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google ID token",
        error: "INVALID_GOOGLE_TOKEN",
      });
    }

    let user = await User.findOne({
      $or: [{ email: googleUser.email }, { googleId: googleUser.sub }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        await user.save();
      }
    } else {
      user = new User({
        userName: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.sub,
        role: "user",
      });

      await user.save();
    }

    // Generate tokens (same payload as regular login)
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "3600" },
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET as string),
      { expiresIn: "7d" },
    );

    // Same response format as regular login
    res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
      expiresIn: 3600,
      user: {
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during Google authentication",
      error: "GOOGLE_AUTH_ERROR",
    });
  }
};

export default {
  register,
  login,
  refreshToken,
  generateMagicLink,
  verifyMagicLink,
  googleAuth,
};
