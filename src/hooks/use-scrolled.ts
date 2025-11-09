"use client";

import { useState, useEffect } from 'react';

export const useScrolled = (thresholdPx: number = 1) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      setScrolled(window.scrollY > thresholdPx);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [thresholdPx]);

  return scrolled;
};