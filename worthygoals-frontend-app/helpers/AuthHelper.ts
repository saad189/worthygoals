import { ACCESS_TOKEN, REFRESH_TOKEN, ID_TOKEN, USER_PROFILE, } from "@/constants";
import SecureStorage from '@/helpers/SecureStorageUtil';


export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const emailValidator = (email: string) => {
    if (!email) return "Email can't be empty."
    if (!validateEmail(email)) return 'Ooops! We need a valid email address.'
    return ''
}

export const passwordValidator = (password: string) => {
    if (!password) return "Password can't be empty."
    // Activate later
    return validatePassword(password).join('\n');
}

export const repeatPasswordValidator = (password: string, repeatPassword: string) => {
    return password !== repeatPassword ? 'Passwords do not match.' : '';
}

export const nameValidator = (name: string) => {
    if (!name) return "Name can't be empty";
    return '';
}


export const validatePassword = (password: string): string[] => {
    const minLength = /.{8,}/;
    const hasNumber = /[0-9]/;
    const hasUppercase = /[A-Z]/;
    const hasLowercase = /[a-z]/;
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/;

    const errors: string[] = [];

    if (!minLength.test(password)) errors.push('Password must be at least 8 characters long.');
    if (!hasNumber.test(password)) errors.push('Password must contain at least one number.');
    if (!hasUppercase.test(password)) errors.push('Password must contain at least one uppercase letter.');
    if (!hasLowercase.test(password)) errors.push('Password must contain at least one lowercase letter.');
    if (!hasSymbol.test(password)) errors.push('Password must contain at least one special character.');

    return errors;
};


export const clearTokens = async () => {
    await Promise.all([
        SecureStorage.removeItem(ACCESS_TOKEN),
        SecureStorage.removeItem(REFRESH_TOKEN),
        SecureStorage.removeItem(ID_TOKEN),
        SecureStorage.removeItem(USER_PROFILE),
    ]);
}