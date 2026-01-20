import React, { useState } from 'react';
import { ModalContainer } from './ModalContainer';
import Loader from '@/components/common/Loader';
import { Label } from '@/components/common/Typography';
import { Eye, EyeOff } from 'lucide-react';
import { ChangePasswordData } from '@/types/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  passwordData: ChangePasswordData & { confirmPassword: string };
  setPasswordData: React.Dispatch<
    React.SetStateAction<ChangePasswordData & { confirmPassword: string }>
  >;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  passwordData,
  setPasswordData,
}) => {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const passwordFields = [
    {
      key: 'current' as const,
      name: 'currentPassword',
      label: 'Current Password',
      value: passwordData.currentPassword,
    },
    {
      key: 'new' as const,
      name: 'newPassword',
      label: 'New Password',
      value: passwordData.newPassword,
    },
    {
      key: 'confirm' as const,
      name: 'confirmPassword',
      label: 'Confirm New Password',
      value: passwordData.confirmPassword,
    },
  ];

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Change Password"
      size="md"
      isLoading={isLoading}
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {passwordFields.map(({ key, name, label, value }) => (
            <div key={key}>
              <Label className="mb-2">{label}</Label>
              <div className="relative">
                <input
                  type={showPasswords[key] ? 'text' : 'password'}
                  value={value}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      [name]: e.target.value,
                    })
                  }
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      [key]: !showPasswords[key],
                    })
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-body hover:text-black dark:hover:text-white p-1 transition-colors"
                >
                  {showPasswords[key] ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-bodydark1 dark:bg-meta-4 py-2.5 px-6 text-black dark:text-white hover:bg-bodydark dark:hover:bg-opacity-90 text-sm transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-warning py-2.5 px-6 text-white hover:bg-warning/90 disabled:opacity-50 text-sm transition-colors font-medium"
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      )}
    </ModalContainer>
  );
};