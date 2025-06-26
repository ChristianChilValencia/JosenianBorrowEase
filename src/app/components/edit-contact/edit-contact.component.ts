import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AlertController, ToastController, ModalController, IonicModule } from '@ionic/angular';
import { ContactService } from '../../services/contact.service';
import { Contact } from '../../models/contact.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-contact',
  templateUrl: './edit-contact.component.html',
  styleUrls: ['./edit-contact.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  providers: [ContactService]
})
export class EditContactComponent implements OnInit {
  @Input() contactId!: string;
  
  contactForm!: FormGroup;
  contact: Contact | null = null;
  isLoading = false;
  isSubmitting = false;

  constructor(
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController
  ) {
    this.createForm();
  }

  ngOnInit() {
    if (this.contactId) {
      this.loadContact(this.contactId);
    }
  }

  createForm() {
    this.contactForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9\+\-\s\(\)]{7,20}$/)]],
      email: ['', [Validators.email]],
      address: [''],
      notes: ['']
    });
  }

  async loadContact(id: string) {
    try {
      this.isLoading = true;
      this.contact = await this.contactService.getContactById(id);
      
      if (this.contact) {
        this.contactForm.patchValue({
          firstName: this.contact.firstName,
          lastName: this.contact.lastName,
          phoneNumber: this.contact.phoneNumber,
          email: this.contact.email || '',
          address: this.contact.address || '',
          notes: this.contact.notes || ''
        });
      } else {
        this.showContactNotFoundAlert();
      }
    } catch (error) {
      console.error('Error loading contact:', error);
      this.showContactNotFoundAlert();
    } finally {
      this.isLoading = false;
    }
  }

  async showContactNotFoundAlert() {
    const alert = await this.alertController.create({
      header: 'Contact Not Found',
      message: 'The contact you are looking for does not exist.',
      buttons: [
        {
          text: 'Close',
          handler: () => {
            this.dismiss();
          }
        }
      ]
    });
    await alert.present();
  }

  async updateContact() {
    if (this.contactForm.invalid || !this.contactId) {
      const alert = await this.alertController.create({
        header: 'Invalid Form',
        message: 'Please fill in all required fields correctly.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    try {
      this.isSubmitting = true;
      
      const updatedContact: Partial<Contact> = {
        firstName: this.contactForm.value.firstName,
        lastName: this.contactForm.value.lastName,
        phoneNumber: this.contactForm.value.phoneNumber,
        email: this.contactForm.value.email || '',
        address: this.contactForm.value.address || '',
        notes: this.contactForm.value.notes || '',
        updatedAt: new Date()
      };
      
      await this.contactService.updateContact(this.contactId, updatedContact);
      
      const toast = await this.toastController.create({
        message: 'Contact updated successfully!',
        duration: 2000,
        color: 'success'
      });
      
      await toast.present();
      this.dismiss(true);
    } catch (error) {
      console.error('Error updating contact:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to update contact. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.isSubmitting = false;
    }
  }

  dismiss(contactUpdated = false) {
    this.modalController.dismiss({
      'contactUpdated': contactUpdated
    });
  }
}
