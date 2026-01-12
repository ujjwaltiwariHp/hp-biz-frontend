import React from 'react';
import Modal from '@/components/common/Modal';

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => { } : onClose}
      title={title}
      size={size}
    >
      {children}
    </Modal>
  );
};