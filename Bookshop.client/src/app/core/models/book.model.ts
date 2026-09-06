export interface BookModel {
  id: number;
  title: string;
  author?: string;
  authorId?: number;
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

export const CURATED_BOOKS: BookModel[] = [
  {
    id: 101,
    title: 'The Butcher & The Wren',
    authorId: 1,
    authorName: 'Alaina Urquhart',
    publisher: 'Zando Books',
    isbn: '978-1638930129',
    description: 'A gripping forensic medical examiner and serial killer thriller set in the Louisiana bayou.',
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
    description: 'A heartbreaking, emotional psychological suspense novel about family secrets.',
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
    description: 'The explosive fantasy adventure of the Grishaverse.',
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
    description: 'An honest, hilarious look at mental health and finding joy in tough times.',
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
    description: 'An inspiring near-future coming of age story about resilience and art.',
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
    description: 'A deep space scientific expedition to Saturn\'s moon Enceladus.',
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
    description: 'မြန်မာနိုင်ငံ အနှံ့အပြား ခရီးသွား မှတ်တမ်းနှင့် ယဉ်ကျေးမှု ရသစာပေ။',
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
    description: 'A delightful modern fable full of wit, humor, and wisdom.',
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
    description: 'ဘဝအောင်မြင်ရေးနှင့် စိတ်ဓာတ်ခွန်အားဖြည့် အတွေးအမြင် စာစုများ။',
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
    description: 'သမိုင်းပါမောက္ခ ဒေါက်တာသန်းထွန်း၏ မြန်မာ့ရှေးဟောင်း သမိုင်းသုတေသန။',
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
    description: 'The proven power of being kind to yourself and building emotional resilience.',
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
    description: 'Mindfulness techniques for overcoming anxiety, pain, and stress.',
    price: 18000,
    originalPrice: 23000,
    stockQuantity: 9,
    categoryId: 4,
    categoryName: 'Mindfulness',
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
  },
];

