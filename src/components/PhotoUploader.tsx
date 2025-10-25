"use client";

import React, { useState, memo, useEffect } from 'react';
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

  // Log when the currentUrl prop changes
  useEffect(() => {
    console.log(`[PhotoUploader - ${photoType}] currentUrl prop changed to:`, currentUrl);
  }, [currentUrl, photoType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      console.log(`[PhotoUploader - ${photoType}] File selected:`, e.target.files[0].name);
    } else {
      setFile(null);
      console.log(`[PhotoUploader - ${photoType}] File selection cleared.`);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error(t('please_select_a_file_first'));
      return;
    }
    setUploading(true);
    console.log(`[PhotoUploader - ${photoType}] Starting upload for file:`, file.name);

    const fileExt = file.name.split('.').pop();
    const fileName = `${photoType}-${Date.now()}.${fileExt}`;
    const filePath = `${taskId}/${fileName}`;

    const { error } = await supabase.storage
      .from('task_photos')
      .upload(filePath, file);

    if (error) {
      console.error(`[PhotoUploader - ${photoType}] Upload failed:`, error); // Log the full error object
      toast.error(`${t('upload_failed')}: ${error.message}`);
    } else {
      const { data } = supabase.storage
        .from('task_photos')
        .getPublicUrl(filePath);
      
      if (data.publicUrl) {
        console.log(`[PhotoUploader - ${photoType}] Upload successful, public URL:`, data.publicUrl);
        onUploadSuccess(data.publicUrl); // Call the parent's success handler
        setFile(null); // Clear the file input after successful upload
        console.log(`[PhotoUploader - ${photoType}] onUploadSuccess called and file state cleared.`);
      } else {
        console.error(`[PhotoUploader - ${photoType}] Could not get public URL for file:`, filePath, "Data:", data); // Improved logging
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

export default memo(PhotoUploader);