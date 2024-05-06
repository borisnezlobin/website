const Badge = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      {...props}
      className={`inline-flex items-center px-2.5 py-1 md:py-0.5 rounded-full text-sm font-medium bg-primary text-light dark:bg-primary-dark dark:text-black ${props.className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
