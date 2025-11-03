"use client";

import React from "react";
import { AlertTriangle, Trash2, CheckCircle, Info, XCircle, X } from "lucide-react";

type DialogType = "danger" | "warning" | "success" | "info";

interface ConfirmDialogProps {
  isOpen: boolean;
  type?: DialogType;
  title?: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const dialogConfig = {
  danger: {
    icon: Trash2,
    iconColor: "text-danger",
    iconBg: "bg-danger/10",
    confirmBg: "bg-danger hover:bg-danger/90",
    borderColor: "border-danger/20",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-warning",
    iconBg: "bg-warning/10",
    confirmBg: "bg-warning hover:bg-warning/90",
    borderColor: "border-warning/20",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-success",
    iconBg: "bg-success/10",
    confirmBg: "bg-success hover:bg-success/90",
    borderColor: "border-success/20",
  },
  info: {
    icon: Info,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    confirmBg: "bg-primary hover:bg-primary/90",
    borderColor: "border-primary/20",
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  type = "warning",
  title = "Are you sure?",
  message = "This action cannot be undone.",
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  children,
}) => {
  // Prevent background scroll when dialog is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const config = dialogConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      className="fixed inset-0 z-999999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className={`relative w-full max-w-md rounded-lg border ${config.borderColor} bg-white dark:bg-boxdark shadow-xl transform transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-black dark:hover:text-white transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          disabled={isLoading}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`mx-auto w-16 h-16 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}>
            <IconComponent className={`${config.iconColor}`} size={32} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>

          {/* Children Content */}
          {children && (
            <div className="mt-4 mb-6">{children}</div>
          )}


          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-medium border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-50 dark:hover:bg-meta-4 text-black dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-6 py-2.5 text-sm font-medium ${config.confirmBg} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Loading...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;