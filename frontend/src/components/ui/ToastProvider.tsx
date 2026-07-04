import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { ToastContext } from "./toast-context";

interface ToastProviderProps {
  children: ReactNode;
}

export default function ToastProvider({
  children,
}: ToastProviderProps) {

  const [message, setMessage] = useState("");

  const value = useMemo(
    () => ({
      showToast: (nextMessage: string) => {
        setMessage(nextMessage);

        window.setTimeout(() => {
          setMessage("");
        }, 3000);
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {message ? (
        <div className="fixed bottom-4 right-4 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-lg">
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}