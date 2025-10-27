"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface TaskPhotoGalleryProps {
  photoBeforeUrls?: string[] | null;
  photoAfterUrls?: string[] | null;
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

const TaskPhotoGallery: React.FC<TaskPhotoGalleryProps> = ({ photoBeforeUrls, photoAfterUrls, photoPermitUrl }) => {
  const { t } = useTranslation();
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      setLoading(true);
      const urlsToFetch: { originalUrl: string; path: string }[] = [];

      const processUrl = (url: string) => {
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/task_photos/');
          if (pathParts.length > 1) {
            urlsToFetch.push({ originalUrl: url, path: pathParts[1] });
          }
        } catch (e) {
          console.error("Invalid URL stored in database:", url);
        }
      };

      (photoBeforeUrls || []).forEach(processUrl);
      (photoAfterUrls || []).forEach(processUrl);
      if (photoPermitUrl) processUrl(photoPermitUrl);

      if (urlsToFetch.length === 0) {
        setLoading(false);
        return;
      }

      const filePaths = urlsToFetch.map(item => item.path);

      try {
        const { data, error } = await supabase.functions.invoke('get-signed-urls', {
          body: { filePaths },
        });

        if (error) throw new Error(error.message);
        if (!data) throw new Error("The security function returned no data.");

        const newSignedUrls: Record<string, string> = {};
        data.forEach((signed: { signedUrl: string; path: string; error: string | null }) => {
          if (signed.error) {
            console.error(`Error generating signed URL for ${signed.path}:`, signed.error);
            return;
          }
          const originalItem = urlsToFetch.find(item => item.path === signed.path);
          if (originalItem) {
            newSignedUrls[originalItem.originalUrl] = signed.signedUrl;
          }
        });
        setSignedUrls(newSignedUrls);

      } catch (error: any) {
        console.error("Error fetching signed URLs:", error);
        toast.error(`Failed to get secure photo links: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrls();
  }, [photoBeforeUrls, photoAfterUrls, photoPermitUrl]);

  const hasPhotos = (photoBeforeUrls && photoBeforeUrls.length > 0) || (photoAfterUrls && photoAfterUrls.length > 0) || photoPermitUrl;

  if (!hasPhotos) {
    return null;
  }

  return (
    <div className="mt-2 pt-2 border-t">
      <div className="flex items-center gap-4 flex-wrap">
        {(photoBeforeUrls || []).map((url, i) => <PhotoThumbnail key={url} url={loading ? null : signedUrls[url]} alt={`${t('before')} ${i + 1}`} />)}
        {(photoAfterUrls || []).map((url, i) => <PhotoThumbnail key={url} url={loading ? null : signedUrls[url]} alt={`${t('after')} ${i + 1}`} />)}
        {photoPermitUrl && <PhotoThumbnail url={loading ? null : signedUrls[photoPermitUrl]} alt={t('permit')} />}
      </div>
    </div>
  );
};

export default TaskPhotoGallery;