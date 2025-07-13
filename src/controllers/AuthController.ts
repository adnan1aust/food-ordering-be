import { Request, Response } from "express";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" },
  );
  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      userName: user.userName,
      email: user.email,
      role: user.role,
    },
  });
};

export default { register, login };
