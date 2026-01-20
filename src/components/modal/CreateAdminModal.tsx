import React, { useState } from 'react';
import { ModalContainer } from './ModalContainer';
import Loader from '@/components/common/Loader';
import { Label } from '@/components/common/Typography';
import { Eye, EyeOff, ChevronDown, MinusCircle } from 'lucide-react';
import { CreateAdminData } from '@/types/auth';
import { SuperAdminRole } from '@/types/auth';
import { SuperAdminPermissions } from '@/types/auth';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: SuperAdminRole[];
  permissions: SuperAdminPermissions;
  rolesLoading: boolean;
  onSubmit: (data: CreateAdminData) => void;
  isLoading: boolean;
}

export const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  isOpen,
  onClose,
  roles,
  permissions,
  rolesLoading,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState<CreateAdminData>({
    email: '',
    password: '',
    name: '',
    role_id: roles.length > 0 ? roles[0].id : 0,
  });
  const [showPassword, setShowPassword] = useState(false);

  const isCreationAllowed =
    permissions.all?.includes('crud') ||
    permissions.super_admins?.includes('create');

  if (!isOpen) return null;

  if (!isCreationAllowed) {
    return (
      <ModalContainer
        isOpen={isOpen}
        onClose={onClose}
        title="Access Denied"
        size="sm"
      >
        <div className="text-center py-4 text-danger">
          <MinusCircle size={32} className="mx-auto mb-2" />
          <p className="text-base">
            You do not have permission to create new administrators.
          </p>
        </div>
      </ModalContainer>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password, name, role_id } = formData;

    if (!email || !password || !name || role_id === 0) {
      alert('Please fill all required fields and select a role');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    onSubmit(formData);
    setFormData({
      email: '',
      password: '',
      name: '',
      role_id: roles.length > 0 ? roles[0].id : 0,
    });
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Administrator"
      size="md"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label className="mb-2">Name</Label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label className="mb-2">Email</Label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            required
            disabled={isLoading}
          />
        </div>

        {rolesLoading ? (
          <div className="flex justify-center py-4">
            <Loader />
          </div>
        ) : (
          <div>
            <Label className="mb-2">Assign Role</Label>
            <div className="relative">
              <select
                value={formData.role_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role_id: parseInt(e.target.value),
                  })
                }
                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                required
                disabled={isLoading}
              >
                {roles.length === 0 && (
                  <option value={0} disabled>
                    No Roles Found
                  </option>
                )}
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute top-1/2 right-4 z-10 -translate-y-1/2 text-body" size={16} />
            </div>
          </div>
        )}

        <div>
          <Label className="mb-2">Password</Label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-body hover:text-black dark:hover:text-white p-1 transition-colors"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {formData.password.length > 0 && formData.password.length < 6 && (
            <p className="text-xs text-danger mt-1">
              Password must be at least 6 characters long.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg bg-bodydark1 dark:bg-meta-4 py-2.5 px-6 text-black dark:text-white hover:bg-bodydark dark:hover:bg-opacity-90 text-sm transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-success py-2.5 px-6 text-white hover:bg-success/90 disabled:opacity-50 text-sm transition-colors font-medium"
          >
            {isLoading ? 'Creating...' : 'Create Admin'}
          </button>
        </div>
      </form>
    </ModalContainer>
  );
};