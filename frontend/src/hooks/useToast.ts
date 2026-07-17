import { useContext } from "react";

import { ToastContext } from "../components/ui/toast-context";

/** useToast — Lấy hàm hiển thị toast từ ToastContext (phải nằm trong ToastProvider). */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used within ToastProvider"
    );
  }

  return context;
}