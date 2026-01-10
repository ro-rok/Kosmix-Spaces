import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  compressImages, 
  shouldCompressImage, 
  getOptimalCompressionSettings,
  type CompressionResult 
} from "@/lib/image-compression";
import { OptimizedUploader } from "@/lib/performance";

interface PhotoFile {
  file: File;
  originalFile?: File;
  preview: string;
  progress: number;
  uploaded: boolean;
  compressed: boolean;
  compressionRatio?: number;
  error?: string;
}

interface PhotoUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
  offeringType?: string; // For offering-specific photo buckets
}

export function PhotoUploader({
  onUpload,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  disabled = false,
  className,
  offeringType
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Initialize optimized uploader with performance settings
  const [uploader] = useState(() => new OptimizedUploader({
    maxConcurrent: 3,
    retryAttempts: 3,
    retryDelay: 1000
  }));

  const validateFile = (file: File): string | null => {
    // Enhanced file type validation with whitelist enforcement
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return `${file.name} is not a supported image format. Only JPG, PNG, and WebP are allowed.`;
    }
    
    if (file.size > maxFileSize) {
      return `${file.name} is too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`;
    }
    
    // Check file count per offering bucket if specified
    if (offeringType && photos.length >= maxFiles) {
      return `Maximum ${maxFiles} photos allowed for ${offeringType}`;
    }
    
    return null;
  };

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of fileArray) {
      if (photos.length + validFiles.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        break;
      }
      
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length === 0) return;
    
    // Check which files need compression
    const filesToCompress = validFiles.filter(shouldCompressImage);
    const filesToKeep = validFiles.filter(file => !shouldCompressImage(file));
    
    // Add files that don't need compression immediately
    const immediatePhotos: PhotoFile[] = filesToKeep.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
      compressed: false
    }));
    
    setPhotos(prev => [...prev, ...immediatePhotos]);
    
    // Compress files that need it
    if (filesToCompress.length > 0) {
      setIsCompressing(true);
      toast.info(`Compressing ${filesToCompress.length} image(s)...`);
      
      try {
        const compressionResults = await compressImages(
          filesToCompress.map(file => ({
            file,
            options: getOptimalCompressionSettings(file)
          })).map(({ file, options }) => file),
          getOptimalCompressionSettings(filesToCompress[0]) // Use first file's settings as default
        );
        
        const compressedPhotos: PhotoFile[] = compressionResults.map((result, index) => ({
          file: result.file,
          originalFile: filesToCompress[index],
          preview: URL.createObjectURL(result.file),
          progress: 0,
          uploaded: false,
          compressed: result.compressionRatio > 0,
          compressionRatio: result.compressionRatio
        }));
        
        setPhotos(prev => [...prev, ...compressedPhotos]);
        
        const totalSavings = compressionResults.reduce(
          (total, result) => total + (result.originalSize - result.compressedSize), 
          0
        );
        
        if (totalSavings > 0) {
          toast.success(
            `Images compressed! Saved ${Math.round(totalSavings / 1024)}KB total`
          );
        }
      } catch (error) {
        console.error('Compression failed:', error);
        toast.error('Image compression failed, using original files');
        
        // Add original files if compression fails
        const fallbackPhotos: PhotoFile[] = filesToCompress.map(file => ({
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          uploaded: false,
          compressed: false
        }));
        
        setPhotos(prev => [...prev, ...fallbackPhotos]);
      } finally {
        setIsCompressing(false);
      }
    }
  }, [photos.length, maxFiles, maxFileSize, acceptedTypes]);

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const photo = prev[index];
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || isCompressing) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const uploadPhotos = async () => {
    const filesToUpload = photos.filter(p => !p.uploaded && !p.error);
    if (filesToUpload.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Use optimized uploader for non-blocking UI and progress tracking
      const uploadPromises = filesToUpload.map((photo, index) => {
        const photoIndex = photos.findIndex(p => p.file === photo.file);
        
        return uploader.uploadFile(
          photo.file,
          (file) => onUpload([file]),
          // Progress callback
          (progress) => {
            setPhotos(prev => prev.map((p, idx) => 
              idx === photoIndex ? { ...p, progress } : p
            ));
          },
          // Success callback
          (result) => {
            setPhotos(prev => prev.map((p, idx) => 
              idx === photoIndex ? { ...p, progress: 100, uploaded: true } : p
            ));
          },
          // Error callback
          (error) => {
            setPhotos(prev => prev.map((p, idx) => 
              idx === photoIndex ? { ...p, error: error.message || 'Upload failed' } : p
            ));
          }
        );
      });
      
      await Promise.allSettled(uploadPromises);
      
      const successCount = photos.filter(p => p.uploaded).length;
      const errorCount = photos.filter(p => p.error).length;
      
      if (successCount > 0) {
        toast.success(`${successCount} photo(s) uploaded successfully`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} photo(s) failed to upload`);
      }
      
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    photos.forEach(photo => {
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
    });
    setPhotos([]);
  };

  const pendingUploads = photos.filter(p => !p.uploaded && !p.error).length;
  const successfulUploads = photos.filter(p => p.uploaded).length;
  const failedUploads = photos.filter(p => p.error).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragging && !disabled && !isCompressing && "border-primary bg-primary/5",
          (disabled || isCompressing) && "opacity-50 cursor-not-allowed",
          !disabled && !isCompressing && "cursor-pointer hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={disabled || isCompressing}
          className="hidden"
          id="photo-upload"
        />
        
        <label htmlFor="photo-upload" className={cn(
          "flex flex-col items-center gap-2",
          (disabled || isCompressing) ? "cursor-not-allowed" : "cursor-pointer"
        )}>
          {isCompressing ? (
            <Zap className="h-8 w-8 text-primary animate-pulse" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">
              {isCompressing 
                ? 'Compressing images...' 
                : isDragging 
                  ? 'Drop photos here' 
                  : 'Upload photos'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to select • Max {maxFiles} files • 
              {Math.round(maxFileSize / 1024 / 1024)}MB each
              {!isCompressing && (
                <span className="block text-xs mt-1 text-primary">
                  ⚡ Images will be automatically compressed for faster uploads
                </span>
              )}
            </p>
          </div>
        </label>
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span>
                {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
              </span>
              {successfulUploads > 0 && (
                <Badge variant="default">{successfulUploads} uploaded</Badge>
              )}
              {failedUploads > 0 && (
                <Badge variant="destructive">{failedUploads} failed</Badge>
              )}
              {photos.filter(p => p.compressed).length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {photos.filter(p => p.compressed).length} compressed
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              {pendingUploads > 0 && (
                <Button
                  size="sm"
                  onClick={uploadPhotos}
                  disabled={isUploading || disabled}
                >
                  {isUploading ? 'Uploading...' : `Upload ${pendingUploads}`}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={isUploading}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="relative">
                  <img
                    src={photo.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  
                  {/* Status overlay */}
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.uploaded && (
                      <Badge variant="default">Uploaded</Badge>
                    )}
                    {photo.error && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                    {!photo.uploaded && !photo.error && (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                  
                  {/* Compression badge */}
                  {photo.compressed && photo.compressionRatio && photo.compressionRatio > 0 && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
                        <Zap className="h-3 w-3 mr-1" />
                        -{photo.compressionRatio}%
                      </Badge>
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removePhoto(index)}
                    disabled={isUploading}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                
                {/* Progress bar */}
                {photo.progress > 0 && photo.progress < 100 && (
                  <div className="mt-2">
                    <Progress value={photo.progress} className="h-1" />
                  </div>
                )}
                
                {/* Error message */}
                {photo.error && (
                  <p className="text-xs text-destructive mt-1 truncate" title={photo.error}>
                    {photo.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}