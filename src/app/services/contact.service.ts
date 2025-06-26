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
  orderBy 
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { Contact } from '../models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private firestore: Firestore;
  private readonly COLLECTION_NAME = 'contacts';

  constructor() {
    try {
      // Get a reference to the already initialized Firebase app
      console.log('Initializing Firestore in ContactService');
      this.firestore = getFirestore();
      console.log('Firestore initialized successfully');
    } catch (error) {
      console.error('Error initializing Firestore:', error);
      throw error;
    }
  }

  // Helper method to convert JavaScript Date objects to Firestore-friendly format
  private prepareDataForFirestore(data: any): any {
    // Create a deep copy to avoid modifying the original
    const result = { ...data };
    
    // Convert Date objects to something Firestore can handle
    for (const key in result) {
      if (result[key] instanceof Date) {
        console.log(`Converting Date field '${key}' for Firestore`);
      }
    }
    
    return result;
  }

  // Create a new contact
  async createContact(contact: Contact): Promise<string> {
    try {
      console.log('Creating contact:', contact);
      const collectionRef = collection(this.firestore, this.COLLECTION_NAME);
      
      // Prepare the data for Firestore
      const firestoreData = this.prepareDataForFirestore(contact);
      
      const docRef = await addDoc(collectionRef, firestoreData);
      console.log('Contact created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  // Get all contacts, optionally sorted
  async getContacts(sortBy: string = 'lastName'): Promise<Contact[]> {
    try {
      const collectionRef = collection(this.firestore, this.COLLECTION_NAME);
      const q = query(collectionRef, orderBy(sortBy));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() } as Contact;
      });
    } catch (error) {
      console.error('Error getting contacts:', error);
      throw error;
    }
  }

  // Get a single contact by ID
  async getContactById(id: string): Promise<Contact | null> {
    try {
      const docRef = doc(this.firestore, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Contact;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting contact:', error);
      throw error;
    }
  }

  // Update a contact
  async updateContact(id: string, data: Partial<Contact>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.COLLECTION_NAME, id);
      const updateData = this.prepareDataForFirestore(data);
      await updateDoc(docRef, updateData);
      console.log('Contact updated successfully');
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  // Delete a contact
  async deleteContact(id: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
      console.log('Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  // Search contacts by name
  async searchContacts(searchTerm: string): Promise<Contact[]> {
    try {
      // Get all contacts (in a real app, you'd implement server-side search)
      const contacts = await this.getContacts();
      
      // Filter contacts client-side
      const lowerSearchTerm = searchTerm.toLowerCase();
      return contacts.filter(contact => 
        contact.firstName.toLowerCase().includes(lowerSearchTerm) || 
        contact.lastName.toLowerCase().includes(lowerSearchTerm) ||
        contact.phoneNumber.includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw error;
    }
  }
}
