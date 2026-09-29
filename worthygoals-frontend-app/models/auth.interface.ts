export interface LoginInfo {
    email: string;
    password: string;
}

/**
 * What "remember me" persists: the email to prefill, and the checkbox state.
 *
 * It used to hold the full LoginInfo, i.e. the user's plaintext password, with
 * no expiry — and on web that lands in localStorage. Silent refresh works off
 * the Cognito refresh token, so the password was never needed.
 */
export interface RememberLoginInfo {
    email: string;
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
