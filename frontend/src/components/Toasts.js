/**
 * @file Toasts.js
 * @description Short-lived notices in the bottom-right corner.
 *
 * They say what happened and then get out of the way, so a result never has to
 * be dismissed by hand before the next action. Errors stay longer than
 * confirmations, because they usually carry a rule the admin needs to read.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const LIFETIME = { success: 4000, error: 8000 };

/** Owns the toast list and clears each one when its time is up. */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((kind, text) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((list) => [...list, { id, kind, text }]);
    timers.current.push(
      setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), LIFETIME[kind] || LIFETIME.success)
    );
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return { toasts, push, dismiss };
}

export default function Toasts({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[60] flex flex-col-reverse gap-2 w-[min(380px,calc(100vw-2.5rem))]"
    >
      {toasts.map((t) => {
        const isError = t.kind === "error";
        const Icon = isError ? AlertCircle : CheckCircle2;
        return (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-2.5 px-3.5 py-3 rounded-lg border shadow-panel ${
              isError ? "bg-danger-soft border-danger/25 text-danger-foreground" : "bg-card border-border text-foreground"
            }`}
          >
            <Icon className={`w-[18px] h-[18px] mt-0.5 flex-shrink-0 ${isError ? "text-danger" : "text-success"}`} />
            <p className="m-0 flex-1 text-[13px] leading-snug">{t.text}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted cursor-pointer bg-transparent border-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
