import {v2 as cloudinary} from 'cloudinary';

const deleteCloudinaryImage=async(cloudinaryUrl)=>{
    const publicId = cloudinaryUrl.split('/').pop().split('.')[0]

    await cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.error(error);
        } else {
          console.log(result);
        }
      });

}
export {deleteCloudinaryImage}