import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    const connect = await mongoose.connect(
      process.env.MONGODB_CONNECTION_STRING as string,
    );
    console.log(
      `Connected to MongoDB: ${connect.connection.host}, ${connect.connection.name}`,
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default dbConnect;
