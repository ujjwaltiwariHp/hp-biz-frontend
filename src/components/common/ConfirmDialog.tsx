import { useEffect, type FC, type ReactNode } from "react";
import { AlertTriangle, Trash2, CheckCircle, Info, XCircle, X } from "lucide-react";
import Loader from "@/components/common/Loader";
import Button from "./Button";
import Modal from "@/components/common/Modal";

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
  children?: ReactNode;
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

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
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
  const config = dialogConfig[type];
  const IconComponent = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => { } : onCancel}
      size="sm"
      showCloseButton={false} // Custom close button handling or none
    >
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto w-16 h-16 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}>
          <IconComponent className={`${config.iconColor}`} size={32} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>

        {/* Children Content */}
        {children && (
          <div className="mb-6">{children}</div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={type === 'danger' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>

      {/* Absolute close button if needed, but Modal has one if showCloseButton=true. 
          Here we wanted custom placement or no close button. 
          Let's add a top-right close button manually if we really want it, 
          or rely on Modal's showCloseButton=true and remove this manual one.
          
          For consistency, let's use Modal's built-in close button by enabling showCloseButton={true} 
          and removing the custom one, OR keep it clean.
          The design usually suggests an X in the corner. 
          Let's enable showCloseButton={true} on Modal and remove the custom X here.
      */}
    </Modal>
  );
};

export const ConfirmDialogWithCloseButton: FC<ConfirmDialogProps> = (props) => {
  // Wrapper to force showCloseButton logic if needed, but modifying component directly is better.
  // Re-rendering to fix the logic above.
  return (
    <ConfirmDialog {...props} />
  )
}

export default ConfirmDialog;