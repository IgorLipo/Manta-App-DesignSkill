'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SO</span>
          </div>
          <span className="font-semibold text-slate-900">Solar Ops</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="/dashboard" className="text-sm font-medium text-brand-600">Dashboard</a>
          <a href="/jobs" className="text-sm text-slate-600 hover:text-slate-900">Jobs</a>
          <a href="/scaffolders" className="text-sm text-slate-600 hover:text-slate-900">Scaffolders</a>
          <a href="/reports" className="text-sm text-slate-600 hover:text-slate-900">Reports</a>
          <a href="/settings" className="text-sm text-slate-600 hover:text-slate-900">Settings</a>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-200 rounded-full" />
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Jobs', value: '24', change: '+3 this week' },
            { label: 'Pending Review', value: '7', change: 'Needs attention' },
            { label: 'Scheduled', value: '12', change: 'Next 14 days' },
            { label: 'Completed', value: '156', change: 'All time' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Job pipeline */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Job Pipeline</h2>
            <button className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition">
              + New Job
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-6 gap-2">
              {[
                { status: 'Awaiting Submission', count: 3, color: 'bg-amber-50 border-amber-200' },
                { status: 'Submitted', count: 5, color: 'bg-blue-50 border-blue-200' },
                { status: 'Needs Info', count: 2, color: 'bg-orange-50 border-orange-200' },
                { status: 'Validated', count: 4, color: 'bg-emerald-50 border-emerald-200' },
                { status: 'Quote Pending', count: 3, color: 'bg-purple-50 border-purple-200' },
                { status: 'Scheduled', count: 7, color: 'bg-sky-50 border-sky-200' },
              ].map((col) => (
                <div key={col.status} className={`rounded-lg border p-3 ${col.color}`}>
                  <p className="text-xs font-medium text-slate-600 mb-2">{col.status}</p>
                  <p className="text-xl font-bold text-slate-900">{col.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent jobs table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Recent Jobs</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Address</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Owner</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Updated</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { address: '14 Oak Avenue, Bristol', owner: 'John Smith', status: 'Quote Submitted', updated: '2h ago' },
                { address: '7 Pine Road, Exeter', owner: 'Sarah Jones', status: 'Awaiting Photos', updated: '5h ago' },
                { address: '22 Elm Street, Cardiff', owner: 'Mike Brown', status: 'Scheduled', updated: '1d ago' },
              ].map((job, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{job.address}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{job.owner}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">{job.updated}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
