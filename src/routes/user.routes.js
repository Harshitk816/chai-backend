import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

//routing to a path
router.route("/register").post(upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),
registerUser)//url now will look like "http://localhost:3000/api/v1/users/register"

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)//we passed our middleware in between, this is how we use middleware

router.route("/refresh-token").post(refreshAccessToken) //for refreshing tokens when expired

router.route("/change-password").post(verifyJWT, changeCurrentPassword)//for changing the password

router.route("/current-user").get(verifyJWT, getCurrentUser)//getting current user

router.route("/update-account").patch(verifyJWT, updateAccountDetails)//updating account details

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)//updating avatar

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)//updating cover image

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)//get user profile

router.route("/history").get(verifyJWT, getWatchHistory)//getting history


export default router