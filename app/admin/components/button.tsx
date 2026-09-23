import { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200",
  secondary:
    "bg-white text-light shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-dark dark:ring-neutral-800 dark:hover:bg-neutral-800",
  ghost:
    "text-muted hover:bg-neutral-200/60 hover:text-light dark:text-muted-dark dark:hover:bg-neutral-800 dark:hover:text-dark",
  danger:
    "bg-primary-light-bg text-primary-light hover:bg-red-100 dark:bg-primary-dark-bg dark:text-primary-dark dark:hover:bg-red-950",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-sm",
  md: "h-10 gap-2 px-4 text-sm",
};

const BASE_CLASSES =
  "inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

export function buttonClassName(variant: ButtonVariant = "secondary", size: ButtonSize = "md") {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, className, type = "button", ...rest },
  ref,
) {
  const classes = className ? `${buttonClassName(variant, size)} ${className}` : buttonClassName(variant, size);
  return <button ref={ref} type={type} className={classes} {...rest} />;
});
