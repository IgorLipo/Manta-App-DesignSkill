'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { jobsApi } from '@/lib/api';
import { toast } from '@/components/ui/toaster';

const statusBadgeVariant: Record<string, 'default' | 'warning' | 'info' | 'success' | 'secondary'> = {
  PENDING_QUOTE: 'warning',
  QUOTE_SUBMITTED: 'info',
  QUOTE_APPROVED: 'success',
  QUOTE_REJECTED: 'warning',
  SCHEDULED: 'default',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'secondary',
  AWAITING_PHOTOS: 'warning',
  NEEDS_INFO: 'warning',
  VALIDATED: 'success',
  DRAFT: 'secondary',
};

export default function DashboardPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewJob, setShowNewJob] = useState(false);
  const [newJob, setNewJob] = useState({ address: '', ownerName: '', ownerEmail: '' });
  const [creating, setCreating] = useState(false);

  const fetchJobs = async () => {
    try {
      const { data } = await jobsApi.list({ limit: 100 });
      const items = data.items || data.data?.items || [];
      setJobs(items);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCreateJob = async () => {
    if (!newJob.address || !newJob.ownerName || !newJob.ownerEmail) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCreating(true);
    try {
      await jobsApi.create({
        address: newJob.address,
        customerName: newJob.ownerName,
        customerEmail: newJob.ownerEmail,
      });
      toast.success('Job created');
      setShowNewJob(false);
      setNewJob({ address: '', ownerName: '', ownerEmail: '' });
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  // KPI stats from real data
  const totalJobs = jobs.length;
  const pendingReview = jobs.filter(j => ['QUOTE_SUBMITTED', 'NEEDS_INFO', 'AWAITING_PHOTOS'].includes(j.status)).length;
  const scheduled = jobs.filter(j => j.status === 'SCHEDULED').length;
  const completed = jobs.filter(j => j.status === 'COMPLETED').length;

  const pipelineCounts: Record<string, number> = {};
  jobs.forEach(j => { pipelineCounts[j.status] = (pipelineCounts[j.status] || 0) + 1; });

  const pipelineColumns = [
    { status: 'DRAFT', label: 'Draft' },
    { status: 'PENDING_QUOTE', label: 'Pending Quote' },
    { status: 'QUOTE_SUBMITTED', label: 'Quote Submitted' },
    { status: 'VALIDATED', label: 'Validated' },
    { status: 'SCHEDULED', label: 'Scheduled' },
    { status: 'COMPLETED', label: 'Completed' },
  ];

  const recentJobs = [...jobs].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()).slice(0, 10);

  const formatDate = (d: string) => {
    if (!d) return '-';
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-text-muted">Welcome back, here is your overview</p>
        </div>
        <Button onClick={() => setShowNewJob(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Job
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Jobs', value: totalJobs, subtext: 'All time', color: 'text-primary' },
          { label: 'Pending Review', value: pendingReview, subtext: 'Needs attention', color: 'text-amber-600' },
          { label: 'Scheduled', value: scheduled, subtext: 'Next 14 days', color: 'text-blue-600' },
          { label: 'Completed', value: completed, subtext: 'All time', color: 'text-green-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-sm text-text-muted mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{loading ? '-' : stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Kanban */}
      <Card>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text">Job Pipeline</h2>
          <Button size="sm" onClick={() => setShowNewJob(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Job
          </Button>
        </div>
        <CardContent className="p-5 overflow-x-auto">
          {loading ? (
            <p className="text-text-muted text-sm">Loading...</p>
          ) : (
            <div className="flex gap-3 min-w-max">
              {pipelineColumns.map((col) => (
                <div key={col.status} className="w-40 rounded-lg border-2 bg-slate-50 border-slate-200">
                  <div className="px-3 py-2 border-b border-border/50 rounded-t-lg">
                    <p className="text-xs font-semibold text-text-muted">{col.label}</p>
                    <p className="text-2xl font-bold text-text">{pipelineCounts[col.status] || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Jobs Table */}
      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-text">Recent Jobs</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-text-muted">Loading...</div>
          ) : recentJobs.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No jobs found</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Ref</th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Address</th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Owner</th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Updated</th>
                  <th className="text-right text-xs font-medium text-text-muted uppercase px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b border-border hover:bg-slate-50/50">
                    <td className="px-5 py-4 text-sm font-medium text-primary">{job.id}</td>
                    <td className="px-5 py-4 text-sm text-text">{job.address || '-'}</td>
                    <td className="px-5 py-4 text-sm text-text-muted">{job.customerName || '-'}</td>
                    <td className="px-5 py-4">
                      <Badge variant={statusBadgeVariant[job.status] || 'default'}>{job.status?.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">{formatDate(job.updatedAt || job.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="ghost" size="sm">View →</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* New Job Dialog */}
      <Dialog open={showNewJob} onOpenChange={setShowNewJob}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Property Address *</label>
              <Input value={newJob.address} onChange={e => setNewJob({ ...newJob, address: e.target.value })} placeholder="123 Solar Street, London" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Owner Name *</label>
              <Input value={newJob.ownerName} onChange={e => setNewJob({ ...newJob, ownerName: e.target.value })} placeholder="John Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Owner Email *</label>
              <Input type="email" value={newJob.ownerEmail} onChange={e => setNewJob({ ...newJob, ownerEmail: e.target.value })} placeholder="john@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewJob(false)}>Cancel</Button>
            <Button onClick={handleCreateJob} disabled={creating}>{creating ? 'Creating...' : 'Create Job'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
