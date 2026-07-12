interface BadgeProps {
  variant: "success" | "warning" | "danger" | "ORM" | "GP2" | "laptop" | "desktop";
  children: React.ReactNode;
}

export default function Badge({ variant, children }: BadgeProps) {
  const colors = {
    success: "bg-green-100 text-green-700 border border-green-200",
    warning: "bg-orange-100 text-orange-700 border border-orange-200",
    danger: "bg-red-100 text-red-700 border border-red-200",
    ORM: "bg-blue-100 text-blue-700 border border-blue-200",
    GP2: "bg-blue-100 text-dark-900 border border-blue-200",
    laptop: "bg-blue-100 text-dark-900 border border-blue-200",
    desktop: "bg-blue-100 text-dark-900 border border-blue-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${colors[variant]}`}
    >
      {children}
    </span>
  );
}
