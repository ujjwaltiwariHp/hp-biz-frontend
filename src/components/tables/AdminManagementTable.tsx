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
import DynamicTable from '@/components/common/DynamicTable';
import { TableColumn } from '@/types/table';

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
  const [showPermissionsModal, setShowPermissionsModal] = useState<SuperAdminRole | null>(null);

  // --- Mutations ---
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

  // --- Handlers ---
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

  // --- Permission Checks ---
  const isAdminDeletable = (admin: SuperAdmin) => {
    if (admin.id === profile.id) return false;
    if (admin.super_admin_role_id === 1) return false;
    return hasPermission(permissions, 'super_admins', 'delete');
  };

  const isAdminUpdatable = (admin: SuperAdmin) => {
    if (admin.id === profile.id) return false;
    return hasPermission(permissions, 'super_admins', 'update');
  };

  // --- Table Configuration ---
  const columns: TableColumn<SuperAdmin>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (admin) => (
        <span className="font-medium text-black dark:text-white">
          {admin.name}{' '}
          {admin.id === profile.id && (
            <span className="text-primary font-normal text-xs ml-1">(You)</span>
          )}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (admin) => <span className="text-sm">{admin.email}</span>,
    },
    {
      key: 'role_name',
      header: 'Role',
      render: (admin) => (
        <button
          onClick={() => handleViewPermissions(admin)}
          className="hover:opacity-80 transition-opacity text-left"
        >
          <span
            className={`inline-flex items-center gap-1.5 rounded-full py-1 px-3 text-xs font-medium ${
              admin.super_admin_role_id === 1
                ? 'bg-danger/10 text-danger border border-danger/20'
                : 'bg-success/10 text-success border border-success/20'
            }`}
          >
            <Shield size={12} />
            {admin.role_name || 'N/A'}
          </span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (admin) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full py-1 px-3 text-xs font-medium ${
            admin.status === 'active'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-danger/10 text-danger border border-danger/20'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              admin.status === 'active' ? 'bg-success' : 'bg-danger'
            }`}
          ></span>
          {admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (admin) => (
        <div className="flex items-center justify-end space-x-2">
          {isAdminUpdatable(admin) && (
            <button
              onClick={() => handleToggleStatus(admin)}
              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors ${
                admin.status === 'active'
                  ? 'text-danger hover:text-danger/80'
                  : 'text-success hover:text-success/80'
              } disabled:opacity-50`}
              disabled={toggleStatusMutation.isPending}
              title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
            >
              {admin.status === 'active' ? (
                <XCircle size={18} />
              ) : (
                <CheckCircle size={18} />
              )}
            </button>
          )}
          {hasPermission(permissions, 'super_admins', 'delete') && (
            <button
              onClick={() => handleDelete(admin)}
              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-meta-4 text-danger hover:text-danger/80 transition-colors ${
                !isAdminDeletable(admin) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={
                deleteMutation.isPending ||
                toggleStatusMutation.isPending ||
                !isAdminDeletable(admin)
              }
              title="Delete Admin"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DynamicTable<SuperAdmin>
        data={admins}
        columns={columns}
        isLoading={false} // Parent modal handles loading
      />

      <PermissionsModal
        isOpen={!!showPermissionsModal}
        onClose={() => setShowPermissionsModal(null)}
        role={showPermissionsModal}
      />

      {/* Delete Confirmation */}
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

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        {...toggleDialog.confirmProps}
        type={selectedAdmin?.status === 'active' ? 'warning' : 'success'}
        title={`${selectedAdmin?.status === 'active' ? 'Deactivate' : 'Activate'} Administrator`}
        message={`Are you sure you want to ${
          selectedAdmin?.status === 'active' ? 'deactivate' : 'activate'
        } "${selectedAdmin?.name}"?`}
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