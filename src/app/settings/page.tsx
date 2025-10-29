'use client';

import { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { Settings as SettingsIcon, User, Lock, Users, Eye, EyeOff, X, CheckCircle, XCircle, Trash2, Shield, MinusCircle, ChevronDown } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { CreateAdminData, UpdateProfileData, ChangePasswordData, SuperAdmin, SuperAdminPermissions, SuperAdminRole } from '@/types/auth';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import Loader from '@/components/common/Loader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';


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
        // Role ID 1 is the Super Admin (Primary Admin) role
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
        return <p className="py-8 text-center text-gray-500">No administrators found.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full table-auto">
                <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                        <th className="py-4 px-4 font-medium text-black dark:text-white">Name</th>
                        <th className="py-4 px-4 font-medium text-black dark:text-white">Email</th>
                        <th className="py-4 px-4 font-medium text-black dark:text-white">Role</th>
                        <th className="py-4 px-4 font-medium text-black dark:text-white">Status</th>
                        <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {admins.map((admin) => (
                        <tr key={admin.id} className="border-b border-stroke dark:border-strokedark">
                            <td className="py-4 px-4 text-black dark:text-white font-medium">
                                {admin.name} {admin.id === profile.id && <span className="text-xs text-primary">(You)</span>}
                            </td>
                            <td className="py-4 px-4 text-black dark:text-white">{admin.email}</td>
                            <td className="py-4 px-4 text-black dark:text-white">
                                <button
                                     onClick={() => handleViewPermissions(admin)}
                                     className="hover:text-primary text-left text-sm"
                                     title="View Role Permissions"
                                >
                                    <span className={`inline-flex items-center gap-1.5 rounded-full py-1 px-2.5 text-xs font-medium ${
                                        admin.super_admin_role_id === 1 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                                    }`}>
                                        <Shield size={12} />
                                        {admin.role_name || 'N/A'}
                                    </span>
                                </button>
                            </td>
                            <td className="py-4 px-4">
                                <span className={`inline-flex items-center gap-1.5 rounded-full py-1 px-2.5 text-xs font-medium ${
                                    admin.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                                }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${admin.status === 'active' ? 'bg-success' : 'bg-danger'}`}></span>
                                    {admin.status}
                                </span>
                            </td>
                            <td className="py-4 px-4 flex items-center space-x-2">
                                {isAdminUpdatable(admin) && (
                                    <button
                                        onClick={() => handleToggleStatus(admin)}
                                        className={`${admin.status === 'active' ? 'text-danger hover:text-danger/80' : 'text-success hover:text-success/80'} disabled:opacity-50`}
                                        title={`Toggle to ${admin.status === 'active' ? 'Inactive' : 'Active'}`}
                                        disabled={toggleStatusMutation.isPending}
                                    >
                                        {admin.status === 'active' ? <XCircle size={20} /> : <CheckCircle size={20} />}
                                    </button>
                                )}
                                {hasPermission(permissions, 'super_admins', 'delete') && (
                                    <button
                                        onClick={() => handleDelete(admin)}
                                        className={`text-danger hover:text-danger/80 ${!isAdminDeletable(admin) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={getDeleteTitle(admin)}
                                        disabled={deleteMutation.isPending || toggleStatusMutation.isPending || !isAdminDeletable(admin)}
                                    >
                                        <Trash2 size={20} />
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
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 dark:bg-boxdark max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 border-b pb-3 dark:border-strokedark">
                    <h3 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Shield size={20} />
                        Permissions for: {role.role_name}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    {Object.entries(role.permissions).sort().map(([resource, actions]) => (
                        <div key={resource} className="p-3 rounded-lg bg-gray-2 dark:bg-meta-4 border border-stroke dark:border-strokedark">
                            <h4 className="font-bold text-black dark:text-white mb-1">
                                {RESOURCE_MAP[resource] || resource.toUpperCase()}
                            </h4>
                            <div className="flex flex-wrap gap-2 text-sm">
                                {actions.map((action: string) => (
                                    <span key={action} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                        {ACTION_MAP[action] || action.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="rounded bg-primary py-2 px-4 text-white hover:bg-primary/90">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


const RoleCreationModal = ({ roles, permissions, onClose }: { roles: SuperAdminRole[], permissions: SuperAdminPermissions, onClose: () => void }) => {
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
             <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-black dark:text-white">Access Denied</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="text-center py-6 text-danger">
                        <MinusCircle size={40} className="mx-auto mb-3" />
                        <p className="text-lg">You do not have permission to create new administrators.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
                <div className="flex items-center justify-between mb-4 border-b pb-3 dark:border-strokedark">
                    <h3 className="text-xl font-semibold text-black dark:text-white">Create New Administrator</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleCreateAdmin}>
                    <div className="mb-4">
                        <label className="mb-2.5 block text-black dark:text-white">Name</label>
                        <input
                            type="text"
                            value={createAdminData.name}
                            onChange={(e) => setCreateAdminData({ ...createAdminData, name: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="mb-2.5 block text-black dark:text-white">Email</label>
                        <input
                            type="email"
                            value={createAdminData.email}
                            onChange={(e) => setCreateAdminData({ ...createAdminData, email: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="mb-2.5 block text-black dark:text-white">Assign Role</label>
                        <div className="relative">
                            <select
                                value={createAdminData.role_id}
                                onChange={(e) => setCreateAdminData({ ...createAdminData, role_id: parseInt(e.target.value) })}
                                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                required
                            >
                                {roles.length === 0 && <option value={0} disabled>Loading Roles...</option>}
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.role_name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute top-1/2 right-4 z-10 -translate-y-1/2" size={20} />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="mb-2.5 block text-black dark:text-white">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={createAdminData.password}
                                onChange={(e) => setCreateAdminData({ ...createAdminData, password: e.target.value })}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-4 text-gray-500 hover:text-black dark:hover:text-white"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={createAdminMutation.isPending}
                        className="w-full rounded bg-success py-3 px-6 text-white hover:bg-success/90 disabled:opacity-50"
                    >
                        {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                    </button>
                </form>
            </div>
        </div>
    );
};


const AllAdminsModal = ({ admins, profile, roles, permissions, onClose }: { admins: SuperAdmin[], profile: SuperAdmin, roles: SuperAdminRole[], permissions: SuperAdminPermissions, onClose: () => void }) => {
    const isViewListAllowed = hasPermission(permissions, 'super_admins', 'view');

    if (!isViewListAllowed) {
        return (
             <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-black dark:text-white">Access Denied</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="text-center py-6 text-danger">
                        <MinusCircle size={40} className="mx-auto mb-3" />
                        <p className="text-lg">You do not have permission to view the list of administrators.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-boxdark max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 border-b pb-3 dark:border-strokedark">
                    <h3 className="text-xl font-semibold text-black dark:text-white">All Administrators</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <AdminManagementTable admins={admins} profile={profile} roles={roles} permissions={permissions} />
            </div>
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
    const isProfileLoading = !isInitialized;

    const { data: adminsResponse, isLoading: adminsLoading } = useQuery({
        queryKey: ['allAdmins'],
        queryFn: authService.getAllAdmins,
        enabled: showAllAdmins && isViewAllowed,
    });
    const admins = adminsResponse?.data?.superAdmins || [];


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

    if (!isInitialized || !isAuthenticated || !profile) {
        return <Loader />;
    }

    return (
        <DefaultLayout>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="py-6 px-4 md:px-6 xl:px-7.5">
                    <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <SettingsIcon size={24} />
                        Admin Panel Settings
                    </h4>
                </div>

                <div className="p-4 md:p-6 xl:p-7.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="rounded-lg border-2 border-stroke p-6 dark:border-strokedark hover:shadow-lg transition-shadow bg-white dark:bg-boxdark">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-medium text-black dark:text-white">Profile</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Update your profile information and contact details.
                            </p>
                            <button
                                onClick={() => setShowEditProfile(true)}
                                className="w-full rounded bg-primary py-2 px-4 text-white hover:bg-primary/90 transition-colors"
                            >
                                Edit Profile
                            </button>
                        </div>

                        <div className="rounded-lg border-2 border-stroke p-6 dark:border-strokedark hover:shadow-lg transition-shadow bg-white dark:bg-boxdark">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                                    <Lock className="h-6 w-6 text-warning" />
                                </div>
                                <h3 className="text-lg font-medium text-black dark:text-white">Security</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Change your account password for better security.
                            </p>
                            <button
                                onClick={() => setShowChangePassword(true)}
                                className="w-full rounded bg-warning py-2 px-4 text-white hover:bg-warning/90 transition-colors"
                            >
                                Change Password
                            </button>
                        </div>

                        <div className={`rounded-lg border-2 border-stroke p-6 dark:border-strokedark bg-white dark:bg-boxdark ${isCreateAllowed ? 'hover:shadow-lg' : 'opacity-50 cursor-not-allowed'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                                    <Users className="h-6 w-6 text-success" />
                                </div>
                                <h3 className="text-lg font-medium text-black dark:text-white">New Admin</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Add new administrator (Super-Admin/Sub-Admin).
                            </p>
                            <button
                                onClick={() => setShowCreateAdmin(true)}
                                disabled={!isCreateAllowed}
                                className="w-full rounded bg-success py-2 px-4 text-white hover:bg-success/90 transition-colors disabled:opacity-50 disabled:hover:bg-success"
                            >
                                Create Admin
                            </button>
                        </div>

                        <div className={`rounded-lg border-2 border-stroke p-6 dark:border-strokedark bg-white dark:bg-boxdark ${isViewAllowed ? 'hover:shadow-lg' : 'opacity-50 cursor-not-allowed'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-meta-5/10">
                                    <Users className="h-6 w-6 text-meta-5" />
                                </div>
                                <h3 className="text-lg font-medium text-black dark:text-white">Manage Admins</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                View all system administrators and manage status/roles.
                            </p>
                            <button
                                onClick={() => setShowAllAdmins(true)}
                                disabled={!isViewAllowed}
                                className="w-full rounded bg-meta-5 py-2 px-4 text-white hover:bg-meta-5/90 transition-colors disabled:opacity-50 disabled:hover:bg-meta-5"
                            >
                                View/Manage
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 rounded-lg border-2 border-stroke p-6 dark:border-strokedark bg-white dark:bg-boxdark">
                        <h3 className="text-lg font-medium text-black dark:text-white mb-4">
                            Your Account Information
                        </h3>
                        {isProfileLoading ? (
                            <div className="text-center py-4">Loading...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoCard title="Name" value={profile?.name} />
                                <InfoCard title="Email" value={profile?.email} />
                                <InfoCard title="Created At" value={profile?.created_at} isDate={true} />
                                <InfoCard title="Last Updated" value={profile?.updated_at} isDate={true} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showEditProfile && <EditProfileModal profileData={profileData} setProfileData={setProfileData} mutation={updateProfileMutation} onClose={() => setShowEditProfile(false)} />}
            {showChangePassword && <ChangePasswordModal passwordData={passwordData} setPasswordData={setPasswordData} mutation={changePasswordMutation} showPasswords={showPasswords} setShowPasswords={setShowPasswords} onClose={() => setShowChangePassword(false)} />}
            {showCreateAdmin && <RoleCreationModal roles={roles} permissions={permissions} onClose={() => setShowCreateAdmin(false)} />}
            {showAllAdmins && isViewAllowed && adminsLoading && (
                 <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
                    <div className="text-white text-lg">Loading Admin Data...</div>
                </div>
            )}
            {showAllAdmins && isViewAllowed && !adminsLoading && (
             <AllAdminsModal admins={admins} profile={profile!} roles={roles} permissions={permissions} onClose={() => setShowAllAdmins(false)} />
            )}
        </DefaultLayout>
    );
}

const InfoCard = ({
    title,
    value,
    isDate = false,
}: {
    title: string;
    value?: string | boolean;
    isDate?: boolean;
}) => {
    let displayValue: string = value?.toString() || 'N/A';
    if (isDate && value && typeof value === 'string') {
        displayValue = formatDate(value);
    }

    return (
        <div className="p-4 rounded bg-gray-2 dark:bg-meta-4">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block">{title}</label>
            <p className="text-base mt-1 font-medium text-black dark:text-white">
                {displayValue}
            </p>
        </div>
    );
};


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
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-black dark:text-white">Edit Profile</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleUpdateProfile}>
                    <div className="mb-4">
                        <label className="mb-2.5 block text-black dark:text-white">Name</label>
                        <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="mb-2.5 block text-black dark:text-white">Email</label>
                        <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full rounded bg-primary py-3 px-6 text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                        {mutation.isPending ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

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
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-black dark:text-white">Change Password</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleChangePassword}>
                    <div className="mb-4">
                        <label className="mb-2.5 block text-black dark:text-white">Current Password</label>
                        <div className="relative">
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                className="absolute right-4 top-4"
                            >
                                {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="mb-2.5 block text-black dark:text-white">New Password</label>
                        <div className="relative">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                className="absolute right-4 top-4"
                            >
                                {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="mb-2.5 block text-black dark:text-white">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                className="absolute right-4 top-4"
                            >
                                {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full rounded bg-warning py-3 px-6 text-white hover:bg-warning/90 disabled:opacity-50"
                    >
                        {mutation.isPending ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};
