export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SuperAdmin {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    admin: SuperAdmin;
    token: string;
  };
}