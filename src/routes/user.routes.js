import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()

//routing to a path
router.route("/register").post(registerUser)//url now will look like "http://localhost:3000/api/v1/users/register"

export default router