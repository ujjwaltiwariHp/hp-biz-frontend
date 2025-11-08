// src/utils/adminHelpers.ts
import { SuperAdminPermissions } from '@/types/auth';

export const hasPermission = (
  userPermissions: SuperAdminPermissions,
  resource: string,
  action: string
): boolean => {
  if (!userPermissions) return false;

  if (userPermissions.all && userPermissions.all.includes('crud')) {
    return true;
  }

  const allowedActions = userPermissions[resource];
  if (!allowedActions) return false;

  return allowedActions.includes(action) || allowedActions.includes('crud');
};

export const RESOURCE_MAP: { [key: string]: string } = {
  all: 'System-Wide Access',
  super_admins: 'Admin Users',
  companies: 'Company Management',
  subscriptions: 'Subscription Packages',
  payments: 'Payment Records',
  invoices: 'Invoices',
  super_admin_roles: 'Admin Roles',
};

export const ACTION_MAP: { [key: string]: string } = {
  crud: 'Full CRUD',
  view: 'View/Read',
  create: 'Create/Add',
  update: 'Update/Edit',
  delete: 'Delete/Remove',
};

export const checkPermissionAllowed = (
  permissions: SuperAdminPermissions,
  resource: string,
  action: string
): boolean => {
  return hasPermission(permissions, resource, action);
};
