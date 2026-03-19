'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Eye, List, LayoutGrid, Search, Filter, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { jobsApi } from '@/lib/api';
import { toast } from '@/components/ui/toaster';

interface Job {
  id: string;
  address: string;
  ownerName: string;
  status: string;
  region: string;
  scaffolderName?: string;
  updatedAt: string;
}

const statusVariant: Record<string, 'default' | 'warning' | 'info' | 'success' | 'secondary'> = {
  'SUBMITTED': 'secondary',
  'NEEDS_INFO': 'warning',
  'SCHEDULED': 'default',
  'VALIDATED': 'success',
  'QUOTE_PENDING': 'info',
  'AWAITING_SUBMISSION': 'warning',
  'QUOTE_SUBMITTED': 'info',
  'COMPLETED': 'success',
};

interface JobFormData {
  address: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  regionId: string;
}

const initialFormData: JobFormData = {
  address: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  regionId: '',
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string; search?: string } = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const response = await jobsApi.list(params) as { data: Job[] };
      setJobs(response.data || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast({ title: 'Error', description: 'Failed to load jobs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await jobsApi.create({
        address: formData.address,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        regionId: formData.regionId,
      });
      toast({ title: 'Success', description: 'Job created successfully' });
      setIsDialogOpen(false);
      setFormData(initialFormData);
      fetchJobs();
    } catch (error) {
      console.error('Failed to create job:', error);
      toast({ title: 'Error', description: 'Failed to create job', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(j =>
    (statusFilter === 'all' || j.status === statusFilter) &&
    (j.address?.toLowerCase().includes(search.toLowerCase()) || j.ownerName?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Jobs</h1>
          <p className="text-text-muted">Manage and track all solar installation jobs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
              <DialogDescription>
                Create a new solar installation job.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="address" className="text-sm font-medium">Property Address</label>
                <Input
                  id="address"
                  placeholder="14 Oak Avenue, Bristol BS1 2AB"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="ownerName" className="text-sm font-medium">Owner Name</label>
                <Input
                  id="ownerName"
                  placeholder="Sarah Jones"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="ownerEmail" className="text-sm font-medium">Owner Email</label>
                <Input
                  id="ownerEmail"
                  type="email"
                  placeholder="sarah.jones@email.com"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="ownerPhone" className="text-sm font-medium">Owner Phone</label>
                <Input
                  id="ownerPhone"
                  placeholder="07700 900123"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.address || !formData.ownerName || !formData.ownerEmail || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Job'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search by address or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="NEEDS_INFO">Needs Info</SelectItem>
                <SelectItem value="VALIDATED">Validated</SelectItem>
                <SelectItem value="QUOTE_PENDING">Quote Pending</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 border border-border rounded-md p-1">
              <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('list')}>
                <List className="w-4 h-4" />
              </Button>
              <Button variant={view === 'kanban' ? 'default' : 'ghost'} size="sm" onClick={() => setView('kanban')}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-text-muted">Loading jobs...</CardContent>
        </Card>
      ) : view === 'list' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Ref</th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Address</th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Owner</th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Region</th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Scaffolder</th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Updated</th>
                  <th className="text-right text-xs font-medium text-text-muted uppercase px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="border-b border-border hover:bg-slate-50/50">
                    <td className="px-5 py-4 text-sm font-medium text-primary">{job.id}</td>
                    <td className="px-5 py-4 text-sm text-text">{job.address}</td>
                    <td className="px-5 py-4 text-sm text-text-muted">{job.ownerName}</td>
                    <td className="px-5 py-4"><Badge variant={statusVariant[job.status] || 'secondary'}>{job.status.replace('_', ' ')}</Badge></td>
                    <td className="px-5 py-4 text-sm text-text-muted">{job.region}</td>
                    <td className="px-5 py-4 text-sm text-text-muted">{job.scaffolderName || 'Unassigned'}</td>
                    <td className="px-5 py-4 text-sm text-text-muted">{job.updatedAt}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/jobs/${job.id}`}><Button variant="ghost" size="sm"><Eye className="w-4 h-4 mr-1" /> View</Button></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-text-muted">Showing {filteredJobs.length} of {jobs.length} jobs</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {['SUBMITTED', 'NEEDS_INFO', 'VALIDATED', 'QUOTE_PENDING', 'SCHEDULED', 'COMPLETED'].map((status) => (
            <Card key={status}>
              <div className="px-4 py-3 border-b border-border bg-slate-50">
                <p className="font-medium text-sm">{status.replace('_', ' ')}</p>
                <p className="text-2xl font-bold">{filteredJobs.filter(j => j.status === status).length}</p>
              </div>
              <CardContent className="p-2 space-y-2 max-h-96 overflow-y-auto">
                {filteredJobs.filter(j => j.status === status).map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="p-3 rounded-md bg-slate-50 hover:bg-slate-100 cursor-pointer">
                      <p className="text-xs font-medium text-primary">{job.id}</p>
                      <p className="text-sm text-text truncate">{job.address}</p>
                      <p className="text-xs text-text-muted">{job.ownerName}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
