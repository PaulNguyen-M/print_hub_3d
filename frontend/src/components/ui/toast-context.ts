import { createContext } from "react";

export interface ToastContextValue {
  showToast: (message: string) => void;
}

/** ToastContext — Context giữ hàm showToast (truy cập qua hook useToast). */
export const ToastContext =
  createContext<ToastContextValue | null>(null);