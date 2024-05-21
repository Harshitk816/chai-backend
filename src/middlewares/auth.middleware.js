import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"

//when the user is logged in, we gave accesToken, refreshToken to the user. Now using these only we will verify user login
export const verifyJWT = asyncHandler(async(req, res, next)=>{//while writing middleware, we need to use {next} - to pass it onto next middleware or response
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace( "Bearer ", "") //if there is no accessToken, then we will check for authorization (custom) header
        
        if(!token){ //if no token
            throw new ApiError(401, "Unauthorized Request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)//using jwt to verify and decode access token
    
        const user = await User.findById(decodedToken?._id)   //when we were encoding token we used the _id(refer to user.model - generateAccessToken custom method)
         .select("-password -refreshToken")
    
         if(!user){
            //NEXT_VIDEO: discuss about frontend
            throw new ApiError(401, "Invalid Access Token")
         }
    
         //now we have access to user, now adding a new object onto req
         req.user = user;
         next()//now our work is done moving onto next
    } catch (error) {
        throw new ApiError(401,error.message ||  "Invalid Access Token")
        
    }

})