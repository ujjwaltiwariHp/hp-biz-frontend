import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LucideIcon } from 'lucide-react';

interface DropdownItem {
  label: string;
  route: string;
  icon: LucideIcon;
  isActive?: boolean;
}

interface SidebarDropdownProps {
  label: string;
  icon: LucideIcon;
  items: DropdownItem[];
  defaultOpen: boolean;
}

const SidebarDropdown = ({ label, icon: Icon, items, defaultOpen }: SidebarDropdownProps) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setOpen(!open);
  };

  const isParentActive = items.some(item => item.isActive);

  return (
    <li>
      <Link
        href="#"
        onClick={handleClick}
        className={`group relative flex items-center gap-3 rounded-lg py-2.5 px-4 font-medium duration-200 ease-in-out
          ${isParentActive || open
            ? 'bg-sky-500/20 text-white' // Parent Active/Open: Light Blue BG, White Text
            : 'text-white hover:bg-white/5' // Inactive: White Text
          }
        `}
      >
        <Icon size={20} className="text-white transition-colors duration-200" />

        <span className="text-sm font-medium flex-1">{label}</span>

        <ChevronDown
          size={16}
          className={`transition-transform duration-300 ease-in-out text-white ${
            open ? 'rotate-180' : ''
          }`}
        />

        {/* Parent Active Indicator */}
        {isParentActive && (
             <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-md bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></span>
        )}
      </Link>

      {/* Dropdown Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        {/* Removed border-l (straight line) as requested */}
        <div className="flex flex-col gap-1 pl-4">
          {items.map((subItem, index) => (
            <Link
              key={index}
              href={subItem.route}
              className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm duration-200 ease-in-out
                ${subItem.isActive
                  ? 'text-white bg-sky-500/20' // Sub-item Active: Blue BG, White Text
                  : 'text-white/70 hover:text-white hover:bg-white/5' // Sub-item Inactive: White-ish text
                }
              `}
            >
              <subItem.icon size={16} className={`flex-shrink-0 transition-colors ${subItem.isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />

              <span className={`transition-transform duration-200 ${subItem.isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                  {subItem.label}
              </span>

              {/* Active Dot */}
              {subItem.isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]"></span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </li>
  );
};

export default SidebarDropdown;