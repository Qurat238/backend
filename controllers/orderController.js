import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorhandler.js";

//Create New Order
export const createOrder = catchAsyncErrors(async(req,res,next) => {
    const { shippingInfo, orderItems, paymentInfo, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;
    const order = await Order.create({
        shippingInfo,
        orderItems, 
        paymentInfo, 
        itemsPrice, 
        taxPrice, 
        shippingPrice, 
        totalPrice,
        paidAt:Date.now(),
        user:req.user._id
    });
    res.status(201).json({
        success:true,
        order
    });
});

//Get Single Order 
export const getSingleOrder = catchAsyncErrors(async(req,res,next) => {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if(!order){
        return next(new ErrorHandler(`Order does not exist with Id:${req.params.id}`, 404));
    }
    res.status(200).json({
        success:true,
        order
    });
});

//Get All Orders (Logged In User)
export const getAllOrders = catchAsyncErrors(async(req,res,next) => {
    const orders = await Order.find({user:req.user._id});
    res.status(200).json({
        success:true,
        orders
    });
});

//Get All Order (Admin)
export const getAllOrdersByAdmin = catchAsyncErrors(async(req,res,next) => {
    const orders = await Order.find();

    let totalAmount = 0;
    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success:true,
        totalAmount,
        orders
    });
});

//Update Order(Admin)
export const updateOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
  
    if (!order) {
      return next(new ErrorHandler("Order does not exist with this Id", 404));
    }
  
    if (order.orderStatus === "Delivered") {
      return next(new ErrorHandler("You have already delivered this order", 400));
    }
  
    if (req.body.status === "Shipped") {
      for (const o of order.orderItems) {
        await updateStock(o.product, o.quantity, next);
      }
    }
  
    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
      order.deliveredAt = Date.now();
    }
    await order.save({ validateBeforeSave: false });
  
    res.status(200).json({
      success: true,
    });
  });
  
  async function updateStock(id, quantity, next) {
    const product = await Product.findById(id);
  
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
  
    product.stock -= quantity;
    await product.save({ validateBeforeSave: false });
  }
  

//Delete Order (Admin)
export const deleteOrder = catchAsyncErrors(async(req,res,next) => {
    const order = await Order.findById(req.params.id);

    if(!order){
        return next(new ErrorHandler("Order does not exist with this Id", 404));
    }
    await order.deleteOne();

    res.status(200).json({
        success:true
    });
});