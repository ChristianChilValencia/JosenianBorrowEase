import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Item } from '../../models/item.model';
import { ItemService } from '../../services/item.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, OnDestroy {
  departmentFilter: string = 'all';
  items: Item[] = [];
  filteredItems: Item[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  private itemsSubscription: Subscription | null = null;

  constructor(
    private itemService: ItemService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadItems();
    this.setupItemsSubscription();
  }

  ngOnDestroy() {
    if (this.itemsSubscription) {
      this.itemsSubscription.unsubscribe();
    }
  }

  private setupItemsSubscription() {
    this.itemsSubscription = this.itemService.items$.subscribe(items => {
      this.items = items;
      this.filterItems();
    });
  }

  async loadItems() {
    this.isLoading = true;
    try {
      await this.itemService.getAllItems();
      this.filterItems();
    } catch (error) {
      console.error('Error loading items:', error);
      // this.showToast('Failed to load items. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  filterItems() {
    if (this.departmentFilter === 'all') {
      this.filteredItems = this.items;
    } else {
      this.filteredItems = this.items.filter(item => 
        item.department === this.departmentFilter
      );
    }

    // Apply search filter if there is a search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      this.filteredItems = this.filteredItems.filter(item => 
        item.name.toLowerCase().includes(term) || 
        item.description.toLowerCase().includes(term) ||
        item.productCode.toLowerCase().includes(term)
      );
    }
  }

  onDepartmentChange(department: string) {
    this.departmentFilter = department;
    this.filterItems();
  }

  onSearch(event: any) {
    this.searchTerm = event.detail.value;
    this.filterItems();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterItems();
  }

  viewItem(item: Item) {
    this.router.navigate(['/tabs/item', item.id]);
  }

  async refreshItems(event: any) {
    try {
      await this.itemService.getAllItems();
      this.filterItems();
    } catch (error) {
      console.error('Error refreshing items:', error);
      this.showToast('Failed to refresh items. Please try again.');
    } finally {
      event.target.complete();
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
