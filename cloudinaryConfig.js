require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'valor_por_defecto',
  api_key: process.env.CLOUDINARY_API_KEY || 'valor_por_defecto',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'valor_por_defecto'
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chat_files',  
    allowedFormats: ['jpg', 'png', 'pdf', 'mp4'],
    resource_type: 'auto'
  }
});

module.exports = { cloudinary, storage };
