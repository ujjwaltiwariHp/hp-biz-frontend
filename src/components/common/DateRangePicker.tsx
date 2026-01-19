// src/components/common/DateRangePicker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';
import { DateRange } from './Calendar/Calendar';
import DatePicker from './Calendar/DatePicker';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  onClose: () => void;
  onApply?: (range: DateRange) => void;
}

export const DateRangePicker: React.FC<Props> = ({
  isOpen,
  dateRange,
  setDateRange,
  onClose,
  onApply
}) => {
  const [localRange, setLocalRange] = useState<DateRange>(dateRange);

  useEffect(() => {
    if (isOpen) {
      setLocalRange(dateRange);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, dateRange]);

  if (!isOpen) return null;

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1)); // Inclusive
    setLocalRange({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    });
  };

  const applyThisMonth = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    setLocalRange({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
    });
  };

  const applyLastMonth = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    const endPrev = new Date(end.getFullYear(), end.getMonth(), 0);
    setLocalRange({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(endPrev, 'yyyy-MM-dd'),
    });
  };

  const clearRange = () => {
    setLocalRange({ startDate: '', endDate: '' });
  };

  const handleApply = () => {
    setDateRange(localRange);
    if (onApply) {
      onApply(localRange);
    }
    onClose();
  };

  const handleCancel = () => {
    setLocalRange(dateRange);
    onClose();
  };

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setLocalRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isValidRange = localRange.startDate && localRange.endDate &&
    new Date(localRange.startDate) <= new Date(localRange.endDate);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleCancel}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-stroke bg-white dark:bg-boxdark dark:border-strokedark shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white">Select Date Range</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose dates for filtering</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg text-gray-600 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <DatePicker
                name="startDate"
                value={localRange.startDate}
                onChange={handleChange}
                placeholder="Select start date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <DatePicker
                name="endDate"
                value={localRange.endDate}
                onChange={handleChange}
                placeholder="Select end date"
              />
            </div>
          </div>

          {/* Validation Message */}
          {localRange.startDate && localRange.endDate && !isValidRange && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-2">
              <X size={16} />
              <span>End date must be after start date</span>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Select
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(7)}
                className="px-3 py-2 rounded-lg border border-stroke text-sm hover:bg-primary hover:text-white hover:border-primary dark:border-strokedark dark:hover:bg-primary transition-colors"
              >
                Last 7 days
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="px-3 py-2 rounded-lg border border-stroke text-sm hover:bg-primary hover:text-white hover:border-primary dark:border-strokedark dark:hover:bg-primary transition-colors"
              >
                Last 30 days
              </button>
              <button
                type="button"
                onClick={() => applyPreset(90)}
                className="px-3 py-2 rounded-lg border border-stroke text-sm hover:bg-primary hover:text-white hover:border-primary dark:border-strokedark dark:hover:bg-primary transition-colors"
              >
                Last 90 days
              </button>
              <button
                type="button"
                onClick={applyThisMonth}
                className="px-3 py-2 rounded-lg border border-stroke text-sm hover:bg-primary hover:text-white hover:border-primary dark:border-strokedark dark:hover:bg-primary transition-colors"
              >
                This month
              </button>
              <button
                type="button"
                onClick={applyLastMonth}
                className="px-3 py-2 rounded-lg border border-stroke text-sm hover:bg-primary hover:text-white hover:border-primary dark:border-strokedark dark:hover:bg-primary transition-colors"
              >
                Last month
              </button>
              <button
                type="button"
                onClick={clearRange}
                className="px-3 py-2 rounded-lg border border-stroke text-sm text-danger hover:bg-danger/10 hover:border-danger dark:border-strokedark transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4 rounded-b-2xl">
          <button
            type="button"
            onClick={clearRange}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-boxdark transition-colors"
          >
            Clear Selection
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-lg border border-stroke text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 dark:border-strokedark transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!isValidRange}
              className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default DateRangePicker;