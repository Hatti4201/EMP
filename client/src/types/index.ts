// User and Authentication Types
export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'employee' | 'hr';
  onboardingStatus?: 'never-submitted' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  registrationSuccess: boolean;
}

// Employee Profile Types
export interface Employee {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  email: string;
  profilePicture?: string;
  ssn: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'no-answer';
  address: Address;
  phoneNumbers: PhoneNumbers;
  workAuthorization: WorkAuthorization;
  reference?: Reference;
  emergencyContacts: EmergencyContact[];
  documents: Document[];
  visaDocuments?: VisaDocument[];
  onboardingStatus: 'never-submitted' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  building: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface PhoneNumbers {
  cell: string;
  work?: string;
}

export interface WorkAuthorization {
  isPermanentResident: boolean;
  citizenshipStatus?: 'green-card' | 'citizen';
  visaType?: 'h1b' | 'l2' | 'f1-cpt-opt' | 'h4' | 'other';
  visaTitle?: string;
  startDate?: string;
  endDate?: string;
}

export interface Reference {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email: string;
  relationship: string;
}

export interface EmergencyContact {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email: string;
  relationship: string;
}

export interface Document {
  _id: string;
  name: string;
  type: 'profile-picture' | 'drivers-license' | 'work-authorization' | 'opt-receipt' | 'opt-ead' | 'i983' | 'i20';
  mimeType?: string;
  url: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}

export interface VisaDocument {
  type: 'OPT Receipt' | 'OPT EAD' | 'I-983' | 'I-20';
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  uploadedAt?: Date | string;
  file?: string;
  name?: string;
  url?: string | null;
}

// Onboarding Application Types
export interface OnboardingApplication {
  _id: string;
  employeeId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// Visa Status Management Types
export interface VisaStatus {
  _id?: string;
  employeeId?: string;
  currentStep?: 'opt-receipt' | 'opt-ead' | 'i983' | 'i20' | 'completed';
  documents?: {
    optReceipt?: Document;
    optEad?: Document;
    i983?: Document;
    i20?: Document;
  };
  steps?: VisaStep[];
  nextStepDue?: string;
  updatedAt?: string;
}

export interface VisaStep {
  type: 'OPT Receipt' | 'OPT EAD' | 'I-983' | 'I-20';
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  uploadedAt?: Date | string;
  file?: string;
}

// HR Management Types
export interface RegistrationToken {
  _id: string;
  email: string;
  token: string;
  name?: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
  onboardingStatus?: 'not_registered' | 'registered' | 'pending' | 'approved' | 'rejected';
  registrationLink?: string;
}

export interface HRDashboardStats {
  totalEmployees: number;
  pendingApplications: number;
  inProgressVisa: number;
  expiringSoon: number;
  pendingVisaDocuments: number;
  approvedApplications: number;
}

// Form Types
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegistrationForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface OnboardingForm {
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  profilePicture?: File | string;
  address: Address;
  phoneNumbers: PhoneNumbers;
  ssn: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'no-answer';
  workAuthorization: WorkAuthorization;
  reference?: Reference;
  emergencyContacts: EmergencyContact[];
  documents: {
    driversLicense?: File | string;
    workAuthorization?: File | string;
    optReceipt?: File | string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}

// Redux State Types
export interface RootState {
  auth: AuthState;
  employee: EmployeeState;
  hr: HRState;
}

export interface EmployeeState {
  profile: Employee | null;
  onboardingApplication: OnboardingApplication | null;
  visaStatus: VisaStatus | null;
  documents: Document[];
  loading: boolean;
  error: string | null;
}

export interface HRState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  registrationTokens: RegistrationToken[];
  pendingApplications: OnboardingApplication[];
  dashboardStats: HRDashboardStats | null;
  loading: boolean;
  error: string | null;
} 