import React, { forwardRef, useRef } from 'react';
import { Search, X, Loader, AlertCircle } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSearchSubmit?: () => void; // New prop for handling Enter key press
  isLoading?: boolean;
  error?: string;
  minLength?: number;
  disabled?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  onSearchSubmit,
  isLoading = false,
  error,
  minLength = 3,
  disabled = false,
}, ref) => {
  // Internal ref to manage cursor position during rapid input (a common React fix)
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Save current cursor position before state update
    const caretPos = e.target.selectionStart;

    // Pass the new value up
    onChange(e.target.value);

    // Reapply focus and cursor position after state update, if possible
    setTimeout(() => {
        if (inputRef.current && caretPos !== null) {
            inputRef.current.selectionStart = caretPos;
            inputRef.current.selectionEnd = caretPos;
            inputRef.current.focus();
        }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      // Prevent form submission if the SearchInput is part of a form
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />

      <input
        ref={(el) => {
          (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        // Retain compact styling
        className={`w-full rounded border ${
          error ? 'border-danger' : 'border-stroke'
        } py-2 pl-10 pr-10 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />

      {isLoading && (
        <Loader className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" size={18} />
      )}

      {!isLoading && value.length > 0 && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          type="button"
        >
          <X size={18} />
        </button>
      )}

      {error && (
        <div className="absolute top-full mt-1 text-xs text-danger flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {value.length > 0 && value.length < minLength && (
        <div className="absolute top-full mt-1 text-xs text-gray-500">
          Minimum {minLength} characters required
        </div>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;