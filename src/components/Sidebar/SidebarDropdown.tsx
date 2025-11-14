import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Typography } from "@/components/common/Typography";
import { ChevronDown, LucideIcon } from 'lucide-react';

interface DropdownItem {
  label: string;
  route: string;
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

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setOpen(!open);
  };

  return (
    <li className='relative'>
      <Link
        href="#"
        onClick={handleClick}
        className={`group relative flex items-center gap-2.5 rounded-lg py-3 px-4 font-medium duration-300 ease-in-out transition-colors
          ${open
            ? 'bg-primary text-white dark:bg-primary dark:text-white shadow-md'
            : 'text-bodydark1 hover:bg-gray-800 dark:hover:bg-meta-4'
          }
        `}
      >
        <Icon size={18} />
        <Typography as="span" variant="body1" className="text-inherit">
          {label}
        </Typography>
        <ChevronDown
          size={16}
          className={`absolute right-4 top-1/2 -translate-y-1/2 text-white transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </Link>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <ul className="mb-6 mt-4 flex flex-col gap-2.5 pl-6">
          {items.map((subItem, index) => (
            <li key={index}>
              <Link
                href={subItem.route}
                className={`group relative flex items-center gap-2.5 rounded-md px-4 duration-300 ease-in-out`}
              >
                <Typography
                  as="span"
                  variant="body"
                  className={`font-medium text-bodydark2 group-hover:text-white ${
                    subItem.isActive ? "text-white" : ""
                  }`}
                >
                  {subItem.label}
                </Typography>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
};

export default SidebarDropdown;