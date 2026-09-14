import React from "react";

export interface ContainerProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  as?: React.ElementType;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = "",
  id,
  as: Component = "div",
}) => {
  return (
    <Component id={id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`.trim()}>
      {children}
    </Component>
  );
};
