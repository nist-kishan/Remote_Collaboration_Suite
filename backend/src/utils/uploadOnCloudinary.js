import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const uploadOnCloudinary = async (localFilePath) => {
  // Check if Cloudinary is configured
  const hasCloudinaryConfig = process.env.CLOUDINARY_NAME && 
                             process.env.CLOUDINARY_API_KEY && 
                             process.env.CLOUDINARY_API_SECRET;

  if (!hasCloudinaryConfig) {
    // Return local file info instead of uploading to Cloudinary
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      return null;
    }

    const stats = fs.statSync(localFilePath);
    const fileName = localFilePath.split('/').pop();
    
    return {
      url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/uploads/${fileName}`,
      public_id: fileName,
      secure_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/uploads/${fileName}`,
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
      return null;
    }

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      return null;
    }

    // Upload to Cloudinary with optimized settings for speed
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Automatically detect file type
      folder: process.env.CLOUDINARY_FOLDER || "chat-media", // Organize files in a folder
      use_filename: true, // Use original filename
      unique_filename: true, // Ensure unique filenames
      overwrite: false, // Don't overwrite existing files
      eager_async: false, // Don't wait for eager transformations
      eager: [
        // Pre-generate optimized versions for faster loading
        { quality: "auto", fetch_format: "auto", width: 1920, height: 1080 },
        { quality: "auto", fetch_format: "auto", width: 1280, height: 720 },
        { quality: "auto", fetch_format: "auto", width: 640, height: 480 }
      ],
      transformation: [
        // Optimize images for faster upload and loading
        { quality: "auto:low", fetch_format: "auto" },
        // Limit file size (10MB max)
        { flags: "attachment" }
      ]
    });

    // Clean up local file after successful upload
    fs.unlinkSync(localFilePath);
    return response;

  } catch (error) {
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
      return false;
    }

    // Extract public ID from Cloudinary URL
    const urlParts = fileUrl.split("/upload/");
    if (urlParts.length < 2) {
      return false;
    }

    const pathAndFile = urlParts[1].split("/").slice(1).join("/");
    const publicId = pathAndFile.replace(/\.\w+$/, "");

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      return true;
    } else {
      return false;
    }

  } catch (err) {
    return false;
  }
};