import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController, ActionSheetController } from '@ionic/angular';
import { Item, BorrowRequest, User } from '../../models/item.model';
import { ItemService } from '../../services/item.service';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

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
    private router: Router
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

  // Show action sheet with options for an item
  async showItemOptions(item: Item) {
    const actionSheet = await this.actionSheetController.create({
      header: item.name,
      buttons: [
        {
          text: 'Edit Item',
          icon: 'create-outline',
          handler: () => {
            this.showEditItemPrompt(item);
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

  // Show action sheet for adding a new item
  async showAddItemPrompt() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Add New Item - Select Name',
      buttons: [
        {
          text: 'Enter Item Details',
          icon: 'create-outline',
          handler: async () => {
            const alert = await this.alertController.create({
              header: 'Item Details',
              inputs: [
                {
                  name: 'name',
                  type: 'text',
                  placeholder: 'Item Name'
                }
              ],
              buttons: [
                {
                  text: 'Cancel',
                  role: 'cancel'
                },
                {
                  text: 'Next',
                  handler: (data) => {
                    if (!data.name) {
                      this.showToast('Please enter item name');
                      return false;
                    }
                    this.showDescriptionPrompt({ name: data.name });
                    return true;
                  }
                }
              ]
            });
            await alert.present();
            return true;
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Show description prompt
  async showDescriptionPrompt(itemData: any) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Add Description',
      buttons: [
        {
          text: 'Enter Description',
          icon: 'document-text-outline',
          handler: async () => {
            const alert = await this.alertController.create({
              header: 'Item Description',
              inputs: [
                {
                  name: 'description',
                  type: 'textarea',
                  placeholder: 'Description'
                }
              ],
              buttons: [
                {
                  text: 'Back',
                  handler: () => {
                    this.showAddItemPrompt();
                  }
                },
                {
                  text: 'Next',
                  handler: (data) => {
                    if (!data.description) {
                      this.showToast('Please enter description');
                      return false;
                    }
                    this.showProductCodePrompt({ ...itemData, description: data.description });
                    return true;
                  }
                }
              ]
            });
            await alert.present();
            return true;
          }
        },
        {
          text: 'Back',
          handler: () => {
            this.showAddItemPrompt();
            return true;
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Show product code prompt
  async showProductCodePrompt(itemData: any) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Add Product Code',
      buttons: [
        {
          text: 'Enter Product Code',
          icon: 'barcode-outline',
          handler: async () => {
            const alert = await this.alertController.create({
              header: 'Product Code',
              inputs: [
                {
                  name: 'productCode',
                  type: 'text',
                  placeholder: 'Product Code'
                }
              ],
              buttons: [
                {
                  text: 'Back',
                  handler: () => {
                    this.showDescriptionPrompt({ name: itemData.name });
                  }
                },
                {
                  text: 'Next',
                  handler: (data) => {
                    if (!data.productCode) {
                      this.showToast('Please enter product code');
                      return false;
                    }
                    this.showAddItemDetailsPrompt({ ...itemData, productCode: data.productCode });
                    return true;
                  }
                }
              ]
            });
            await alert.present();
            return true;
          }
        },
        {
          text: 'Back',
          handler: () => {
            this.showDescriptionPrompt({ name: itemData.name });
            return true;
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Show second prompt for department, status, and image selection
  async showAddItemDetailsPrompt(itemData: any) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Department',
      buttons: [
        ...this.departmentOptions.map(dept => ({
          text: dept,
          handler: async () => {
            itemData.department = dept;
            // Show status selection
            return this.showStatusSelectionPrompt(itemData);
          }
        })),
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Show status selection prompt
  async showStatusSelectionPrompt(itemData: any) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Status',
      buttons: [
        ...this.statusOptions.map(status => ({
          text: status.replace('_', ' ').toUpperCase(),
          handler: async () => {
            itemData.status = status;
            // Show image selection
            return this.showImageSelectionPrompt(itemData);
          }
        })),
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Show image selection prompt
  async showImageSelectionPrompt(itemData: any) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Image',
      buttons: [
        ...this.imageOptions.map(img => ({
          text: img.name,
          handler: async () => {
            itemData.image = img.path;
            return this.addNewItem(itemData);
          }
        })),
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Add new item to Firestore
  async addNewItem(itemData: any) {
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
        image: itemData.image,
        dateAdded: new Date(),
        addedBy: this.user.email
      };

      await this.itemService.addItem(item);
      loading.dismiss();
      this.showToast('Item added successfully');
      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      loading.dismiss();
      this.showToast('Failed to add item');
      return false;
    }
  }

  // Show edit item prompt
  async showEditItemPrompt(item: Item) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Edit Item - ' + item.name,
      buttons: [
        {
          text: 'Edit Name',
          icon: 'create-outline',
          handler: async () => {
            const alert = await this.alertController.create({
              header: 'Edit Name',
              inputs: [
                {
                  name: 'name',
                  type: 'text',
                  placeholder: 'Item Name',
                  value: item.name
                }
              ],
              buttons: [
                {
                  text: 'Cancel',
                  role: 'cancel'
                },
                {
                  text: 'Next',
                  handler: (data) => {
                    if (!data.name) {
                      this.showToast('Please enter item name');
                      return false;
                    }
                    this.showEditDescriptionPrompt({ ...item, name: data.name });
                    return true;
                  }
                }
              ]
            });
            await alert.present();
            return true;
          }
        },
        {
          text: 'Keep Current Name (' + item.name + ')',
          icon: 'checkmark-outline',
          handler: () => {
            this.showEditDescriptionPrompt(item);
            return true;
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Show description edit prompt
  async showEditDescriptionPrompt(itemData: Item) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Edit Description',
      buttons: [
        {
          text: 'Edit Description',
          icon: 'document-text-outline',
          handler: async () => {
            const alert = await this.alertController.create({
              header: 'Edit Description',
              inputs: [
                {
                  name: 'description',
                  type: 'textarea',
                  placeholder: 'Description',
                  value: itemData.description
                }
              ],
              buttons: [
                {
                  text: 'Back',
                  handler: () => {
                    this.showEditItemPrompt(itemData);
                  }
                },
                {
                  text: 'Next',
                  handler: (data) => {
                    if (!data.description) {
                      this.showToast('Please enter description');
                      return false;
                    }
                    this.showEditProductCodePrompt({ ...itemData, description: data.description });
                    return true;
                  }
                }
              ]
            });
            await alert.present();
            return true;
          }
        },
        {
          text: 'Keep Current Description',
          icon: 'checkmark-outline',
          handler: () => {
            this.showEditProductCodePrompt(itemData);
            return true;
          }
        },
        {
          text: 'Back',
          handler: () => {
            this.showEditItemPrompt(itemData);
            return true;
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Show product code edit prompt
  async showEditProductCodePrompt(itemData: Item) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Edit Product Code',
      buttons: [
        {
          text: 'Edit Product Code',
          icon: 'barcode-outline',
          handler: async () => {
            const alert = await this.alertController.create({
              header: 'Edit Product Code',
              inputs: [
                {
                  name: 'productCode',
                  type: 'text',
                  placeholder: 'Product Code',
                  value: itemData.productCode
                }
              ],
              buttons: [
                {
                  text: 'Back',
                  handler: () => {
                    this.showEditDescriptionPrompt(itemData);
                  }
                },
                {
                  text: 'Next',
                  handler: (data) => {
                    if (!data.productCode) {
                      this.showToast('Please enter product code');
                      return false;
                    }
                    this.showEditItemDetailsPrompt({ ...itemData, productCode: data.productCode }, itemData);
                    return true;
                  }
                }
              ]
            });
            await alert.present();
            return true;
          }
        },
        {
          text: 'Keep Current Product Code (' + itemData.productCode + ')',
          icon: 'checkmark-outline',
          handler: () => {
            this.showEditItemDetailsPrompt(itemData, itemData);
            return true;
          }
        },
        {
          text: 'Back',
          handler: () => {
            this.showEditDescriptionPrompt(itemData);
            return true;
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Show department and status selection for edit
  async showEditItemDetailsPrompt(itemData: any, originalItem: Item) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Department',
      buttons: [
        ...this.departmentOptions.map(dept => ({
          text: dept,
          handler: async () => {
            itemData.department = dept;
            return this.showEditStatusSelectionPrompt(itemData, originalItem);
          }
        })),
        {
          text: 'Keep Current (' + originalItem.department + ')',
          handler: async () => {
            itemData.department = originalItem.department;
            return this.showEditStatusSelectionPrompt(itemData, originalItem);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Show status selection for edit
  async showEditStatusSelectionPrompt(itemData: any, originalItem: Item) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Status',
      buttons: [
        ...this.statusOptions.map(status => ({
          text: status.replace('_', ' ').toUpperCase(),
          handler: async () => {
            itemData.status = status;
            return this.showEditImageSelectionPrompt(itemData, originalItem);
          }
        })),
        {
          text: 'Keep Current (' + originalItem.status + ')',
          handler: async () => {
            if (!originalItem.id) {
              this.showToast('Error: Item ID is missing');
              return false;
            }
            itemData.status = originalItem.status;
            return this.showEditImageSelectionPrompt(itemData, originalItem);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Show image selection for edit
  async showEditImageSelectionPrompt(itemData: any, originalItem: Item) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Image',
      buttons: [
        ...this.imageOptions.map(img => ({
          text: img.name,
          handler: async () => {
            if (!originalItem.id) {
              this.showToast('Error: Item ID is missing');
              return false;
            }
            itemData.image = img.path;
            return this.updateItem(itemData, originalItem.id);
          }
        })),
        {
          text: 'Keep Current Image',
          handler: async () => {
            itemData.image = originalItem.image;
            return this.updateItem(itemData, originalItem.id);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
    return true;
  }

  // Update item in Firestore
  async updateItem(itemData: any, itemId: string | undefined) {
    if (!itemId) {
      throw new Error('Item ID is required');
      return false;
    }
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
        image: itemData.image
      };

      await this.itemService.updateItem(itemId, item);
      loading.dismiss();
      this.showToast('Item updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating item:', error);
      loading.dismiss();
      this.showToast('Failed to update item');
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
          role: 'destructive',
          handler: () => this.deleteItem(item)
        }
      ]
    });
    await alert.present();
    return true;
  }

  // Delete item from Firestore
  async deleteItem(item: Item) {
    const loading = await this.loadingController.create({
      message: 'Deleting item...'
    });
    await loading.present();

    try {
      if (!item.id) {
        throw new Error('Item ID is required');
      }
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
      if (!request.id) {
        throw new Error('Request ID is missing');
      }

      const updatedRequest = {
        ...request,
        status: 'approved' as const,
        approvedBy: this.user.email,
        approvalDate: new Date()
      };
      
      await this.requestService.updateRequest(request.id, updatedRequest);
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
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Reason for rejection (optional)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reject',
          role: 'destructive',
          handler: async (data) => {
            const loading = await this.loadingController.create({
              message: 'Rejecting request...'
            });
            await loading.present();

            try {
              if (!request.id) {
                throw new Error('Request ID is missing');
              }

              const updatedRequest = {
                ...request,
                status: 'rejected' as const,
                rejectedBy: this.user.email,
                rejectionDate: new Date(),
                rejectionReason: data.reason || 'No reason provided'
              };
              
              await this.requestService.updateRequest(request.id, updatedRequest);
              loading.dismiss();
              this.showToast('Request rejected successfully');
              return true;
            } catch (error) {
              console.error('Error rejecting request:', error);
              loading.dismiss();
              this.showToast('Failed to reject request');
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
    return true;
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
    this.user = this.authService.getCurrentUser();
  }

  // Setup subscriptions for items and requests
  private setupSubscriptions() {
    this.requestsSubscription = this.requestService.requests$.subscribe(requests => {
      this.pendingRequests = requests.filter(req => req.status === 'waiting');
    });
    
    this.itemsSubscription = this.itemService.items$.subscribe(items => {
      this.items = items;
      this.filteredItems = [...items];
    });
  }

  async loadData() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.requestService.getPendingRequests(),
        this.itemService.getAllItems()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  segmentChanged(event: any) {
    this.segmentValue = event.detail.value;
  }
}
