'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, List, LayoutGrid, Search, Filter, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const jobs = [
  { id: 'JOB-001', address: '14 Oak Avenue, Bristol BS1 2AB', owner: 'Sarah Jones', status: 'Submitted', region: 'South West', scaffolder: 'Acme Scaffolding', updated: '2h ago' },
  { id: 'JOB-002', address: '7 Pine Road, Exeter EX4 5BT', owner: 'Michael Brown', status: 'Needs Info', region: 'South West', scaffolder: 'Southwest Scaff', updated: '5h ago' },
  { id: 'JOB-003', address: '22 Elm Street, Cardiff CF10 1AB', owner: 'Emily Wilson', status: 'Scheduled', region: 'Wales', scaffolder: 'Welsh Scaffolding', updated: '1d ago' },
  { id: 'JOB-004', address: '89 Maple Drive, Manchester M1 5AB', owner: 'David Taylor', status: 'Validated', region: 'North West', scaffolder: 'Northern Scaff', updated: '1d ago' },
  { id: 'JOB-005', address: '3 Cedar Lane, Birmingham B1 2DE', owner: 'Lisa Anderson', status: 'Quote Pending', region: 'Midlands', scaffolder: 'Midland Scaff Co', updated: '2d ago' },
  { id: 'JOB-006', address: '45 Birch Road, Leeds LS2 7PN', owner: 'James Martin', status: 'Awaiting Submission', region: 'Yorkshire', scaffolder: 'Yorkshire Scaff', updated: '2d ago' },
  { id: 'JOB-007', address: '12 Willow Way, Glasgow G1 5PY', owner: 'Rachel White', status: 'Quote Submitted', region: 'Scotland', scaffolder: 'Scottish Scaff', updated: '3d ago' },
  { id: 'JOB-008', address: '67 Ash Street, Liverpool L1 8JQ', owner: 'Robert Clark', status: 'Submitted', region: 'North West', scaffolder: 'Liverpool Scaff', updated: '3d ago' },
];

const statusVariant: Record<string, 'default' | 'warning' | 'info' | 'success' | 'secondary'> = {
  'Submitted': 'secondary', 'Needs Info': 'warning', 'Scheduled': 'default',
  'Validated': 'success', 'Quote Pending': 'info', 'Awaiting Submission': 'warning',
  'Quote Submitted': 'info',
};

export default function JobsPage() {
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredJobs = jobs.filter(j =>
    (statusFilter === 'all' || j.status === statusFilter) &&
    (j.address.toLowerCase().includes(search.toLowerCase()) || j.owner.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Jobs</h1>
          <p className="text-text-muted">Manage and track all solar installation jobs</p>
        </div>
        <Button><Filter className="w-4 h-4 mr-2" /> Filter</Button>
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
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Needs Info">Needs Info</SelectItem>
                <SelectItem value="Validated">Validated</SelectItem>
                <SelectItem value="Quote Pending">Quote Pending</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
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

      {view === 'list' ? (
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
                    <td className="px-5 py-4 text-sm text-text-muted">{job.owner}</td>
                    <td className="px-5 py-4"><Badge variant={statusVariant[job.status]}>{job.status}</Badge></td>
                    <td className="px-5 py-4 text-sm text-text-muted">{job.region}</td>
                    <td className="px-5 py-4 text-sm text-text-muted">{job.scaffolder}</td>
                    <td className="px-5 py-4 text-sm text-text-muted">{job.updated}</td>
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
          {['Submitted', 'Needs Info', 'Validated', 'Quote Pending', 'Scheduled', 'Completed'].map((status) => (
            <Card key={status}>
              <div className="px-4 py-3 border-b border-border bg-slate-50">
                <p className="font-medium text-sm">{status}</p>
                <p className="text-2xl font-bold">{filteredJobs.filter(j => j.status === status).length}</p>
              </div>
              <CardContent className="p-2 space-y-2 max-h-96 overflow-y-auto">
                {filteredJobs.filter(j => j.status === status).map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="p-3 rounded-md bg-slate-50 hover:bg-slate-100 cursor-pointer">
                      <p className="text-xs font-medium text-primary">{job.id}</p>
                      <p className="text-sm text-text truncate">{job.address}</p>
                      <p className="text-xs text-text-muted">{job.owner}</p>
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
