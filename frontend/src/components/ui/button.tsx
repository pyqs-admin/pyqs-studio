import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-slate-950 text-white hover:bg-slate-800", outline: "border border-slate-200 bg-white hover:bg-slate-50", ghost: "hover:bg-slate-100" }, size: { default: "h-9 px-3", lg: "h-10 px-4" } }, defaultVariants: { variant: "default", size: "default" } });
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => { const Component = asChild ? Slot : "button"; return <Component className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />; });
Button.displayName = "Button";
