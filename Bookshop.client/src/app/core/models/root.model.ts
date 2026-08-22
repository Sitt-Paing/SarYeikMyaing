export interface RootModel<T = any> {
  message: any;
  success: boolean;
  meta?: any;
  statuscode?: number;
  statusCode?: number;
  code?: number;
  data: T;
  error?: any;
}
