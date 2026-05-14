export interface UserRole {
    name: string;
    id: number;
    permissions: UserPermission[];
}

export interface UserPermission {
    name: string;
    id: number;
}