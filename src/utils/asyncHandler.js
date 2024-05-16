const asyncHandler=(reqHandler)=>{
    return (req, res, next)=>{
        Promise.resolve(reqHandler(req, res, next))
        .catch((err)=>next(err))
    }

}

export {asyncHandler}

// const asyncHandler=()=>{}
// const asyncHandler=(func)=>{async()=>{}}


// const asyncHandler=(fun)=>async(req, res, next)=>{
//     try{
//         await fun(req, res, next)
//     }catch(error){
//         res.status(err.code).json({
//             success:false,
//             message:err.message
//         })
//     }
// }