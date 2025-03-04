export interface LoginInfo {
    email: string;
    password: string;
}

export interface RememberLoginInfo {
    loginInfo: LoginInfo;
    rememberMe: boolean;
}

export interface SignUpInfo extends LoginInfo {
    repeatedPassword: string;
}

export interface JwtPayload {
    email: string;
    id: number;
}

export interface AuthTokens {
    accessToken: string;
    idToken: string;
    refreshToken: string;
}

export interface ConfirmSignUpModel {
    email: string;
    code: string;
}

export interface ConfirmPasswordModel extends ConfirmSignUpModel {
    password: string;
    repeatedPassword: string;
}
