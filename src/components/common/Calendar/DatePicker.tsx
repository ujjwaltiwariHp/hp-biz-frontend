import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import Calendar from './Calendar';
import ClickOutside from '../../ClickOutside'; // Assuming ClickOutside is in components/ClickOutside.tsx based on previous ls
import { format, isValid, parseISO } from 'date-fns';

interface DatePickerProps {
    value: string; // ISO string 'yyyy-MM-dd'
    onChange: (dateObj: { target: { name: string; value: string } }) => void; // Mimic event object for easier drop-in replacement
    name: string;
    label?: string;
    placeholder?: string;
    minDate?: string;
    maxDate?: string;
    className?: string;
    disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    name,
    label,
    placeholder = 'Select date',
    minDate,
    maxDate,
    className = '',
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Helper to format date for display
    const displayValue = value ? format(parseISO(value), 'MMM dd, yyyy') : '';

    const handleDateSelect = (date: Date | any) => {
        if (date instanceof Date) {
            const dateString = format(date, 'yyyy-MM-dd');
            // Create a fake event object to maintain compatibility with existing handlers
            onChange({ target: { name, value: dateString } });
            setIsOpen(false);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange({ target: { name, value: '' } });
    };

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
            )}

            <ClickOutside onOutsideClick={() => setIsOpen(false)} className="relative">
                <div
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={`
            w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 
            text-black dark:text-white outline-none transition focus:border-primary 
            dark:border-form-strokedark dark:bg-form-input
            flex items-center justify-between cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-meta-4' : ''}
            ${isOpen ? 'border-primary dark:border-primary' : ''}
          `}
                >
                    <div className="flex items-center gap-2 flex-1">
                        <CalendarIcon size={20} className="text-gray-500 dark:text-gray-400" />
                        <span className={`${!value ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                            {displayValue || placeholder}
                        </span>
                    </div>

                    {value && !disabled && (
                        <button
                            onClick={handleClear}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-500"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {isOpen && !disabled && (
                    <div className="absolute z-9999 mt-2 p-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 left-0 sm:left-auto">
                        <Calendar
                            mode="single"
                            selected={value ? parseISO(value) : undefined}
                            onSelect={handleDateSelect}
                            minDate={minDate ? parseISO(minDate) : undefined}
                            maxDate={maxDate ? parseISO(maxDate) : undefined}
                        />
                    </div>
                )}
            </ClickOutside>
        </div>
    );
};

export default DatePicker;
