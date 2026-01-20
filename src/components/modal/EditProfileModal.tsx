import React from 'react';
import { ModalContainer } from './ModalContainer';
import Loader from '@/components/common/Loader';
import { Label } from '@/components/common/Typography';
import { UpdateProfileData } from '@/types/auth';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: UpdateProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<UpdateProfileData>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profileData,
  setProfileData,
  onSubmit,
  isLoading,
}) => {
  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      size="md"
      isLoading={isLoading}
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label className="mb-2">Name</Label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) =>
                setProfileData({ ...profileData, name: e.target.value })
              }
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              required
            />
          </div>

          <div>
            <Label className="mb-2">Email</Label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              required
            />
          </div>

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
              className="rounded-lg bg-primary py-2.5 px-6 text-white hover:bg-primary/90 disabled:opacity-50 text-sm transition-colors font-medium"
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      )}
    </ModalContainer>
  );
};