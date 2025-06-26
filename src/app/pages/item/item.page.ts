import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController, ModalController } from '@ionic/angular';
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
    try {
      if (this.eventDate && this.returnDate) {
        this.dateLabel = `Event: ${this.formatDate(this.eventDate)} until Return: ${this.formatDate(this.returnDate)}`;
      } else if (this.eventDate) {
        this.dateLabel = `Event: ${this.formatDate(this.eventDate)}`;
      } else if (this.returnDate) {
        this.dateLabel = `Return: ${this.formatDate(this.returnDate)}`;
      } else {
        this.dateLabel = '';
      }
    } catch (error) {
      console.error('Error updating date label:', error);
      this.dateLabel = '';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateStr);
        return 'Invalid date';
      }
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error formatting date';
    }
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
    const today = new Date();
    return today.toISOString();
  }
  
  getMinReturnDate(): string {
    if (this.eventDate) {
      const eventDate = new Date(this.eventDate);
      // Add 1 hour to event date as minimum return time
      eventDate.setHours(eventDate.getHours() + 1);
      return eventDate.toISOString();
    }
    return new Date().toISOString();
  }

  // Calendar methods
  async openEventDateCalendar() {
    const alert = await this.alertController.create({
      header: 'Select Event Date',
      cssClass: 'calendar-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Set Date & Time',
          handler: (data) => {
            if (data && data.date) {
              // Handle date selection
              const selectedDate = new Date(data.date);
              
              // Now prompt for time
              this.promptForTime(selectedDate, 'event');
            }
          }
        }
      ],
      inputs: [
        {
          type: 'date',
          name: 'date',
          min: this.getMinDate().split('T')[0], // Get just the date part
          placeholder: 'YYYY-MM-DD'
        }
      ]
    });

    await alert.present();
  }

  async openReturnDateCalendar() {
    // Ensure event date is set first
    if (!this.eventDate) {
      this.showAlert('Event Date Required', 'Please select an event date first before selecting a return date.');
      return;
    }
    
    const minDate = new Date(this.eventDate);
    const minDateString = minDate.toISOString().split('T')[0];

    const alert = await this.alertController.create({
      header: 'Select Return Date',
      cssClass: 'calendar-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Set Date & Time',
          handler: (data) => {
            if (data && data.date) {
              // Handle date selection
              const selectedDate = new Date(data.date);
              
              // Ensure selected date is after event date
              const eventDate = new Date(this.eventDate);
              if (selectedDate.toDateString() === eventDate.toDateString()) {
                // Same day - make sure time will be after event time
                selectedDate.setHours(eventDate.getHours() + 1, eventDate.getMinutes());
              }
              
              // Now prompt for time
              this.promptForTime(selectedDate, 'return');
            }
          }
        }
      ],
      inputs: [
        {
          type: 'date',
          name: 'date',
          min: minDateString,
          placeholder: 'YYYY-MM-DD'
        }
      ]
    });

    await alert.present();
  }

  async promptForTime(date: Date, type: 'event' | 'return') {
    const currentHours = new Date().getHours().toString().padStart(2, '0');
    const currentMinutes = new Date().getMinutes().toString().padStart(2, '0');
    const defaultTime = `${currentHours}:${currentMinutes}`;

    const alert = await this.alertController.create({
      header: `Select ${type === 'event' ? 'Event' : 'Return'} Time`,
      inputs: [
        {
          type: 'time',
          name: 'time',
          value: defaultTime
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: (data) => {
            if (data && data.time) {
              try {
                const [hours, minutes] = data.time.split(':');
                date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                
                const isoString = date.toISOString();
                
                // Update the appropriate date
                if (type === 'event') {
                  this.eventDate = isoString;
                  this.borrowRequestForm.get('eventDate')?.setValue(isoString);
                  
                  // If return date is set and now before event date, clear it
                  if (this.returnDate) {
                    const returnDate = new Date(this.returnDate);
                    if (returnDate < date) {
                      this.returnDate = '';
                      this.borrowRequestForm.get('returnDate')?.setValue('');
                      this.showToast('Return date reset as it was before the new event date');
                    }
                  }
                } else {
                  this.returnDate = isoString;
                  this.borrowRequestForm.get('returnDate')?.setValue(isoString);
                }
                
                // Update the date label
                this.updateDateLabel();
              } catch (error) {
                console.error('Error setting time:', error);
                this.showToast('Error setting time. Please try again.');
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
