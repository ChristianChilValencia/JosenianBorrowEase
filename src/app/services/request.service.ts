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
import { CrudService } from './crud.service';
import { BorrowRequest } from '../models/item.model';
import { ItemService } from './item.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private firestore: Firestore;
  private requestsCollection = 'borrowRequests';
  
  private requestsSubject = new BehaviorSubject<BorrowRequest[]>([]);
  public requests$ = this.requestsSubject.asObservable();
  
  private filteredRequestsSubject = new BehaviorSubject<BorrowRequest[]>([]);
  public filteredRequests$ = this.filteredRequestsSubject.asObservable();

  constructor(
    private crudService: CrudService,
    private itemService: ItemService
  ) {
    this.firestore = getFirestore();
    this.listenToRequests();
  }

  // Setup real-time listener for requests
  private listenToRequests() {
    const requestsRef = collection(this.firestore, this.requestsCollection);
    onSnapshot(requestsRef, (snapshot) => {
      const requests = snapshot.docs.map(doc => {
        const data = doc.data() as BorrowRequest;
        return { ...data, id: doc.id };
      });
      this.requestsSubject.next(requests);
    });
  }

  // Get all requests
  async getAllRequests(): Promise<BorrowRequest[]> {
    try {
      const requestsRef = collection(this.firestore, this.requestsCollection);
      const q = query(requestsRef, orderBy('requestDate', 'desc'));
      const snapshot = await getDocs(q);
      
      const requests = snapshot.docs.map(doc => {
        const data = doc.data() as BorrowRequest;
        return { ...data, id: doc.id };
      });
      
      return requests;
    } catch (error) {
      console.error('Error getting requests:', error);
      throw error;
    }
  }

  // Get requests by status
  async getRequestsByStatus(status: string): Promise<BorrowRequest[]> {
    try {
      const requestsRef = collection(this.firestore, this.requestsCollection);
      
      // Create the query - need to create a Firebase index for this
      const q = query(
        requestsRef,
        where('status', '==', status),
        orderBy('requestDate', 'desc')
      );
      
      try {
        const snapshot = await getDocs(q);
        
        const requests = snapshot.docs.map(doc => {
          const data = doc.data() as BorrowRequest;
          return { ...data, id: doc.id };
        });
        
        this.filteredRequestsSubject.next(requests);
        return requests;
      } catch (error: any) {
        // Check for missing index error
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          console.error('Firestore index is missing:', error);
          
          // Extract the index creation URL from the error message if available
          const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s"')]+/);
          if (urlMatch && urlMatch[0]) {
            console.warn('Create the missing index here:', urlMatch[0]);
            throw new Error(`Missing Firestore index. Create it here: ${urlMatch[0]}`);
          } else {
            throw new Error('Missing Firestore index for requests by status query. Please create a composite index on the "borrowRequests" collection with fields: "status" (Ascending) and "requestDate" (Descending)');
          }
        }
        throw error;
      }
    } catch (error) {
      console.error(`Error getting requests with status ${status}:`, error);
      throw error;
    }
  }

  // Get pending requests
  async getPendingRequests(): Promise<BorrowRequest[]> {
    return this.getRequestsByStatus('waiting');
  }

  // Get approved requests
  async getApprovedRequests(): Promise<BorrowRequest[]> {
    return this.getRequestsByStatus('approved');
  }

  // Get rejected requests
  async getRejectedRequests(): Promise<BorrowRequest[]> {
    return this.getRequestsByStatus('not_approved');
  }

  // Get requests by user
  async getRequestsByUser(userId: string): Promise<BorrowRequest[]> {
    try {
      const requestsRef = collection(this.firestore, this.requestsCollection);
      
      // Create the query - need to create a Firebase index for this
      const q = query(
        requestsRef,
        where('requesterEmail', '==', userId),
        orderBy('requestDate', 'desc')
      );
      
      try {
        const snapshot = await getDocs(q);
        
        const requests = snapshot.docs.map(doc => {
          const data = doc.data() as BorrowRequest;
          return { ...data, id: doc.id };
        });
        
        return requests;
      } catch (error: any) {
        // Check for missing index error
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          console.error('Firestore index is missing:', error);
          
          // Extract the index creation URL from the error message if available
          const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s"')]+/);
          if (urlMatch && urlMatch[0]) {
            console.warn('Create the missing index here:', urlMatch[0]);
            throw new Error(`Missing Firestore index. Create it here: ${urlMatch[0]}`);
          } else {
            throw new Error('Missing Firestore index for requests by user query. Please create a composite index on the "borrowRequests" collection with fields: "requesterEmail" (Ascending) and "requestDate" (Descending)');
          }
        }
        throw error;
      }
    } catch (error) {
      console.error(`Error getting requests for user ${userId}:`, error);
      throw error;
    }
  }

  // Get a single request by ID
  async getRequest(id: string): Promise<BorrowRequest | null> {
    try {
      const requestRef = doc(this.firestore, this.requestsCollection, id);
      const requestDoc = await getDoc(requestRef);
      
      if (requestDoc.exists()) {
        const data = requestDoc.data() as BorrowRequest;
        return { ...data, id: requestDoc.id };
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error getting request with ID ${id}:`, error);
      throw error;
    }
  }

  // Create a new borrow request
  async createRequest(request: BorrowRequest): Promise<string> {
    try {
      // Set requestDate to current date if not provided
      if (!request.requestDate) {
        request.requestDate = Timestamp.now();
      }
      
      // Set status to waiting by default if not provided
      if (!request.status) {
        request.status = 'waiting';
      }
      
      // Add the request to Firestore
      const requestsRef = collection(this.firestore, this.requestsCollection);
      const docRef = await addDoc(requestsRef, request);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  // Update a request status (approve or reject)
  async updateRequestStatus(
    id: string, 
    status: 'approved' | 'not_approved', 
    approverEmail: string, 
    notes?: string
  ): Promise<void> {
    try {
      const requestRef = doc(this.firestore, this.requestsCollection, id);
      
      const updateData: Partial<BorrowRequest> = {
        status,
        approvedBy: approverEmail,
        approvalDate: Timestamp.now(),
        notes: notes || ''
      };
      
      await updateDoc(requestRef, updateData);
      
      // If approved, update the item status as well
      if (status === 'approved') {
        const request = await this.getRequest(id);
        if (request) {
          await this.itemService.updateItem(request.itemId, {
            status: 'borrowed',
            borrower: request.requesterEmail,
            returnDate: request.returnDate
          });
        }
      }
    } catch (error) {
      console.error(`Error updating request status for ID ${id}:`, error);
      throw error;
    }
  }

  // Mark item as returned
  async markItemReturned(requestId: string, itemId: string): Promise<void> {
    try {
      // Update the request status
      const requestRef = doc(this.firestore, this.requestsCollection, requestId);
      await updateDoc(requestRef, {
        status: 'returned',
        returnDate: Timestamp.now()
      });
      
      // Update the item status
      await this.itemService.updateItem(itemId, {
        status: 'available',
        borrower: '',
        returnDate: null
      });
    } catch (error) {
      console.error(`Error marking item returned for request ${requestId}:`, error);
      throw error;
    }
  }
}
