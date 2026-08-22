import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'books',
    loadComponent: () => import('./pages/shop/shop').then((m) => m.Shop),
  },
  {
    path: 'books/:id',
    loadComponent: () => import('./pages/book-detail/book-detail').then((m) => m.BookDetail),
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart').then((m) => m.Cart),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders').then((m) => m.Orders),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./pages/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'books',
        loadComponent: () => import('./pages/master/books/books').then((m) => m.Books),
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/master/categories/categories').then((m) => m.Categories),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
