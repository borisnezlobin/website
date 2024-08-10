const Badge = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      {...props}
      className={`inline-flex items-center px-2.5 py-1 md:py-0.5 print:p-0 rounded-full text-sm font-medium bg-primary-light-bg text-light dark:bg-primary-dark dark:text-dark-background ${props.className} print:text-muted print:bg-transparent`}
    >
      {children}
    </span>
  );
};

export default Badge;
