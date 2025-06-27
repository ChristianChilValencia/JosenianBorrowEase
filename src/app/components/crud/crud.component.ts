import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Item } from '../../models/item.model';

@Component({
  selector: 'app-crud',
  templateUrl: './crud.component.html',
  styleUrls: ['./crud.component.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule]
})
export class CrudComponent implements OnInit {
  @Input() item: Item | null = null;
  @Input() departmentOptions: string[] = [];
  @Input() statusOptions: string[] = [];
  @Input() imageOptions: { path: string; name: string }[] = [];
  
  @Output() saveItem = new EventEmitter<any>();
  
  itemForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  selectedImagePath: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.initForm();
    
    if (this.item) {
      this.isEditMode = true;
      
      // Find matching image option if available
      const existingImageOption = this.imageOptions.find(
        img => this.normalizeImagePath(img.path) === this.normalizeImagePath(this.item?.image || '')
      );
      
      // Use the found option path or keep the original if no match found
      const imagePath = existingImageOption ? existingImageOption.path : this.item.image;
      console.log('Found matching image option:', existingImageOption);
      console.log('Using image path for form:', imagePath);
      
      // Apply item data to form
      this.itemForm.patchValue({
        name: this.item.name,
        description: this.item.description,
        productCode: this.item.productCode,
        department: this.item.department,
        status: this.item.status,
        image: imagePath // Use matched option path or original path
      });
      
      // Set initial image preview
      if (imagePath) {
        console.log('Setting initial image preview:', imagePath);
        this.selectedImagePath = this.normalizeImagePath(imagePath);
      }
      
      console.log('Initial image path in edit mode:', this.selectedImagePath);
    } else {
      // For new items, don't set any default image in the preview
      this.selectedImagePath = '';
    }
  }

  initForm() {
    this.itemForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      productCode: ['', Validators.required],
      department: ['', Validators.required],
      status: ['available', Validators.required],
      image: [''] // No default image, require explicit selection
    });
  }
  
  // Normalize image path for comparison (handle with/without leading slash)
  private normalizeImagePath(path: string): string {
    if (!path) return '';
    return path.startsWith('/') ? path : '/' + path;
  }
  
  // Handle image selection change
  onImageChange(event: any) {
    const imagePath = event.detail.value;
    console.log('Selected image path:', imagePath);
    
    if (imagePath && imagePath.trim() !== '') {
      // Make sure the path starts with a slash
      this.selectedImagePath = this.normalizeImagePath(imagePath);
      console.log('Updated selected image path:', this.selectedImagePath);
    } else {
      // If empty selection, clear the preview instead of showing default
      this.selectedImagePath = '';
      console.log('Cleared image selection');
    }
  }

  submitForm() {
    if (this.itemForm.invalid) {
      // Mark all fields as touched to trigger validation
      Object.keys(this.itemForm.controls).forEach(key => {
        const control = this.itemForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = this.itemForm.value;
    
    // Ensure image path is properly set in the submitted data
    const itemData = {
      ...formData,
      id: this.item?.id, // Include original ID if in edit mode
      // Only include image if it's actually selected
      image: formData.image && formData.image.trim() !== '' ? formData.image : undefined
    };

    console.log('CRUD component submitting form data:', itemData);
    
    // Pass the data back to the parent component through the modal
    // Using 'role' of 'submit' to distinguish from cancel
    this.modalController.dismiss(itemData, 'submit');
  }

  dismiss() {
    console.log('CRUD component dismissing without data');
    this.modalController.dismiss(null, 'cancel');
  }
}
