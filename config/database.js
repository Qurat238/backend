import mongoose from "mongoose";

const connectDatabase = () => {
    mongoose.connect(process.env.DB_URI)
        .then((data) => {
            console.log(`MongoDB connected with server: ${data.connection.host}`);
        })
        .catch((error) => {
            console.error('Error connecting to MongoDB:', error);
        });
};


export default connectDatabase;
