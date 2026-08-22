export interface BookModel {
  id: number;
  title: string;
  authorId: number;
  authorName?: string;
  slug?: string;
  isbn: string;
  description?: string;
  originalPrice: number;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  categoryId: number;
  categoryName?: string;
  publishedDate?: string;
  pageCount?: number;
  publisher?: string;
  language?: string;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
  deletedOn?: string;
}

export interface BookFilterParams {
  skipRows?: number;
  pageSize?: number;
  q?: string;
  categoryId?: number;
  sortField?: string;
  order?: number;
}
