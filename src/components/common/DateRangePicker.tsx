// src/components/common/DateRangePicker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';

type DateRange = {
  startDate: string;
  endDate: string;
};

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
    start.setDate(end.getDate() - days);
    setLocalRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  const applyThisMonth = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    setLocalRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  const applyLastMonth = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    const endPrev = new Date(end.getFullYear(), end.getMonth(), 0);
    setLocalRange({
      startDate: start.toISOString().split('T')[0],
      endDate: endPrev.toISOString().split('T')[0],
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
              <input
                type="date"
                aria-label="Start Date"
                value={localRange.startDate}
                onChange={(e) => setLocalRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black dark:text-white outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                aria-label="End Date"
                value={localRange.endDate}
                onChange={(e) => setLocalRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black dark:text-white outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input text-sm"
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