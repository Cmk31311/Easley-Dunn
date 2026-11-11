/**
 * @file Select.js
 * @description A dropdown that looks like the rest of the console rather than
 * the operating system's own control.
 *
 * A native <select> is kept underneath — it stays keyboard and screen-reader
 * friendly, and behaves correctly on a phone — but its platform styling is
 * switched off and the chevron is drawn inside the field, with room reserved
 * for it so the text never runs underneath.
 */

import React from "react";
import { ChevronDown } from "lucide-react";

export default function Select({ label, value, onChange, children, className = "" }) {
  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <select
        aria-label={label}
        value={value}
        onChange={onChange}
        className="appearance-none w-full h-8 pl-2.5 pr-8 bg-card border border-border rounded-md text-[13px] font-medium text-foreground/90 cursor-pointer hover:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-info"
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground absolute right-2 pointer-events-none" />
    </span>
  );
}
