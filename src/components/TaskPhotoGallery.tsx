"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface TaskPhotoGalleryProps {
  photoBeforeUrl?: string | null;
  photoAfterUrl?: string | null;
  photoPermitUrl?: string | null;
}

const PhotoThumbnail: React.FC<{ url: string | null; alt: string }> = ({ url, alt }) => {
  if (!url) {
    return (
      <div>
        <Skeleton className="w-16 h-16 rounded-md" />
        <p className="text-xs text-center text-muted-foreground mt-1">{alt}</p>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <img src={url} alt={alt} className="w-16 h-16 object-cover rounded-md hover:opacity-80 transition-opacity" />
          <p className="text-xs text-center text-muted-foreground mt-1">{alt}</p>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{alt}</DialogTitle>
        </DialogHeader>
        <img src={url} alt={alt} className="w-full h-auto rounded-lg" />
      </DialogContent>
    </Dialog>
  );
};

const TaskPhotoGallery: React.FC<TaskPhotoGalleryProps> = ({ photoBeforeUrl, photoAfterUrl, photoPermitUrl }) => {
  const { t } = useTranslation();
  const [signedUrls, setSignedUrls] = useState({ before: null, after: null, permit: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      const urlsToFetch: { key: 'before' | 'after' | 'permit'; url: string }[] = [];
      if (photoBeforeUrl) urlsToFetch.push({ key: 'before', url: photoBeforeUrl });
      if (photoAfterUrl) urlsToFetch.push({ key: 'after', url: photoAfterUrl });
      if (photoPermitUrl) urlsToFetch.push({ key: 'permit', url: photoPermitUrl });

      if (urlsToFetch.length === 0) {
        setLoading(false);
        return;
      }

      // Extract file paths from the full URLs
      const filePaths = urlsToFetch.map(item => {
        const urlParts = item.url.split('/public/task_photos/');
        return urlParts.length > 1 ? urlParts[1] : '';
      }).filter(path => path);

      if (filePaths.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-signed-urls', {
          body: { filePaths },
        });

        if (error) throw error;

        const newSignedUrls: any = {};
        data.forEach((signed: { signedUrl: string; path: string }) => {
          const originalItem = urlsToFetch.find(item => item.url.includes(signed.path));
          if (originalItem) {
            newSignedUrls[originalItem.key] = signed.signedUrl;
          }
        });
        setSignedUrls(newSignedUrls);
      } catch (error) {
        console.error("Error fetching signed URLs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrls();
  }, [photoBeforeUrl, photoAfterUrl, photoPermitUrl]);

  const hasPhotos = photoBeforeUrl || photoAfterUrl || photoPermitUrl;

  if (!hasPhotos) {
    return null;
  }

  return (
    <div className="mt-2 pt-2 border-t">
      <div className="flex items-center gap-4">
        {photoBeforeUrl && <PhotoThumbnail url={loading ? null : signedUrls.before} alt={t('before')} />}
        {photoAfterUrl && <PhotoThumbnail url={loading ? null : signedUrls.after} alt={t('after')} />}
        {photoPermitUrl && <PhotoThumbnail url={loading ? null : signedUrls.permit} alt={t('permit')} />}
      </div>
    </div>
  );
};

export default TaskPhotoGallery;