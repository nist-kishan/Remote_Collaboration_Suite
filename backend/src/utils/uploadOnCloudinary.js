import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const uploadOnCloudinary = async (localFilePath) => {
  // Check if Cloudinary is configured
  const hasCloudinaryConfig = process.env.CLOUDINARY_NAME && 
                             process.env.CLOUDINARY_API_KEY && 
                             process.env.CLOUDINARY_API_SECRET;

  if (!hasCloudinaryConfig) {
    console.warn('Cloudinary not configured, serving files locally');
    
    // Return local file info instead of uploading to Cloudinary
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      console.error('Local file does not exist:', localFilePath);
      return null;
    }

    const stats = fs.statSync(localFilePath);
    const fileName = localFilePath.split('/').pop();
    
    return {
      url: `http://localhost:5000/uploads/${fileName}`,
      public_id: fileName,
      secure_url: `http://localhost:5000/uploads/${fileName}`,
      width: stats.size,
      height: stats.size,
      format: fileName.split('.').pop(),
      resource_type: 'auto'
    };
  }

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!localFilePath) {
      console.error('No local file path provided');
      return null;
    }

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      console.error('Local file does not exist:', localFilePath);
      return null;
    }

    // Upload to Cloudinary with optimized settings
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Automatically detect file type
      folder: "chat-media", // Organize files in a folder
      use_filename: true, // Use original filename
      unique_filename: true, // Ensure unique filenames
      overwrite: false, // Don't overwrite existing files
      transformation: [
        // Optimize images
        { quality: "auto", fetch_format: "auto" },
        // Limit file size (10MB max)
        { flags: "attachment" }
      ]
    });

    // Clean up local file after successful upload
    fs.unlinkSync(localFilePath);
    // console.log('File uploaded to Cloudinary successfully:', response.url);
    return response;

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Clean up local file even on error
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

export const deleteFromUrl = async (fileUrl) => {
  try {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    if (!fileUrl) {
      console.error('No file URL provided for deletion');
      return false;
    }

    // Extract public ID from Cloudinary URL
    const urlParts = fileUrl.split("/upload/");
    if (urlParts.length < 2) {
      console.error("Invalid Cloudinary URL:", fileUrl);
      return false;
    }

    const pathAndFile = urlParts[1].split("/").slice(1).join("/");
    const publicId = pathAndFile.replace(/\.\w+$/, "");

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      // console.log('File deleted from Cloudinary successfully:', publicId);
      return true;
    } else {
      console.error('Failed to delete file from Cloudinary:', result);
      return false;
    }

  } catch (err) {
    console.error('Error deleting file from Cloudinary:', err);
    return false;
  }
};