import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Typography } from '@/components/common/Typography';

interface GlobalSearchInputProps {
  searchTerm: string;
  onSearchChange: (newSearchTerm: string) => void;
  placeholder?: string;
  debounceDelay?: number;
}

const GlobalSearchInput: React.FC<GlobalSearchInputProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = 'Search all columns...',
  debounceDelay = 300,
}) => {
  const [inputValue, setInputValue] = useState(searchTerm);

  // Sync internal state if external searchTerm changes (e.g., when clearing filters)
  useEffect(() => {
    if (searchTerm !== inputValue) {
      setInputValue(searchTerm);
    }
  }, [searchTerm, inputValue]);

  // Debounce logic using useEffect - This is the core fix
  useEffect(() => {
    // We capture the current input value here
    const currentInput = inputValue;

    const handler = setTimeout(() => {
      // Check if the current debounced value is still the one held by the internal state
      // AND if it differs from the last committed search term (searchTerm from props)
      if (currentInput !== searchTerm) {
        onSearchChange(currentInput);
      }
    }, debounceDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, debounceDelay, onSearchChange, searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Force the search immediately using the current inputValue
      if (inputValue !== searchTerm) {
        onSearchChange(inputValue);
      }
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-stroke py-2.5 pl-10 pr-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary text-sm"
      />
    </div>
  );
};

export default GlobalSearchInput;