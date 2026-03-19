'use client';

import { useState, useEffect, useCallback } from 'react';
import { auditApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;
      const { data } = await auditApi.list(params);
      setLogs(data.items || data.data?.items || []);
      const total = data.total || data.data?.total || 1;
      setTotalPages(Math.ceil(total / 20));
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Audit Log</h1>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 flex-wrap">
          <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="w-48">
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </Select>
          <Select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="w-48">
            <option value="">All Entities</option>
            <option value="Job">Job</option>
            <option value="Quote">Quote</option>
            <option value="User">User</option>
            <option value="Scaffolder">Scaffolder</option>
          </Select>
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>Refresh</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">No audit logs found</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-sm text-text-muted">{formatDate(log.timestamp || log.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-text">{log.userId || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-text">{log.entityType}</td>
                  <td className="px-4 py-3 text-sm text-text-muted max-w-xs truncate">{log.details || JSON.stringify(log.metadata || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
