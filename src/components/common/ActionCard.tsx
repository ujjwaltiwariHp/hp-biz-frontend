import React from 'react';

interface ActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: 'primary' | 'success' | 'warning' | 'danger' | string;
    onClick: () => void;
    buttonText: string;
    disabled?: boolean;
}

// Map color props to Tailwind classes to prevent purging issues (MUST keep this function)
const colorMap = (color: string) => {
    switch (color) {
        case 'primary': return { bg: 'bg-primary', bgOpacity: 'bg-primary/10', borderOpacity: 'border-primary/20', hover: 'hover:bg-primary/90' };
        case 'success': return { bg: 'bg-success', bgOpacity: 'bg-success/10', borderOpacity: 'border-success/20', hover: 'hover:bg-success/90' };
        case 'warning': return { bg: 'bg-warning', bgOpacity: 'bg-warning/10', borderOpacity: 'border-warning/20', hover: 'hover:bg-warning/90' };
        case 'danger': return { bg: 'bg-danger', bgOpacity: 'bg-danger/10', borderOpacity: 'border-danger/20', hover: 'hover:bg-danger/90' };
        default: return { bg: 'bg-gray-500', bgOpacity: 'bg-gray-500/10', borderOpacity: 'border-gray-500/20', hover: 'hover:bg-gray-500/90' };
    }
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon, color, onClick, buttonText, disabled }) => {

    const colors = colorMap(color);

    return (
        <div
            className={`relative rounded-xl border border-stroke p-4 dark:border-strokedark bg-white dark:bg-boxdark shadow-md
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl transition-shadow'} flex flex-col justify-between h-36`}
        >

            {/* FIX: Ensure visibility by using a high-contrast text color that works in light mode */}
            {/* The primary color text ensures it's dark in light mode, and visible in dark mode */}
            <div className={`absolute top-4 right-4 text-primary dark:text-gray-500 opacity-60`}>
                {icon}
            </div>

            {/* TOP SECTION: Title & Description (Flex-grow added to push button down) */}
            <div className="flex-shrink-0 mb-1 flex-grow">
                <h3 className="text-lg font-bold text-black dark:text-white truncate mb-1">{title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-tight min-h-[20px]">
                    {description}
                </p>
            </div>

            {/* BOTTOM SECTION: Button (Full Width) */}
            <div className="flex items-center justify-end flex-shrink-0 mt-2 w-full">

                {/* Button Area (Takes all available space) */}
                <button
                    onClick={onClick}
                    disabled={disabled}
                    // w-full ensures button fills container horizontally
                    className={`${colors.bg} ${colors.hover} disabled:opacity-50 disabled:hover:bg-primary rounded-lg py-2 px-3 text-white transition-colors text-sm font-medium whitespace-nowrap shadow-md hover:shadow-lg w-full`}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export default ActionCard;