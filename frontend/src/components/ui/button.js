import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[13px] font-semibold tracking-[-0.015em] transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.985]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:bg-[#13365c] hover:shadow-panel",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[#e3eaf2]",
        outline:
          "border border-border bg-card text-foreground shadow-soft hover:bg-muted hover:border-[#cfd8e3]",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-muted",
        soft:
          "bg-accent text-accent-foreground hover:bg-[#dce6f2]",
        danger:
          "bg-danger text-white shadow-soft hover:bg-[#c01238]",
        "danger-outline":
          "border border-danger/25 bg-card text-danger hover:bg-danger-soft",
        link:
          "text-foreground underline-offset-4 hover:underline px-0 h-auto",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-3 text-[12.5px] gap-1.5 rounded-lg",
        lg: "h-11 px-5 text-[14px]",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
