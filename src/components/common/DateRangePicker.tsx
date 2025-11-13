'use client';

import React from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';

type DateRange = {
  startDate: string;
  endDate: string;
};

interface Props {
  isOpen: boolean;
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  onClose: () => void;
}

export const DateRangePicker: React.FC<Props> = ({ isOpen, dateRange, setDateRange, onClose }) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  const clearRange = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl border border-stroke bg-white dark:bg-boxdark dark:border-strokedark shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-lg text-gray-600 hover:text-black dark:hover:text-white">
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">Select Date Range</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose a custom date range or pick a preset</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <label className="flex flex-col">
            <span className="text-xs text-gray-600 dark:text-gray-300 mb-1">Start Date</span>
            <input
              type="date"
              aria-label="Start Date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 text-black dark:text-white outline-none text-sm"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-xs text-gray-600 dark:text-gray-300 mb-1">End Date</span>
            <input
              type="date"
              aria-label="End Date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 text-black dark:text-white outline-none text-sm"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => applyPreset(7)} className="px-3 py-2 rounded-lg border border-stroke text-sm hover:bg-gray-50 dark:hover:bg-meta-4">Last 7 days</button>
          <button onClick={() => applyPreset(30)} className="px-3 py-2 rounded-lg border border-stroke text-sm hover:bg-gray-50 dark:hover:bg-meta-4">Last 30 days</button>
          <button onClick={() => applyPreset(90)} className="px-3 py-2 rounded-lg border border-stroke text-sm hover:bg-gray-50 dark:hover:bg-meta-4">Last 90 days</button>
          <button onClick={() => { const end = new Date(); const start = new Date(end.getFullYear(), end.getMonth(), 1); setDateRange({ startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }); }} className="px-3 py-2 rounded-lg border border-stroke text-sm hover:bg-gray-50 dark:hover:bg-meta-4">This month</button>
          <button onClick={() => { const end = new Date(); const start = new Date(end.getFullYear(), end.getMonth() - 1, 1); const endPrev = new Date(end.getFullYear(), end.getMonth(), 0); setDateRange({ startDate: start.toISOString().split('T')[0], endDate: endPrev.toISOString().split('T')[0] }); }} className="px-3 py-2 rounded-lg border border-stroke text-sm hover:bg-gray-50 dark:hover:bg-meta-4">Last month</button>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={clearRange} className="px-4 py-2 rounded-lg border border-stroke text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-meta-4">Clear</button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-stroke text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-meta-4">Cancel</button>
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-primary text-white text-sm">Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
