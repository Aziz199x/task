"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toastError } from '@/utils/toast'; // Import toastError

interface TaskPhotoGalleryProps {
  photoBeforeUrls?: string[] | null;
  photoAfterUrls?: string[] | null;
  photoPermitUrl?: string | null;
}

const PhotoThumbnail: React.FC<{ url: string | null; alt: string }> = ({ url, alt }) => {
  const { t } = useTranslation();
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
          <img 
            src={url} 
            alt={alt} 
            className="w-16 h-16 object-cover rounded-md hover:opacity-80 transition-opacity" 
            onError={(e) => {
              // If the image fails to load, try to get a new signed URL
              const target = e.target as HTMLImageElement;
              if (target.dataset.retry !== 'true') {
                target.dataset.retry = 'true';
                // This will trigger a re-render with updated URLs
                window.dispatchEvent(new CustomEvent('refresh-photo-urls'));
              }
            }}
          />
          <p className="text-xs text-center text-muted-foreground mt-1">{alt}</p>
        </div>
      </DialogTrigger>
      {/* DialogContent adjusted to respect safe-area insets and limit modal height on mobile.
          This keeps the close button and image above Android navigation/gesture bars. */}
      <DialogContent
        className="w-full sm:max-w-3xl sm:rounded-lg rounded-none bg-background p-4 sm:p-6
                   max-h-[calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 4rem)]
                   overflow-auto pb-[calc(1rem + env(safe-area-inset-bottom))]"
      >
        <DialogHeader>
          <DialogTitle>{alt}</DialogTitle>
        </DialogHeader>
        <img
          src={url}
          alt={alt}
          // Constrain image height so it fits within the visible viewport and allow scrolling if needed.
          className="w-full h-auto object-contain rounded-lg
                     max-h-[calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 10rem)]"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.dataset.retry !== 'true') {
              target.dataset.retry = 'true';
              window.dispatchEvent(new CustomEvent('refresh-photo-urls'));
            }
          }}
        />
        <DialogClose asChild>
          <Button variant="secondary" className="mt-4 w-full sm:w-auto sm:self-end">
            <X className="h-4 w-4 mr-2" /> {t('close')}
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

const TaskPhotoGallery: React.FC<TaskPhotoGalleryProps> = ({ photoBeforeUrls, photoAfterUrls, photoPermitUrl }) => {
  const { t } = useTranslation();
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchSignedUrls = async () => {
    setLoading(true);
    const urlsToFetch: { originalUrl: string; path: string }[] = [];

    const processUrl = (url: string) => {
      try {
        // Extract the file path from the Supabase storage URL
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

    try {
      // Get signed URLs for all photos
      const filePaths = urlsToFetch.map(item => item.path);
      const { data, error } = await supabase.storage
        .from('task_photos')
        .createSignedUrls(filePaths, 3600); // 1 hour expiry

      if (error) throw new Error(error.message);

      const newSignedUrls: Record<string, string> = {};
      data.forEach((signedUrlData: { path: string; signedUrl: string }) => {
        const originalItem = urlsToFetch.find(item => item.path === signedUrlData.path);
        if (originalItem) {
          newSignedUrls[originalItem.originalUrl] = signedUrlData.signedUrl;
        }
      });
      
      setSignedUrls(newSignedUrls);
    } catch (error: any) {
      console.error("Error fetching signed URLs:", error);
      toastError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignedUrls();
    
    // Listen for refresh events (when an image fails to load)
    const handleRefresh = () => {
      setRetryCount(prev => prev + 1);
    };
    
    window.addEventListener('refresh-photo-urls', handleRefresh);
    return () => window.removeEventListener('refresh-photo-urls', handleRefresh);
  }, [photoBeforeUrls, photoAfterUrls, photoPermitUrl, retryCount]);

  const hasPhotos = (photoBeforeUrls && photoBeforeUrls.length > 0) || 
                   (photoAfterUrls && photoAfterUrls.length > 0) || 
                   photoPermitUrl;

  if (!hasPhotos) {
    return null;
  }

  return (
    <div className="mt-2 pt-2 border-t">
      <div className="flex items-center gap-4 flex-wrap">
        {(photoBeforeUrls || []).map((url, i) => (
          <PhotoThumbnail 
            key={`${url}-${retryCount}`} 
            url={loading ? null : (signedUrls[url] || url)} 
            alt={`${t('before')} ${i + 1}`} 
          />
        ))}
        {(photoAfterUrls || []).map((url, i) => (
          <PhotoThumbnail 
            key={`${url}-${retryCount}`} 
            url={loading ? null : (signedUrls[url] || url)} 
            alt={`${t('after')} ${i + 1}`} 
          />
        ))}
        {photoPermitUrl && (
          <PhotoThumbnail 
            key={`${photoPermitUrl}-${retryCount}`} 
            url={loading ? null : (signedUrls[photoPermitUrl] || photoPermitUrl)} 
            alt={t('permit')} 
          />
        )}
      </div>
    </div>
  );
};

export default TaskPhotoGallery;