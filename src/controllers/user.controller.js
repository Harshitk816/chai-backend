import { asyncHandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


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
        console.log(email)


        //validation for non-empty fields
        if(
            [fullName, email, password, username].some((field)=>//if any of the fields returns an empty string after trimming then its empty and returns true
            field?.trim()==="")
        ){
            throw new ApiError(400,"All fields are required")//throws error 400(client)
        }

        //check if user already exists
        const existedUser = User.findOne({//findOne return the very first result matching the value 
            $or:[{username}, {email}]//uses OR operator to find any of the values(urername OR email)
        })

        if(existedUser){
            throw new ApiError(409,"User with email or username already exists")
        }

        //handling images and files
        const avatarLocalPath = req.files?.avatar[0]?.path;//{req.files} is provided by multer 

        const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
            avatar:avatar.url,
            coverImage:coverImage.url || "", //as cover image is not compulsary, send empty string
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

export {registerUser}