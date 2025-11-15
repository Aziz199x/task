"use client";

/**
 * Checks if a given error object indicates a Supabase email rate limit error.
 * @param error The error object, potentially from a Supabase API call.
 * @returns true if the error is a rate limit error, false otherwise.
 */
export const isRateLimitError = (error: any): boolean => {
  return (
    error?.status === 429 ||
    error?.code === 'over_email_send_rate_limit' ||
    /rate\s*limit/i.test(error?.message || '')
  );
};