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
  message: string;
  data: {
    users: UserListItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
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
