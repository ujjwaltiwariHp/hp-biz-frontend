'use client';
import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { MenuItem } from './menuItems';

interface SidebarItemProps {
  item: MenuItem;
  isOpen: boolean;
  onToggle: (route: string) => void;
}

const SidebarItem = ({ item, isOpen, onToggle }: SidebarItemProps) => {
  const pathname = usePathname();
  const contentSpace = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState('0px');

  // 1. Check if this specific item is the current page
  const isExactActive = item.route === pathname || (item.route === '/dashboard' && pathname === '/');

  // 2. Check if any child is active
  const isChildActive = item.children?.some((child) => pathname === child.route || pathname.startsWith(child.route));

  // 3. Highlight Parent ONLY if collapsed and active (Show "You are here" marker)
  const isParentHighlighted = !item.children
    ? isExactActive
    : (isChildActive && !isOpen);

  // Handle Height Animation
  useEffect(() => {
    if (isOpen && contentSpace.current) {
      setHeight(`${contentSpace.current.scrollHeight}px`);
    } else {
      setHeight('0px');
    }
  }, [isOpen]);

  // --- RENDER: DROPDOWN PARENT ---
  if (item.children) {
    return (
      <li className="flex flex-col">
        <button
          onClick={() => onToggle(item.route)}
          className={`group relative flex items-center gap-2.5 rounded-lg px-4 py-2.5 font-medium text-sm transition-all duration-200 ease-in-out w-full
            ${isParentHighlighted
              ? "bg-sky-500/20 text-white" // Active (Collapsed): Blue BG
              : "text-bodydark1 hover:text-white" // Inactive/Open: No BG, just text color hover
            }
          `}
        >
          <item.icon size={20} className={isParentHighlighted ? 'text-sky-400' : 'text-inherit'} />

          <span className="flex-1 text-left whitespace-nowrap">
            {item.label}
          </span>

          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />

          {/* Active Bar Indicator (Only when closed & active) */}
          {isParentHighlighted && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-md bg-sky-400 shadow-glow"></span>
          )}
        </button>

        {/* Dropdown Content */}
        <div
          ref={contentSpace}
          style={{ maxHeight: height }}
          className="overflow-hidden transition-all duration-300 ease-in-out"
        >
          <div className="mt-1 flex flex-col gap-1 pl-9 pr-2">
            {item.children.map((child, idx) => {
              const isActive = pathname === child.route;
              return (
                <Link
                  key={idx}
                  href={child.route}
                  className={`relative flex items-center gap-2 rounded-md py-2 px-3 text-sm font-medium transition-colors duration-200
                    ${isActive
                      ? "text-white bg-sky-500/20"  // Active Child: Blue BG
                      : "text-bodydark2 hover:text-white" // Inactive Child: No BG, just text hover
                    }
                  `}
                >
                  {child.icon && <child.icon size={16} />}
                  <span>{child.label}</span>

                  {/* Child Active Dot */}
                  {isActive && (
                    <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-glow"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </li>
    );
  }

  // --- RENDER: SINGLE LINK ---
  return (
    <li>
      <Link
        href={item.route}
        className={`group relative flex items-center gap-2.5 rounded-lg px-4 py-2.5 font-medium text-sm transition-all duration-200 ease-in-out
          ${isExactActive
            ? "bg-sky-500/20 text-white"
            : "text-bodydark1 hover:text-white" // No BG on hover
          }
        `}
      >
        <item.icon size={20} className={isExactActive ? 'text-sky-400' : 'text-inherit'} />
        <span>{item.label}</span>

        {isExactActive && (
           <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-md bg-sky-400 shadow-glow"></span>
        )}
      </Link>
    </li>
  );
};

export default SidebarItem;