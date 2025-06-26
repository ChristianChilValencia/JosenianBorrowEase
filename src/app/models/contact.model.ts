export interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: Date | any;
  updatedAt?: Date | any;
}
