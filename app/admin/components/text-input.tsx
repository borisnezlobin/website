import { forwardRef } from "react";

export const TEXT_INPUT_CLASSES =
  "h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-light placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-dark";

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    const classes = className ? `${TEXT_INPUT_CLASSES} ${className}` : TEXT_INPUT_CLASSES;
    return <input ref={ref} className={classes} {...rest} />;
  },
);
