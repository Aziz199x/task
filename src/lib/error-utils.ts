import { TFunction } from 'i18next';

/**
 * Normalizes various error types into a user-friendly, translated message.
 * @param err The error object (can be a string, Error, Supabase error, etc.).
 * @param t The i18next translation function.
 * @returns A user-friendly error message string.
 */
export const normalizeError = (err: any, t: TFunction): string => {
  if (!err) {
    return t('an_unexpected_error_occurred');
  }

  // Handle string errors
  if (typeof err === 'string') {
    // Check if the string itself is a translation key
    if (t(err) !== err) {
      return t(err);
    }
    return err;
  }

  // Handle Supabase AuthApiError or PostgrestError
  if (err.name === 'AuthApiError' || err.code?.startsWith('PGRST')) {
    // Specific handling for common Supabase errors
    if (err.message.includes('Email rate limit exceeded')) {
      return t('email_rate_limit_exceeded');
    }
    if (err.message.includes('User already registered')) {
      return t('user_already_registered_login_instead');
    }
    if (err.message.includes('invalid_grant') || err.message.includes('invalid_credentials')) {
      return t('invalid_credentials');
    }
    if (err.message.includes('Email not confirmed')) {
      return t('email_not_confirmed');
    }
    if (err.message.includes('Password recovery not allowed')) {
      return t('password_recovery_not_allowed');
    }
    if (err.message.includes('Password has been used recently')) {
      return t('password_used_recently');
    }
    if (err.message.includes('Database query timed out')) {
      return t('database_connection_timeout');
    }
    if (err.message.includes('Failed to fetch')) {
      return t('network_error_check_connection');
    }
    // Fallback for other Supabase errors
    return err.message;
  }

  // Handle generic Error objects
  if (err instanceof Error) {
    if (err.message.includes('timed out')) {
      return t('database_connection_timeout');
    }
    if (err.message.includes('Failed to fetch')) {
      return t('network_error_check_connection');
    }
    return err.message;
  }

  // Handle Zod errors (from react-hook-form validation)
  if (err.issues && Array.isArray(err.issues)) {
    return err.issues.map((issue: any) => issue.message).join(', ');
  }

  // Handle response objects from Edge Functions that might contain an 'error' field
  if (err.error && typeof err.error === 'string') {
    return err.error;
  }

  // Fallback for any other unknown error structure
  return t('an_unexpected_error_occurred');
};