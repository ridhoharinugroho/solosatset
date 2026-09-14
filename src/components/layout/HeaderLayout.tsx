import React from "react";

export interface HeaderLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export const HeaderLayout: React.FC<HeaderLayoutProps> = ({ children, className = "" }) => {
  return (
    <header className={`w-full ${className}`.trim()}>
      {children}
    </header>
  );
};
