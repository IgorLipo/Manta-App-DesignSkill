'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell, Check, CheckCheck, Trash2, Search, Briefcase, FileText,
  Settings, AlertCircle, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { notificationsApi } from '@/lib/api';
import { toast } from '@/components/ui/toaster';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}

const notificationIcons: Record<string, React.ElementType> = {
  JOB_SUBMITTED: Briefcase,
  QUOTE_SUBMITTED: FileText,
  QUOTE_APPROVED: Check,
  QUOTE_REJECTED: AlertCircle,
  SCAFFOLDER_ASSIGNED: Briefcase,
  OWNER_INVITE: Bell,
  SCHEDULE_PROPOSED: Clock,
  SCHEDULE_CONFIRMED: Check,
  WORK_STARTED: Briefcase,
  WORK_COMPLETED: Check,
  SITE_REPORT_SUBMITTED: FileText,
  SYSTEM: Settings,
  default: Bell,
};

const notificationTypeLabels: Record<string, string> = {
  JOB_SUBMITTED: 'Job',
  QUOTE_SUBMITTED: 'Quote',
  QUOTE_APPROVED: 'Quote',
  QUOTE_REJECTED: 'Quote',
  SCAFFOLDER_ASSIGNED: 'Job',
  OWNER_INVITE: 'Job',
  SCHEDULE_PROPOSED: 'Job',
  SCHEDULE_CONFIRMED: 'Job',
  WORK_STARTED: 'Job',
  WORK_COMPLETED: 'Job',
  SITE_REPORT_SUBMITTED: 'Job',
  SYSTEM: 'System',
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; type?: string; read?: boolean } = { page, limit };

      if (activeTab === 'unread') params.read = false;
      else if (activeTab === 'jobs') params.type = 'JOB';
      else if (activeTab === 'quotes') params.type = 'QUOTE';
      else if (activeTab === 'system') params.type = 'SYSTEM';

      const response = await notificationsApi.list(params) as NotificationsResponse;
      let filtered = response.data || [];

      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          n => n.title.toLowerCase().includes(searchLower) || n.message.toLowerCase().includes(searchLower)
        );
      }

      setNotifications(filtered);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeTab, search]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      toast({ title: 'Success', description: 'Notification marked as read' });
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast({ title: 'Error', description: 'Failed to mark as read', variant: 'destructive' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: 'Success', description: 'All notifications marked as read' });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast({ title: 'Error', description: 'Failed to mark all as read', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
      toast({ title: 'Success', description: 'Notification deleted' });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => notificationsApi.markRead(id)));
      setNotifications(prev => prev.map(n => selectedIds.has(n.id) ? { ...n, read: true } : n));
      setSelectedIds(new Set());
      toast({ title: 'Success', description: 'Selected notifications marked as read' });
    } catch (error) {
      console.error('Failed to mark selected as read:', error);
      toast({ title: 'Error', description: 'Failed to mark as read', variant: 'destructive' });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Notifications</h1>
          <p className="text-text-muted">View and manage your notifications</p>
        </div>
        <Button variant="outline" onClick={handleMarkAllAsRead} disabled={loading}>
          <CheckCheck className="w-4 h-4 mr-2" />
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-border">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Unread
          </TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Jobs
          </TabsTrigger>
          <TabsTrigger value="quotes" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Quotes
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            System
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {selectedIds.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-text-muted">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleBulkMarkAsRead}>
                <Check className="w-4 h-4 mr-1" />
                Mark as read
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-muted">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-text-muted mb-3" />
              <p className="text-text-muted">No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || notificationIcons.default;
                const typeLabel = notificationTypeLabels[notification.type] || 'System';
                const isUnread = !notification.read;

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors ${
                      isUnread ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleSelect(notification.id)}
                      className="mt-1 w-5 h-5 rounded border border-border flex items-center justify-center hover:border-primary"
                    >
                      {selectedIds.has(notification.id) && (
                        <div className="w-3 h-3 bg-primary rounded-sm" />
                      )}
                    </button>

                    <Avatar
                      fallback={typeLabel.charAt(0)}
                      className="w-10 h-10 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium text-sm ${isUnread ? 'text-text' : 'text-text-muted'}`}>
                          {notification.title}
                        </h3>
                        <Badge variant={isUnread ? 'default' : 'secondary'} className="text-xs">
                          {typeLabel}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-muted line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-text-muted mt-1">{formatRelativeTime(notification.createdAt)}</p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMarkAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {notification.metadata && typeof notification.metadata === 'object' && 'jobId' in notification.metadata && (
                        <Link href={`/jobs/${notification.metadata.jobId}`}>
                          <Button variant="ghost" size="sm" className="h-8">
                            View
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(notification.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-text-muted">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="flex items-center px-3 text-sm text-text-muted">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
