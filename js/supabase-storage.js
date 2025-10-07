// Supabase Storage Module
// Migration from Firebase Storage to Supabase Storage for PHARMA DIRECT

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';
import { supabaseConfig, getProfessionalErrorMessage } from './supabase-config.js';

// Initialize Supabase client
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// Storage bucket names
export const STORAGE_BUCKETS = {
    products: 'product-images',
    avatars: 'user-avatars',
    documents: 'documents',
    temp: 'temp-uploads'
};

// =============================================
// IMAGE UPLOAD OPERATIONS
// =============================================

/**
 * Upload product image (equivalent to Firebase Storage uploadBytes)
 * @param {File} file - Image file to upload
 * @param {string} productId - Product ID for file naming
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<Object>} Upload result with public URL
 */
export async function uploadProductImage(file, productId, bucket = STORAGE_BUCKETS.products) {
    try {
        console.log('📸 uploadProductImage: Uploading image for product:', productId);
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}_${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        // Upload file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ uploadProductImage: Upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        const result = {
            path: data.path,
            fullPath: data.fullPath,
            publicUrl: urlData.publicUrl,
            fileName: fileName
        };

        console.log('✅ uploadProductImage: Image uploaded successfully:', result.publicUrl);
        return result;
    } catch (error) {
        console.error('❌ uploadProductImage: Exception:', error);
        throw error;
    }
}

/**
 * Upload user avatar (equivalent to Firebase Storage uploadBytes)
 * @param {File} file - Avatar file to upload
 * @param {string} userId - User ID for file naming
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<Object>} Upload result with public URL
 */
export async function uploadUserAvatar(file, userId, bucket = STORAGE_BUCKETS.avatars) {
    try {
        console.log('👤 uploadUserAvatar: Uploading avatar for user:', userId);
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true // Allow overwriting existing avatar
            });

        if (error) {
            console.error('❌ uploadUserAvatar: Upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        const result = {
            path: data.path,
            fullPath: data.fullPath,
            publicUrl: urlData.publicUrl,
            fileName: fileName
        };

        console.log('✅ uploadUserAvatar: Avatar uploaded successfully:', result.publicUrl);
        return result;
    } catch (error) {
        console.error('❌ uploadUserAvatar: Exception:', error);
        throw error;
    }
}

/**
 * Upload document (equivalent to Firebase Storage uploadBytes)
 * @param {File} file - Document file to upload
 * @param {string} documentType - Type of document (prescription, license, etc.)
 * @param {string} userId - User ID for file naming
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<Object>} Upload result with public URL
 */
