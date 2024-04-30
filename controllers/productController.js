import Product from "../models/productModel.js";
import ErrorHandler from "../utils/errorhandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import ApiFeatures from "../utils/apifeatures.js";
import cloudinary from "cloudinary";

//Create Products -- Admin
export const createProduct = catchAsyncErrors(async(req,res,next) => {
    let images = [];
    if(typeof req.body.images === 'string'){
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }
    const imagesLinks = [];
    for(let i=0 ; i < images.length ; i++){
        const result = await cloudinary.v2.uploader.upload(images[i],{
            folder:"products",
        });
        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
        });
    }
    req.body.images = imagesLinks;
    req.body.user = req.user.id;
    const product = await Product.create(req.body);

    res.status(201).json({
        success:true,
        product
    });
});

//Get All Products
export const getAllProducts = catchAsyncErrors(async(req,res,next) => {
    const resultPerPage = 8;
    const productsCount = await Product.countDocuments();
    let apiFeature = new ApiFeatures(Product.find(), req.query).search().filter();
    let products = await apiFeature.query;
    let filteredProductsCount = products.length;
    apiFeature = new ApiFeatures(Product.find(), req.query).search().filter().pagination(resultPerPage);
    products = await apiFeature.query;

    res.status(200).json({
        success:true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount,
    });
});

//Get All Products(Admin)
export const getAdminProducts = catchAsyncErrors(async(req,res,next) => {
    const products = await Product.find();
    res.status(200).json({
        success:true,
        products,
    });
});

//Get Single Product
export const getSingleProduct = catchAsyncErrors(async(req,res,next) => {
    const product = await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler("Product not found",404));
    }

    res.status(200).json({
        success:true,
        product
    });
});

//Update Product -- Admin
export const updateProduct = catchAsyncErrors(async(req,res,next) => {
    let product = await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler("Product not found",404));
    }

    //Images Start Here
    let images = [];
    if(typeof req.body.images === 'string'){
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }
    if(images !== undefined){
        //Deleting Images from cloudinary
        for( let i=0; i < product.images.length; i++){
            await cloudinary.v2.uploader.destroy(product.images[i].public_id);
        }
        const imagesLinks = [];
        for(let i=0 ; i < images.length ; i++){
            const result = await cloudinary.v2.uploader.upload(images[i],{
                folder:"products",
            });
            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url,
            });
        }
        req.body.images = imagesLinks;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    });

    res.status(200).json({
        success:true,
        product
    })
});

//Delete Product -- Admin
export const deleteProduct = catchAsyncErrors(async(req,res,next)=>{
    const product = await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler("Product not found",404));
    }

    //Deleting Images from cloudinary
    for( let i=0; i < product.images.length; i++){
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    await product.deleteOne();

    res.status(200).json({
        success:true,
        message:"Product deleted successfully"
    });
});

//Giving or updating reviews
export const createProductReview = catchAsyncErrors(async(req,res,next) => {
    const { rating, comment, productId } = req.body;
    const review = {
        user:req.user._id,
        name:req.user.name,
        rating:Number(rating),
        comment
    }
    const product = await Product.findById(productId);
    const isReviewed = product.reviews.find((rev) => rev.user.toString() === req.user._id.toString());
    if(isReviewed){
        product.reviews.forEach((rev) => {
            if(rev.user.toString() === req.user._id.toString()){
                rev.rating = rating,
                rev.comment = comment
            }
        });
    }
    else{
        product.reviews.push(review);
        product.noOfReviews = product.reviews.length;
    }
    let avg = 0;
    product.reviews.forEach((rev)=>{
        avg += rev.rating;
    });
    product.ratings = avg/product.reviews.length;
    await product.save({validateBeforeSave:false});
    res.status(200).json({
        success:true
    });
});

//Get All Reviews of a product
export const getProductReviews = catchAsyncErrors(async(req,res,next) => {
    const product = await Product.findById(req.query.id);
    if(!product){
        return next(new ErrorHandler("Product not found", 404));
    }
    res.status(200).json({
        success:true,
        reviews:product.reviews
    });
});

//Delete Reviews
export const deleteReview = catchAsyncErrors(async(req,res,next) => {
    const product = await Product.findById(req.query.productId);
    if(!product){
        return next(new ErrorHandler("Product not found", 404));
    }
    const reviews = product.reviews.filter((rev) => rev._id.toString() !== req.query.id.toString());
    let avg = 0;
    reviews.forEach((rev) => {avg += rev.rating;});
    let ratings = 0;
    if(reviews.length === 0){
        ratings = 0;
    } else {
        ratings = avg / reviews.length;
    }
    const noOfReviews = reviews.length;
    await Product.findByIdAndUpdate(req.query.productId, {
        reviews, ratings, noOfReviews
    },{
        new:true,
        runValidators:true,
        useFindAndModify:false
    });
    res.status(200).json({
        success:true
    });
});
