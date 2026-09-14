import React from "react";
import { HeaderLayout } from "./HeaderLayout";
import { Container } from "../ui/Container";

export interface AppShellProps {
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  headerSlot,
  footerSlot,
  children,
  className = "",
}) => {
  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 text-gray-900 ${className}`.trim()}>
      {headerSlot && <HeaderLayout>{headerSlot}</HeaderLayout>}
      
      <main className="flex-1 w-full">
        <Container className="py-6">
          {children}
        </Container>
      </main>

      {footerSlot && (
        <footer className="w-full bg-white border-t border-gray-200 py-6 mt-auto">
          <Container>
            {footerSlot}
          </Container>
        </footer>
      )}
    </div>
  );
};
