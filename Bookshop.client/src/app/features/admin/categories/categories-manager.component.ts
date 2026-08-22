import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-categories-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule],
  templateUrl: './categories-manager.component.html',
  styleUrl: './categories-manager.component.scss',
})
export class CategoriesManagerComponent implements OnInit {
  readonly categoryService = inject(CategoryService);
  private readonly notification = inject(NotificationService);

  isDialogVisible = false;
  isEditMode = false;
  isSaving = false;
  currentCategory: Partial<Category> = {};

  ngOnInit(): void {
    this.categoryService.loadCategories().subscribe();
  }

  openNewCategoryDialog(): void {
    this.isEditMode = false;
    this.currentCategory = {
      name: '',
      description: '',
      icon: 'pi-tag',
    };
    this.isDialogVisible = true;
  }

  editCategory(cat: Category): void {
    this.isEditMode = true;
    this.currentCategory = { ...cat };
    this.isDialogVisible = true;
  }

  saveCategory(): void {
    if (!this.currentCategory.name?.trim()) {
      this.notification.warn('Required', 'Category name is required.');
      return;
    }

    this.isSaving = true;

    if (this.isEditMode && this.currentCategory.id) {
      this.categoryService.updateCategory(this.currentCategory.id, this.currentCategory).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.isDialogVisible = false;
          }
        },
        error: () => {
          this.isSaving = false;
        }
      });
    } else {
      this.categoryService.createCategory(this.currentCategory).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.isDialogVisible = false;
          }
        },
        error: () => {
          this.isSaving = false;
        }
      });
    }
  }

  deleteCategory(cat: Category): void {
    if (confirm(`Are you sure you want to delete "${cat.name}"?`)) {
      this.categoryService.deleteCategory(cat.id).subscribe();
    }
  }

  seedStandardCategories(): void {
    const standardCategories: Array<{ name: string; description: string; icon: string }> = [
      { name: 'မြန်မာဝတ္ထုနှင့် ရသစာပေ (Myanmar Novels)', description: 'မြန်မာစာပေ ဝတ္ထုရှည်နှင့် ဝတ္ထုတိုများ', icon: 'pi-book' },
      { name: 'ဘာသာပြန် ဝတ္ထုများ (Translations)', description: 'နိုင်ငံတကာ ကမ္ဘာကျော် ဘာသာပြန်စာပေများ', icon: 'pi-globe' },
      { name: 'အောင်မြင်ရေးနှင့် စိတ်ခွန်အား (Self-Help)', description: 'စိတ်ခွန်အားဖြည့်နှင့် ဘဝလမ်းညွှန် စာအုပ်များ', icon: 'pi-compass' },
      { name: 'စီးပွားရေးနှင့် စီမံခန့်ခွဲမှု (Business)', description: 'စီးပွားရေး၊ ရင်းနှီးမြှုပ်နှံမှုနှင့် ခေါင်းဆောင်မှု', icon: 'pi-chart-line' },
      { name: 'ကလေးစာပေနှင့် ရုပ်ပြ (Children & Comics)', description: 'ကလေးပုံပြင်၊ ပညာပေးနှင့် ရုပ်ပြကာတွန်းများ', icon: 'pi-star' },
      { name: 'ကျန်းမာရေးနှင့် စိတ်ပညာ (Health & Psychology)', description: 'ကိုယ်စိတ်ကျန်းမာရေးနှင့် စိတ်ပညာစာအုပ်များ', icon: 'pi-heart' },
    ];

    for (const cat of standardCategories) {
      this.categoryService.createCategory(cat).subscribe();
    }
  }
}
