import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Typography } from "@/components/common/Typography"; // Import Typography

const SidebarDropdown = ({ item }: any) => {
  const pathname = usePathname();

  return (
    <>
      <ul className="mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
        {item.map((item: any, index: number) => (
          <li key={index}>
            <Link
              href={item.route}
              // Removed all text-related classes from here
              className={`group relative flex items-center gap-2.5 rounded-md px-4 duration-300 ease-in-out`}
            >
              {/* Wrapped item.label in Typography and passed all text classes, including hover/active state */}
              <Typography
                as="span"
                variant="body" // arbitrary base variant
                className={`font-medium text-bodydark2 group-hover:text-white ${
                  pathname === item.route ? "text-white" : ""
                }`}
              >
                {item.label}
              </Typography>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};

export default SidebarDropdown;