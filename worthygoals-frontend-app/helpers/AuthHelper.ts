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
    //  if (!validatePassword(password)) return 'Password not valid.'
    return ''
}

export const nameValidator = (name: string) => {
    if (!name) return "Name can't be empty";
    return '';
}


export const validatePassword = (password: string): boolean => {
    const minLength = /.{8,}/;
    const hasNumber = /[0-9]/;
    const hasUppercase = /[A-Z]/;
    const hasLowercase = /[a-z]/;
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/;

    return (
        minLength.test(password) &&
        hasNumber.test(password) &&
        hasUppercase.test(password) &&
        hasLowercase.test(password) &&
        hasSymbol.test(password)
    );
};
