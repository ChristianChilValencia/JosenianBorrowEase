import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User>(this.getDemoUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isApproverSubject = new BehaviorSubject<boolean>(true);
  public isApprover$ = this.isApproverSubject.asObservable();

  constructor() {}

  // Check if user is an approver - always true in demo mode
  isUserApprover(): boolean {
    return true; // Always return true for demo mode
  }

  // Get current user - returns a demo user for demo mode
  getCurrentUser(): User {
    return this.getDemoUser();
  }
  
  // Create a demo user object
  private getDemoUser(): User {
    return {
      uid: 'demo-user-id',
      email: 'demo@josenian.edu',
      displayName: 'Demo User',
      department: 'IMC',
      role: 'approver',
      studentId: 'DEMO-123'
    };
  }
}
