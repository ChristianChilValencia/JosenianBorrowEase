import { Component, OnInit } from '@angular/core';
import { ContactService } from '../services/contact.service';
import { AlertController, ToastController, ModalController } from '@ionic/angular';
import { Contact } from '../models/contact.model';
// Make sure to import the standalone component
// import { EditContactComponent } from '../components/edit-contact/edit-contact.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  contacts: Contact[] = [];
  isLoading = false;
  searchTerm = '';
  sortBy = 'lastName';

  constructor(
    private contactService: ContactService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.loadContacts();
  }

  ionViewWillEnter() {
    this.loadContacts();
  }

  async loadContacts() {
    try {
      this.isLoading = true;
      this.contacts = await this.contactService.getContacts(this.sortBy);
    } catch (error) {
      console.error('Error loading contacts:', error);
      const toast = await this.toastController.create({
        // message: 'Failed to load contacts. Please try again.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  async search() {
    if (!this.searchTerm.trim()) {
      // If search term is empty, load all contacts
      this.loadContacts();
      return;
    }
    
    try {
      this.isLoading = true;
      this.contacts = await this.contactService.searchContacts(this.searchTerm);
    } catch (error) {
      console.error('Error searching contacts:', error);
    } finally {
      this.isLoading = false;
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.loadContacts();
  }

  changeSortOrder() {
    // Toggle between firstName and lastName sorting
    this.sortBy = this.sortBy === 'lastName' ? 'firstName' : 'lastName';
    this.loadContacts();
  }

  async confirmDelete(contact: Contact) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete "${contact.firstName} ${contact.lastName}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteContact(contact);
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteContact(contact: Contact) {
    if (!contact.id) {
      console.error('Contact ID is missing');
      return;
    }
    
    try {
      await this.contactService.deleteContact(contact.id);
      this.contacts = this.contacts.filter(c => c.id !== contact.id);
      
      const toast = await this.toastController.create({
        message: 'Contact deleted successfully!',
        duration: 2000,
        color: 'success'
      });
      
      await toast.present();
    } catch (error) {
      console.error('Error deleting contact:', error);
      const toast = await this.toastController.create({
        message: 'Failed to delete contact. Please try again.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async doRefresh(event: any) {
    try {
      await this.loadContacts();
    } finally {
      event.target.complete();
    }
  }
EditContactComponent: any;
  async openEditContact(contact: Contact) {
    if (!contact.id) {
      console.error('Contact ID is missing');
      return;
    }
    
    const modal = await this.modalController.create({
      component: this.EditContactComponent,
      componentProps: {
        contactId: contact.id
      },
      breakpoints: [0, 0.5, 0.75, 1],
      initialBreakpoint: 0.75,
      backdropDismiss: true,
      showBackdrop: true
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.contactUpdated) {
      this.loadContacts();
    }
  }
}
