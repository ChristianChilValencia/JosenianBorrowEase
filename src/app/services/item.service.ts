import { Injectable } from '@angular/core';
import { 
  collection, 
  Firestore, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CrudService } from './crud.service';
import { Item } from '../models/item.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private firestore: Firestore;
  private storage: any;
  private itemsCollection = 'items';
  private itemsSubject = new BehaviorSubject<Item[]>([]);
  public items$ = this.itemsSubject.asObservable();

  // Maintain filtered items for each department
  private filteredItemsSubject = new BehaviorSubject<Item[]>([]);
  public filteredItems$ = this.filteredItemsSubject.asObservable();

  constructor(private crudService: CrudService) {
    this.firestore = getFirestore();
    this.storage = getStorage();
    this.listenToItems();
  }

  // Setup real-time listener for items
  private listenToItems() {
    const itemsRef = collection(this.firestore, this.itemsCollection);
    onSnapshot(itemsRef, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data() as Item;
        return { ...data, id: doc.id };
      });
      this.itemsSubject.next(items);
    });
  }

  // Get all items
  async getAllItems(): Promise<Item[]> {
    try {
      const itemsRef = collection(this.firestore, this.itemsCollection);
      // Get all items without ordering in the query
      const snapshot = await getDocs(itemsRef);
      
      const items = snapshot.docs.map(doc => {
        const data = doc.data() as Item;
        return { ...data, id: doc.id };
      });
      
      // Sort in memory instead of in the query
      const sortedItems = items.sort((a, b) => {
        const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return dateB - dateA; // descending order
      });
      
      return sortedItems;
    } catch (error) {
      console.error('Error getting items:', error);
      throw error;
    }
  }

  // Get items by department
  async getItemsByDepartment(department: string): Promise<Item[]> {
    try {
      if (department === 'all') {
        return this.getAllItems();
      }
      
      const itemsRef = collection(this.firestore, this.itemsCollection);
      // Simplified query - only filter by department without ordering
      const q = query(
        itemsRef,
        where('department', '==', department)
      );
      
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => {
        const data = doc.data() as Item;
        return { ...data, id: doc.id };
      });
      
      // Sort in memory
      const sortedItems = items.sort((a, b) => {
        const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return dateB - dateA; // descending order
      });
      
      this.filteredItemsSubject.next(sortedItems);
      return sortedItems;
    } catch (error) {
      console.error('Error getting items by department:', error);
      throw error;
    }
  }

  // Get items by status
  async getItemsByStatus(status: string): Promise<Item[]> {
    try {
      const itemsRef = collection(this.firestore, this.itemsCollection);
      const q = query(
        itemsRef,
        where('status', '==', status),
        orderBy('dateAdded', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => {
        const data = doc.data() as Item;
        return { ...data, id: doc.id };
      });
      
      return items;
    } catch (error) {
      console.error('Error getting items by status:', error);
      throw error;
    }
  }

  // Get a single item by ID
  async getItem(id: string): Promise<Item | null> {
    try {
      const itemRef = doc(this.firestore, this.itemsCollection, id);
      const itemDoc = await getDoc(itemRef);
      
      if (itemDoc.exists()) {
        const data = itemDoc.data() as Item;
        return { ...data, id: itemDoc.id };
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error getting item with ID ${id}:`, error);
      throw error;
    }
  }

  // Add a new item
  async addItem(item: Item, imageFile?: File): Promise<string> {
    try {
      console.log('Adding item with image path:', item.image);
      
      // Set status to available by default if not provided
      if (!item.status) {
        item.status = 'available';
      }
      
      // Set dateAdded to current date if not provided
      if (!item.dateAdded) {
        item.dateAdded = Timestamp.now();
      }
      
      // Ensure image path is set correctly if provided
      if (item.image) {
        // Make sure the path starts with a slash
        if (!item.image.startsWith('/')) {
          item.image = '/' + item.image;
        }
      }
      
      console.log('Final image path for new item:', item.image);
      
      // If image file is provided, try to upload it
      if (imageFile) {
        try {
          // First try with Firebase Storage
          const imageUrl = await this.uploadImage(imageFile);
          item.image = imageUrl;
        } catch (uploadError) {
          console.warn('Firebase Storage upload failed:', uploadError);
          
          // Add image metadata to the item description so we know what the original image was
          item.description += `\n\nOriginal image: ${imageFile.name} (${Math.round(imageFile.size / 1024)} KB)`;
        }
      }
      
      // Add the item to Firestore
      const itemsRef = collection(this.firestore, this.itemsCollection);
      const docRef = await addDoc(itemsRef, item);
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  }

  // Upload image to Firebase Storage
  private async uploadImage(file: File): Promise<string> {
    try {
      // Generate a unique filename
      const filePath = `item-images/${new Date().getTime()}_${file.name}`;
      const storageRef = ref(this.storage, filePath);
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit. Please choose a smaller image.');
      }
      
      // Set metadata with appropriate content type
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'origin': 'JosenianBorrowEase App'
        }
      };
      
      // Upload the file with metadata
      await uploadBytes(storageRef, file, metadata);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      // Provide more detailed error messages based on error type
      if (error.code === 'storage/unauthorized' || error.name === 'FirebaseError' || 
          error.message?.includes('CORS')) {
        // This might be a CORS issue
        console.error('This might be a CORS issue. Please ensure CORS is properly configured for Firebase Storage.');
        throw new Error(
          'Access denied while uploading image. This is likely a CORS configuration issue.\n\n' +
          'Please configure CORS for your Firebase Storage by running:\n' +
          'gsutil cors set cors.json gs://' + this.getBucketName() + '\n\n' +
          'See the README.md file for detailed instructions.'
        );
      } else if (error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please try again later or contact support.');
      } else {
        throw new Error('Failed to upload image: ' + error.message);
      }
    }
  }

  // Update an item
  async updateItem(id: string, item: Partial<Item>, imageFile?: File): Promise<void> {
    try {
      console.log('Updating item with ID:', id, 'and image path:', item.image);
      const itemRef = doc(this.firestore, this.itemsCollection, id);
      
      // Ensure image path is set correctly if provided
      if (item.image) {
        // Make sure the path starts with a slash
        if (!item.image.startsWith('/')) {
          item.image = '/' + item.image;
        }
      }
      
      console.log('Final image path for update:', item.image);
      
      // If image file is provided, upload it
      if (imageFile) {
        const imageUrl = await this.uploadImage(imageFile);
        item.image = imageUrl;
      }
      
      await updateDoc(itemRef, item);
    } catch (error) {
      console.error(`Error updating item with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete an item
  async deleteItem(id: string): Promise<void> {
    try {
      const itemRef = doc(this.firestore, this.itemsCollection, id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error(`Error deleting item with ID ${id}:`, error);
      throw error;
    }
  }

  // Search items by name
  async searchItems(searchTerm: string): Promise<Item[]> {
    try {
      // Get all items and filter on the client side (Firestore doesn't support LIKE queries)
      const items = await this.getAllItems();
      
      // Filter items whose name contains the search term (case insensitive)
      const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filteredItems;
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }

  // Helper method to get Firebase Storage bucket name
  private getBucketName(): string {
    // This should match your Firebase Storage bucket name
    // You can find this in Firebase Console -> Storage -> Files
    // It typically follows the pattern: projectid.appspot.com
    
    // Extract from storage reference if possible
    try {
      const storageRef = ref(this.storage, '');
      const fullPath = storageRef.toString();
      
      // Parse the bucket name from the full path
      const bucketMatch = fullPath.match(/\/b\/([^\/]+)/);
      if (bucketMatch && bucketMatch[1]) {
        return bucketMatch[1];
      }
    } catch (e) {
      console.warn('Could not determine bucket name automatically', e);
    }
    
    // Return from firebaseConfig in environment.ts
    return 'josenianborrowease.appspot.com';
  }
}
