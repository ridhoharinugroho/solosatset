import React from "react";

export interface StatusBadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "default";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = "default",
  className = "",
}) => {
  const variantClasses: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    default: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const badgeClass = variantClasses[variant] || variantClasses.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass} ${className}`.trim()}
    >
      {label}
    </span>
  );
};
