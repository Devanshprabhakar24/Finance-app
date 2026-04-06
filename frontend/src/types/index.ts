// Central types file
export type UserRole = 'ADMIN' | 'ANALYST' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  profileImage?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}
