import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController, ActionSheetController, ModalController } from '@ionic/angular';
import { Item, BorrowRequest, User } from '../../models/item.model';
import { ItemService } from '../../services/item.service';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CrudComponent } from '../../components/crud/crud.component';

@Component({
  selector: 'app-approver',
  templateUrl: './approver.page.html',
  styleUrls: ['./approver.page.scss'],
  standalone: false,
})
export class ApproverPage implements OnInit, OnDestroy {
  segmentValue: string = 'pendingRequests';
  
  pendingRequests: BorrowRequest[] = [];
  items: Item[] = [];
  filteredItems: Item[] = []; // For the search functionality in Manage Items
  
  // Demo user for single-user mode
  user: User = {
    uid: 'demo-user-id',
    email: 'demo@josenian.edu',
    displayName: 'Demo User',
    role: 'approver',
    department: 'IMC'
  };
  
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  
  // Available item images with full paths
  imageOptions: { path: string; name: string }[] = [
    { path: '/assets/items/cables.png', name: 'Cables' },
    { path: '/assets/items/hdmi-adapter.png', name: 'HDMI Adapter' },
    { path: '/assets/items/laptop.png', name: 'Laptop' },
    { path: '/assets/items/monitor.png', name: 'Monitor' },
    { path: '/assets/items/projector.png', name: 'Projector' },
    { path: '/assets/items/scissors.png', name: 'Scissors' },
    { path: '/assets/items/default-item.png', name: 'Default Item' },
  ];
  
  // Department options
  departmentOptions = ['IMC', 'SCS', 'PAO'];
  
  // Status options
  statusOptions = ['available', 'in_use', 'maintenance', 'reserved'];
  
