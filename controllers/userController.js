import User from "../models/userModel.js";
import ErrorHandler from "../utils/errorhandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import sendToken from "../utils/jwttoken.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import cloudinary from "cloudinary";
//Register a user
export const registerUser = catchAsyncErrors(async(req,res,next) => {
    const {name, email, password} = req.body;
    
    let user = await User.findOne({email});
    if(user){
        return next(new ErrorHandler("User Already Exists", 400));
    }

    const avatar = req.files.avatar;
    const avatarBuffer = avatar.data.toString('base64')

    const myCloud = await cloudinary.uploader.upload(`data:${avatar.mimetype};base64,${avatarBuffer}`, { resource_type: 'auto' }, (error, result) => {
        if (error) {
          console.error('Error uploading image to Cloudinary:', error);
        } else {
          console.log('Image uploaded successfully:', result);
        }
      });
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
    
    const otp = Math.floor(Math.random() * 1000000);
    
    user.resetPasswordToken = otp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const message = `Your OTP for reseting the password ${otp}. If you did not request for this, please ignore this email.`;

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
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();
        return next(new ErrorHandler(error.message, 500));

    }
});

//Reset Passowrd
export const resetPassword = catchAsyncErrors(async(req,res,next) => {

    const { otp, password, confirmPassword } = req.body;

    const user = await User.findOne({
        resetPasswordToken: otp,
        resetPasswordExpire: { $gt:Date.now() }
    });

    if(!user){
        return next(new ErrorHandler("Reset Password Otp in invalid or has been expired", 400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match", 400));
    }
    user.password = password;
    user.resetPasswordOtp = null;
    user.resetPasswordExpiry = null;
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
        const avatar = req.files.avatar;
    const avatarBuffer = avatar.data.toString('base64')
    const myCloud = await cloudinary.uploader.upload(`data:${avatar.mimetype};base64,${avatarBuffer}`, { resource_type: 'auto' }, (error, result) => {
        if (error) {
          console.error('Error uploading image to Cloudinary:', error);
        } else {
          console.log('Image uploaded successfully:', result);
        }
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
