// src/components/modals/PermissionsModal.tsx
import React from 'react';
import { ModalContainer } from './ModalContainer';
import { SuperAdminRole } from '@/types/auth';
import { Shield } from 'lucide-react';

const RESOURCE_MAP: { [key: string]: string } = {
  all: 'System-Wide Access',
  super_admins: 'Admin Users',
  companies: 'Company Management',
  subscriptions: 'Subscription Packages',
  payments: 'Payment Records',
  invoices: 'Invoices',
  super_admin_roles: 'Admin Roles',
};

const ACTION_MAP: { [key: string]: string } = {
  crud: 'Full CRUD',
  view: 'View/Read',
  create: 'Create/Add',
  update: 'Update/Edit',
  delete: 'Delete/Remove',
};

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: SuperAdminRole | null;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  role,
}) => {
  if (!role) return null;

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={`Permissions: ${role.role_name}`}
      size="md"
    >
      <div className="space-y-3">
        {Object.entries(role.permissions)
          .sort()
          .map(([resource, actions]) => (
            <div
              key={resource}
              className="p-3 rounded-md bg-gray-2 dark:bg-meta-4 border border-stroke dark:border-strokedark"
            >
              <h4 className="font-semibold text-black dark:text-white mb-2 text-sm flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                {RESOURCE_MAP[resource] || resource.toUpperCase()}
              </h4>
              <div className="flex flex-wrap gap-2">
                {(actions as string[]).map((action: string) => (
                  <span
                    key={action}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {ACTION_MAP[action] || action.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>
    </ModalContainer>
  );
};