  private requestsSubscription: Subscription | null = null;
  private itemsSubscription: Subscription | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private itemService: ItemService,
    private requestService: RequestService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private router: Router,
    private modalController: ModalController
  ) {}

  // Search items
  async searchItems(event: any) {
    const query = event.detail.value?.toLowerCase() || '';
    this.filteredItems = this.items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.productCode.toLowerCase().includes(query)
    );
  }

  // Format date for display
  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  // Open CRUD modal for adding a new item
  async openAddItemModal() {
    const modal = await this.modalController.create({
      component: CrudComponent,
      componentProps: {
        departmentOptions: this.departmentOptions,
        statusOptions: this.statusOptions,
        imageOptions: this.imageOptions
      }
    });

    modal.onDidDismiss().then((result) => {
      console.log('Add item modal dismissed with result:', result);
      if (result && result.data) {
        this.addNewItem(result.data);
      }
    });

    await modal.present();
  }

  // Open CRUD modal for editing an existing item
  async openEditItemModal(item: Item) {
    const modal = await this.modalController.create({
      component: CrudComponent,
      componentProps: {
        item: item,
        departmentOptions: this.departmentOptions,
        statusOptions: this.statusOptions,
        imageOptions: this.imageOptions
      }
    });

    modal.onDidDismiss().then((result) => {
      console.log('Edit item modal dismissed with result:', result);
      if (result && result.data) {
        this.updateItem(result.data, item.id);
      }
    });

    await modal.present();
  }

  // Show item options (edit/delete)
  async showItemOptions(item: Item) {
    const actionSheet = await this.actionSheetController.create({
      header: item.name,
      buttons: [
        {
          text: 'Edit Item',
          icon: 'create-outline',
          handler: () => {
            this.openEditItemModal(item);
            return true;
          }
        },
        {
          text: 'Delete Item',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.showDeleteConfirmation(item);
            return true;
          }
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Show CRUD modal for adding a new item
  async showAddItemPrompt() {
    this.openAddItemModal();
    return true;
  }

  // Show edit item prompt using CRUD component
  async showEditItemPrompt(item: Item) {
    this.openEditItemModal(item);
    return true;
  }

  // Add new item to Firestore
  async addNewItem(itemData: any) {
    console.log('Adding new item with data:', itemData);
    
    // Only use the image path that was explicitly selected in the form
    // No default fallback unless "Default Item" was explicitly selected
    const imagePath = itemData.image || undefined;
    
    console.log('Using image path:', imagePath);
    
    const loading = await this.loadingController.create({
      message: 'Adding item...'
    });
    await loading.present();

    try {
      const item: Item = {
        name: itemData.name,
        description: itemData.description,
        department: itemData.department,
        productCode: itemData.productCode,
        status: itemData.status,
        image: imagePath,
        dateAdded: new Date(),
        addedBy: this.user.email
      };

      console.log('Prepared item object for Firestore:', item);
      const newItemId = await this.itemService.addItem(item);
      console.log('Item added successfully with ID:', newItemId);
      
      loading.dismiss();
      this.showToast('Item added successfully');
      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      loading.dismiss();
      this.showToast('Failed to add item: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }

  // Update item in Firestore
  async updateItem(itemData: any, itemId: string | undefined) {
    console.log('Updating item with ID:', itemId, 'and data:', itemData);
    
    if (!itemId) {
      console.error('Item ID is missing in updateItem');
      this.showToast('Item ID is required');
      return false;
    }
    
    // Only use the image path that was explicitly selected
    // No default fallback unless it was explicitly selected
    const imagePath = itemData.image || undefined;
    
    console.log('Using image path for update:', imagePath);
    
    const loading = await this.loadingController.create({
      message: 'Updating item...'
    });
    await loading.present();

    try {
      const item: Partial<Item> = {
        name: itemData.name,
        description: itemData.description,
        department: itemData.department,
        productCode: itemData.productCode,
        status: itemData.status,
        image: imagePath
      };

      console.log('Prepared item object for update:', item);
      await this.itemService.updateItem(itemId, item);
      console.log('Item updated successfully');
      
      loading.dismiss();
      this.showToast('Item updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating item:', error);
      loading.dismiss();
      this.showToast('Failed to update item: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }

  // Show delete confirmation
  async showDeleteConfirmation(item: Item) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${item.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          cssClass: 'danger',
          handler: () => {
            this.deleteItem(item);
          }
        }
      ]
    });
    await alert.present();
    return true;
  }

  // Delete item from Firestore
  async deleteItem(item: Item) {
    if (!item.id) {
      this.showToast('Item ID is required');
      return false;
    }
    
    const loading = await this.loadingController.create({
      message: 'Deleting item...'
    });
    await loading.present();

    try {
      await this.itemService.deleteItem(item.id);
      loading.dismiss();
      this.showToast('Item deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      loading.dismiss();
      this.showToast('Failed to delete item');
      return false;
    }
  }

  // Handle request approval
  async approveRequest(request: BorrowRequest) {
    const loading = await this.loadingController.create({
      message: 'Approving request...'
    });
    await loading.present();

    try {
      // Make sure to pass the ID (using non-null assertion since we're in a context where we know it exists)
      await this.requestService.updateRequestStatus(request.id as string, 'approved', this.user.displayName as string);
      loading.dismiss();
      this.showToast('Request approved successfully');
    } catch (error) {
      console.error('Error approving request:', error);
      loading.dismiss();
      this.showToast('Failed to approve request');
    }
  }

  // Handle request rejection
  async rejectRequest(request: BorrowRequest) {
    const alert = await this.alertController.create({
      header: 'Reject Request',
      message: 'Please provide a reason for rejection:',
      inputs: [
        {
          name: 'reason',
          type: 'text',
          placeholder: 'Rejection reason'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reject',
          handler: async (data) => {
            if (!data.reason) {
              this.showToast('Please provide a reason for rejection');
              return false;
            }
            
            const loading = await this.loadingController.create({
              message: 'Rejecting request...'
            });
            await loading.present();
            
            try {
              await this.requestService.updateRequestStatus(
                request.id as string, 
                'not_approved', // Using the correct status value
                this.user.displayName as string,
                data.reason
              );
              loading.dismiss();
              this.showToast('Request rejected');
            } catch (error) {
              console.error('Error rejecting request:', error);
              loading.dismiss();
              this.showToast('Failed to reject request');
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  // Show toast message
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.setupSubscriptions();
    this.loadData();
  }

  ngOnDestroy() {
    if (this.requestsSubscription) {
      this.requestsSubscription.unsubscribe();
    }
    if (this.itemsSubscription) {
      this.itemsSubscription.unsubscribe();
    }
  }

  // Load demo user
  async loadCurrentUser() {
    this.isLoading = true;
    try {
      // In a real app, you would get the user from auth service
      // const user = await this.authService.getCurrentUser();
      // this.user = user;
      
      // For demo purposes, we're using a hardcoded user
      console.log('Using demo user:', this.user);
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading user:', error);
      this.isLoading = false;
    }
  }

  // Setup data fetching
  private setupSubscriptions() {
    // Clear any existing subscriptions
    if (this.requestsSubscription) {
      this.requestsSubscription.unsubscribe();
      this.requestsSubscription = null;
    }
    if (this.itemsSubscription) {
      this.itemsSubscription.unsubscribe();
      this.itemsSubscription = null;
    }
    
    // Fetch pending requests as a Promise
    this.requestService.getPendingRequests()
      .then(requests => {
        this.pendingRequests = requests;
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error fetching pending requests:', error);
        this.isLoading = false;
      });
    
    // Subscribe to the real-time items observable
    this.itemsSubscription = this.itemService.items$.subscribe(items => {
      console.log('Real-time items update received:', items);
      this.items = items;
      this.filteredItems = items;
      this.isLoading = false;
    });
  }

  async loadData() {
    this.isLoading = true;
    // The actual data loading is handled by the subscriptions
  }

  segmentChanged(event: any) {
    this.segmentValue = event.detail.value;
  }
}
