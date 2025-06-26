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
  where 
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CrudService {
  private firestore: Firestore;

  constructor() {
    try {
      // Get a reference to the already initialized Firebase app
      // If it fails, we'll initialize it here as a fallback
      console.log('Initializing Firestore in CrudService');
      this.firestore = getFirestore();
      console.log('Firestore initialized successfully');
    } catch (error) {
      console.error('Error initializing Firestore, trying fallback:', error);
      // Fallback initialization if the app-level initialization failed
      const app = initializeApp(environment.firebase)
      this.firestore = getFirestore(app);
      console.log('Firestore initialized with fallback method');
    }
  }

  // Helper method to convert JavaScript Date objects to Firestore-friendly format
  private prepareDataForFirestore(data: any): any {
    // Create a deep copy to avoid modifying the original
    const result = { ...data };
    
    // Convert Date objects to something Firestore can handle
    // Firestore will automatically convert to Timestamp
    for (const key in result) {
      if (result[key] instanceof Date) {
        // Keep as Date object, Firestore will handle the conversion
        console.log(`Converting Date field '${key}' for Firestore`);
      }
    }
    
    return result;
  }

  // Create a new item in the specified collection
  async createItem(collectionName: string, data: any): Promise<string> {
    try {
      console.log('Starting to create item in collection:', collectionName, 'with data:', data);
      const collectionRef = collection(this.firestore, collectionName);
      console.log('Collection reference created');
      
      // Prepare the data for Firestore
      const firestoreData = this.prepareDataForFirestore(data);
      console.log('Data prepared for Firestore:', firestoreData);
      
      const docRef = await addDoc(collectionRef, firestoreData);
      console.log('Document created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error in createItem:', error);
      throw error;
    }
  }

  // Get all items from a collection
  async getItems(collectionName: string): Promise<any[]> {
    const collectionRef = collection(this.firestore, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => {
      return { id: doc.id, ...doc.data() };
    });
  }

  // Get a single item by ID
  async getItemById(collectionName: string, id: string): Promise<any> {
    const docRef = doc(this.firestore, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  }

  // Update an item
  async updateItem(collectionName: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, collectionName, id);
    await updateDoc(docRef, data);
  }

  // Delete an item
  async deleteItem(collectionName: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, collectionName, id);
    await deleteDoc(docRef);
  }

  // Search items by field
  async searchItems(collectionName: string, field: string, value: any): Promise<any[]> {
    const collectionRef = collection(this.firestore, collectionName);
    const q = query(collectionRef, where(field, "==", value));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      return { id: doc.id, ...doc.data() };
    });
  }
}
