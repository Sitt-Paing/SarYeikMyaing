import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BookModel } from '../../core/models/book.model';
import { CategoryModel } from '../../core/models/category.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { CartState } from '../../core/state/cart.state';
import { BookCard } from '../../shared/components/book-card/book-card';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';

export interface VendorItem {
  id: number;
  name: string;
  badge: string;
  avatarColor: string;
  booksCount: number;
  rating: number;
  covers: string[];
}

export interface BlogPostItem {
  id: number;
  title: string;
  date: string;
  category: string;
  imageUrl: string;
  summary?: string;
  readTime?: string;
}

export interface CategorySlide {
  id: number;
  name: string;
  burmeseName: string;
  icon: string;
  coverImage: string;
  bgColor: string;
  itemCount: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BookCard, MmkCurrencyPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  readonly cartService = inject(CartState);
  private readonly router = inject(Router);

  books = signal<BookModel[]>([]);
  categories = signal<CategoryModel[]>([]);
  subscribedEmail = '';
  newsletterSuccess = signal(false);
  activeHeroIndex = signal(0);

  // Category Shelf Carousel Items
  readonly categorySlides: CategorySlide[] = [
    {
      id: 1,
      name: 'Mystery & Thriller',
      burmeseName: 'သည်းထိတ်ရင်ဖို',
      icon: 'pi-compass',
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
      bgColor: 'from-amber-500/20 to-orange-500/10',
      itemCount: 142,
    },
    {
      id: 2,
      name: 'Fantasy & Sci-Fi',
      burmeseName: 'စိတ်ကူးယဉ်နှင့် သိပ္ပံ',
      icon: 'pi-bolt',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
      bgColor: 'from-brand-500/20 to-sky-500/10',
      itemCount: 98,
    },
    {
      id: 3,
      name: 'Business & Finance',
      burmeseName: 'စီးပွားရေးနှင့် စီမံခန့်ခွဲမှု',
      icon: 'pi-chart-line',
      coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80',
      bgColor: 'from-emerald-500/20 to-teal-500/10',
      itemCount: 86,
    },
    {
      id: 4,
      name: 'Self-Help & Mindset',
      burmeseName: 'ဘဝအောင်မြင်ရေး',
      icon: 'pi-heart',
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80',
      bgColor: 'from-purple-500/20 to-indigo-500/10',
      itemCount: 120,
    },
    {
      id: 5,
      name: 'Literature & Novels',
      burmeseName: 'ရသစာပေနှင့် ဝတ္ထုရှည်',
      icon: 'pi-book',
      coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
      bgColor: 'from-rose-500/20 to-pink-500/10',
      itemCount: 215,
    },
    {
      id: 6,
      name: 'History & Biography',
      burmeseName: 'သမိုင်းနှင့် အတ္ထုပ္ပတ္တိ',
      icon: 'pi-globe',
      coverImage: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=400&q=80',
      bgColor: 'from-cyan-500/20 to-blue-500/10',
      itemCount: 74,
    },
  ];

  // Top Selling Vendors / Publishers
  readonly topVendors: VendorItem[] = [
    {
      id: 1,
      name: 'စိတ်ကူးချိုချို စာပေ (Seikku Cho Cho)',
      badge: 'SC',
      avatarColor: 'bg-purple-600',
      booksCount: 145,
      rating: 4.9,
      covers: [
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&q=80',
      ],
    },
    {
      id: 2,
      name: 'လွင်ဦးစာပေ (Lwin Oo Books)',
      badge: 'LO',
      avatarColor: 'bg-brand-600',
      booksCount: 98,
      rating: 4.8,
      covers: [
        'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=200&q=80',
      ],
    },
    {
      id: 3,
      name: 'ရန်အောင်စာပေ (Yan Aung Publishing)',
      badge: 'YA',
      avatarColor: 'bg-emerald-600',
      booksCount: 112,
      rating: 4.9,
      covers: [
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=200&q=80',
      ],
    },
    {
      id: 4,
      name: 'ပညာရွှေတောင် စာအုပ်တိုက်',
      badge: 'PY',
      avatarColor: 'bg-amber-600',
      booksCount: 84,
      rating: 4.7,
      covers: [
        'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80',
      ],
    },
  ];

