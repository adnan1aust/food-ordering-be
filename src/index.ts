import express from "express";
import cors from "cors";
import "dotenv/config";
import userRoute from "./routes/UserRoute";
import authRoutes from "./routes/AuthRoutes";
import dbConnect from "./config/dbConnect";

dbConnect();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoute);

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.info("Server is running on port 7000");
});
