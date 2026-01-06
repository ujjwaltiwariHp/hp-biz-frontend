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

  const isExactActive =
    item.route === pathname || (item.route === '/dashboard' && pathname === '/');

  const isChildActive = item.children?.some(
    (child) =>
      pathname === child.route ||
      pathname.startsWith(child.route) ||
      child.children?.some(
        (nested) =>
          pathname === nested.route || pathname.startsWith(nested.route)
      )
  );

  const isParentHighlighted = !item.children
    ? isExactActive
    : isChildActive && !isOpen;

  useEffect(() => {
    if (!contentSpace.current) return;

    let retryTimeout: NodeJS.Timeout | null = null;
    let rafId1: number | null = null;
    let rafId2: number | null = null;

    const updateHeight = () => {
      if (isOpen && contentSpace.current) {
        const scrollHeight = contentSpace.current.scrollHeight;
        if (scrollHeight > 0) {
          setHeight(`${scrollHeight}px`);
        } else {
          // Retry if content not ready yet
          retryTimeout = setTimeout(() => {
            if (contentSpace.current) {
              setHeight(`${contentSpace.current.scrollHeight}px`);
            }
          }, 50);
        }
      } else {
        setHeight('0px');
      }
    };

    // Use double RAF to ensure DOM is fully rendered
    rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(updateHeight);
    });

    // Also use ResizeObserver to handle dynamic content changes
    const resizeObserver = new ResizeObserver(() => {
      if (isOpen && contentSpace.current) {
        setHeight(`${contentSpace.current.scrollHeight}px`);
      }
    });

    if (contentSpace.current) {
      resizeObserver.observe(contentSpace.current);
    }

    return () => {
      if (rafId1 !== null) cancelAnimationFrame(rafId1);
      if (rafId2 !== null) cancelAnimationFrame(rafId2);
      if (retryTimeout !== null) clearTimeout(retryTimeout);
      resizeObserver.disconnect();
    };
  }, [isOpen, item.children]);

  if (item.children) {
    return (
      <li className="flex flex-col">
        <button
          onClick={() => onToggle(item.route)}
          className={`group relative flex items-center gap-2.5 rounded-lg px-4 py-2.5 font-medium text-base transition-all duration-200 ease-in-out w-full
            ${
              isParentHighlighted
                ? 'bg-sky-500/20 text-white'
                : 'text-bodydark1 hover:text-white'
            }
          `}
        >
          <item.icon
            size={20}
            className={isParentHighlighted ? 'text-sky-400' : 'text-inherit'}
          />

          <span className="flex-1 text-left whitespace-nowrap">
            {item.label}
          </span>

          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />

          {isParentHighlighted && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-md bg-sky-400 shadow-glow"></span>
          )}
        </button>

        <div
          ref={contentSpace}
          style={{ maxHeight: height }}
          className="overflow-hidden transition-all duration-300 ease-in-out"
        >
          <div className="mt-1 flex flex-col gap-1 pl-9 pr-2">
            {item.children.map((child, idx) => {
              const isActive = pathname === child.route;

              return (
                <div key={idx}>
                  <Link
                    href={child.route}
                    className={`relative flex items-center gap-2 rounded-md py-2 px-3 text-base font-medium transition-colors duration-200
                      ${
                        isActive
                          ? 'text-white bg-sky-500/20'
                          : 'text-bodydark2 hover:text-white'
                      }
                    `}
                  >
                    {child.icon && <child.icon size={16} />}
                    <span>{child.label}</span>

                    {isActive && (
                      <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-glow"></span>
                    )}
                  </Link>

                  {child.children && (
                    <div className="mt-1 flex flex-col gap-1 pl-5">
                      {child.children.map((nested, nIdx) => {
                        const nestedActive = pathname === nested.route;

                        return (
                          <Link
                            key={nIdx}
                            href={nested.route}
                            className={`relative flex items-center gap-2 rounded-md py-2 px-3 text-sm font-medium transition-colors duration-200
                              ${
                                nestedActive
                                  ? 'text-white bg-sky-500/20'
                                  : 'text-bodydark2 hover:text-white'
                              }
                            `}
                          >
                            {nested.icon && <nested.icon size={14} />}
                            <span>{nested.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.route}
        className={`group relative flex items-center gap-2.5 rounded-lg px-4 py-2.5 font-medium text-base transition-all duration-200 ease-in-out
          ${
            isExactActive
              ? 'bg-sky-500/20 text-white'
              : 'text-bodydark1 hover:text-white'
          }
        `}
      >
        <item.icon
          size={20}
          className={isExactActive ? 'text-sky-400' : 'text-inherit'}
        />
        <span>{item.label}</span>

        {isExactActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-md bg-sky-400 shadow-glow"></span>
        )}
      </Link>
    </li>
  );
};

export default SidebarItem;