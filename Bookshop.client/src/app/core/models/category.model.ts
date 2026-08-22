export interface Category {
  id: number;
  name: string;
  description?: string | null;
  icon?: string;
  bookCount?: number;
  createdOn?: string;
  updatedOn?: string | null;
  deletedOn?: string | null;
}
