import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
    isBefore,
    isAfter,
    isWithinInterval
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type DateRange = {
    startDate: string;
    endDate: string;
};

interface CalendarProps {
    mode?: 'single' | 'range';
    selected?: Date | DateRange;
    onSelect: (date: Date | DateRange | undefined) => void;
    className?: string;
    minDate?: Date;
    maxDate?: Date;
}

const Calendar: React.FC<CalendarProps> = ({
    mode = 'single',
    selected,
    onSelect,
    className = '',
    minDate,
    maxDate,
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth)),
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const isSelected = (date: Date) => {
        if (mode === 'single') {
            return selected instanceof Date && isSameDay(date, selected);
        } else {
            const range = selected as DateRange;
            if (!range?.startDate) return false;
            const start = new Date(range.startDate);
            const end = range.endDate ? new Date(range.endDate) : null;

            if (isSameDay(date, start)) return true;
            if (end && isSameDay(date, end)) return true;
            if (end && isWithinInterval(date, { start, end })) return true;

            return false;
        }
    };

    const isRangeStart = (date: Date) => {
        if (mode !== 'range' || !selected) return false;
        const range = selected as DateRange;
        return range.startDate && isSameDay(date, new Date(range.startDate));
    };

    const isRangeEnd = (date: Date) => {
        if (mode !== 'range' || !selected) return false;
        const range = selected as DateRange;
        return range.endDate && isSameDay(date, new Date(range.endDate));
    };

    const isRangeMiddle = (date: Date) => {
        if (mode !== 'range' || !selected) return false;
        const range = selected as DateRange;
        if (!range.startDate || !range.endDate) return false;

        // Check if within interval but IS NOT start or end
        const start = new Date(range.startDate);
        const end = new Date(range.endDate);
        const isIn = isWithinInterval(date, { start, end });
        return isIn && !isSameDay(date, start) && !isSameDay(date, end);
    };

    const isDisabled = (date: Date) => {
        if (minDate && isBefore(date, minDate) && !isSameDay(date, minDate)) return true;
        if (maxDate && isAfter(date, maxDate) && !isSameDay(date, maxDate)) return true;
        return false;
    };

    const handleDayClick = (date: Date) => {
        if (isDisabled(date)) return;

        if (mode === 'single') {
            onSelect(date);
        } else {
            const range = (selected as DateRange) || { startDate: '', endDate: '' };

            if (!range.startDate || (range.startDate && range.endDate)) {
                // Start new range
                onSelect({ startDate: format(date, 'yyyy-MM-dd'), endDate: '' });
            } else {
                // Complete range
                const start = new Date(range.startDate);
                if (isBefore(date, start)) {
                    // Swap if clicked before start
                    onSelect({
                        startDate: format(date, 'yyyy-MM-dd'),
                        endDate: range.startDate
                    });
                } else {
                    onSelect({
                        startDate: range.startDate,
                        endDate: format(date, 'yyyy-MM-dd')
                    });
                }
            }
        }
    };

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className={`p-4 bg-white dark:bg-boxdark rounded-lg ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={prevMonth}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-600 dark:text-gray-400"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="font-semibold text-black dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                    onClick={nextMonth}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-600 dark:text-gray-400"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const disabled = isDisabled(day);
                    const selectedDay = isSelected(day);
                    const rangeStart = isRangeStart(day);
                    const rangeEnd = isRangeEnd(day);
                    const rangeMiddle = isRangeMiddle(day);
                    const isTodayDate = isToday(day);

                    let dayClasses = `
            h-9 w-9 flex items-center justify-center rounded-md text-sm transition-colors relative
            ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600 opacity-50' : 'text-black dark:text-white'}
            ${disabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-meta-4'}
          `;

                    // Range middle styling (background spanning the cell)
                    if (rangeMiddle && !disabled) {
                        dayClasses += ' bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary rounded-none';
                    }

                    // Start and End of range styling
                    if ((rangeStart || rangeEnd) && !disabled) {
                        dayClasses += ' bg-primary text-white hover:bg-primary dark:hover:bg-primary';
                        // Adjust rounding for ranges
                        if (rangeStart && isRangeEnd(day)) {
                            // If it's both start and end (single day range or same day selected twice?)
                            // Just keep full rounded
                        } else if (rangeStart) {
                            dayClasses += ' rounded-r-none';
                        } else if (rangeEnd) {
                            dayClasses += ' rounded-l-none';
                        }
                    }

                    // Single selection styling
                    if (mode === 'single' && selectedDay && !disabled) {
                        dayClasses += ' bg-primary text-white hover:bg-primary dark:hover:bg-primary font-medium';
                    }

                    // Today styling (if not selected)
                    if (isTodayDate && !selectedDay && !rangeMiddle && !disabled) {
                        dayClasses += ' font-bold text-primary';
                    }

                    return (
                        <div key={day.toString()} className="p-0">
                            <button
                                type="button"
                                onClick={() => handleDayClick(day)}
                                disabled={disabled}
                                className={dayClasses}
                            >
                                {format(day, 'd')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
