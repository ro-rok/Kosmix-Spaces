import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface TempPhoto {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  file?: File; // Keep reference to original file
}

export function useUploadTempPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, offeringType }: { file: File; offeringType?: string }) => {
      return api.partner.uploadTempPhoto(file, offeringType);
    },
    onSuccess: (data) => {
      // Invalidate any relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ["temp-photos"] });
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

export function useMoveTempPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      listingId, 
      tempPhotoIds, 
      offeringType 
    }: { 
      listingId: string; 
      tempPhotoIds: string[]; 
      offeringType?: string;
    }) => {
      return api.partner.moveTempPhotos(listingId, tempPhotoIds, offeringType);
    },
    onSuccess: (data, variables) => {
      // Invalidate listing queries to refresh the photos
      queryClient.invalidateQueries({ queryKey: ["partner", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["partner", "listing", variables.listingId] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(`Failed to move photos: ${error.message}`);
    },
  });
}

export function useDeleteTempPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (publicId: string) => {
      return api.partner.deleteTempPhoto(publicId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["temp-photos"] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });
}

export function useCleanupTempPhotos() {
  return useMutation({
    mutationFn: async (maxAgeHours: number = 24) => {
      return api.partner.cleanupTempPhotos(maxAgeHours);
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(`Cleanup failed: ${error.message}`);
    },
  });
}