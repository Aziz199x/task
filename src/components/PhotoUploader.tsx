"use client";

import React, { useState, memo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Upload, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import imageCompression from 'browser-image-compression';
import { toastSuccess, toastError, toastLoading, dismissToast } from '@/utils/toast'; // Import new toast helpers

interface PhotoUploaderProps {
  label: string;
  bucketName: string;
  folderName: string;
  fileNamePrefix?: string;
  currentImageUrl: string | null | undefined;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ label, bucketName, folderName, fileNamePrefix, currentImageUrl, onUploadSuccess, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { t } = useTranslation();

  const handleUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toastError(t('invalid_file_type'));
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const loadingToastId = toastLoading(t('uploading_photo'));

    try {
      // Options for image compression
      const options = {
        maxSizeMB: 1, // Max file size in MB
        maxWidthOrHeight: 1024, // Max width or height in pixels
        useWebWorker: true, // Use web worker for better performance
        onProgress: (p: number) => setUploadProgress(p), // Progress callback
      };

      const compressedFile = await imageCompression(file, options);

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${fileNamePrefix || 'file'}-${Date.now()}.${fileExt}`;
      const filePath = `${folderName}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      setUploadProgress(100);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      if (publicUrlData.publicUrl) {
        onUploadSuccess(publicUrlData.publicUrl);
        toastSuccess(t('photo_uploaded_successfully'));
      } else {
        throw new Error(t('could_not_get_photo_url'));
      }
    } catch (error: any) {
      toastError(error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      dismissToast(loadingToastId);
    }
  }, [bucketName, folderName, fileNamePrefix, onUploadSuccess, t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleUpload(selectedFile);
      e.target.value = '';
    }
  };

  const handleRemove = async () => {
    // The parent component is now responsible for file deletion logic.
    // This function just calls the passed onRemove prop.
    onRemove();
  };

  if (currentImageUrl) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer group">
                <img 
                  key={currentImageUrl} 
                  src={currentImageUrl} 
                  alt={label} 
                  className="w-20 h-20 object-cover rounded-md hover:opacity-80 transition-opacity" 
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-md flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent
              className="w-full sm:max-w-3xl sm:rounded-lg rounded-none bg-background p-4 sm:p-6
                         max-h-[calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 4rem)]
                         overflow-auto pb-[calc(1rem + env(safe-area-inset-bottom))]"
            >
              <img
                src={currentImageUrl}
                alt={label}
                className="w-full h-auto object-contain rounded-lg
                           max-h-[calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 10rem)]"
              />
            </DialogContent>
          </Dialog>
          <Button variant="destructive" size="icon" onClick={handleRemove} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${fileNamePrefix || 'photo'}-upload`}>{label}</Label>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input 
            id={`${fileNamePrefix || 'photo'}-upload`} 
            type="file" 
            onChange={handleFileChange} 
            accept="image/*" 
            disabled={uploading}
            className="flex-1"
          />
          {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
        {uploading && (
          <div className="space-y-1">
            <Progress value={uploadProgress} className="w-full h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {uploadProgress < 100 ? t('uploading') : t('processing')}... {uploadProgress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(PhotoUploader);