import express from "express";
import errorMiddleware from "./middleware/error.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";
import cors from "cors";
// import { fileURLToPath } from 'url';
// import { dirname, join, resolve } from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
//Middleware
app.use(
    fileUpload({
      limits: { fileSize: 50 * 1024 * 1024 },
      useTempFiles: true,
    })
  );
app.use(cors());


if(process.env.NODE_ENV!=="PRODUCTION"){
    // config
    dotenv.config({path:"config/config.env"});
}

// Route Imports
import product from "./routes/productRoute.js";
import user from "./routes/userRoute.js";
import order from "./routes/orderRoute.js";
import payment from "./routes/paymentRoute.js";

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);

app.get("/",(req,res) => {
  res.json("Hello");
});

//Middleware for errors
app.use(errorMiddleware);

/*----------------------------------------Deployment---------------------------------------------*/

// To run frontend and backend on same port
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// app.use(express.static(join(__dirname, "./frontend/build")));
// app.get("*",(req,res) => {
//     res.sendFile(resolve(__dirname, "./frontend/build/index.html"));
// });


export default app;
