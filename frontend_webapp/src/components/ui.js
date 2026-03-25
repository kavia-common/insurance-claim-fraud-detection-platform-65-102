import React, { useEffect } from "react";

/**
 * PUBLIC_INTERFACE
 * Simple badge/pill component with variants.
 */
export function Pill({ variant = "default", children }) {
  const cls =
    variant === "primary"
      ? "Pill PillPrimary"
      : variant === "warn"
        ? "Pill PillWarn"
        : variant === "danger"
          ? "Pill PillDanger"
          : "Pill";
  return <span className={cls}>{children}</span>;
}

/**
 * PUBLIC_INTERFACE
 * Modal component with ESC to close and click-outside close.
 */
export function Modal({ title, isOpen, onClose, children, footer }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="ModalOverlay"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : "Dialog"}
      onMouseDown={(e) => {
        // close if clicking overlay, not the modal content
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="Modal">
        <div className="ModalHeader">
          <h2>{title}</h2>
          <button className="Btn BtnSmall" onClick={onClose} aria-label="Close dialog">
            Close
          </button>
        </div>
        <div className="ModalBody">{children}</div>
        {footer ? <div className="ModalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Format currency (USD by default).
 */
export function formatMoney(amount, currency = "USD") {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount));
  } catch {
    return `$${Number(amount).toFixed(2)}`;
  }
}

/**
 * PUBLIC_INTERFACE
 * Format score 0..1 or 0..100 into percentage label.
 */
export function formatScore(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return "—";
  const n = Number(score);
  const pct = n <= 1 ? n * 100 : n;
  return `${Math.round(pct)}%`;
}

/**
 * PUBLIC_INTERFACE
 * Determine risk tier label/variant from numeric score.
 */
export function riskTier(score) {
  const n = Number(score);
  const pct = n <= 1 ? n * 100 : n;
  if (pct >= 80) return { label: "High", variant: "danger" };
  if (pct >= 50) return { label: "Medium", variant: "warn" };
  return { label: "Low", variant: "default" };
}
