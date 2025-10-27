"use client";

import React, { useState, memo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import imageCompression from 'browser-image-compression';

interface MultiPhotoUploaderProps {
  label: string;
  taskId: string;
  photoType: 'before' | 'after';
  currentUrls: string[] | null | undefined;
  onUploadSuccess: (url: string) => void;
  onRemove: (url: string) => void;
}

const MultiPhotoUploader: React.FC<MultiPhotoUploaderProps> = ({ label, taskId, photoType, currentUrls, onUploadSuccess, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { t } = useTranslation();

  const handleUpload = useCallback(async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('invalid_file_type'));
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        onProgress: (p: number) => setUploadProgress(p),
      };
      const compressedFile = await imageCompression(file, options);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${photoType}-${Date.now()}.${fileExt}`;
      const filePath = `${taskId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task_photos')
        .upload(filePath, compressedFile, { cacheControl: '3600', upsert: false });

      setUploadProgress(100);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('task_photos').getPublicUrl(filePath);
      if (publicUrlData.publicUrl) {
        onUploadSuccess(publicUrlData.publicUrl);
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
      handleUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {currentUrls?.map((url) => (
          <div key={url} className="relative group">
            <Dialog>
              <DialogTrigger asChild>
                <img src={url} alt={label} className="w-20 h-20 object-cover rounded-md cursor-pointer" />
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <img src={url} alt={label} className="w-full h-auto rounded-lg" />
              </DialogContent>
            </Dialog>
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(url)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Label
          htmlFor={`${photoType}-multi-upload`}
          className="w-20 h-20 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-accent"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <PlusCircle className="h-6 w-6 text-muted-foreground" />
          )}
          <Input
            id={`${photoType}-multi-upload`}
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            disabled={uploading}
            className="hidden"
          />
        </Label>
      </div>
      {uploading && (
        <div className="space-y-1 pt-2">
          <Progress value={uploadProgress} className="w-full h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {uploadProgress < 100 ? t('uploading') : t('processing')}... {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default memo(MultiPhotoUploader);