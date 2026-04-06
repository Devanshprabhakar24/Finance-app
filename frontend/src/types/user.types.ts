export interface UserListItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE';
  profileImage?: string;
  createdAt: string;
}

export interface UserListResponse {
  success: boolean;
  message: string;
  data: UserListItem[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface UserStatsResponse {
  message: string;
  data: {
    total: number;
    active: number;
    inactive: number;
    byRole: {
      ADMIN: number;
      ANALYST: number;
      VIEWER: number;
    };
  };
}
