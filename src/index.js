import connectDB from './db/index.js'
import dotenv from 'dotenv'
import { app } from './app.js'




dotenv.config(
    {
        path:'./env'
    }
)


connectDB()
.then(
    app.on("error",(error)=>{
        console.log("Error in Database Connection : " + error);
    })
)
.then(
    app.listen(process.env.PORT || 8000, () =>{
        console.log(`Server is running on port ${process.env.PORT||8000}`)
    })
)
.catch(error=>console.log(`Error in DB Connection`, error)) 












// import express from 'express'

// const app=express()
// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log('Error connecting to MongoDB: ' + error)
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`Server started on Port ${process.env.PORT}`)
//         })
        
//     }catch(error){
//         console.log('Error:', error)
//         throw err
//     }
// })()