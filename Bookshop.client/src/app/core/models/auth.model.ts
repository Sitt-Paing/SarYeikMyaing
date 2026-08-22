export interface User {
  id: string | number;
  userName: string;
  email: string;
  phoneNumber?: string;
  roles?: string[];
  token?: string;
}

export interface LoginDto {
  userNameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  userName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword?: string;
  role?: string; // 'User' | 'Admin' | 'DevAdmin'
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken?: string;
  refreshTokenExpiry?: string;
  user?: User;
}
