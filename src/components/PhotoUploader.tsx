"use client";

import React, { useState, memo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const handleUpload = useCallback(async (file: File) => {
    if (!file) return;

    setUploading(true);
    console.log(`[PhotoUploader - ${photoType}] Starting auto-upload for file:`, file.name);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${photoType}-${Date.now()}.${fileExt}`;
      const filePath = `${taskId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task_photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(`[PhotoUploader - ${photoType}] Upload failed:`, uploadError);
        toast.error(`${t('upload_failed')}: ${uploadError.message}`);
      } else {
        console.log(`[PhotoUploader - ${photoType}] Upload successful, data:`, uploadData);
        const { data: publicUrlData } = supabase.storage
          .from('task_photos')
          .getPublicUrl(filePath);
        
        if (publicUrlData.publicUrl) {
          console.log(`[PhotoUploader - ${photoType}] Public URL retrieved:`, publicUrlData.publicUrl);
          onUploadSuccess(publicUrlData.publicUrl);
        } else {
          console.error(`[PhotoUploader - ${photoType}] Could not get public URL for file:`, filePath, "Data:", publicUrlData);
          toast.error(t('could_not_get_photo_url'));
        }
      }
    } catch (unexpectedError: any) {
      console.error(`[PhotoUploader - ${photoType}] An unexpected error occurred during upload:`, unexpectedError);
      toast.error(`${t('upload_failed')}: ${unexpectedError.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  }, [taskId, photoType, onUploadSuccess, t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      console.log(`[PhotoUploader - ${photoType}] File selected, triggering upload:`, selectedFile.name);
      handleUpload(selectedFile);
      e.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };

  if (currentUrl) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <img src={currentUrl} alt={label} className="w-20 h-20 object-cover rounded-md" />
          <Button variant="destructive" size="icon" onClick={onRemove} disabled={uploading}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${photoType}-upload`}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input id={`${photoType}-upload`} type="file" onChange={handleFileChange} accept="image/*" disabled={uploading} />
        {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
    </div>
  );
};

export default memo(PhotoUploader);