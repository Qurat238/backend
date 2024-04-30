import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import stripe from "stripe";

export const processPayment = catchAsyncErrors(async (req, res, next) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const total = req.body.amount;
  const myPayment = await stripeInstance.paymentIntents.create({
    amount: total,
    currency: "inr",
  });
  res.status(201).json({
    success: true,
    client_secret: myPayment.client_secret,
  });
});

export const sendStripeApiKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    stripeApiKey: process.env.STRIPE_API_KEY,
  });
});
