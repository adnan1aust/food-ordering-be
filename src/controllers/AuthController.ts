import { Request, Response } from "express";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthenticatedUser } from "../types/auth";

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
    { expiresIn: "60s" },
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

export default { register, login, refreshToken };
