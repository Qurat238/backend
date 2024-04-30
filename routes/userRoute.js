import express from "express";
import { registerUser, loginUser, logout, forgotPassword, resetPassword, getUserDetails, updatePassword, updateProfile, getAllUsers, getSingleUser, updateUserRole, deleteUser } from "../controllers/userController.js";
const router = express.Router();
import { isAuthenticatedUser, authorizeRoles } from "../middleware/auth.js";


router.post("/register",registerUser);
router.post("/login",loginUser);
router.put("/password/reset/:token",resetPassword);
router.post("/password/forgot",forgotPassword);
router.get("/me",isAuthenticatedUser , getUserDetails);
router.put("/password/update",isAuthenticatedUser , updatePassword);
router.put("/me/update",isAuthenticatedUser , updateProfile);
router.get("/logout",logout);
router.get("/admin/users",isAuthenticatedUser , authorizeRoles("admin"), getAllUsers);
router.get("/admin/user/:id",isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
                               .put("/admin/user/:id",isAuthenticatedUser , authorizeRoles("admin"), updateUserRole)
                               .delete("/admin/user/:id",isAuthenticatedUser , authorizeRoles("admin"), deleteUser);

export default router;