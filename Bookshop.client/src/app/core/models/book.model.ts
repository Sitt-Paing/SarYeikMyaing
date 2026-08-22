import { Author } from './author.model';
import { Category } from './category.model';

export interface Book {
  id: number;
  title: string;
  authorId?: number | null;
  author?: Author | null;
  slug?: string | null;
  description?: string | null;
  originalPrice?: number | null;
  price: number;
  categoryId?: number | null;
  category?: Category | null;
  stockQuantity: number;
  imageUrl?: string | null;
  isbn?: string | null;
  publishedDate?: string | null;
  pageCount?: number | null;
  publisher?: string | null;
  language?: string | null;
  createdOn?: string;
  updatedOn?: string | null;
  deletedOn?: string | null;
  // UI helpers
  rating?: number;
  ratingCount?: number;
  badge?: string;
  isFeatured?: boolean;
}

export interface BookFilterParams {
  skipRows?: number;
  pageSize?: number;
  q?: string;
  sortField?: string;
  order?: number; // 1 for asc, -1 for desc
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}
