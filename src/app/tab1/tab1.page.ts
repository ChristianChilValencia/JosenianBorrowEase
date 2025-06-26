import { Component } from '@angular/core';
import { ContactService } from '../services/contact.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular';
import { Contact } from '../models/contact.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  contactForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private contactService: ContactService,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.createForm();
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

  async submitContact() {
    if (this.contactForm.invalid) {
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
      
      const newContact: Contact = {
        firstName: this.contactForm.value.firstName,
        lastName: this.contactForm.value.lastName,
        phoneNumber: this.contactForm.value.phoneNumber,
        email: this.contactForm.value.email || '',
        address: this.contactForm.value.address || '',
        notes: this.contactForm.value.notes || '',
        createdAt: new Date()
      };
      
      console.log('Submitting contact:', newContact);
      try {
        const docId = await this.contactService.createContact(newContact);
        console.log('Contact created with ID:', docId);
        
        const toast = await this.toastController.create({
          message: 'Contact added successfully!',
          duration: 2000,
          color: 'success'
        });
        
        await toast.present();
        this.contactForm.reset();
      } catch (error: any) {
        console.error('Detailed error:', error);
        const errorMessage = error?.message || 'Unknown error occurred';
        
        const alert = await this.alertController.create({
          header: 'Error',
          message: `Failed to add contact: ${errorMessage}`,
          buttons: ['OK']
        });
        await alert.present();
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  resetForm() {
    this.contactForm.reset();
  }
}
