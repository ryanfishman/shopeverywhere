"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder,
  className = "",
}: SearchBarProps) => {
  return (
    <div className={`relative flex-1 group ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:outline-none transition-all duration-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Search className="absolute left-4 top-3 text-white/50 group-focus-within:text-slate-400 h-5 w-5 transition-colors" />
    </div>
  );
};

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const MobileSearchBar = ({
  value,
  onChange,
  placeholder,
}: MobileSearchBarProps) => {
  return (
    <div className="relative flex-1">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:outline-none transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Search className="absolute left-3 top-3 text-white/50 h-5 w-5" />
    </div>
  );
};

