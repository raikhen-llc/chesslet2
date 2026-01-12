"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for toast notifications
 * @returns {{ toast: { message: string, type: string } | null, showToast: (message: string, type?: string) => void }}
 */
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}

/**
 * Toast component - renders the toast notification
 */
export function Toast({ toast }) {
  if (!toast) return null;

  return <div className={`toast toast-${toast.type}`}>{toast.message}</div>;
}