  // Blog posts
  readonly blogPostsLeft: BlogPostItem[] = [
    {
      id: 1,
      title: '၂၀၂၆ ခုနှစ်အတွက် လက်မလွှတ်သင့်သော ရသဝတ္ထုရှည် (၅) အုပ်',
      date: 'MAY 14, 2026',
      category: 'စာပေသုံးသပ်ချက်',
      imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 2,
      title: 'စာဖတ်အားကောင်းလာစေရန် အလေ့အကျင့်ကောင်းများ မွေးမြူနည်း',
      date: 'MAY 08, 2026',
      category: 'ဘဝနေထိုင်မှု',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 3,
      title: 'စာပေလောက၏ ရှားပါးစာအုပ်များ စုဆောင်းထိန်းသိမ်းခြင်း အနုပညာ',
      date: 'APR 29, 2026',
      category: 'အထွေထွေ ဗဟုသုတ',
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=300&q=80',
    },
  ];

  readonly featuredBlog: BlogPostItem = {
    id: 4,
    title: 'စာရေးဆရာများနှင့် လူငယ်စာဖတ်သူများ၏ အတွေးအမြင် ဖလှယ်ပွဲ အထူးဆောင်းပါး',
    date: 'OCTOBER 21, 2026',
    category: 'စာရေးဆရာ အင်တာဗျူး',
    imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    summary:
      'စာပေဖန်တီးသူများ၏ အတွေးအခေါ်နှင့် မျက်မှောက်ခေတ် လူငယ်များ စာပေဖတ်ရှုမှု အလေ့အထ တိုးတက်လာရေး ဆွေးနွေးချက်များ...',
    readTime: '6 MIN READ',
  };

  readonly blogPostsRight: BlogPostItem[] = [
    {
      id: 5,
      title: 'ကလေးငယ်များအတွက် စိတ်ကူးဉာဏ် ဖွံ့ဖြိုးစေမည့် ကလေးပုံပြင် စာအုပ်များ',
      date: 'MAY 02, 2026',
      category: 'ကလေးစာပေ',
      imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 6,
      title: 'စီးပွားရေးနှင့် ရင်းနှီးမြှုပ်နှံမှု အခြေခံ နားလည်စေမည့် လမ်းညွှန်များ',
      date: 'APR 20, 2026',
      category: 'စီးပွားရေး',
      imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 7,
      title: 'ဘာသာပြန်စာပေ၏ အလှနှင့် မူရင်းစာအုပ်များ၏ ရသကွာခြားချက်များ',
      date: 'APR 12, 2026',
      category: 'ဘာသာပြန်',
      imageUrl: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=300&q=80',
    },
  ];

  // Publisher Logos
  readonly publisherLogos = [
    { name: 'Seikku Cho Cho', icon: 'pi-bookmark-fill' },
    { name: 'Lwin Oo Books', icon: 'pi-compass' },
    { name: 'Yan Aung Publishing', icon: 'pi-star-fill' },
    { name: 'Pyinnyar Shwe Taung', icon: 'pi-bolt' },
    { name: 'Sar Oak Sin Classic', icon: 'pi-verified' },
    { name: 'Knowledge House', icon: 'pi-globe' },
  ];

  // Community Reader Photos
  readonly readerPhotos = [
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=400&q=80',
  ];

