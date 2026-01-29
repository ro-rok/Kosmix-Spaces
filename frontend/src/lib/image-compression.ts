/**
 * Image compression utilities for optimizing photos before upload
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress an image file with specified options
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeKB = 500,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width: newWidth, height: newHeight } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // Draw and compress the image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Try different quality levels to meet size requirements
        let currentQuality = quality;
        let attempts = 0;
        const maxAttempts = 5;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedSizeKB = blob.size / 1024;

              // If size is acceptable or we've tried enough times, use this result
              if (compressedSizeKB <= maxSizeKB || attempts >= maxAttempts || currentQuality <= 0.1) {
                const compressedFile = new File(
                  [blob],
                  getCompressedFileName(file.name, format),
                  { type: `image/${format}` }
                );

                resolve({
                  file: compressedFile,
                  originalSize: file.size,
                  compressedSize: blob.size,
                  compressionRatio: Math.round((1 - blob.size / file.size) * 100)
                });
              } else {
                // Try with lower quality
                attempts++;
                currentQuality = Math.max(0.1, currentQuality - 0.1);
                tryCompress();
              }
            },
            `image/${format}`,
            currentQuality
          );
        };

        tryCompress();
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Generate compressed file name
 */
export function getCompressedFileName(originalName: string, format: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}_compressed.${format}`;
}

/**
 * Batch compress multiple images
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  
  for (const file of files) {
    try {
      const result = await compressImage(file, options);
      results.push(result);
    } catch (error) {
      // Return original file if compression fails
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0
      });
    }
  }
  
  return results;
}

/**
 * Get optimal compression settings based on image type and size
 */
export function getOptimalCompressionSettings(file: File): CompressionOptions {
  const sizeKB = file.size / 1024;
  
  // Workspace photos - high quality for hero images, medium for others
  if (sizeKB > 2000) {
    // Large images - aggressive compression
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.7,
      maxSizeKB: 400,
      format: 'jpeg'
    };
  } else if (sizeKB > 1000) {
    // Medium images - moderate compression
    return {
      maxWidth: 1600,
      maxHeight: 900,
      quality: 0.8,
      maxSizeKB: 300,
      format: 'jpeg'
    };
  } else {
    // Small images - light compression
    return {
      maxWidth: 1200,
      maxHeight: 800,
      quality: 0.85,
      maxSizeKB: 200,
      format: 'jpeg'
    };
  }
}

/**
 * Check if file needs compression
 */
export function shouldCompressImage(file: File): boolean {
  const sizeKB = file.size / 1024;
  const maxSizeKB = 500; // Compress if larger than 500KB
  
  return sizeKB > maxSizeKB || !file.type.includes('jpeg');
}