export async function uploadDocument(file, documentType, userId, bucket = STORAGE_BUCKETS.documents) {
    try {
        console.log('📄 uploadDocument: Uploading document:', documentType, 'for user:', userId);
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${documentType}_${userId}_${Date.now()}.${fileExt}`;
        const filePath = `documents/${documentType}/${fileName}`;

        // Upload file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ uploadDocument: Upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        const result = {
            path: data.path,
            fullPath: data.fullPath,
            publicUrl: urlData.publicUrl,
            fileName: fileName,
            documentType: documentType
        };

        console.log('✅ uploadDocument: Document uploaded successfully:', result.publicUrl);
        return result;
    } catch (error) {
        console.error('❌ uploadDocument: Exception:', error);
        throw error;
    }
}

// =============================================
// FILE MANAGEMENT OPERATIONS
// =============================================

/**
 * Delete file from storage (equivalent to Firebase Storage deleteObject)
 * @param {string} filePath - Path to file in storage
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<void>}
 */
export async function deleteFile(filePath, bucket) {
    try {
        console.log('🗑️ deleteFile: Deleting file:', filePath, 'from bucket:', bucket);
        
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error('❌ deleteFile: Delete error:', error);
            throw error;
        }

        console.log('✅ deleteFile: File deleted successfully');
    } catch (error) {
        console.error('❌ deleteFile: Exception:', error);
        throw error;
    }
}

/**
 * Get file URL (equivalent to Firebase Storage getDownloadURL)
 * @param {string} filePath - Path to file in storage
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<string>} Public URL of the file
 */
export async function getFileUrl(filePath, bucket) {
    try {
        console.log('🔗 getFileUrl: Getting URL for file:', filePath);
        
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        console.log('✅ getFileUrl: URL retrieved:', data.publicUrl);
        return data.publicUrl;
    } catch (error) {
        console.error('❌ getFileUrl: Exception:', error);
        throw error;
    }
}

/**
 * Get signed URL for private file access (equivalent to Firebase Storage getDownloadURL with auth)
 * @param {string} filePath - Path to file in storage
 * @param {string} bucket - Storage bucket name
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>} Signed URL for the file
 */
export async function getSignedUrl(filePath, bucket, expiresIn = 3600) {
    try {
        console.log('🔐 getSignedUrl: Getting signed URL for file:', filePath);
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, expiresIn);

        if (error) {
            console.error('❌ getSignedUrl: Error:', error);
            throw error;
        }

        console.log('✅ getSignedUrl: Signed URL created');
        return data.signedUrl;
    } catch (error) {
        console.error('❌ getSignedUrl: Exception:', error);
        throw error;
    }
}

/**
 * List files in bucket/folder (equivalent to Firebase Storage listAll)
 * @param {string} bucket - Storage bucket name
 * @param {string} folder - Folder path (optional)
 * @returns {Promise<Array>} Array of file objects
 */
export async function listFiles(bucket, folder = '') {
    try {
        console.log('📋 listFiles: Listing files in bucket:', bucket, 'folder:', folder);
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(folder);

        if (error) {
            console.error('❌ listFiles: Error:', error);
            throw error;
        }

        console.log('✅ listFiles: Found', data?.length || 0, 'files');
        return data || [];
    } catch (error) {
        console.error('❌ listFiles: Exception:', error);
        throw error;
    }
}

// =============================================
// IMAGE PROCESSING UTILITIES
// =============================================

/**
 * Validate image file (equivalent to Firebase file validation)
 * @param {File} file - Image file to validate
 * @param {Object} options - Validation options
 * @returns {Promise<boolean>} True if valid
 */
export function validateImageFile(file, options = {}) {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
        minWidth = 100,
        maxWidth = 2048,
        minHeight = 100,
        maxHeight = 2048
    } = options;

    console.log('🔍 validateImageFile: Validating file:', file.name);

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }

    console.log('✅ validateImageFile: File validation passed');
    return true;
}

/**
 * Resize image before upload (client-side processing)
 * @param {File} file - Image file to resize
 * @param {Object} options - Resize options
 * @returns {Promise<File>} Resized image file
 */
export function resizeImage(file, options = {}) {
    const {
        maxWidth = 800,
        maxHeight = 600,
        quality = 0.8,
        outputType = 'image/jpeg'
    } = options;

    console.log('🔄 resizeImage: Resizing image to', maxWidth, 'x', maxHeight);

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Draw and resize
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to resize image'));
                        return;
                    }

                    // Create new file from blob
                    const resizedFile = new File([blob], file.name, {
                        type: outputType,
                        lastModified: Date.now()
                    });

                    console.log('✅ resizeImage: Image resized successfully');
                    resolve(resizedFile);
                },
                outputType,
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = URL.createObjectURL(file);
    });
}

/**
 * Generate thumbnail (equivalent to Firebase image processing)
 * @param {File} file - Image file to thumbnail
 * @param {number} size - Thumbnail size (default: 200)
 * @returns {Promise<File>} Thumbnail file
 */
export function generateThumbnail(file, size = 200) {
    console.log('🖼️ generateThumbnail: Generating thumbnail for:', file.name);

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate thumbnail dimensions
            let { width, height } = img;
            
            if (width > height) {
                height = (height * size) / width;
                width = size;
            } else {
                width = (width * size) / height;
                height = size;
            }

            // Set canvas dimensions
            canvas.width = size;
            canvas.height = size;

            // Draw centered thumbnail
            const x = (size - width) / 2;
            const y = (size - height) / 2;
            ctx.drawImage(img, x, y, width, height);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to generate thumbnail'));
                        return;
                    }

                    // Create thumbnail file
                    const thumbnailFile = new File([blob], `thumb_${file.name}`, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });

                    console.log('✅ generateThumbnail: Thumbnail generated successfully');
                    resolve(thumbnailFile);
                },
                'image/jpeg',
                0.8
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image for thumbnail'));
        };

        img.src = URL.createObjectURL(file);
    });
}

// =============================================
// BULK OPERATIONS
// =============================================

/**
 * Upload multiple images (equivalent to Firebase batch upload)
 * @param {Array<File>} files - Array of image files
 * @param {string} productId - Product ID for file naming
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<Array>} Array of upload results
 */
export async function uploadMultipleImages(files, productId, bucket = STORAGE_BUCKETS.products) {
    try {
        console.log('📸 uploadMultipleImages: Uploading', files.length, 'images for product:', productId);
        
        const uploadPromises = files.map((file, index) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${productId}_${index}_${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            return supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })
                .then(({ data, error }) => {
                    if (error) throw error;
                    
                    const { data: urlData } = supabase.storage
                        .from(bucket)
                        .getPublicUrl(filePath);

                    return {
                        path: data.path,
                        fullPath: data.fullPath,
                        publicUrl: urlData.publicUrl,
                        fileName: fileName,
                        index: index
                    };
                });
        });

        const results = await Promise.all(uploadPromises);
        console.log('✅ uploadMultipleImages: All images uploaded successfully');
        return results;
    } catch (error) {
        console.error('❌ uploadMultipleImages: Exception:', error);
        throw error;
    }
}

/**
 * Clean up old files (equivalent to Firebase cleanup operations)
 * @param {string} bucket - Storage bucket name
 * @param {string} folder - Folder to clean
 * @param {number} maxAge - Maximum age in days (default: 30)
 * @returns {Promise<number>} Number of files cleaned
 */
export async function cleanupOldFiles(bucket, folder, maxAge = 30) {
    try {
        console.log('🧹 cleanupOldFiles: Cleaning files older than', maxAge, 'days in:', folder);
        
        const { data: files, error } = await supabase.storage
            .from(bucket)
            .list(folder);

        if (error) {
            console.error('❌ cleanupOldFiles: Error listing files:', error);
            throw error;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAge);
        
        const oldFiles = files?.filter(file => {
            const fileDate = new Date(file.updated_at);
            return fileDate < cutoffDate;
        }) || [];

        if (oldFiles.length === 0) {
            console.log('✅ cleanupOldFiles: No old files to clean');
            return 0;
        }

        const filePaths = oldFiles.map(file => `${folder}/${file.name}`);
        
        const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove(filePaths);

        if (deleteError) {
            console.error('❌ cleanupOldFiles: Error deleting files:', deleteError);
            throw deleteError;
        }

        console.log('✅ cleanupOldFiles: Cleaned', oldFiles.length, 'old files');
        return oldFiles.length;
    } catch (error) {
        console.error('❌ cleanupOldFiles: Exception:', error);
        throw error;
    }
}

// Export the Supabase client for direct use if needed
export { supabase };
