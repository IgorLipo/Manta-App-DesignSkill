import { create } from 'zustand';

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

export interface Job {
  id: string;
  address: string;
  postcode: string;
  propertyType: string;
  status: JobStatus;
  priority: 'high' | 'medium' | 'normal';
  location?: { latitude: number; longitude: number };
  photos?: string[];
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  scaffolderId?: string;
  quote?: {
    amount: number;
    startDate: string;
    endDate: string;
    notes: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  };
  schedule?: {
    date: string;
    confirmedBy: string[];
    requestedChanges?: { requestedBy: string; reason: string }[];
  };
  adminNotes?: string;
}

export interface JobState {
  currentJob: Job | null;
  jobs: Job[];
  isLoading: boolean;
  setCurrentJob: (job: Job | null) => void;
  setJobs: (jobs: Job[]) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
}

export const useJobStore = create<JobState>((set, get) => ({
  currentJob: null,
  jobs: [],
  isLoading: false,

  setCurrentJob: (job) => set({ currentJob: job }),

  setJobs: (jobs) => set({ jobs }),

  updateJob: (id, updates) => {
    const { jobs } = get();
    const updatedJobs = jobs.map((job) =>
      job.id === id ? { ...job, ...updates } : job
    );
    set({ jobs: updatedJobs });

    const { currentJob } = get();
    if (currentJob?.id === id) {
      set({ currentJob: { ...currentJob, ...updates } });
    }
  },
}));
