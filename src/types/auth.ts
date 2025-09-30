export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateAdminData {
  email: string;
  password: string;
  name: string;
}

export interface UpdateProfileData {
  email?: string;
  name?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  superAdmin: SuperAdmin;
}

export interface SuperAdmin {
  id: number;
  email: string;
  name: string;
  role?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AdminListResponse {
  success: boolean;
  superAdmins: SuperAdmin[];
}

export interface ProfileResponse {
  success: boolean;
  superAdmin: SuperAdmin;
}