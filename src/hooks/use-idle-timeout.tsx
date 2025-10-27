"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const useIdleTimeout = (onIdle: () => void, idleTimeSeconds: number) => {
  const { t } = useTranslation();
  const timeoutId = useRef<number | null>(null);

  const handleIdle = useCallback(() => {
    toast.warning(t('signed_out_due_to_inactivity'));
    onIdle();
  }, [onIdle, t]);

  const resetTimer = useCallback(() => {
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }
    timeoutId.current = window.setTimeout(handleIdle, idleTimeSeconds * 1000);
  }, [handleIdle, idleTimeSeconds]);

  const handleEvent = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    
    events.forEach(event => window.addEventListener(event, handleEvent));
    resetTimer();

    return () => {
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
      events.forEach(event => window.removeEventListener(event, handleEvent));
    };
  }, [handleEvent, resetTimer]);

  return null; // This hook does not render anything
};

export default useIdleTimeout;