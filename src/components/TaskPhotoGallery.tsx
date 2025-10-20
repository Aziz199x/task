"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface TaskPhotoGalleryProps {
  photoBeforeUrl?: string | null;
  photoAfterUrl?: string | null;
  photoPermitUrl?: string | null;
}

const PhotoThumbnail: React.FC<{ url: string; alt: string }> = ({ url, alt }) => (
  <Dialog>
    <DialogTrigger asChild>
      <div className="cursor-pointer">
        <img src={url} alt={alt} className="w-16 h-16 object-cover rounded-md hover:opacity-80 transition-opacity" />
        <p className="text-xs text-center text-muted-foreground mt-1">{alt}</p>
      </div>
    </DialogTrigger>
    <DialogContent className="max-w-3xl">
      <img src={url} alt={alt} className="w-full h-auto rounded-lg" />
    </DialogContent>
  </Dialog>
);

const TaskPhotoGallery: React.FC<TaskPhotoGalleryProps> = ({ photoBeforeUrl, photoAfterUrl, photoPermitUrl }) => {
  const { t } = useTranslation();

  const hasPhotos = photoBeforeUrl || photoAfterUrl || photoPermitUrl;

  if (!hasPhotos) {
    return null;
  }

  return (
    <div className="mt-2 pt-2 border-t">
      <div className="flex items-center gap-4">
        {photoBeforeUrl && <PhotoThumbnail url={photoBeforeUrl} alt={t('before')} />}
        {photoAfterUrl && <PhotoThumbnail url={photoAfterUrl} alt={t('after')} />}
        {photoPermitUrl && <PhotoThumbnail url={photoPermitUrl} alt={t('permit')} />}
      </div>
    </div>
  );
};

export default TaskPhotoGallery;