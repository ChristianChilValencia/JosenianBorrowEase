import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { BorrowRequest, User } from '../../models/item.model';
import { RequestService } from '../../services/request.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.page.html',
  styleUrls: ['./requests.page.scss'],
  standalone: false
})
export class RequestsPage implements OnInit, OnDestroy {
  requestStatus: string = 'waiting';
  requests: BorrowRequest[] = [];
  filteredRequests: BorrowRequest[] = [];
  isLoading: boolean = false;
  // Demo user for single-user mode
  user: User = {
    uid: 'demo-user-id',
    email: 'demo@josenian.edu',
    displayName: 'Demo User',
    role: 'approver',
    department: 'IMC',
    studentId: 'DEMO-123'
  };
  
  private requestsSubscription: Subscription | null = null;

  constructor(
    private requestService: RequestService,
    public authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadCurrentUser();
    this.setupRequestsSubscription();
    this.loadRequests();
  }

  ngOnDestroy() {
    if (this.requestsSubscription) {
      this.requestsSubscription.unsubscribe();
    }
  }

  async loadCurrentUser() {
    // In demo mode, we're always using the demo user
    // No need to check authentication
    this.user = this.authService.getCurrentUser();
    this.filterRequests();
  }

  private setupRequestsSubscription() {
    this.requestsSubscription = this.requestService.requests$.subscribe(requests => {
      this.requests = requests;
      this.filterRequests();
    });
  }

  async loadRequests() {
    this.isLoading = true;
    try {
      await this.requestService.getAllRequests();
    } catch (error) {
      console.error('Error loading requests:', error);
      // this.showToast('Failed to load requests. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  filterRequests() {
    // In demo mode, show all requests with selected status
    // since the demo user is an approver
    this.filteredRequests = this.requests.filter(request => 
      request.status === this.requestStatus
    );
  }

  onStatusChange(status: string) {
    this.requestStatus = status;
    this.filterRequests();
  }

  async refreshRequests(event: any) {
    try {
      await this.requestService.getAllRequests();
      this.filterRequests();
    } catch (error) {
      console.error('Error refreshing requests:', error);
      this.showToast('Failed to refresh requests. Please try again.');
    } finally {
      event.target.complete();
    }
  }

  async viewRequestDetails(request: BorrowRequest) {
    const alert = await this.alertController.create({
      header: request.itemName,
      subHeader: `Status: ${this.getStatusText(request.status)}`,
      message: `
        <p><strong>Event:</strong> ${request.eventName}</p>
        <p><strong>Reason:</strong> ${request.reason}</p>
        <p><strong>Request Date:</strong> ${this.formatDate(request.requestDate)}</p>
        <p><strong>Event Date:</strong> ${this.formatDate(request.eventDate)}</p>
        <p><strong>Return Date:</strong> ${this.formatDate(request.returnDate)}</p>
        ${request.approvedBy ? `<p><strong>Approved By:</strong> ${request.approvedBy}</p>` : ''}
        ${request.approvalDate ? `<p><strong>Approval Date:</strong> ${this.formatDate(request.approvalDate)}</p>` : ''}
        ${request.notes ? `<p><strong>Notes:</strong> ${request.notes}</p>` : ''}
      `,
      buttons: ['Close']
    });
    
    await alert.present();
  }

  async cancelRequest(request: BorrowRequest) {
    const alert = await this.alertController.create({
      header: 'Cancel Request',
      message: 'Are you sure you want to cancel this borrow request?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Cancelling request...'
            });
            await loading.present();
            
            try {
              // Delete the request
              // await this.requestService.deleteRequest(request.id!);
              await this.requestService.updateRequestStatus(request.id!, 'not_approved', this.user?.email || '', 'Cancelled by requester');
              
              this.showToast('Request cancelled successfully');
            } catch (error) {
              console.error('Error cancelling request:', error);
              this.showToast('Failed to cancel request. Please try again.');
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

  // Helper function to get status text
  getStatusText(status: string): string {
    switch (status) {
      case 'waiting': return 'Pending';
      case 'approved': return 'Approved';
      case 'not_approved': return 'Not Approved';
      case 'returned': return 'Returned';
      default: return status;
    }
  }

  // Helper function to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'waiting': return 'warning';
      case 'approved': return 'success';
      case 'not_approved': return 'danger';
      case 'returned': return 'medium';
      default: return 'primary';
    }
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