  // Fallback / Curated Books Data for full richness
  readonly curatedBooks: BookModel[] = [
    {
      id: 101,
      title: 'The Butcher & The Wren',
      authorId: 1,
      authorName: 'Alaina Urquhart',
      publisher: 'Zando Books',
      isbn: '978-1638930129',
      price: 18500,
      originalPrice: 24000,
      stockQuantity: 15,
      categoryId: 1,
      categoryName: 'Mystery',
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 102,
      title: 'The Secrets We Keep',
      authorId: 2,
      authorName: 'Kate Hewitt',
      publisher: 'Bookouture',
      isbn: '978-1800192345',
      price: 16000,
      originalPrice: 21000,
      stockQuantity: 12,
      categoryId: 1,
      categoryName: 'Thriller',
      imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 103,
      title: 'Shadow & Bone',
      authorId: 3,
      authorName: 'Leigh Bardugo',
      publisher: 'Henry Holt',
      isbn: '978-1250027436',
      price: 19500,
      originalPrice: 26000,
      stockQuantity: 20,
      categoryId: 2,
      categoryName: 'Fantasy',
      imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 104,
      title: 'Broken: In the Best Possible Way',
      authorId: 4,
      authorName: 'Jenny Lawson',
      publisher: 'Henry Holt & Co',
      isbn: '978-1250077035',
      price: 15500,
      originalPrice: 20000,
      stockQuantity: 8,
      categoryId: 4,
      categoryName: 'Humor & Memoir',
      imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 105,
      title: 'The Words In My Hands',
      authorId: 5,
      authorName: 'Asphyxia',
      publisher: 'Annick Press',
      isbn: '978-1773215280',
      price: 17000,
      originalPrice: 22500,
      stockQuantity: 14,
      categoryId: 2,
      categoryName: 'Young Adult',
      imageUrl: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 106,
      title: 'Enceladus: Hard Science Fiction',
      authorId: 6,
      authorName: 'Brandon Q. Morris',
      publisher: 'Amphibian Press',
      isbn: '978-1980838845',
      price: 16500,
      originalPrice: 21000,
      stockQuantity: 10,
      categoryId: 2,
      categoryName: 'Sci-Fi',
      imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 107,
      title: 'Travel Tales of Burma',
      authorId: 7,
      authorName: 'မောင်သာနိုး',
      publisher: 'စိတ်ကူးချိုချို စာပေ',
      isbn: '978-9997100012',
      price: 12000,
      originalPrice: 15000,
      stockQuantity: 25,
      categoryId: 5,
      categoryName: 'Travel & Culture',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 108,
      title: 'Holy Cow: An American Story',
      authorId: 8,
      authorName: 'David Duchovny',
      publisher: 'Farrar, Straus and Giroux',
      isbn: '978-0374172077',
      price: 14500,
      originalPrice: 18000,
      stockQuantity: 18,
      categoryId: 5,
      categoryName: 'Literature',
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 109,
      title: 'Search Light in the Dark',
      authorId: 9,
      authorName: 'ဆရာဖေမြင့်',
      publisher: 'လွင်ဦးစာပေ',
      isbn: '978-9997100043',
      price: 13500,
      originalPrice: 16000,
      stockQuantity: 30,
      categoryId: 4,
      categoryName: 'Self-Improvement',
      imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 110,
      title: 'Ancient History of Myanmar',
      authorId: 10,
      authorName: 'ဒေါက်တာသန်းထွန်း',
      publisher: 'ရန်အောင်စာပေ',
      isbn: '978-9997100050',
      price: 22000,
      originalPrice: 28000,
      stockQuantity: 12,
      categoryId: 6,
      categoryName: 'History',
      imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 111,
      title: 'Love Myself First',
      authorId: 11,
      authorName: 'Dr. Kristin Neff',
      publisher: 'William Morrow',
      isbn: '978-0061733529',
      price: 15000,
      originalPrice: 19000,
      stockQuantity: 16,
      categoryId: 4,
      categoryName: 'Psychology',
      imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 112,
      title: 'Healing Through Mindfulness',
      authorId: 12,
      authorName: 'Jon Kabat-Zinn',
      publisher: 'Hachette Books',
      isbn: '978-1401307783',
      price: 18000,
      originalPrice: 23000,
      stockQuantity: 9,
      categoryId: 4,
      categoryName: 'Mindfulness',
      imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
    },
  ];

  ngOnInit(): void {
    this.bookService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const fetched = (res.data.records || res.data || []) as BookModel[];
          if (fetched && fetched.length > 0) {
            this.books.set([...fetched, ...this.curatedBooks]);
          } else {
            this.books.set(this.curatedBooks);
          }
        } else {
          this.books.set(this.curatedBooks);
        }
      },
      error: () => {
        this.books.set(this.curatedBooks);
      },
    });

    this.categoryService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categories.set(res.data as CategoryModel[]);
        }
      },
    });
  }

  get favouriteBooksCenter(): BookModel[] {
    return this.books().slice(0, 2);
  }

  get favouriteBooksLeft(): BookModel[] {
    return this.books().slice(2, 6);
  }

  get favouriteBooksRight(): BookModel[] {
    return this.books().slice(6, 10);
  }

  get trendingBooks(): BookModel[] {
    return this.books().slice(0, 4);
  }

  get bestsellingBooks(): BookModel[] {
    return this.books().slice(4, 8);
  }

  get popularBooks(): BookModel[] {
    return this.books().slice(8, 12);
  }

  onAddToCart(book: BookModel, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.cartService.addToCart(book, 1);
  }

  onSubscribeNewsletter(event: Event): void {
    event.preventDefault();
    if (this.subscribedEmail && this.subscribedEmail.includes('@')) {
      this.newsletterSuccess.set(true);
      setTimeout(() => {
        this.newsletterSuccess.set(false);
        this.subscribedEmail = '';
      }, 4000);
    }
  }

  scrollCategory(direction: 'prev' | 'next'): void {
    const el = document.getElementById('category-carousel-track');
    if (el) {
      const scrollAmount = direction === 'next' ? 320 : -320;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
}

