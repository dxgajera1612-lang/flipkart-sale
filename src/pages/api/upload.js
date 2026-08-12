// pages/api/upload.js
import { withAdminAuth } from '../../middleware/auth';

/**
 * Image Upload Endpoint
 * Handles file uploads for products and settings
 * Uses base64 encoding for storage-agnostic approach
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { file, type = 'product' } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    // Validate file size (max 5MB)
    const fileSizeInMB = Buffer.byteLength(file) / (1024 * 1024);
    if (fileSizeInMB > 5) {
      return res.status(413).json({
        success: false,
        message: 'File size exceeds 5MB limit',
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    let mimeType = 'image/jpeg';

    if (file.startsWith('data:image/png')) {
      mimeType = 'image/png';
    } else if (file.startsWith('data:image/webp')) {
      mimeType = 'image/webp';
    } else if (file.startsWith('data:image/gif')) {
      mimeType = 'image/gif';
    }

    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `${type}_${timestamp}_${random}`;

    // For now, return data URL (can be replaced with cloud storage)
    // In production, save to S3, Cloudinary, or similar service
    const imageUrl = file.startsWith('data:') 
      ? file 
      : `data:${mimeType};base64,${file}`;

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename,
        url: imageUrl,
        type: mimeType,
        size: fileSizeInMB,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

export default withAdminAuth(handler);
