export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  message: string;
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
