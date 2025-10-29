"use client";

import { useState } from "react";

interface UseConfirmDialogReturn {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  confirmProps: {
    isOpen: boolean;
    onCancel: () => void;
  };
}

export const useConfirmDialog = (): UseConfirmDialogReturn => {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  return {
    isOpen,
    openDialog,
    closeDialog,
    confirmProps: {
      isOpen,
      onCancel: closeDialog,
    },
  };
};