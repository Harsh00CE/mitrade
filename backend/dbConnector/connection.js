import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


const connection = {};

const connectDB = async () => {
    if (connection.isConnected) {
        console.log("Already connected to database");
        return;
    }
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI || "", {});
        connection.isConnected = db.connections[0].readyState;

    } catch (error) {
        console.log("Error connecting to database");
        console.log(error);
        throw error;
    }
};

export default connectDB;