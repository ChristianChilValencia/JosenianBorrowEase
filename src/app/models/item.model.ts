export interface Item {
  id?: string;
  name: string;
  description: string;
  createdAt: Date | any; // any to accommodate Firestore Timestamp
  updatedAt?: Date | any; // any to accommodate Firestore Timestamp
}
