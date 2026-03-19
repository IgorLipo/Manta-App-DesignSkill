export type Role = 'ADMIN' | 'OWNER' | 'SCAFFOLDER' | 'ENGINEER';

export type JobStatus =
  | 'DRAFT'
  | 'AWAITING_OWNER_SUBMISSION'
  | 'SUBMITTED'
  | 'NEEDS_MORE_INFO'
  | 'VALIDATED'
  | 'ASSIGNED_TO_SCAFFOLDER'
  | 'QUOTE_PENDING'
  | 'QUOTE_SUBMITTED'
  | 'QUOTE_REVISION_REQUESTED'
  | 'QUOTE_APPROVED'
  | 'QUOTE_REJECTED'
  | 'SCHEDULING_IN_PROGRESS'
  | 'SCHEDULED'
  | 'SCAFFOLD_WORK_IN_PROGRESS'
  | 'SCAFFOLD_COMPLETE'
  | 'INSTALLER_ASSIGNED'
  | 'SITE_REPORT_PENDING'
  | 'SITE_REPORT_IN_PROGRESS'
  | 'SITE_REPORT_SUBMITTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD';

export interface User {
  id: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  isActive: boolean;
}

export interface Property {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
}

export interface JobPhoto {
  id: string;
  category: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  amount: number;
  currency: string;
  notes?: string;
  proposedDate?: string;
  status: string;
  submittedAt: string;
  scaffolder: { companyName: string; firstName: string; lastName: string };
}

export interface Job {
  id: string;
  property: Property;
  status: JobStatus;
  statusReason?: string;
  adminNotes?: string;
  photos: JobPhoto[];
  quotes: Quote[];
  schedules: any[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Scaffolder {
  id: string;
  companyName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  regions: { region: { name: string; code: string } }[];
}
