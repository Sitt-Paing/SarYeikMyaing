export interface UserModel {
  id: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  roles?: string[];
}

export interface LoginModel {
  userNameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterModel {
  userName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword?: string;
  role?: string;
}

export interface TokenModel {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: UserModel;
}
