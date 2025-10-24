import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/m4a'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Max 10 files at once
  }
});

// Image compression middleware
export const compressImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }

  try {
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(path.extname(inputPath), '_compressed' + path.extname(inputPath));

    // Compress image using sharp
    await sharp(inputPath)
      .resize(1920, 1080, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .png({ quality: 80 })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Replace original file with compressed version
    fs.unlinkSync(inputPath);
    fs.renameSync(outputPath, inputPath);

    // Update file info
    const stats = fs.statSync(inputPath);
    req.file.size = stats.size;

    next();
  } catch (error) {
    next(); // Continue without compression if it fails
  }
};

// Video optimization middleware (placeholder)
export const optimizeVideo = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('video/')) {
    return next();
  }

  // For now, just pass through
  // In production, you'd use FFmpeg to optimize videos
  next();
};

// Audio optimization middleware (placeholder)
export const optimizeAudio = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('audio/')) {
    return next();
  }

  // For now, just pass through
  // In production, you'd use FFmpeg to optimize audio
  next();
};

// Combined optimization middleware
export const optimizeMedia = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const mimeType = req.file.mimetype;
  
  if (mimeType.startsWith('image/')) {
    return compressImage(req, res, next);
  } else if (mimeType.startsWith('video/')) {
    return optimizeVideo(req, res, next);
  } else if (mimeType.startsWith('audio/')) {
    return optimizeAudio(req, res, next);
  }
  
  next();
};

// Error handling middleware
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
  }
  
  if (error.message === 'Invalid file type') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Please upload images, videos, or audio files.'
    });
  }
  
  next(error);
};
