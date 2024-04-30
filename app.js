import express from "express";
import errorMiddleware from "./middleware/error.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";

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


export default app;
