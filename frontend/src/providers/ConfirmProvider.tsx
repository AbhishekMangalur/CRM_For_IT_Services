"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

type ConfirmFunction = (message: string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFunction>((nextMessage) => {
    resolver.current?.(false);

    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setMessage(nextMessage);
    });
  }, []);

  const close = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setMessage(null);
  }, []);

  useEffect(
    () => () => {
      resolver.current?.(false);
    },
    [],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {message !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onKeyDown={(event) => {
            if (event.key === "Escape") close(false);
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close(false);
          }}
        >
          <div
            aria-describedby="confirmation-dialog-description"
            aria-labelledby="confirmation-dialog-title"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
            role="alertdialog"
          >
            <h2
              className="text-lg font-semibold text-slate-950"
              id="confirmation-dialog-title"
            >
              Are you sure?
            </h2>
            <p
              className="mt-2 whitespace-pre-wrap text-sm text-slate-600"
              id="confirmation-dialog-description"
            >
              {message}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                autoFocus
                variant="outline"
                onClick={() => close(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => close(true)}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFunction {
  const confirm = useContext(ConfirmContext);

  if (!confirm) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }

  return confirm;
}
