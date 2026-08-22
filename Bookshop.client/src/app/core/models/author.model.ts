export interface AuthorModel {
  id: number;
  name: string;
  biography?: string;
  imageUrl?: string;
  isActive?: boolean;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
  deletedOn?: string;
}
