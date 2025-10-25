"use client";

import React, { useState, memo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Upload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface PhotoUploaderProps {
  label: string;
  taskId: string;
  photoType: 'before' | 'after' | 'permit';
  currentUrl: string | null | undefined;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ label, taskId, photoType, currentUrl, onUploadSuccess, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { t } = useTranslation();

  const handleUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('file_too_large'));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('invalid_file_type'));
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${photoType}-${Date.now()}.${fileExt}`;
      const filePath = `${taskId}/${fileName}`;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { error: uploadError } = await supabase.storage
        .from('task_photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('task_photos')
        .getPublicUrl(filePath);
      
      if (publicUrlData.publicUrl) {
        onUploadSuccess(publicUrlData.publicUrl);
        toast.success(t('photo_uploaded_successfully'));
      } else {
        throw new Error(t('could_not_get_photo_url'));
      }
    } catch (error: any) {
      toast.error(`${t('upload_failed')}: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [taskId, photoType, onUploadSuccess, t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleUpload(selectedFile);
      e.target.value = '';
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await onRemove();
    } finally {
      setUploading(false);
    }
  };

  if (currentUrl) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer group">
                <img 
                  key={currentUrl} 
                  src={currentUrl} 
                  alt={label} 
                  className="w-20 h-20 object-cover rounded-md hover:opacity-80 transition-opacity" 
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-md flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <img src={currentUrl} alt={label} className="w-full h-auto rounded-lg" />
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
      <Label htmlFor={`${photoType}-upload`}>{label}</Label>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input 
            id={`${photoType}-upload`} 
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