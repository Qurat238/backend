import express from "express";
import { createOrder, getSingleOrder, getAllOrders, getAllOrdersByAdmin, updateOrder, deleteOrder } from "../controllers/orderController.js";
const router = express.Router();
import { isAuthenticatedUser, authorizeRoles } from "../middleware/auth.js";

router.post("/order/new",isAuthenticatedUser , createOrder);
router.get("/order/:id",isAuthenticatedUser, getSingleOrder);
router.get("/orders/me",isAuthenticatedUser, getAllOrders);
router.get("/admin/orders",isAuthenticatedUser, authorizeRoles("admin"), getAllOrdersByAdmin);
router.put("/admin/order/:id",isAuthenticatedUser, authorizeRoles("admin"), updateOrder)
                                .delete("/admin/order/:id",isAuthenticatedUser, authorizeRoles("admin"), deleteOrder);

export default router;