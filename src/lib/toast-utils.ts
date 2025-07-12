import toast from 'react-hot-toast';

export const toastUtils = {
  success: (message: string) => {
    toast.success(message);
  },

  error: (message: string, error?: unknown) => {
    // Log the actual error for debugging
    if (error) {
      console.error('Error details:', error);
    }
    
    // Show user-friendly error message
    toast.error(message);
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  // API Error handler
  apiError: (error: unknown, fallbackMessage = 'Algo salió mal') => {
    let message = fallbackMessage;
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message);
    }
    
    console.error('API Error:', error);
    toast.error(message);
  },
};
