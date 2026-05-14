
import { DecodedToken } from '@/models';
import { jwtDecode } from 'jwt-decode';

export const decodeJwtToken = (token: string): DecodedToken => {
    return jwtDecode<DecodedToken>(token);
};

export const isTimeNearExpiry = (exp: number, offsetSeconds = 60): boolean => {
    try {
        const currentTime = Date.now() / 1000; // current time in seconds
        return exp < currentTime + offsetSeconds;
    } catch (error) {
        // If decoding fails, consider the token as expired
        return true;
    }
};
