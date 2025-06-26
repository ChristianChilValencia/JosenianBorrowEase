import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ItemService } from '../../services/item.service';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../services/auth.service';
import { Item, BorrowRequest, User } from '../../models/item.model';

@Component({
  selector: 'app-item',
  templateUrl: './item.page.html',
  styleUrls: ['./item.page.scss'],
  standalone: false
})
export class ItemPage implements OnInit {
  item: Item | null = null;
  isLoading: boolean = true;
  borrowRequestForm: FormGroup;
  // Demo user for single-user mode
  user: User = {
    uid: 'demo-user-id',
    email: 'demo@josenian.edu',
    displayName: 'Demo User',
    role: 'student',
    department: 'IMC',
    studentId: 'DEMO-123'
  };
  
  eventDate: string = '';
  returnDate: string = '';
  dateLabel: string = '';
  
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    private requestService: RequestService,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.borrowRequestForm = this.formBuilder.group({
      eventName: ['', [Validators.required]],
      reason: ['', [Validators.required]],
      eventDate: ['', [Validators.required]],
      returnDate: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadItemDetails();
  }

  async loadCurrentUser() {
    // In demo mode, we're always using the demo user
    // No need to check authentication
    this.user = this.authService.getCurrentUser();
  }

  async loadItemDetails() {
    this.isLoading = true;
    const itemId = this.route.snapshot.paramMap.get('id');
    
    if (!itemId) {
      this.showAlert('Error', 'No item ID provided');
      this.router.navigate(['/tabs/home']);
      return;
    }
    
    try {
      this.item = await this.itemService.getItem(itemId);
      if (!this.item) {
        this.showAlert('Error', 'Item not found');
        this.router.navigate(['/tabs/home']);
      }
    } catch (error) {
      console.error('Error loading item:', error);
      // this.showAlert('Error', 'Failed to load item details');
    } finally {
      this.isLoading = false;
    }
  }

  updateDateLabel() {
    if (this.eventDate && this.returnDate) {
      this.dateLabel = `Event: ${this.formatDate(this.eventDate)} until Return: ${this.formatDate(this.returnDate)}`;
    } else if (this.eventDate) {
      this.dateLabel = `Event: ${this.formatDate(this.eventDate)}`;
    } else if (this.returnDate) {
      this.dateLabel = `Return: ${this.formatDate(this.returnDate)}`;
    } else {
      this.dateLabel = '';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  async submitBorrowRequest() {
    if (!this.borrowRequestForm.valid) {
      this.showAlert('Validation Error', 'Please fill all required fields');
      return;
    }
    
    // No need to check authentication in demo mode
    
    if (!this.item) {
      this.showAlert('Error', 'Item not found');
      return;
    }
    
    this.isSubmitting = true;
    
    const loading = await this.loadingController.create({
      message: 'Submitting request...'
    });
    await loading.present();
    
    try {
      const formValues = this.borrowRequestForm.value;
      
      const borrowRequest: BorrowRequest = {
        itemId: this.item.id!,
        itemName: this.item.name,
        itemImage: this.item.image,
        itemCode: this.item.productCode,
        requesterName: this.user.displayName || this.user.email,
        requesterEmail: this.user.email,
        requesterStudentId: this.user.studentId || '',
        requestDate: new Date(),
        eventDate: new Date(formValues.eventDate),
        returnDate: new Date(formValues.returnDate),
        eventName: formValues.eventName,
        reason: formValues.reason,
        purpose: formValues.reason, // For compatibility with purpose field
        department: this.item.department,
        status: 'waiting'
      };
      
      await this.requestService.createRequest(borrowRequest);
      
      loading.dismiss();
      this.isSubmitting = false;
      
      this.showSuccessAlert();
    } catch (error) {
      console.error('Error submitting borrow request:', error);
      loading.dismiss();
      this.isSubmitting = false;
      this.showAlert('Error', 'Failed to submit borrow request. Please try again.');
    }
  }

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Request Submitted',
      message: 'Your borrow request has been submitted successfully and is awaiting approval.',
      buttons: [
        {
          text: 'View My Requests',
          handler: () => {
            this.router.navigate(['/tabs/requests']);
          }
        },
        {
          text: 'Back to Home',
          handler: () => {
            this.router.navigate(['/tabs/home']);
          }
        }
      ]
    });
    
    await alert.present();
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

  // Methods for template usage
  getMinDate(): string {
    return new Date().toISOString();
  }
  
  getMinReturnDate(): string {
    return this.eventDate || new Date().toISOString();
  }
}
