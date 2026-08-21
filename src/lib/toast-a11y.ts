/**
 * Accessible toast layer.
 *
 * Sonner renders toasts in a portal outside the current focus context, so an
 * error toast that appears (or is dismissed/auto-closed) can leave keyboard
 * focus on `<body>` — the user loses their place and has to Tab from the top.
 *
 * `toastError` / `toastSuccess` capture the element that was focused when the
 * toast was raised and restore it *only* if focus was actually lost (body,
 * documentElement, or a node that got detached, e.g. the toast itself). If the
 * user moved on to another control in the meantime, nothing is touched — the
 * toast never steals or hijacks navigation.
 */
import { toast } from "sonner";

type ToastOptions = {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
  onAutoClose?: () => void;
};

function currentFocus(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;
  if (active === document.body || active === document.documentElement) return null;
  return active;
}

function focusLost(): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (!active) return true;
  if (active === document.body || active === document.documentElement) return true;
  return !active.isConnected;
}

/** Restore focus to `opener` when, and only when, focus was lost. */
export function restoreFocus(opener: HTMLElement | null) {
  if (!opener || !opener.isConnected || !focusLost()) return;
  opener.focus({ preventScroll: true });
}

function withFocusReturn(
  kind: "error" | "success" | "info",
  message: string,
  options: ToastOptions = {},
) {
  const opener = currentFocus();
  const restore = () => restoreFocus(opener);
  return toast[kind](message, {
    ...options,
    onDismiss: () => {
      options.onDismiss?.();
      restore();
    },
    onAutoClose: () => {
      options.onAutoClose?.();
      restore();
    },
  });
}

export const toastError = (message: string, options?: ToastOptions) =>
  withFocusReturn("error", message, options);

export const toastSuccess = (message: string, options?: ToastOptions) =>
  withFocusReturn("success", message, options);

export const toastInfo = (message: string, options?: ToastOptions) =>
  withFocusReturn("info", message, options);
