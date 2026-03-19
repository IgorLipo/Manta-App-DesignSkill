'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const kpiStats = [
  { label: 'Total Jobs', value: 24, subtext: '+3 this week', color: 'text-primary' },
  { label: 'Pending Review', value: 7, subtext: 'Needs attention', color: 'text-amber-600' },
  { label: 'Scheduled', value: 12, subtext: 'Next 14 days', color: 'text-blue-600' },
  { label: 'Completed', value: 156, subtext: 'All time', color: 'text-green-600' },
];

const pipelineColumns = [
  { status: 'Awaiting Submission', count: 3, color: 'bg-amber-100 border-amber-300', headerColor: 'bg-amber-50' },
  { status: 'Submitted', count: 5, color: 'bg-blue-100 border-blue-300', headerColor: 'bg-blue-50' },
  { status: 'Needs Info', count: 2, color: 'bg-orange-100 border-orange-300', headerColor: 'bg-orange-50' },
  { status: 'Validated', count: 4, color: 'bg-emerald-100 border-emerald-300', headerColor: 'bg-emerald-50' },
  { status: 'Quote Pending', count: 3, color: 'bg-purple-100 border-purple-300', headerColor: 'bg-purple-50' },
  { status: 'Scheduled', count: 7, color: 'bg-sky-100 border-sky-300', headerColor: 'bg-sky-50' },
];

const recentJobs = [
  { id: 'JOB-001', address: '14 Oak Avenue, Bristol BS1 2AB', owner: 'Sarah Jones', status: 'Quote Submitted', updated: '2h ago' },
  { id: 'JOB-002', address: '7 Pine Road, Exeter EX4 5BT', owner: 'Michael Brown', status: 'Awaiting Photos', updated: '5h ago' },
  { id: 'JOB-003', address: '22 Elm Street, Cardiff CF10 1AB', owner: 'Emily Wilson', status: 'Scheduled', updated: '1d ago' },
  { id: 'JOB-004', address: '89 Maple Drive, Manchester M1 5AB', owner: 'David Taylor', status: 'Validated', updated: '1d ago' },
  { id: 'JOB-005', address: '3 Cedar Lane, Birmingham B1 2DE', owner: 'Lisa Anderson', status: 'Submitted', updated: '2d ago' },
  { id: 'JOB-006', address: '45 Birch Road, Leeds LS2 7PN', owner: 'James Martin', status: 'Needs Info', updated: '2d ago' },
  { id: 'JOB-007', address: '12 Willow Way, Glasgow G1 5PY', owner: 'Rachel White', status: 'Quote Pending', updated: '3d ago' },
  { id: 'JOB-008', address: '67 Ash Street, Liverpool L1 8JQ', owner: 'Robert Clark', status: 'Awaiting Submission', updated: '3d ago' },
  { id: 'JOB-009', address: '8 Spruce Avenue, Bristol BS8 4RS', owner: 'Anna Lewis', status: 'Completed', updated: '4d ago' },
  { id: 'JOB-010', 'address': '21 Holly Close, Sheffield S1 4AB', owner: 'Chris Walker', status: 'Completed', updated: '5d ago' },
];

const statusBadgeVariant: Record<string, 'default' | 'warning' | 'info' | 'success' | 'secondary'> = {
  'Quote Submitted': 'info',
  'Awaiting Photos': 'warning',
  'Scheduled': 'default',
  'Validated': 'success',
  'Submitted': 'secondary',
  'Needs Info': 'warning',
  'Quote Pending': 'secondary',
  'Awaiting Submission': 'warning',
  'Completed': 'success',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-text-muted">Welcome back, here is your overview</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> New Job
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-sm text-text-muted mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Kanban */}
      <Card>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text">Job Pipeline</h2>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Job
          </Button>
        </div>
        <CardContent className="p-5 overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {pipelineColumns.map((col) => (
              <div key={col.status} className={`w-40 rounded-lg border-2 ${col.color}`}>
                <div className={`px-3 py-2 ${col.headerColor} border-b border-border/50 rounded-t-lg`}>
                  <p className="text-xs font-semibold text-text-muted">{col.status}</p>
                  <p className="text-2xl font-bold text-text">{col.count}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs Table */}
      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-text">Recent Jobs</h2>
        </div>
        <div className="overflow-x-auto">
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
                  <td className="px-5 py-4 text-sm text-text">{job.address}</td>
                  <td className="px-5 py-4 text-sm text-text-muted">{job.owner}</td>
                  <td className="px-5 py-4">
                    <Badge variant={statusBadgeVariant[job.status] || 'default'}>{job.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted">{job.updated}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="ghost" size="sm">View →</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
