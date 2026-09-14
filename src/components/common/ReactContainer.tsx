import React from "react";

export interface ReactContainerProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

export const ReactContainer: React.FC<ReactContainerProps> = ({ children, className = "", id }) => {
  return (
    <div id={id} className={`sopaloka-react-container ${className}`.trim()}>
      {children}
    </div>
  );
};
