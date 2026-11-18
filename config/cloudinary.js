import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ntnojoha',
  api_key: process.env.CLOUDINARY_API_KEY || '264668588968844',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'AP2u45ZFke4YCDA2T6d03GoY7TA',
});

export default cloudinary;
