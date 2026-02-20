import mongoose from "mongoose";

const connectDB = async () =>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DBName}`);
          console.log('⚙ MongoDB connected successfully');
    } catch (error) {
        console.log('Error: MongoDB conncection failed: ', error);
    }
    
}

export default connectDB;