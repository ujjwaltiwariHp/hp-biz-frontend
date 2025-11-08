// src/components/tables/AdminManagementTable.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { toast } from 'react-toastify';
import { SuperAdmin, SuperAdminRole, SuperAdminPermissions } from '@/types/auth';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { PermissionsModal } from '@/components/modal/PermissionsModal';
import { hasPermission } from '@/utils/adminHelpers';

interface AdminManagementTableProps {
  admins: SuperAdmin[];
  profile: SuperAdmin;
  roles: SuperAdminRole[];
  permissions: SuperAdminPermissions;
}

export default function AdminManagementTable({
  admins,
  profile,
  roles,
  permissions,
}: AdminManagementTableProps) {
  const queryClient = useQueryClient();
  const deleteDialog = useConfirmDialog();
  const toggleDialog = useConfirmDialog();
  const [selectedAdmin, setSelectedAdmin] = useState<SuperAdmin | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] =
    useState<SuperAdminRole | null>(null);

  const deleteMutation = useMutation({
    mutationFn: authService.deleteAdmin,
    onSuccess: () => {
      toast.success('Admin deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['allAdmins'] });
      deleteDialog.closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
      deleteDialog.closeDialog();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: authService.toggleAdminStatus,
    onSuccess: () => {
      toast.success('Admin status updated');
      queryClient.invalidateQueries({ queryKey: ['allAdmins'] });
      toggleDialog.closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
      toggleDialog.closeDialog();
    },
  });

  const handleDelete = (admin: SuperAdmin) => {
    if (admin.id === profile.id) {
      toast.error("Cannot delete your own account");
      return;
    }
    if (admin.super_admin_role_id === 1) {
      toast.error('Cannot delete a primary Super Admin account.');
      return;
    }
    setSelectedAdmin(admin);
    deleteDialog.openDialog();
  };

  const handleToggleStatus = (admin: SuperAdmin) => {
    setSelectedAdmin(admin);
    toggleDialog.openDialog();
  };

  const handleViewPermissions = (admin: SuperAdmin) => {
    const role = roles.find((r) => r.id === admin.super_admin_role_id);
    if (role) {
      setShowPermissionsModal(role);
    } else {
      toast.info('Role details not available.');
    }
  };

  const isAdminDeletable = (admin: SuperAdmin) => {
    if (admin.id === profile.id) return false;
    if (admin.super_admin_role_id === 1) return false;
    return hasPermission(permissions, 'super_admins', 'delete');
  };

  const isAdminUpdatable = (admin: SuperAdmin) => {
    if (admin.id === profile.id) return false;
    return hasPermission(permissions, 'super_admins', 'update');
  };

  if (admins.length === 0) {
    return <p className="py-6 text-center text-gray-500 text-sm">No administrators found.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="py-2 px-3 font-semibold text-black dark:text-white">Name</th>
              <th className="py-2 px-3 font-semibold text-black dark:text-white">Email</th>
              <th className="py-2 px-3 font-semibold text-black dark:text-white">Role</th>
              <th className="py-2 px-3 font-semibold text-black dark:text-white">Status</th>
              <th className="py-2 px-3 font-semibold text-black dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr
                key={admin.id}
                className="border-b border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4/50 transition-colors"
              >
                <td className="py-2 px-3 text-black dark:text-white font-medium text-xs">
                  {admin.name}{' '}
                  {admin.id === profile.id && (
                    <span className="text-primary font-normal">(You)</span>
                  )}
                </td>
                <td className="py-2 px-3 text-black dark:text-white text-xs">{admin.email}</td>
                <td className="py-2 px-3">
                  <button
                    onClick={() => handleViewPermissions(admin)}
                    className="hover:text-primary text-left text-xs"
                  >
                    <span
                      className={`inline-flex items-center gap-1 rounded-full py-0.5 px-2 text-xs font-medium ${
                        admin.super_admin_role_id === 1
                          ? 'bg-danger/10 text-danger'
                          : 'bg-success/10 text-success'
                      }`}
                    >
                      <Shield size={10} />
                      {admin.role_name || 'N/A'}
                    </span>
                  </button>
                </td>
                <td className="py-2 px-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full py-0.5 px-2 text-xs font-medium ${
                      admin.status === 'active'
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        admin.status === 'active' ? 'bg-success' : 'bg-danger'
                      }`}
                    ></span>
                    {admin.status}
                  </span>
                </td>
                <td className="py-2 px-3 flex items-center space-x-1">
                  {isAdminUpdatable(admin) && (
                    <button
                      onClick={() => handleToggleStatus(admin)}
                      className={`${
                        admin.status === 'active'
                          ? 'text-danger hover:text-danger/80'
                          : 'text-success hover:text-success/80'
                      } disabled:opacity-50 p-1 transition-colors`}
                      disabled={toggleStatusMutation.isPending}
                    >
                      {admin.status === 'active' ? (
                        <XCircle size={16} />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                    </button>
                  )}
                  {hasPermission(permissions, 'super_admins', 'delete') && (
                    <button
                      onClick={() => handleDelete(admin)}
                      className={`text-danger hover:text-danger/80 ${
                        !isAdminDeletable(admin) ? 'opacity-50 cursor-not-allowed' : ''
                      } p-1 transition-colors`}
                      disabled={
                        deleteMutation.isPending ||
                        toggleStatusMutation.isPending ||
                        !isAdminDeletable(admin)
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PermissionsModal
        isOpen={!!showPermissionsModal}
        onClose={() => setShowPermissionsModal(null)}
        role={showPermissionsModal}
      />

      <ConfirmDialog
        {...deleteDialog.confirmProps}
        type="danger"
        title="Delete Administrator"
        message={`Are you sure you want to permanently delete "${selectedAdmin?.name}"?`}
        onConfirm={() => {
          if (selectedAdmin) deleteMutation.mutate(selectedAdmin.id);
          deleteDialog.closeDialog();
        }}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        {...toggleDialog.confirmProps}
        type={selectedAdmin?.status === 'active' ? 'warning' : 'success'}
        title={`${selectedAdmin?.status === 'active' ? 'Deactivate' : 'Activate'} Administrator`}
        message={`Are you sure you want to ${selectedAdmin?.status === 'active' ? 'deactivate' : 'activate'} "${selectedAdmin?.name}"?`}
        onConfirm={() => {
          if (selectedAdmin) toggleStatusMutation.mutate(selectedAdmin.id);
          toggleDialog.closeDialog();
        }}
        confirmText={selectedAdmin?.status === 'active' ? 'Deactivate' : 'Activate'}
        isLoading={toggleStatusMutation.isPending}
      />
    </>
  );
}