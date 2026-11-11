import React from "react";
import { X, UserPlus, UserMinus } from "lucide-react";
import { Button } from "./ui/button";

export default function ConfirmModal({
  isOpen,
  type,
  isAutomate,
  permissions,
  userName,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  const granting = type === "onboard";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[420px] ui-panel p-6 flex flex-col gap-5 shadow-panel"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
              granting ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
            }`}
          >
            {granting ? <UserPlus className="size-5" /> : <UserMinus className="size-5" />}
          </div>
          <div>
            <h3 className="m-0 text-[17px] font-semibold tracking-tight text-foreground">
              {isAutomate ? "Automated" : "Manual"} {granting ? "grant" : "revoke"}
            </h3>
            <p className="mt-1.5 mb-0 text-[13px] text-muted-foreground leading-relaxed">
              {granting ? "Grant" : "Revoke"}{" "}
              <span className="font-semibold text-foreground">{permissions?.length || 0}</span>{" "}
              {granting ? "to" : "from"} <span className="font-semibold text-foreground">{userName}</span>
            </p>
          </div>
        </div>

        <div className="bg-muted rounded-md p-3.5 border border-border max-h-[200px] overflow-y-auto scroll-soft">
          <ul className="m-0 p-0 list-none space-y-2">
            {permissions?.map((name, idx) => (
              <li key={idx} className="flex items-center gap-2.5 text-[13px] font-medium text-foreground/90">
                <span className={`w-1.5 h-1.5 rounded-full ${granting ? "bg-success" : "bg-danger"}`} />
                {name}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2.5">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={granting ? "default" : "danger"}
            className="flex-1"
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
