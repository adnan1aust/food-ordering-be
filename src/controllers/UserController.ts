import { Request, Response } from "express";

const checkUserRoute = async (req: Request, res: Response) => {
  res.status(200).json({ message: "User route accessed successfully!" });
};

const checkAdminRoute = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Admin route accessed successfully!" });
};

const checkManagerRoute = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Manager route accessed successfully!" });
};

export default {
  checkUserRoute,
  checkAdminRoute,
  checkManagerRoute,
};
