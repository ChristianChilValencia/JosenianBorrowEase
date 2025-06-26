import { Injectable } from '@angular/core';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  Firestore 
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = getAuth();
  private firestore: Firestore;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isApproverSubject = new BehaviorSubject<boolean>(false);
  public isApprover$ = this.isApproverSubject.asObservable();

  constructor() {
    this.firestore = getFirestore();
    this.initAuthListener();
  }

  // Initialize auth state listener
  private initAuthListener() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const user = await this.getUserData(firebaseUser.uid);
        this.currentUserSubject.next(user);
        
        // Check if user is an approver
        const isApprover = user?.role === 'approver' || user?.role === 'admin';
        this.isApproverSubject.next(isApprover);
      } else {
        // User is signed out
        this.currentUserSubject.next(null);
        this.isApproverSubject.next(false);
      }
    });
  }

  // Get current user data from Firestore
  async getUserData(uid: string): Promise<User | null> {
    try {
      const userRef = doc(this.firestore, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        return { ...userData, uid }; // Ensure uid is included and not overwritten
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, userData: Partial<User>): Promise<FirebaseUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await this.createUserProfile(user.uid, {
        uid: user.uid,
        email: user.email || email,
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || '',
        studentId: userData.studentId || '',
        department: userData.department || '',
        role: userData.role || 'student'
      });
      
      return user;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  // Create user profile in Firestore
  async createUserProfile(uid: string, userData: User): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', uid);
      await setDoc(userRef, userData);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Check if user is an approver - always true in demo mode
  isUserApprover(): boolean {
    return true; // Always return true for demo mode
  }

  // Get current user - returns a demo user for demo mode
  getCurrentUser(): User {
    // Create a demo user for single-user mode
    const demoUser: User = {
      uid: 'demo-user-id',
      email: 'demo@josenian.edu',
      displayName: 'Demo User',
      department: 'IT',
      role: 'approver'
    };
    
    // Always return the demo user regardless of actual auth state
    return demoUser;
  }
}
