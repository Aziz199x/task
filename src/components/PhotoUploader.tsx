"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Trash2 } from 'lucide-react';
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
  const [file, setFile] = useState<File | null>(null);
  const { t } = useTranslation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error(t('please_select_a_file_first'));
      return;
    }
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${photoType}-${Date.now()}.${fileExt}`;
    const filePath = `${taskId}/${fileName}`;

    const { error } = await supabase.storage
      .from('task_photos')
      .upload(filePath, file);

    if (error) {
      toast.error(`${t('upload_failed')}: ${error.message}`);
    } else {
      const { data } = supabase.storage
        .from('task_photos')
        .getPublicUrl(filePath);
      
      if (data.publicUrl) {
        onUploadSuccess(data.publicUrl);
        toast.success(t('photo_uploaded_successfully'));
        setFile(null);
      } else {
        toast.error(t('could_not_get_photo_url'));
      }
    }
    setUploading(false);
  };

  if (currentUrl) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <img src={currentUrl} alt={label} className="w-20 h-20 object-cover rounded-md" />
          <Button variant="destructive" size="icon" onClick={onRemove}>
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
        <Input id={`${photoType}-upload`} type="file" onChange={handleFileChange} accept="image/*" />
        <Button onClick={handleUpload} disabled={uploading || !file} size="icon">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default PhotoUploader;