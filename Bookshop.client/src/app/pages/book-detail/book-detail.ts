import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookModel } from '../../core/models/book.model';
import { CategoryModel } from '../../core/models/category.model';
import { ReviewModel, ReviewSummary } from '../../core/models/review.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { ReviewService } from '../../core/services/review.service';
import { SharedService } from '../../core/services/shared.service';
import { CartState } from '../../core/state/cart.state';
import { WishlistState } from '../../core/state/wishlist.state';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MmkCurrencyPipe, TranslatePipe],
  templateUrl: './book-detail.html',
})
export class BookDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly reviewService = inject(ReviewService);
  readonly sharedService = inject(SharedService);
  readonly cartService = inject(CartState);
  readonly wishlistService = inject(WishlistState);
  private readonly cdr = inject(ChangeDetectorRef);

  book: BookModel | null = null;
  categories: CategoryModel[] = [];
  quantity = 1;
  isLoading = false;

  // Reviews & Rating
  reviews: ReviewModel[] = [];
  reviewSummary: ReviewSummary = {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };
  isLoadingReviews = false;

  // Review Form
  newRating = 5;
  newComment = '';
  newReviewerName = '';
  isSubmittingReview = false;
  reviewFormError = '';
  reviewFormSuccess = '';

  ngOnInit(): void {
    this.categoryService.get().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.categories = (Array.isArray(res.data) ? res.data : (res.data.records || [])) as CategoryModel[];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });

    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.quantity = 1;
        this.isLoading = true;
        this.cdr.detectChanges();
        this.bookService.getById(id).subscribe({
          next: (res) => {
            if (res && res.data) {
              this.book = (Array.isArray(res.data) ? res.data[0] : res.data) as BookModel;
            } else {
              this.book = null;
            }
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.book = null;
            this.isLoading = false;
            this.cdr.detectChanges();
          },
        });
        this.loadReviews(id);
      }
    });
  }

  loadReviews(bookId: number): void {
    this.isLoadingReviews = true;
    this.reviewService.getByBookId(bookId).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.reviews = res.data.reviews || [];
          if (res.data.summary) {
            this.reviewSummary = res.data.summary;
          }
        }
        this.isLoadingReviews = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingReviews = false;
        this.cdr.detectChanges();
      },
    });
  }

  setRating(stars: number): void {
    this.newRating = stars;
  }

  submitReview(): void {
    if (!this.book) return;

    this.reviewFormError = '';
    this.reviewFormSuccess = '';

    const name = this.newReviewerName.trim() ||
      (this.sharedService.userNameSignal() !== 'Guest' ? this.sharedService.userNameSignal() : '') ||
      'Reader';

    this.isSubmittingReview = true;
    this.cdr.detectChanges();

    this.reviewService.create({
      bookId: this.book.id,
      rating: this.newRating,
      comment: this.newComment.trim(),
      userName: name,
    }).subscribe({
      next: (res) => {
        this.isSubmittingReview = false;
        if (res.success) {
          this.reviewFormSuccess = 'Thank you! Your review has been published.';
          this.newComment = '';
          this.newRating = 5;
          this.loadReviews(this.book!.id);
        } else {
          this.reviewFormError = res.message || 'Could not submit review.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmittingReview = false;
        this.reviewFormError = err.error?.message || 'Server error occurred while posting review.';
        this.cdr.detectChanges();
      },
    });
  }

  getRatingPercentage(stars: number): number {
    if (!this.reviewSummary.totalReviews) return 0;
    const count = this.reviewSummary.ratingDistribution[stars] || 0;
    return Math.round((count / this.reviewSummary.totalReviews) * 100);
  }

  toggleWishlist(): void {
    if (this.book) {
      this.wishlistService.toggleWishlist(this.book);
    }
  }

  isInWishlist(): boolean {
    return this.book ? this.wishlistService.isInWishlist(this.book.id) : false;
  }

  getCategoryName(id?: number): string {
    const cat = this.categories.find((c) => c.id === id);
    return cat ? cat.name : 'Literature';
  }

  incrementQuantity(): void {
    if (this.book && this.quantity < this.book.stockQuantity) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.book) {
      this.cartService.addToCart(this.book, this.quantity);
    }
  }

  buyNow(): void {
    if (this.book) {
      this.cartService.addToCart(this.book, this.quantity);
      this.router.navigate(['/checkout']);
    }
  }
}
