import React from "react";
import { Button } from "../ui/Button";

export interface NavActionsProps {
  searchSlot?: React.ReactNode;
  authSlot?: React.ReactNode;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

export const NavActions: React.FC<NavActionsProps> = ({
  searchSlot,
  authSlot,
  onLoginClick,
  onRegisterClick,
}) => {
  return (
    <div className="flex items-center space-x-3">
      {searchSlot && <div className="flex-1 max-w-xs">{searchSlot}</div>}
      
      {authSlot ? (
        authSlot
      ) : (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onLoginClick}>
            Masuk
          </Button>
          <Button variant="primary" size="sm" onClick={onRegisterClick}>
            Daftar
          </Button>
        </div>
      )}
    </div>
  );
};
