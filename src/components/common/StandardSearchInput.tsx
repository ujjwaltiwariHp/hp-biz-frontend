'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';

interface StandardSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear?: () => void;
  placeholder?: string;
  minLength?: number;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * StandardSearchInput - A reusable search component that:
 * 1. Only triggers search on Enter key press or Search button click
 * 2. Shows validation for minimum length
 * 3. Provides clear functionality
 * 4. Shows loading state
 */
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
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSearch = () => {
    // Prevent search if value is less than minLength
    if (localValue.length > 0 && localValue.length < minLength) {
      return;
    }
    onSearch();
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
  const canSearch = localValue.length === 0 || localValue.length >= minLength;

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <Search
        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
          isLoading ? 'text-primary animate-pulse' : 'text-gray-400'
        }`}
        size={18}
      />

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled || isLoading}
        className={`w-full rounded-lg border ${
          showMinLengthWarning ? 'border-warning' : 'border-stroke'
        } py-2.5 pl-10 pr-20 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary text-sm ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : ''
        }`}
      />

      {/* Right Actions */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="p-1.5">
            <Loader className="animate-spin text-primary" size={16} />
          </div>
        )}

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

        {/* Search Button */}
        {!isLoading && (
          <button
            type="button"
            onClick={handleSearch}
            disabled={!canSearch || disabled}
            className={`p-1.5 rounded-md transition-colors ${
              canSearch && !disabled
                ? 'text-primary hover:bg-primary/10'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title={canSearch ? 'Search (Enter)' : `Minimum ${minLength} characters`}
          >
            <Search size={16} />
          </button>
        )}
      </div>

      {/* Validation Message */}
      {showMinLengthWarning && (
        <div className="absolute top-full mt-1 text-xs text-warning flex items-center gap-1">
          <span>Minimum {minLength} characters required</span>
        </div>
      )}

      {/* Helper Text */}
      {!showMinLengthWarning && localValue.length === 0 && (
        <div className="absolute top-full mt-1 text-xs text-gray-500">
          Press Enter to search
        </div>
      )}
    </div>
  );
};

export default StandardSearchInput;