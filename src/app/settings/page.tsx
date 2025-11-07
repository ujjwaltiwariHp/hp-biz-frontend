'use client';

import { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { Settings as SettingsIcon, User, Lock, Users, Eye, EyeOff, X, CheckCircle, XCircle, Trash2, Shield, MinusCircle, ChevronDown, DollarSign } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { billingService } from '@/services/billing.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { CreateAdminData, UpdateProfileData, ChangePasswordData, SuperAdmin, SuperAdminPermissions, SuperAdminRole } from '@/types/auth';
import { BillingSettings, UpdateBillingSettingsPayload } from '@/types/billing';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import Loader from '@/components/common/Loader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import ClickOutside from '@/components/ClickOutside';
import ActionCard from '@/components/common/ActionCard';
// IMPORTED BILLING COMPONENT
import BillingSettingsModal from '@/components/forms/BillingSettingsModal';


const RESOURCE_MAP: { [key: string]: string } = {
  all: 'System-Wide Access',
  super_admins: 'Admin Users',
  companies: 'Company Management',
  subscriptions: 'Subscription Packages',
  payments: 'Payment Records',
  invoices: 'Invoices',
  super_admin_roles: 'Admin Roles'
};

const ACTION_MAP: { [key: string]: string } = {
  crud: 'Full CRUD',
  view: 'View/Read',
  create: 'Create/Add',
  update: 'Update/Edit',
  delete: 'Delete/Remove',
};


const hasPermission = (userPermissions: SuperAdminPermissions, resource: string, action: string): boolean => {
  if (!userPermissions) return false;

  if (userPermissions.all && userPermissions.all.includes('crud')) {
    return true;
  }

  const allowedActions = userPermissions[resource];
  if (!allowedActions) return false;

  return allowedActions.includes(action) || allowedActions.includes('crud');
};


const AdminManagementTable = ({
    admins,
    profile,
    roles,
    permissions
}: {
    admins: SuperAdmin[];
    profile: SuperAdmin;
    roles: SuperAdminRole[];
    permissions: SuperAdminPermissions;
}) => {
    const queryClient = useQueryClient();
    const [showPermissionsModal, setShowPermissionsModal] = useState<SuperAdminRole | null>(null);

    const deleteDialog = useConfirmDialog();
    const toggleDialog = useConfirmDialog();
    const [selectedAdmin, setSelectedAdmin] = useState<SuperAdmin | null>(null);

    const deleteMutation = useMutation({
        mutationFn: authService.deleteAdmin,
        onSuccess: () => {
            toast.success('Admin deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['allAdmins'] });
            setSelectedAdmin(null);
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete admin';

            if (errorMessage.includes('primary Super Admin') || errorMessage.includes('full privileges')) {
                toast.error('Cannot delete a primary Super Admin account. You can only deactivate it.');
            } else {
                toast.error(errorMessage);
            }
            setSelectedAdmin(null);
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: authService.toggleAdminStatus,
        onSuccess: () => {
            toast.success('Admin status updated');
            queryClient.invalidateQueries({ queryKey: ['allAdmins'] });
            setSelectedAdmin(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update status');
        },
    });

    const handleDelete = (admin: SuperAdmin) => {
        if (admin.super_admin_role_id === 1) {
            toast.error('Cannot delete a primary Super Admin account. You can only deactivate it.');
            return;
        }

        setSelectedAdmin(admin);
        deleteDialog.openDialog();
    };

    const confirmDelete = () => {
        if (!selectedAdmin) return;

        if (selectedAdmin.super_admin_role_id === 1) {
             toast.error('Cannot delete a primary Super Admin account. You can only deactivate it.');
             deleteDialog.closeDialog();
             setSelectedAdmin(null);
             return;
        }

        deleteMutation.mutate(selectedAdmin.id);
        deleteDialog.closeDialog();
        setSelectedAdmin(null);
    };

    const handleToggleStatus = (admin: SuperAdmin) => {
        setSelectedAdmin(admin);
        toggleDialog.openDialog();
    };

    const confirmToggleStatus = () => {
        if (!selectedAdmin) return;
        toggleStatusMutation.mutate(selectedAdmin.id);
        toggleDialog.closeDialog();
        setSelectedAdmin(null);
    };

    const handleViewPermissions = (admin: SuperAdmin) => {
        const role = roles.find(r => r.id === admin.super_admin_role_id);
        if (role) {
            setShowPermissionsModal(role);
        } else {
            toast.info("Role details not available.");
        }
    }

    const isAdminDeletable = (admin: SuperAdmin) => {
        if (admin.id === profile.id) return false;
        if (admin.super_admin_role_id === 1) return false;
        return hasPermission(permissions, 'super_admins', 'delete');
    };

    const isAdminUpdatable = (admin: SuperAdmin) => {
        if (admin.id === profile.id) return false;
        return hasPermission(permissions, 'super_admins', 'update');
    };

    const getDeleteTitle = (admin: SuperAdmin) => {
        if (admin.id === profile.id) return "Cannot delete your own account";
        if (admin.super_admin_role_id === 1) return "Super Admin accounts cannot be deleted (only deactivated)";
        if (!hasPermission(permissions, 'super_admins', 'delete')) return "Permission denied: Missing delete rights";
        return "Delete Admin";
    };

    if (admins.length === 0) {
        return <p className="py-6 text-center text-gray-500 text-sm">No administrators found.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
                <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                        <th className="py-2 px-3 font-semibold text-black dark:text-white text-xs sm:text-sm">Name</th>
                        <th className="py-2 px-3 font-semibold text-black dark:text-white text-xs sm:text-sm">Email</th>
                        <th className="py-2 px-3 font-semibold text-black dark:text-white text-xs sm:text-sm">Role</th>
                        <th className="py-2 px-3 font-semibold text-black dark:text-white text-xs sm:text-sm">Status</th>
                        <th className="py-2 px-3 font-semibold text-black dark:text-white text-xs sm:text-sm">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {admins.map((admin) => (
                        <tr key={admin.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4/50 transition-colors">
                            <td className="py-2 px-3 text-black dark:text-white text-sm font-medium">
                                {admin.name} {admin.id === profile.id && <span className="text-xs text-primary font-normal">(You)</span>}
                            </td>
                            <td className="py-2 px-3 text-black dark:text-white text-sm">{admin.email}</td>
                            <td className="py-2 px-3 text-black dark:text-white">
                                <button
                                     onClick={() => handleViewPermissions(admin)}
                                     className="hover:text-primary text-left text-xs"
                                     title="View Role Permissions"
                                >
                                    <span className={`inline-flex items-center gap-1 rounded-full py-0.5 px-2 text-xs font-medium ${
                                        admin.super_admin_role_id === 1 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                                    }`}>
                                        <Shield size={10} />
                                        {admin.role_name || 'N/A'}
                                    </span>
                                </button>
                            </td>
                            <td className="py-2 px-3">
                                <span className={`inline-flex items-center gap-1 rounded-full py-0.5 px-2 text-xs font-medium ${
                                    admin.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                                }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${admin.status === 'active' ? 'bg-success' : 'bg-danger'}`}></span>
                                    {admin.status}
                                </span>
                            </td>
                            <td className="py-2 px-3 flex items-center space-x-1">
                                {isAdminUpdatable(admin) && (
                                    <button
                                        onClick={() => handleToggleStatus(admin)}
                                        className={`${admin.status === 'active' ? 'text-danger hover:text-danger/80' : 'text-success hover:text-success/80'} disabled:opacity-50 p-1 transition-colors`}
                                        title={`Toggle to ${admin.status === 'active' ? 'Inactive' : 'Active'}`}
                                        disabled={toggleStatusMutation.isPending}
                                    >
                                        {admin.status === 'active' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                    </button>
                                )}
                                {hasPermission(permissions, 'super_admins', 'delete') && (
                                    <button
                                        onClick={() => handleDelete(admin)}
                                        className={`text-danger hover:text-danger/80 ${!isAdminDeletable(admin) ? 'opacity-50 cursor-not-allowed' : ''} p-1 transition-colors`}
                                        title={getDeleteTitle(admin)}
                                        disabled={deleteMutation.isPending || toggleStatusMutation.isPending || !isAdminDeletable(admin)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {showPermissionsModal && (
                <PermissionsModal role={showPermissionsModal} onClose={() => setShowPermissionsModal(null)} />
            )}

            <ConfirmDialog
                {...deleteDialog.confirmProps}
                type="danger"
                title="Delete Administrator"
                message={`Are you sure you want to permanently delete "${selectedAdmin?.name}"? This action cannot be undone.`}
                onConfirm={confirmDelete}
                confirmText="Delete"
                isLoading={deleteMutation.isPending}
            />
            <ConfirmDialog
                {...toggleDialog.confirmProps}
                type={selectedAdmin?.status === 'active' ? 'warning' : 'success'}
                title={`${selectedAdmin?.status === 'active' ? 'Deactivate' : 'Activate'} Administrator`}
                message={`Are you sure you want to ${selectedAdmin?.status === 'active' ? 'deactivate' : 'activate'} "${selectedAdmin?.name}"?`}
                onConfirm={confirmToggleStatus}
                confirmText={selectedAdmin?.status === 'active' ? 'Deactivate' : 'Activate'}
                isLoading={toggleStatusMutation.isPending}
            />
        </div>
    );
};

const PermissionsModal = ({ role, onClose }: { role: SuperAdminRole, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50 p-4 sm:p-6">
            <ClickOutside onOutsideClick={onClose}>
                <div className="w-full max-w-lg rounded-lg bg-white p-5 dark:bg-boxdark max-h-[90vh] overflow-y-auto transform transition-all duration-300 shadow-2xl">
                    <div className="flex items-center justify-between mb-3 border-b pb-3 dark:border-strokedark">
                        <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                            <Shield size={18} />
                            Permissions for: {role.role_name}
                        </h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white p-1">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(role.permissions).sort().map(([resource, actions]) => (
                            <div key={resource} className="p-3 rounded-md bg-gray-2 dark:bg-meta-4 border border-stroke dark:border-strokedark">
                                <h4 className="font-semibold text-black dark:text-white mb-1 text-sm">
                                    {RESOURCE_MAP[resource] || resource.toUpperCase()}
                                </h4>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    {actions.map((action: string) => (
                                        <span key={action} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                            {ACTION_MAP[action] || action.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-right">
                        <button onClick={onClose} className="rounded bg-primary py-2 px-4 text-white hover:bg-primary/90 text-sm transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </ClickOutside>
        </div>
    );
};


const RoleCreationModal = ({ roles, permissions, rolesLoading, onClose }: { roles: SuperAdminRole[], permissions: SuperAdminPermissions, rolesLoading: boolean, onClose: () => void }) => {
    const queryClient = useQueryClient();

    const nonSuperAdminRole = roles.find(r => r.role_name !== 'Super Admin');
    const initialRoleId = nonSuperAdminRole ? nonSuperAdminRole.id : (roles.length > 0 ? roles[0].id : 0);

    const [createAdminData, setCreateAdminData] = useState<CreateAdminData>({
        email: '',
        password: '',
        name: '',
        role_id: initialRoleId
    });
    const [showPassword, setShowPassword] = useState(false);

    const createAdminMutation = useMutation({
        mutationFn: authService.createAdmin,
        onSuccess: () => {
            toast.success('Admin created successfully');
            queryClient.invalidateQueries({ queryKey: ['allAdmins'] });
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create admin');
        },
    });

    const isCreationAllowed = hasPermission(permissions, 'super_admins', 'create');

    const handleCreateAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        const { email, password, name, role_id } = createAdminData;
        if (!email || !password || !name || role_id === 0) {
            toast.error('Please fill all required fields and select a role');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        createAdminMutation.mutate(createAdminData);
    };

    if (!isCreationAllowed) {
        return (
             <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50 p-4 sm:p-6">
                <div className="w-full max-w-sm rounded-lg bg-white p-5 dark:bg-boxdark shadow-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-black dark:text-white">Access Denied</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white p-1">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="text-center py-4 text-danger">
                        <MinusCircle size={32} className="mx-auto mb-2" />
                        <p className="text-base">You do not have permission to create new administrators.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50 p-4 sm:p-6">
            <ClickOutside onOutsideClick={onClose}>
                <div className="w-full max-w-md rounded-lg bg-white p-5 dark:bg-boxdark max-h-[90vh] overflow-y-auto transform transition-all duration-300 shadow-2xl">
                    <div className="flex items-center justify-between mb-4 border-b pb-3 dark:border-strokedark">
                        <h3 className="text-lg font-semibold text-black dark:text-white">Create New Administrator</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white p-1">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleCreateAdmin}>
                        <div className="mb-3">
                            <label className="mb-1.5 block text-black dark:text-white text-sm">Name</label>
                            <input
                                type="text"
                                value={createAdminData.name}
                                onChange={(e) => setCreateAdminData({ ...createAdminData, name: e.target.value })}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-sm"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="mb-1.5 block text-black dark:text-white text-sm">Email</label>
                            <input
                                type="email"
                                value={createAdminData.email}
                                onChange={(e) => setCreateAdminData({ ...createAdminData, email: e.target.value })}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-sm"
                                required
                            />
                        </div>
                        {rolesLoading ? (
                            <div className="flex justify-center py-4"><Loader /></div>
                        ) : (
                            <div className="mb-3">
                                <label className="mb-1.5 block text-black dark:text-white text-sm">Assign Role</label>
                                <div className="relative">
                                    <select
                                        value={createAdminData.role_id}
                                        onChange={(e) => setCreateAdminData({ ...createAdminData, role_id: parseInt(e.target.value) })}
                                        className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-2.5 px-4 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-sm"
                                        required
                                    >
                                        {roles.length === 0 && <option value={0} disabled>No Roles Found</option>}
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>
                                                {role.role_name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute top-1/2 right-4 z-10 -translate-y-1/2 text-gray-500" size={16} />
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="mb-1.5 block text-black dark:text-white text-sm">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={createAdminData.password}
                                    onChange={(e) => setCreateAdminData({ ...createAdminData, password: e.target.value })}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-sm"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black dark:hover:text-white p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded bg-gray-300 dark:bg-gray-600 py-2.5 px-4 text-black dark:text-white hover:bg-gray-400 dark:hover:bg-gray-700 text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createAdminMutation.isPending}
                                className="rounded bg-success py-2.5 px-4 text-white hover:bg-success/90 disabled:opacity-50 text-sm transition-colors"
                            >
                                {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                            </button>
                        </div>
                    </form>
                </div>
            </ClickOutside>
        </div>
    );
};


const AllAdminsModal = ({ admins, profile, roles, permissions, onClose }: { admins: SuperAdmin[], profile: SuperAdmin, roles: SuperAdminRole[], permissions: SuperAdminPermissions, onClose: () => void }) => {
    const isViewListAllowed = hasPermission(permissions, 'super_admins', 'view');

    if (!isViewListAllowed) {
        return (
             <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50 p-4 sm:p-6">
                <div className="w-full max-w-sm rounded-lg bg-white p-5 dark:bg-boxdark shadow-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-black dark:text-white">Access Denied</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white p-1">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="text-center py-4 text-danger">
                        <MinusCircle size={32} className="mx-auto mb-2" />
                        <p className="text-base">You do not have permission to view the list of administrators.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50 p-4 sm:p-6">
            <ClickOutside onOutsideClick={onClose}>
                <div className="w-full max-w-5xl rounded-lg bg-white p-5 dark:bg-boxdark max-h-[90vh] overflow-y-auto transform transition-all duration-300 shadow-2xl">
                    <div className="flex items-center justify-between mb-4 border-b pb-3 dark:border-strokedark">
                        <h3 className="text-lg font-semibold text-black dark:text-white">All Administrators</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white p-1">
                            <X size={20} />
                        </button>
                    </div>
                    {/* Admins loading is checked in the parent component, but adding a fallback just in case */}
                    {admins.length === 0 ? <div className="flex justify-center py-6"><Loader /></div> : (
                        <AdminManagementTable admins={admins} profile={profile} roles={roles} permissions={permissions} />
                    )}
                </div>
            </ClickOutside>
        </div>
    );
};


export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { profile, permissions, isInitialized, isAuthenticated } = useAuth();

    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showCreateAdmin, setShowCreateAdmin] = useState(false);
    const [showAllAdmins, setShowAllAdmins] = useState(false);
    const [showBillingSettings, setShowBillingSettings] = useState(false);

    const [profileData, setProfileData] = useState<UpdateProfileData>({ email: '', name: '' });
    const [passwordData, setPasswordData] = useState<ChangePasswordData & { confirmPassword: string }>({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
        queryKey: ['superAdminRoles'],
        queryFn: authService.getRoles,
        enabled: isInitialized && isAuthenticated,
    });
    const roles = rolesResponse?.data?.roles || [];

    const isViewAllowed = hasPermission(permissions, 'super_admins', 'view');
    const isCreateAllowed = hasPermission(permissions, 'super_admins', 'create');
    const isProfileLoading = !isInitialized || !isAuthenticated || !profile;

    const { data: adminsResponse, isLoading: adminsLoading } = useQuery({
        queryKey: ['allAdmins'],
        queryFn: authService.getAllAdmins,
        enabled: showAllAdmins && isViewAllowed,
    });
    const admins = adminsResponse?.data?.superAdmins || [];

    const { data: billingResponse, isLoading: billingLoading, isError: billingError } = useQuery<BillingSettings>({
        queryKey: ['billingSettings'],
        queryFn: billingService.getBillingSettings,
        enabled: isInitialized && isAuthenticated,
        retry: 1,
    });
    const billingSettings = billingResponse;


    useEffect(() => {
        if (profile) {
            setProfileData({
                email: profile.email || '',
                name: profile.name || '',
            });
        }
    }, [profile]);


    const updateProfileMutation = useMutation({
        mutationFn: authService.updateProfile,
        onSuccess: () => {
            toast.success('Profile updated successfully');
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setShowEditProfile(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: authService.changePassword,
        onSuccess: () => {
            toast.success('Password changed successfully');
            setShowChangePassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to change password');
        },
    });

    const updateBillingMutation = useMutation({
        mutationFn: billingService.updateBillingSettings,
        onSuccess: () => {
            toast.success('Billing Settings updated successfully');
            queryClient.invalidateQueries({ queryKey: ['billingSettings'] });
            setShowBillingSettings(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update billing settings');
        },
    });


    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileData.email || !profileData.name) {
            toast.error('Please fill all fields');
            return;
        }
        updateProfileMutation.mutate(profileData);
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = passwordData;
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please fill all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        changePasswordMutation.mutate({ currentPassword, newPassword });
    };

    if (isProfileLoading) {
        return <Loader />;
    }

    return (
        <DefaultLayout>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                <div className="py-4 px-4 sm:px-6 border-b border-stroke dark:border-strokedark">
                    <h4 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                        <SettingsIcon size={24} className="text-primary" />
                        Admin Panel Settings
                    </h4>
                </div>

                <div className="p-4 sm:p-6 space-y-6">
                    {/* Action Cards Section */}
                    <section className='border border-stroke dark:border-strokedark rounded-lg p-3 dark:bg-boxdark-2/50'>
                        <h3 className="text-base font-semibold text-black dark:text-white mb-3">
                           Admin Actions
                        </h3>
                        {rolesLoading ? (
                             <div className="flex justify-center py-6"><Loader /></div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <ActionCard
                                    title="Profile"
                                    description="Update your personal details."
                                    icon={<User className="h-6 w-6 text-primary" />}
                                    color="primary"
                                    onClick={() => setShowEditProfile(true)}
                                    buttonText="Edit Profile"
                                />

                                <ActionCard
                                    title="Security"
                                    description="Change your account password."
                                    icon={<Lock className="h-6 w-6 text-warning" />}
                                    color="warning"
                                    onClick={() => setShowChangePassword(true)}
                                    buttonText="Change Password"
                                />

                                <ActionCard
                                    title="New Admin"
                                    description="Add a new administrator to the system."
                                    icon={<Users className="h-6 w-6 text-success" />}
                                    color="success"
                                    onClick={() => setShowCreateAdmin(true)}
                                    buttonText="Create Admin"
                                    disabled={!isCreateAllowed}
                                />

                                <ActionCard
                                    title="Manage Admins"
                                    description="View and manage all system administrators."
                                    icon={<Users className="h-6 w-6 text-meta-5" />}
                                    color="meta-5"
                                    onClick={() => setShowAllAdmins(true)}
                                    buttonText="View/Manage"
                                    disabled={!isViewAllowed}
                                />
                            </div>
                        )}
                    </section>

                    {/* Account Information Section */}
                    <section className="rounded-lg border border-stroke p-4 dark:border-strokedark bg-white dark:bg-boxdark shadow-md">
                        <h3 className="text-base font-semibold text-black dark:text-white mb-3">
                            Your Account Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <InfoCard title="Name" value={profile?.name} />
                            <InfoCard title="Email" value={profile?.email} />
                            <InfoCard title="Created At" value={profile?.created_at} isDate={true} />
                            <InfoCard title="Last Updated" value={profile?.updated_at} isDate={true} />
                        </div>
                    </section>

                    {/* Billing Settings Section */}
                    <section className="rounded-lg border border-stroke p-4 dark:border-strokedark bg-white dark:bg-boxdark shadow-md">
                        <h3 className="text-base font-semibold text-black dark:text-white flex items-center gap-2 mb-3">
                            <DollarSign size={18} className='text-success' />
                            Billing & Invoice Settings (Company)
                        </h3>
                        {billingLoading ? (
                            <div className="flex justify-center py-6"><Loader /></div>
                        ) : billingError || !billingSettings ? (
                            <div className="text-center py-3 text-danger text-sm">
                                Failed to load billing settings.
                            </div>
                        ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                 <InfoCard title="Company Name" value={billingSettings.company_name} />
                                 <InfoCard title="Company Email" value={billingSettings.email} />
                                 <InfoCard title="Company Phone" value={billingSettings.phone} />
                                 <InfoCard title="Currency" value={billingSettings.currency} />

                                 <InfoCard title="Tax Rate" value={`${(billingSettings.tax_rate * 100).toFixed(2)} %`} />
                                 <InfoCard title="Bank Name" value={billingSettings.bank_details?.bank_name || 'N/A'} />
                                 <InfoCard title="QR Code" value={billingSettings.qr_code_image_url ? 'Available' : 'N/A'} />
                                 <InfoCard title="Last Updated" value={billingSettings.updated_at} isDate={true} />

                                 <InfoCard title="Address" value={billingSettings.address} fullWidth={true} />

                                 <div className="lg:col-span-3 xl:col-span-4 pt-3 border-t border-stroke dark:border-strokedark flex justify-end">
                                     <button
                                        onClick={() => setShowBillingSettings(true)}
                                        className="rounded bg-success py-2 px-4 text-white hover:bg-success/90 transition-colors text-sm"
                                     >
                                         Edit Billing Settings
                                     </button>
                                 </div>
                             </div>
                        )}
                    </section>
                </div>
            </div>

            {showEditProfile && <EditProfileModal profileData={profileData} setProfileData={setProfileData} mutation={updateProfileMutation} onClose={() => setShowEditProfile(false)} />}
            {showChangePassword && <ChangePasswordModal passwordData={passwordData} setPasswordData={setPasswordData} mutation={changePasswordMutation} showPasswords={showPasswords} setShowPasswords={setShowPasswords} onClose={() => setShowChangePassword(false)} />}
            {showCreateAdmin && <RoleCreationModal roles={roles} permissions={permissions} rolesLoading={rolesLoading} onClose={() => setShowCreateAdmin(false)} />}

            {/* Conditional Loader for AllAdminsModal */}
            {showAllAdmins && isViewAllowed && adminsLoading && (
                 <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
                    <Loader />
                </div>
            )}

            {showAllAdmins && isViewAllowed && !adminsLoading && (
             <AllAdminsModal admins={admins} profile={profile!} roles={roles} permissions={permissions} onClose={() => setShowAllAdmins(false)} />
            )}

            {showBillingSettings && billingSettings && (
                 <BillingSettingsModal settings={billingSettings} mutation={updateBillingMutation} onClose={() => setShowBillingSettings(false)} />
            )}
        </DefaultLayout>
    );
}

// InfoCard definition remains locally defined
const InfoCard = ({
    title,
    value,
    isDate = false,
    fullWidth = false,
}: {
    title: string;
    value?: string | boolean;
    isDate?: boolean;
    fullWidth?: boolean;
}) => {
    let displayValue: string = value?.toString() || 'N/A';
    if (isDate && value && typeof value === 'string') {
        displayValue = formatDate(value);
    }

    return (
        <div className={`p-3 rounded bg-gray-2 dark:bg-meta-4/50 border border-stroke dark:border-strokedark/50 ${fullWidth ? 'col-span-full' : ''}`}>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block truncate">{title}</label>
            <p className="text-sm mt-0.5 font-semibold text-black dark:text-white break-words">
                {displayValue}
            </p>
        </div>
    );
};


// MODAL 1: Edit Profile (Updated max-w to lg)
const EditProfileModal = ({
    profileData,
    setProfileData,
    mutation,
    onClose
}: {
    profileData: UpdateProfileData;
    setProfileData: React.Dispatch<React.SetStateAction<UpdateProfileData>>;
    mutation: any;
    onClose: () => void;
}) => {
    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(profileData);
    };

    return (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50 p-4 sm:p-6">
            <ClickOutside onOutsideClick={onClose}>
                {/* Increased size: max-w-lg */}
                <div className="w-full max-w-lg rounded-lg bg-white p-6 dark:bg-boxdark max-h-[90vh] overflow-y-auto transform transition-all duration-300 shadow-2xl">
                    <div className="flex items-center justify-between mb-4 border-b pb-3 dark:border-strokedark">
                        <h3 className="text-xl font-semibold text-black dark:text-white">Edit Profile</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white p-1">
                            <X size={24} />
                        </button>
                    </div>
                    {mutation.isPending ? (
                        <div className="flex justify-center py-12"><Loader /></div>
                    ) : (
                        <form onSubmit={handleUpdateProfile}>
                            <div className="mb-4">
                                <label className="mb-1.5 block text-black dark:text-white text-base font-medium">Name</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="mb-1.5 block text-black dark:text-white text-base font-medium">Email</label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t dark:border-strokedark">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-lg bg-gray-300 dark:bg-gray-600 py-2.5 px-6 text-black dark:text-white hover:bg-gray-400 dark:hover:bg-gray-700 text-sm transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={mutation.isPending}
                                    className="rounded-lg bg-primary py-2.5 px-6 text-white hover:bg-primary/90 disabled:opacity-50 text-sm transition-colors font-medium"
                                >
                                    {mutation.isPending ? 'Updating...' : 'Update Profile'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </ClickOutside>
        </div>
    );
};

// MODAL 2: Change Password (Updated max-w to lg)
const ChangePasswordModal = ({
    passwordData,
    setPasswordData,
    mutation,
    showPasswords,
    setShowPasswords,
    onClose
}: {
    passwordData: ChangePasswordData & { confirmPassword: string };
    setPasswordData: React.Dispatch<React.SetStateAction<ChangePasswordData & { confirmPassword: string }>>;
    mutation: any;
    showPasswords: { current: boolean; new: boolean; confirm: boolean };
    setShowPasswords: React.Dispatch<React.SetStateAction<{ current: boolean; new: boolean; confirm: boolean }>>;
    onClose: () => void;
}) => {
    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = passwordData;
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please fill all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        mutation.mutate({ currentPassword, newPassword });
    };

    return (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50 p-4 sm:p-6">
            <ClickOutside onOutsideClick={onClose}>
                {/* Increased size: max-w-lg */}
                <div className="w-full max-w-lg rounded-lg bg-white p-6 dark:bg-boxdark max-h-[90vh] overflow-y-auto transform transition-all duration-300 shadow-2xl">
                    <div className="flex items-center justify-between mb-4 border-b pb-3 dark:border-strokedark">
                        <h3 className="text-xl font-semibold text-black dark:text-white">Change Password</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white p-1">
                            <X size={24} />
                        </button>
                    </div>
                    {mutation.isPending ? (
                        <div className="flex justify-center py-12"><Loader /></div>
                    ) : (
                        <form onSubmit={handleChangePassword}>
                            <div className="mb-4">
                                <label className="mb-1.5 block text-black dark:text-white text-base font-medium">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black dark:hover:text-white p-1"
                                    >
                                        {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="mb-1.5 block text-black dark:text-white text-base font-medium">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black dark:hover:text-white p-1"
                                    >
                                        {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="mb-1.5 block text-black dark:text-white text-base font-medium">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-base"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black dark:hover:text-white p-1"
                                    >
                                        {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t dark:border-strokedark">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-lg bg-gray-300 dark:bg-gray-600 py-2.5 px-6 text-black dark:text-white hover:bg-gray-400 dark:hover:bg-gray-700 text-sm transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={mutation.isPending}
                                    className="rounded-lg bg-warning py-2.5 px-6 text-white hover:bg-warning/90 disabled:opacity-50 text-sm transition-colors font-medium"
                                >
                                    {mutation.isPending ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </ClickOutside>
        </div>
    );
};