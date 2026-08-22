export interface ApiResponse<T = any> {
  success: boolean;
  statuscode: number;
  message: string;
  data: T;
}

export interface PaginatedResult<T> {
  records: T[];
  recordsTotal: number;
}
