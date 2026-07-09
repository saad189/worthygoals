import { LocationCoordinates } from "./location.interface";


export interface UserModel {
    firstName: string;
    lastName: string;
    email: string;
    id: number;
    localtion: LocationCoordinates;
    role: UserRole;
    age: number;
    /** Onboarding tone preference (soft | firm | intense); null until chosen. */
    tone?: string | null;
    /** Onboarding-matched mentor (personality slug); null until chosen. */
    personalityId?: string | null;
}

export interface CreateUserModel {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date;
    gender: string;
    latitude?: number;
    longitude?: number;
}

export interface UserRole {
    name: string;
    id: number;
    permissions: UserPermission[];
}

export interface UserPermission {
    name: string;
    id: number;
}