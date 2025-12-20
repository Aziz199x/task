import { toast as sonnerToast } from "sonner";
import i18n from '@/i18n'; // Import i18n instance for translation
import { normalizeError } from '@/lib/error-utils'; // Import normalizeError

// Map to store active toasts for deduplication
const activeToasts = new Map<string, number>(); // message -> count

// Function to generate a unique key for a toast message
const getToastKey = (message: string) => message;

// Function to prevent duplicate toasts
const showUniqueToast = (message: string, options?: any) => {
  const key = getToastKey(message);
  if (activeToasts.has(key)) {
    // If toast with this message is already active, increment count and return
    activeToasts.set(key, activeToasts.get(key)! + 1);
    return;
  }

  const id = sonnerToast(message, {
    ...options,
    onAutoClose: (toastId) => {
      activeToasts.delete(key);
      if (options.onAutoClose) options.onAutoClose(toastId);
    },
    onDismiss: (toastId) => {
      activeToasts.delete(key);
      if (options.onDismiss) options.onDismiss(toastId);
    },
  });
  activeToasts.set(key, 1);
  return id;
};

export const toastSuccess = (message: string, options?: any) => {
  showUniqueToast(i18n.t(message), {
    ...options,
    duration: 3000,
    style: {
      background: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      border: '1px solid hsl(var(--primary))',
    },
    icon: '✅',
  });
};

export const toastError = (error: any, options?: any) => {
  const message = normalizeError(error, i18n.t);
  showUniqueToast(message, {
    ...options,
    duration: 5000,
    style: {
      background: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
      border: '1px solid hsl(var(--destructive))',
    },
    icon: '❌',
  });
};

export const toastWarning = (message: string, options?: any) => {
  showUniqueToast(i18n.t(message), {
    ...options,
    duration: 4000,
    style: {
      background: 'hsl(var(--yellow-100))', // Assuming a yellow-100 equivalent for warning background
      color: 'hsl(var(--yellow-800))', // Assuming a yellow-800 equivalent for warning text
      border: '1px solid hsl(var(--yellow-500))', // Assuming a yellow-500 equivalent for warning border
    },
    icon: '⚠️',
  });
};

export const toastInfo = (message: string, options?: any) => {
  showUniqueToast(i18n.t(message), {
    ...options,
    duration: 3000,
    style: {
      background: 'hsl(var(--secondary))',
      color: 'hsl(var(--secondary-foreground))',
      border: '1px solid hsl(var(--border))',
    },
    icon: 'ℹ️',
  });
};

export const toastLoading = (message: string, options?: any) => {
  return sonnerToast.loading(i18n.t(message), {
    ...options,
    duration: Infinity, // Stays open until dismissed
    style: {
      background: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
      border: '1px solid hsl(var(--border))',
    },
    icon: '⏳',
  });
};

export const dismissToast = (toastId: string | number) => {
  sonnerToast.dismiss(toastId);
};