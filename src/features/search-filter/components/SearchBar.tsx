import React from "react";
import { Button } from "../../../components/ui/Button";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Cari barang, motor, HP, elektronik...",
  onClear,
  className = "",
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`.trim()}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
        🔍
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-20 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          className="absolute right-14 text-xs font-semibold text-gray-400 hover:text-gray-600 px-1"
        >
          ✕
        </button>
      )}
      <Button
        variant="primary"
        size="sm"
        className="absolute right-1.5 rounded-lg px-3 py-1.5"
      >
        Cari
      </Button>
    </div>
  );
};
