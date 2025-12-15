"use client";

import { SearchBar, MobileSearchBar } from "./SearchBar";
import { FilterButton, MobileFilterButton } from "./StoreFilter";

interface SearchWithFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
  filterCount: number;
  placeholder: string;
  filterTitle: string;
}

export const DesktopSearchWithFilter = ({
  searchQuery,
  onSearchChange,
  onFilterClick,
  filterCount,
  placeholder,
  filterTitle,
}: SearchWithFilterProps) => {
  return (
    <div className="hidden md:flex flex-1 max-w-2xl items-center gap-2 relative">
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={placeholder}
      />
      <div className="relative">
        <FilterButton
          onClick={onFilterClick}
          activeCount={filterCount}
          title={filterTitle}
        />
      </div>
    </div>
  );
};

export const MobileSearchWithFilter = ({
  searchQuery,
  onSearchChange,
  onFilterClick,
  filterCount,
  placeholder,
  filterTitle,
}: SearchWithFilterProps) => {
  return (
    <div className="md:hidden p-3 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10">
      <div className="flex items-center gap-2">
        <MobileSearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={placeholder}
        />
        <MobileFilterButton
          onClick={onFilterClick}
          activeCount={filterCount}
          title={filterTitle}
        />
      </div>
    </div>
  );
};



