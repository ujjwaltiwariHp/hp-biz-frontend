import React from 'react';
import { ModalContainer } from './ModalContainer';
import Loader from '@/components/common/Loader';
import AdminManagementTable from '@/components/tables/AdminManagementTable';
import { SuperAdmin, SuperAdminRole, SuperAdminPermissions } from '@/types/auth';

interface ViewAdminsModalProps {
  isOpen: boolean;
  onClose: () => void;
  admins: SuperAdmin[] | undefined;
  profile: SuperAdmin;
  roles: SuperAdminRole[];
  permissions: SuperAdminPermissions;
  isLoading: boolean;
}

export const ViewAdminsModal: React.FC<ViewAdminsModalProps> = ({
  isOpen,
  onClose,
  admins,
  profile,
  roles,
  permissions,
  isLoading,
}) => {
  const isViewAllowed =
    permissions.all?.includes('crud') ||
    permissions.super_admins?.includes('view');
    console.log("admin");
    console.log(admins);

  if (!isViewAllowed) {
    return (
      <ModalContainer
        isOpen={isOpen}
        onClose={onClose}
        title="Access Denied"
        size="sm"
      >
        <div className="text-center py-4 text-danger">
          <p className="text-base">
            You do not have permission to view the list of administrators.
          </p>
        </div>
      </ModalContainer>
    );
  }

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="All Administrators"
      size="lg"
      isLoading={isLoading}
    >

      {isLoading ? (
        <div className="flex justify-center h-[400px] w-full">
          <Loader />
        </div>
      ) : !admins || admins.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No administrators found.</p>
        </div>
      ) : (
        <AdminManagementTable
          admins={admins}
          profile={profile}
          roles={roles}
          permissions={permissions}
        />
      )}
    </ModalContainer>
  );
};