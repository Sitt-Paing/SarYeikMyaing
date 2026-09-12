export interface ReviewModel {
  id: number;
  bookId: number;
  userId?: string;
  userName: string;
  rating: number;
  comment?: string;
  createdOn: string;
}

export interface ReviewDistribution {
  [key: number]: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: ReviewDistribution;
}

export interface BookReviewsResponse {
  reviews: ReviewModel[];
  summary: ReviewSummary;
}

export interface CreateReviewRequest {
  bookId: number;
  rating: number;
  comment?: string;
  userName?: string;
}
