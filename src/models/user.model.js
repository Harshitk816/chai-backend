import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const userSchema = new Schema( 
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String,//cloudinary url
            required:true,
        },
        coverImage:{
            type:String,//cloudinary url
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"Password is required"]
        },
        refreshToken:{
            type:String
        }
    },{
        timestamps:true
    })

userSchema.pre("save",async function(next){
    //password encryption
    if(!this.modified("password")) return next() //if password is not modified then simply move onto next middleware
    this.password = bcrypt(this.password,10)//encrypting 
    next()//a flag to move to next middleware

userSchema.methods.isPasswordCorrect = async function(password){//creating custom methods
    return await bcrypt.compare(password,this.password)  //will return true/false based on promise resol
}

userSchema.methods.generateAccessToken = function(){
   return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
         {
             _id:this._id
 
         },
         process.env.REFRESH_TOKEN_SECRET,
         {
             expiresIn:process.env.REFRESH_TOKEN_EXPIRY
         }
     )
 }

})

export const User = mongoose.model("User",userSchema)
