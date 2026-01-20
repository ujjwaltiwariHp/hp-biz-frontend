'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';

interface StandardSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value?: string) => void;
  onClear?: () => void;
  placeholder?: string;
  minLength?: number;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  debounceMs?: number;
}


export const StandardSearchInput: React.FC<StandardSearchInputProps> = ({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search...',
  minLength = 3,
  isLoading = false,
  disabled = false,
  className = '',
  debounceMs = 500,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const triggerSearch = (val: string) => {
    if (val.length === 0 || val.length >= minLength) {
      onSearch(val);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);

    // Debounce Logic
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      triggerSearch(newValue);
    }, debounceMs);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Clear pending debounce and trigger immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      triggerSearch(localValue);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (onClear) {
      onClear();
    }
    inputRef.current?.focus();
  };

  const showMinLengthWarning = localValue.length > 0 && localValue.length < minLength;

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon or Loading Spinner */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors text-gray-400">
        {isLoading ? (
          <Loader className="animate-spin text-primary" size={18} />
        ) : (
          <Search size={18} />
        )}
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full rounded-lg border ${showMinLengthWarning ? 'border-warning' : 'border-stroke'
          } py-2.5 pl-10 pr-10 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary text-sm ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : ''
          }`}
      />

      {/* Right Actions - Only Clear Button Now */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {/* Clear Button */}
        {!isLoading && localValue.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-gray-400 hover:text-danger rounded-md hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Validation Message - Optional, kept discrete */}
      {showMinLengthWarning && (
        <div className="absolute top-full mt-1 text-xs text-warning">
          Type at least {minLength} characters...
        </div>
      )}
    </div>
  );
};

export default StandardSearchInput;