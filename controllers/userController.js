import User from "../models/userModel.js";
import ErrorHandler from "../utils/errorhandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import sendToken from "../utils/jwttoken.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import cloudinary from "cloudinary";
import fs from "fs";

//Register a user
export const registerUser = catchAsyncErrors(async(req,res,next) => {

    const {name, email, password} = req.body;

    const avatar = req.files.avatar.tempFilePath;

    let user = await User.findOne({email});

    if(user){
        return next(new ErrorHandler("User Already Exists", 400));
    }

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatars",
        width:150,
        crop:"scale",
    });
    
    fs.rmSync("./tmp", { recursive: true });

    user = await User.create({
        name,
        email,
        password,
        avatar:{
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        },

    });

   sendToken(user,201,res);
});

//Login a user
export const loginUser = catchAsyncErrors(async(req,res,next) => {
    const { email, password } = req.body;

    //Checkin if user has given email and password both
    if(!email || !password){
        return next(new ErrorHandler("Please enter email and pasword", 400));
    }

    const user = await User.findOne({email}).select("+password");

    if(!user){
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    sendToken(user, 200, res);
});

//Logout a user
export const logout = catchAsyncErrors(async(req,res,next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly:true
    });

    res.status(200).json({
        success:true,
        message:"Logged Out"
    });
});

//Forgot Pasword
export const forgotPassword = catchAsyncErrors(async(req,res,next) => {
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new ErrorHandler("User not found", 404));
    }
    //Get Reset Password Token
    const resetToken = user.getResetPasswordToken();
    await user.save({validateBeforeSave:false});

    const resetPasswordUrl = `https://calm-blue-yak.cyclic.app/password/reset/${resetToken}`;
    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email, then please just ignore it.`;

    try {
        await sendEmail({
            email:user.email,
            subject:`Ecommerce Password Recovery`,
            message
        });
        res.status(200).json({
            success:true,
            message:`Email sent to ${user.email} successfully`
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({validateBeforeSave:false});
        return next(new ErrorHandler(error.message, 500));
        
    }
});

//Reset Passowrd
export const resetPassword = catchAsyncErrors(async(req,res,next) => {

    //Creating token hashed
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt:Date.now() }
    });
    
    if(!user){
        return next(new ErrorHandler("Reset Password Token in invalid or has been expired", 400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match", 400));
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendToken(user,200,res);
});

//Get User Detail
export const getUserDetails = catchAsyncErrors(async(req,res,next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success:true,
        user
    });
});

//Update User Password
export const updatePassword = catchAsyncErrors(async(req,res,next) => {
    const user = await User.findById(req.user.id).select("+password");
    
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if(!isPasswordMatched){
        return next(new ErrorHandler("Old password is incorrect", 400));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHandler("confirm password does not matched", 400));
    }
    user.password = req.body.newPassword;
    await user.save();

    sendToken(user, 200, res);
});

//Update User Profile
export const updateProfile = catchAsyncErrors(async(req,res,next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    if(req.body.avatar !== ""){
        const user = await User.findById(req.user.id);
        const imageId = user.avatar.public_id;
        await cloudinary.v2.uploader.destroy(imageId);
        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width:150,
            crop:"scale",
        });
        newUserData.avatar = {
            public_id:myCloud.public_id,
            url:myCloud.secure_url,
        }
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new:true,
        runValidators:true,
        useFindAndModify:false
    });

    res.status(200).json({
        success:true
    });
});

//Get All Users (Admin)
export const getAllUsers = catchAsyncErrors(async(req,res,next) => {
    const users = await User.find();
    res.status(200).json({
        success:true,
        users
    });
});

//Get Single User (Admin)
export const getSingleUser = catchAsyncErrors(async(req,res,next) => {
    const user = await User.findById(req.params.id);
    if(!user){
        return next(new ErrorHandler(`User does not exist with Id:${req.params.id}`, 404));
    }
    res.status(200).json({
        success:true,
        user
    });
});

//Update Role (Admin)
export const updateUserRole = catchAsyncErrors(async(req,res,next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role:req.body.role
    }
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new:true,
        runValidators:true,
        useFindAndModify:false
    });
    if(!user){
        return next(new ErrorHandler(`User does not exist with Id:${req.params.id}`, 404));
    }
    res.status(200).json({
        success:true
    });
});

//Delete User (Admin)
export const deleteUser = catchAsyncErrors(async(req,res,next) => {
    const user = await User.findById(req.params.id);
    if(!user){
        return next(new ErrorHandler(`User does not exist with Id:${req.params.id}`, 404));
    }
    const imageId = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(imageId);
    await user.deleteOne();
    res.status(200).json({
        success:true,
        message:"User Deleted successfully"
    });
});

