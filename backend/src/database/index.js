import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () =>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DBName}?retryWrites=true&w=majority`);
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('Error: MongoDB connection failed: ', error);
        process.exit(1);
    }
}

export default connectDB;