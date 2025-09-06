import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Make sure to configure the path if this file is not in the root
dotenv.config({ path: './backend/.env' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;