export interface Item {
  id?: string;
  name: string;
  description: string;
  department: string;
  productCode: string;
  image: string;
  status: 'available' | 'borrowed' | 'unavailable' | 'in_use' | 'maintenance' | 'reserved';
  dateAdded: Date | any; // any to accommodate Firestore Timestamp
  addedBy?: string;
  borrower?: string;
  returnDate?: Date | any;
}

export interface BorrowRequest {
  id?: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  itemCode?: string; // Added missing property
  requesterName: string;
  requesterEmail: string;
  requesterStudentId: string;
  requestDate: Date | any;
  eventDate: Date | any;
  returnDate: Date | any;
  eventName: string;
  reason: string;
  purpose?: string; // Added missing property
  department: string;
  status: 'waiting' | 'approved' | 'not_approved' | 'returned';
  approvedBy?: string;
  approvalDate?: Date | any;
  notes?: string;
}

export interface Department {
  id: string;
  name: string;
  color: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  studentId?: string;
  department?: string;
  role?: 'student' | 'approver' | 'admin';
}
