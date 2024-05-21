import { asyncHandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId)=>{
    try{
        const user = await User.findOne(userId)//getting user from DB

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        //storing refreshToken to DB
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})//saving the value without other mandatory fields kicking in (password etc)

        return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500, "Something went wrong while generating access and refresh token.")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
        //get user details from frontend
        //validation-no empty fields
        //check if user is already registered ; username,email 
        //check for images, check for avatar
        //upload them to cloudinary
        //create user object - create entry in db
        //remove passowrd and refresh token key from resposnse
        //check for user creation
        //return res

        const {fullName, email, password, username}=req.body//get user details
        // console.log("userController req.body :", req.body)


        //validation for non-empty fields
        if(
            [fullName, email, password, username].some((field)=>//if any of the fields returns an empty string after trimming then its empty and returns true
            field?.trim()==="")
        ){
            throw new ApiError(400,"All fields are required")//throws error 400(client)
        }

        //check if user already exists
        const existedUser =await User.findOne({//findOne return the very first result matching the value 
            $or:[{username}, {email}]//uses OR operator to find any of the values(urername OR email)
        })

        if(existedUser){
            throw new ApiError(409,"User with email or username already exists")
        }

        // console.log("userController req.files: ",req.files)

        //handling images and files
        const avatarLocalPath = req.files?.avatar[0]?.path;//{req.files} is provided by multer 

        //const coverImageLocalPath = req.files?.coverImage[0]?.path;
        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
            coverImageLocalPath=req.files.coverImage[0].path;
        }

        //check avatar path

        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar path is Required")
        }

        //upload images on cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        //check avatar
        if(!avatar){
            throw new ApiError(400,"Avatar image is Required")
        }

        //create user object
        const user = await User.create({
            fullName,
            avatar:avatar?.url,
            coverImage:coverImage?.url || "", //as cover image is not compulsary, send empty string
            email,
            password,
            username:username.toLowerCase()
        })
        //check whether the user has been created successfully, find in DB

        const createdUser = await User.findById(user._id).select(//checks for the newly created user with id 
            "-password -refreshToken"//simultaneously if the user is found then unselect these two fields from the response
        )

        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering the user")
        }  

        return res.status(201).json(//sends a response with status code 201 and a json
            new ApiResponse(200, createdUser, "User has been created Successfully.")//new Instance of class ApiResponse with newly created user info
        )


})

const loginUser = asyncHandler(async(req, res)=>{
    //req.body->data
    //username and email
    //find user
    //password check
    //access and refresh token 
    //send cookie

    //accessing data from frontend
    const {email, username, password}  = req.body
    console.log(email)

    //if neither of them is present throw err cuz alteast one of them is required
    if(!username && email){
        throw new ApiError(400, "Username or email is required")
    }

    //findiing the user inside the database
    const user = await User.findOne(//return the first result that matches the search
        {
            $or:[{username}, {email}]//using or operator to find any of the result
        }
    )

    //if user is not found throw error
    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    //checking the password  ('user' stores the data from db)
    const isPasswordValid = await user.isPasswordCorrect(password) //comparing the password in the db and the one we got from frontend

    //if password is not valid throw error  
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid Password")
    }

    //generating access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    
    //sending the data to the frontend
    const loggedInUser = await User.findOne(user._id).select("-password -refreshToken") //excluding password and refreshToken to be sent to frontend

    //sending cookies
    const options = {//designing options
        httpOnly:true,//by setting this to true, now only our server(backend) will be able to modify cookies
        secure:true
    }
    return res.status(200)//sending accesstoken and refresh token as cookies
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,//sending data as response
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res)=>{
     //now we have access to the user using the middleware(verifyJWT) and we use it
     await User.findByIdAndUpdate(
        req.user._id, //value used to search (this req.user comes from verifyJWT middleware)
        {
            $set:{
                refreshToken:undefined //setting the value of refreshToken to undefined
                }
        }
     )
     //handling cookies
     const options = {//designing options
        httpOnly:true,//by setting this to true, now only our server(backend) will be able to modify cookies
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken", options)//this will clear cookies
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out."))

})

//to refresh the access token after expiration
export const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken//accessing the refresh token from frontend

    if(!incomingRefreshToken){//if no token
        throw new ApiError(401, "Unauthorized request.")
    }

    try {
        const decodedRefreshToken = jwt.verify(
                        incomingRefreshToken,
                        process.env.REFRESH_TOKEN_SECRET
                    )//this will verify and decode the refresh token as the token we get from frontend is encoded 
    
        const user = await User.findOne(decodedRefreshToken?._id)//finding user based on the id decoded from the refresh token
    
        if(!user){//if no user found
            throw new ApiError(401, "Invalid Refresh Token.")
        }
    
        //we are basically only decoding the refreshToken to find the user cuz the encodedRefresh token is already saved into
        // the database and we just need to compare it with the token we got from the frontend
    
        if(incomingRefreshToken!==user?.refreshToken){//if it does not match
            throw new ApiError(401, "Refresh Token is Expired or Used.")
        }
    
        const options={//for cookies
            httpOnly:true,
            secure:true
        }
    
        const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)//generating new tokens
    
        //sending response, cookies(tokens), status 
        return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {newAccessToken, newRefreshToken},"Access token refreshed successfully")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token.") //if error, throw error


    }
    
})
export {registerUser,
        loginUser,
        logoutUser}
