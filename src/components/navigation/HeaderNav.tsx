import React from "react";
import { Container } from "../ui/Container";
import { NavBrand } from "./NavBrand";
import { NavActions } from "./NavActions";

export interface HeaderNavProps {
  brandProps?: React.ComponentProps<typeof NavBrand>;
  actionsProps?: React.ComponentProps<typeof NavActions>;
  className?: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  brandProps,
  actionsProps,
  className = "",
}) => {
  return (
    <nav className={`bg-white border-b border-gray-200 sticky top-0 z-40 ${className}`.trim()}>
      <Container className="h-16 flex items-center justify-between">
        <NavBrand {...brandProps} />
        <NavActions {...actionsProps} />
      </Container>
    </nav>
  );
};
