'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ClickOutside from '@/components/ClickOutside';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full m-4',
};

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <ClickOutside onOutsideClick={onClose} className="w-full h-full flex items-center justify-center pointer-events-none">
                <div
                    className={`relative w-full ${sizeClasses[size]} rounded-xl bg-white dark:bg-boxdark max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto transform transition-all duration-300 ease-in-out`}
                    role="dialog"
                    aria-modal="true"
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke bg-white dark:border-strokedark dark:bg-boxdark px-6 py-4">
                            {title && (
                                <h3 className="text-xl font-semibold text-black dark:text-white truncate mr-4">
                                    {title}
                                </h3>
                            )}
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-black dark:hover:text-white p-1 rounded-lg transition-colors ml-auto"
                                >
                                    <X size={24} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </ClickOutside>
        </div>,
        document.body
    );
};

export default Modal;
