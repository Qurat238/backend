import app from "./app.js";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import connectDatabase from "./config/database.js";



//uncaught exception error
process.on("uncaughtException", (err)=>{
    console.log(`Error: ${err.message}`);
    console.log("Shutting down the server due to uncaught exception");
    process.exit(1);
})

if(process.env.NODE_ENV!=="PRODUCTION"){
    // config
    dotenv.config({path:"config/config.env"});
}

// Connecting to Database
connectDatabase()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const server = app.listen(process.env.PORT, () => {
    console.log(`Server is working on http://localhost:${process.env.PORT}`);
});

//Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log("Shutting down the server due to unhandled promise rejection");

    server.close(()=>{
        process.exit(1);
    });
})
