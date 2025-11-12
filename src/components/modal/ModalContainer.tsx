import React from 'react';
import { X } from 'lucide-react';
import ClickOutside from '@/components/ClickOutside';
import { CardTitle } from '@/components/common/Typography';

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
};

export const ModalContainer: React.FC<ModalContainerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/600 backdrop-blur-sm p-4">

      {/* Removed w-full from ClickOutside to allow centering */}
      <ClickOutside onOutsideClick={onClose}>
        <div

          className={`w-full ${sizeClasses[size]} rounded-xl bg-white dark:bg-boxdark max-h-[90vh] overflow-y-auto transform transition-all duration-300 shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke bg-white dark:border-strokedark dark:bg-boxdark px-6 py-4">
            <CardTitle as="h3" className="truncate mr-4">
              {title}
            </CardTitle>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-500 hover:text-black dark:hover:text-white p-1 flex-shrink-0 transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 w-full">
            {children}
          </div>
        </div>
      </ClickOutside>
    </div>
  );
};