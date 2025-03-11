export const formatErrorMessage = (error: any): string => {
    let errorMessage = 'Something went wrong!';

    if (error.response && error.response.data) {
        const message = error.response.data.message;
        if (Array.isArray(message)) {
            errorMessage = message.join(', ');
        } else if (typeof message === 'string') {
            errorMessage = message;
        }
    }
    else {
        errorMessage = error.message;
    }

    return errorMessage;
};
