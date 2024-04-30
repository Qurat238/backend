import express from "express";
import { processPayment, sendStripeApiKey } from "../controllers/paymentController.js";
const router = express.Router();
import {isAuthenticatedUser} from "../middleware/auth.js";

router.post("/payment/process",isAuthenticatedUser,processPayment);
router.get("/stripeapikey",isAuthenticatedUser, sendStripeApiKey);

export default router;
