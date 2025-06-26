import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
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
  
  // Demo user for single-user mode
  user: User = {
    uid: 'demo-user-id',
    email: 'demo@josenian.edu',
    displayName: 'Demo User',
    role: 'approver',
    department: 'IT'
  };
  
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  
  itemForm: FormGroup;
  
  // Keep track of image file
  selectedImageFile: File | null = null;
  previewImage: string | ArrayBuffer | null = null;
  
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
    private router: Router
  ) {
    this.itemForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      department: ['', [Validators.required]],
      productCode: ['', [Validators.required]],
      status: ['available', [Validators.required]]
    });
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

  async loadCurrentUser() {
    // In demo mode, we're always using the demo user
    // No need to check authentication or permissions
    this.user = this.authService.getCurrentUser();
  }

  private setupSubscriptions() {
    this.requestsSubscription = this.requestService.requests$.subscribe(requests => {
      this.pendingRequests = requests.filter(req => req.status === 'waiting');
    });
    
    this.itemsSubscription = this.itemService.items$.subscribe(items => {
      this.items = items;
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
      this.showToast('Failed to load data. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  segmentChanged(event: any) {
    this.segmentValue = event.detail.value;
  }

  // Image selection handler
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        this.showAlert('File Size Error', 'Image size exceeds 5MB limit. Please choose a smaller image.');
        event.target.value = null; // Reset the file input
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        this.showAlert('File Type Error', 'Please select an image file (JPEG, PNG, etc.)');
        event.target.value = null; // Reset the file input
        return;
      }
      
      this.selectedImageFile = file;
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async submitItemForm() {
    if (!this.itemForm.valid) {
      this.showAlert('Validation Error', 'Please fill all required fields');
      return;
    }
    
    // No authentication check needed for demo purposes
    
    this.isSubmitting = true;
    
    const loading = await this.loadingController.create({
      message: 'Adding item...'
    });
    await loading.present();
    
    try {
      const formValues = this.itemForm.value;
      
      const item: Item = {
        name: formValues.name,
        description: formValues.description,
        department: formValues.department,
        productCode: formValues.productCode,
        status: formValues.status,
        image: '',
        dateAdded: new Date(),
        addedBy: this.user.email
      };
      
      await this.itemService.addItem(item, this.selectedImageFile || undefined);
      
      // Reset form and image preview
      this.itemForm.reset({
        status: 'available'
      });
      this.selectedImageFile = null;
      this.previewImage = null;
      
      loading.dismiss();
      this.isSubmitting = false;
      
      this.showToast('Item added successfully');
    } catch (error: any) {
      console.error('Error adding item:', error);
      loading.dismiss();
      this.isSubmitting = false;
      
      // Show a more specific error message if available
      const errorMessage = error.message || 'Failed to add item. Please try again.';
      this.showAlert('Error', errorMessage);
    }
  }

  async approveRequest(request: BorrowRequest) {
    const alert = await this.alertController.create({
      header: 'Approve Request',
      message: `Are you sure you want to approve the request for "${request.itemName}"?`,
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Add notes (optional)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Approve',
          handler: async (data) => {
            const loading = await this.loadingController.create({
              message: 'Approving request...'
            });
            await loading.present();
            
            try {
              await this.requestService.updateRequestStatus(
                request.id!,
                'approved',
                this.user.email,
                data.notes
              );
              
              this.showToast('Request approved successfully');
            } catch (error) {
              console.error('Error approving request:', error);
              this.showAlert('Error', 'Failed to approve request. Please try again.');
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  async rejectRequest(request: BorrowRequest) {
    const alert = await this.alertController.create({
      header: 'Reject Request',
      message: `Are you sure you want to reject the request for "${request.itemName}"?`,
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Add reason for rejection (required)',
          attributes: {
            required: true
          }
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
            if (!data.notes || data.notes.trim() === '') {
              this.showToast('Please provide a reason for rejection');
              return false;
            }
            
            const loading = await this.loadingController.create({
              message: 'Rejecting request...'
            });
            await loading.present();
            
            try {
              await this.requestService.updateRequestStatus(
                request.id!,
                'not_approved',
                this.user.email,
                data.notes
              );
              
              this.showToast('Request rejected successfully');
              return true;
            } catch (error) {
              console.error('Error rejecting request:', error);
              this.showAlert('Error', 'Failed to reject request. Please try again.');
              return false;
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  // Helper function to format dates
  formatDate(date: Date | any): string {
    if (!date) return 'N/A';
    
    // Handle Firebase Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    
    const d = new Date(date);
    return d.toLocaleString();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    
    await alert.present();
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    
    await toast.present();
  }
}
