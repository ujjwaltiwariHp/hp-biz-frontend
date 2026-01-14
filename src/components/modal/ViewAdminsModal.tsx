import React from 'react';
import { ModalContainer } from './ModalContainer';
import AdminManagementTable from '@/components/tables/AdminManagementTable';
import { SuperAdmin, SuperAdminRole, SuperAdminPermissions } from '@/types/auth';
import Loader from '../common/Loader';

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

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={isViewAllowed ? 'All Administrators' : 'Access Denied'}
      size={isViewAllowed ? 'lg' : 'sm'}
    >
      {!isViewAllowed ? (
        <div className="text-center py-4 text-danger">
          <p className="text-base">
            You do not have permission to view the list of administrators.
          </p>
        </div>
      ) : (
        <AdminManagementTable
          admins={admins || []}
          profile={profile}
          roles={roles}
          permissions={permissions}
          isLoading={isLoading}
        />
      )}
    </ModalContainer>
  );
};
