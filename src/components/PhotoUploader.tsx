"use client";

import React, { useState, memo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

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
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${photoType}-${Date.now()}.${fileExt}`;
      const filePath = `${taskId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task_photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('task_photos')
        .getPublicUrl(filePath);
      
      if (publicUrlData.publicUrl) {
        onUploadSuccess(publicUrlData.publicUrl);
      } else {
        throw new Error(t('could_not_get_photo_url'));
      }
    } catch (error: any) {
      toast.error(`${t('upload_failed')}: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }, [taskId, photoType, onUploadSuccess, t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleUpload(selectedFile);
      e.target.value = '';
    }
  };

  if (currentUrl) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <img key={currentUrl} src={currentUrl} alt={label} className="w-20 h-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity" />
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <img src={currentUrl} alt={label} className="w-full h-auto rounded-lg" />
            </DialogContent>
          </Dialog>
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