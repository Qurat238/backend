import express from "express";
import { getAllProducts, createProduct, updateProduct, deleteProduct, getSingleProduct, createProductReview, getProductReviews, deleteReview, getAdminProducts } from "../controllers/productController.js";
import { isAuthenticatedUser , authorizeRoles } from "../middleware/auth.js";
const router = express.Router();

router.get("/products",getAllProducts);
router.get("/admin/products",isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);
router.post("/admin/product/new",isAuthenticatedUser , authorizeRoles("admin") , createProduct);
router.put("/admin/product/:id",isAuthenticatedUser , authorizeRoles("admin") , updateProduct)
                                  .delete("/admin/product/:id",isAuthenticatedUser , authorizeRoles("admin") , deleteProduct);
router.get("/product/:id",getSingleProduct);
router.put("/review",isAuthenticatedUser , createProductReview);
router.get("/reviews",getProductReviews).delete("/reviews",isAuthenticatedUser, deleteReview);

export default router;