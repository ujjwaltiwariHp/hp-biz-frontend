"use client";

import React from "react";
import StandardSearchInput from "@/components/common/StandardSearchInput";
import { Filter, X } from "lucide-react";
import { Typography } from "@/components/common/Typography";
import DateRangePicker from "@/components/common/DateRangePicker";

export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    value: string;
    options?: FilterOption[];
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    type?: 'select' | 'input'; // Support input type for things like 'Resource Type' text filter
}

export interface TableToolbarProps {
    searchConfig?: {
        value: string;
        onChange: (value: string) => void;
        onSearch: () => void;
        onClear: () => void;
        placeholder?: string;
        isLoading?: boolean;
    };
    filterConfigs?: FilterConfig[];
    dateRangeConfig?: {
        value: { startDate: string; endDate: string };
        onChange: (range: { startDate: string; endDate: string }) => void; // Used for state update
        onApply: (range: { startDate: string; endDate: string }) => void; // Used for API call
    };
    activeFilters?: {
        count: number;
        filters: Array<{
            key: string;
            label: string;
            value: string | number;
        }>;
        onClearAll: () => void;
    };
    renderRightSide?: () => React.ReactNode;
    className?: string;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
    searchConfig,
    filterConfigs = [],
    dateRangeConfig,
    activeFilters,
    renderRightSide,
    className = "",
}) => {
    const [showDatePicker, setShowDatePicker] = React.useState(false);

    return (
        <div className={`px-4 md:px-6 xl:px-7.5 py-6 bg-gray-50 dark:bg-meta-4 border-b border-stroke dark:border-strokedark ${className}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Search Section - Takes 2 columns usually, or full width if no other filters */}
                {searchConfig && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Typography variant="label" as="span">Search</Typography>
                        </label>
                        <StandardSearchInput
                            value={searchConfig.value}
                            onChange={searchConfig.onChange}
                            onSearch={searchConfig.onSearch}
                            onClear={searchConfig.onClear}
                            placeholder={searchConfig.placeholder || "Search..."}
                            isLoading={searchConfig.isLoading}
                        />
                    </div>
                )}

                {/* Dynamic Filters */}
                {filterConfigs.map((config) => (
                    <div key={config.key} className={config.className || ""}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Typography variant="label" as="span">{config.label}</Typography>
                        </label>
                        {config.type === 'input' ? (
                            <input
                                type="text"
                                placeholder={config.placeholder}
                                value={config.value}
                                onChange={(e) => config.onChange(e.target.value)}
                                className="w-full h-11 rounded border border-stroke py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary text-sm"
                            />
                        ) : (
                            <div className="relative z-20 bg-white dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
                                <select
                                    value={config.value}
                                    onChange={(e) => config.onChange(e.target.value)}
                                    className="relative z-20 w-full appearance-none rounded border-none bg-transparent py-2.5 px-4 h-11 outline-none transition focus:border-primary active:border-primary dark:bg-boxdark dark:text-white text-sm"
                                >
                                    {config.options?.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <g opacity="0.8">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="#637381"></path>
                                        </g>
                                    </svg>
                                </span>
                            </div>
                        )}

                    </div>
                ))}

                {/* Date Range Filter */}
                {dateRangeConfig && (
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Typography variant="label" as="span">Date Range</Typography>
                        </label>
                        <button
                            onClick={() => setShowDatePicker(true)}
                            className="flex items-center justify-between w-full h-11 px-4 text-sm border border-stroke bg-white dark:bg-boxdark rounded dark:border-strokedark transition-colors text-left"
                        >
                            <span className="truncate text-black dark:text-white">
                                {dateRangeConfig.value.startDate && dateRangeConfig.value.endDate
                                    ? `${dateRangeConfig.value.startDate} - ${dateRangeConfig.value.endDate}`
                                    : 'Select dates'}
                            </span>
                            <Filter size={16} className="text-gray-500 flex-shrink-0" />
                        </button>
                        <DateRangePicker
                            isOpen={showDatePicker}
                            dateRange={dateRangeConfig.value}
                            setDateRange={dateRangeConfig.onChange}
                            onClose={() => setShowDatePicker(false)}
                            onApply={(range) => {
                                dateRangeConfig.onApply(range);
                                setShowDatePicker(false);
                            }}
                        />
                    </div>
                )}

                {/* Render Right Side (Custom Actions) */}
                {renderRightSide && (
                    <div className={`flex items-end justify-end ${!searchConfig && filterConfigs.length === 0 && !dateRangeConfig ? 'col-span-full' : ''}`}>
                        {renderRightSide()}
                    </div>
                )}
            </div>

            {/* Active Filters Display */}
            {activeFilters && activeFilters.count > 0 && (
                <div className="mt-4 flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-primary">
                            Active Filters ({activeFilters.count}):
                        </span>
                        {activeFilters.filters.map((filter) => (
                            <span key={filter.key} className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-boxdark rounded text-xs border border-stroke dark:border-strokedark">
                                {filter.label}: {filter.value}
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={activeFilters.onClearAll}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    >
                        <X size={16} />
                        Clear All
                    </button>
                </div>
            )}
        </div>
    );
};

export default TableToolbar;
