export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateAdminData {
  email: string;
  password: string;
  name: string;
  role_id: number;
}

export interface UpdateProfileData {
  email?: string;
  name?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SuperAdminPermissions {
  [key: string]: string[];
}

export type AdminRoleName = string;

export interface SuperAdmin {
  id: number;
  email: string;
  name: string;
  status: 'active' | 'inactive';
  is_super_admin: boolean;
  super_admin_role_id: number | null;
  role_name: AdminRoleName;
  created_at: string;
  updated_at: string;
  permissions: SuperAdminPermissions;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    superAdmin: SuperAdmin;
  };
  meta: {
    timezone: string;
    timezone_abbr: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: SuperAdmin;
  meta: {
    timezone: string;
    timezone_abbr: string;
  };
}

export interface AdminListResponse {
  success: boolean;
  message: string;
  data: {
    superAdmins: SuperAdmin[];
  };
  meta: {
    timezone: string;
    timezone_abbr: string;
  };
}

export interface SuperAdminRole {
  id: number;
  role_name: string;
  description: string;
  permissions: SuperAdminPermissions;
}

export interface RolesResponse {
  success: boolean;
  message: string;
  data: {
    roles: SuperAdminRole[];
  };
  meta: {
    timezone: string;
    timezone_abbr: string;
  };
}

export interface UpdateRolePermissionsData {
  permissions: SuperAdminPermissions;
}

export interface DeleteAdminResponse {
  success: boolean;
  message: string;
  data: object;
  meta: {
    timezone: string;
    timezone_abbr: string;
  };
}

export interface ToggleStatusResponse {
  success: boolean;
  message: string;
  data: {
    superAdmin: SuperAdmin;
  };
  meta: {
    timezone: string;
    timezone_abbr: string;
  };
}