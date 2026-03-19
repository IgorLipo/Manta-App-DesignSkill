'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, Calendar, MapPin, Clock, CheckCircle, XCircle, Edit, FileText } from 'lucide-react';
import Link from 'next/link';
import { jobsApi, scaffoldersApi } from '@/lib/api';
import { toast } from '@/components/ui/toaster';

interface Quote {
  id: string;
  scaffolderName: string;
  amount: number;
  notes?: string;
  date: string;
  status: string;
}

interface Job {
  id: string;
  address: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  status: string;
  priority: string;
  propertyType?: string;
  bedrooms?: number;
  roofType?: string;
  access?: string;
  timeline: { date: string; action: string; user: string }[];
  quotes: Quote[];
  scaffolderId?: string;
  scaffolderName?: string;
  region?: string;
}

interface Scaffolder {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [scaffolders, setScaffolders] = useState<Scaffolder[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isRequestInfoDialogOpen, setIsRequestInfoDialogOpen] = useState(false);
  const [selectedScaffolderId, setSelectedScaffolderId] = useState('');
  const [requestInfoNote, setRequestInfoNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJob = useCallback(async () => {
    setLoading(true);
    try {
      const response = await jobsApi.get(params.id) as { data: Job };
      setJob(response.data);
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast({ title: 'Error', description: 'Failed to load job details', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchScaffolders = useCallback(async () => {
    try {
      const response = await scaffoldersApi.list() as { data: Scaffolder[] };
      setScaffolders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch scaffolders:', error);
    }
  }, []);

  useEffect(() => {
    fetchJob();
    fetchScaffolders();
  }, [fetchJob, fetchScaffolders]);

  const handleAssignScaffolder = async () => {
    if (!selectedScaffolderId) return;
    setIsSubmitting(true);
    try {
      await jobsApi.assign(params.id, selectedScaffolderId);
      toast({ title: 'Success', description: 'Scaffolder assigned successfully' });
      setIsAssignDialogOpen(false);
      setSelectedScaffolderId('');
      fetchJob();
    } catch (error) {
      console.error('Failed to assign scaffolder:', error);
      toast({ title: 'Error', description: 'Failed to assign scaffolder', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveQuote = async (quoteId: string) => {
    setIsSubmitting(true);
    try {
      await jobsApi.validate(params.id, 'APPROVED', 'Quote approved');
      toast({ title: 'Success', description: 'Quote approved' });
      fetchJob();
    } catch (error) {
      console.error('Failed to approve quote:', error);
      toast({ title: 'Error', description: 'Failed to approve quote', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    setIsSubmitting(true);
    try {
      await jobsApi.validate(params.id, 'REJECTED', 'Quote rejected');
      toast({ title: 'Success', description: 'Quote rejected' });
      fetchJob();
    } catch (error) {
      console.error('Failed to reject quote:', error);
      toast({ title: 'Error', description: 'Failed to reject quote', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async (quoteId: string) => {
    setIsSubmitting(true);
    try {
      await jobsApi.validate(params.id, 'REVISION_REQUESTED', 'Revision requested');
      toast({ title: 'Success', description: 'Revision requested' });
      fetchJob();
    } catch (error) {
      console.error('Failed to request revision:', error);
      toast({ title: 'Error', description: 'Failed to request revision', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestMoreInfo = async () => {
    setIsSubmitting(true);
    try {
      await jobsApi.validate(params.id, 'NEEDS_INFO', requestInfoNote);
      toast({ title: 'Success', description: 'More info requested' });
      setIsRequestInfoDialogOpen(false);
      setRequestInfoNote('');
      fetchJob();
    } catch (error) {
      console.error('Failed to request more info:', error);
      toast({ title: 'Error', description: 'Failed to request more info', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/jobs"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="flex-1">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        <Card><CardContent className="p-8 text-center text-text-muted">Loading job details...</CardContent></Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/jobs"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        </div>
        <Card><CardContent className="p-8 text-center text-text-muted">Job not found</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jobs"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text">{job.id}</h1>
            <Badge variant="info">{job.status.replace('_', ' ')}</Badge>
            <Badge variant="destructive">{job.priority}</Badge>
          </div>
          <p className="text-text-muted flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="quotes">Quotes</TabsTrigger><TabsTrigger value="schedule">Schedule</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList>
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card><CardHeader><CardTitle>Property Details</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-text-muted">Type</p><p className="font-medium">{job.propertyType || 'N/A'}</p></div>
                <div><p className="text-sm text-text-muted">Bedrooms</p><p className="font-medium">{job.bedrooms || 'N/A'}</p></div>
                <div><p className="text-sm text-text-muted">Roof Type</p><p className="font-medium">{job.roofType || 'N/A'}</p></div>
                <div><p className="text-sm text-text-muted">Access</p><p className="font-medium">{job.access || 'N/A'}</p></div>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Owner Information</CardTitle></CardHeader><CardContent>
                <div className="flex items-center gap-4"><Avatar fallback={job.ownerName?.charAt(0) || 'O'} /><div><p className="font-medium">{job.ownerName}</p><p className="text-sm text-text-muted">{job.ownerEmail}</p><p className="text-sm text-text-muted">{job.ownerPhone}</p></div></div>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Timeline</CardTitle></CardHeader><CardContent>
                <div className="space-y-4">{job.timeline?.map((t, i) => (
                  <div key={i} className="flex gap-4"><div className="w-2 h-2 bg-primary rounded-full mt-2" /><div><p className="font-medium">{t.action}</p><p className="text-sm text-text-muted">{t.date} by {t.user}</p></div></div>
                ))}</div>
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="quotes" className="space-y-4 mt-4">
              {job.quotes?.map((q) => (
                <Card key={q.id}><CardContent className="p-4"><div className="flex justify-between items-start"><div><p className="font-medium">{q.scaffolderName}</p><p className="text-sm text-text-muted">{q.notes}</p><p className="text-xs text-text-muted">{q.date}</p></div><div className="text-right"><p className="text-2xl font-bold">£{q.amount}</p><Badge variant="warning">{q.status}</Badge></div></div><div className="flex gap-2 mt-4"><Button size="sm" onClick={() => handleApproveQuote(q.id)} disabled={isSubmitting}><CheckCircle className="w-4 h-4 mr-1" /> Approve</Button><Button size="sm" variant="outline" onClick={() => handleRejectQuote(q.id)} disabled={isSubmitting}><XCircle className="w-4 h-4 mr-1" /> Reject</Button><Button size="sm" variant="outline" onClick={() => handleRequestRevision(q.id)} disabled={isSubmitting}><Edit className="w-4 h-4 mr-1" /> Request Revision</Button></div></CardContent></Card>
              ))}
              {(!job.quotes || job.quotes.length === 0) && (
                <Card><CardContent className="p-6 text-center text-text-muted">No quotes submitted yet</CardContent></Card>
              )}
            </TabsContent>
            <TabsContent value="schedule" className="mt-4"><Card><CardContent className="p-6 text-center text-text-muted">No schedule proposed yet</CardContent></Card></TabsContent>
            <TabsContent value="activity" className="mt-4"><Card><CardContent className="space-y-4">{job.timeline?.map((t, i) => (<div key={i} className="flex gap-4"><div className="w-2 h-2 bg-primary rounded-full mt-2" /><div><p className="font-medium">{t.action}</p><p className="text-sm text-text-muted">{t.date} by {t.user}</p></div></div>))}</CardContent></Card></TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent className="space-y-2">
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline"><User className="w-4 h-4 mr-2" /> Assign Scaffolder</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Scaffolder</DialogTitle>
                  <DialogDescription>Select a scaffolder to assign to this job.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Select value={selectedScaffolderId} onValueChange={setSelectedScaffolderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scaffolder" />
                    </SelectTrigger>
                    <SelectContent>
                      {scaffolders.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} {s.companyName ? `(${s.companyName})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAssignScaffolder} disabled={!selectedScaffolderId || isSubmitting}>
                    {isSubmitting ? 'Assigning...' : 'Assign'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isRequestInfoDialogOpen} onOpenChange={setIsRequestInfoDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline"><Edit className="w-4 h-4 mr-2" /> Request More Info</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request More Information</DialogTitle>
                  <DialogDescription>Specify what additional information is needed.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Describe what information is needed..."
                    value={requestInfoNote}
                    onChange={(e) => setRequestInfoNote(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRequestInfoDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleRequestMoreInfo} disabled={!requestInfoNote || isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Request'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button className="w-full" variant="outline" onClick={() => window.open(`/api/v1/reports/${job.id}/report`, '_blank')}>
              <FileText className="w-4 h-4 mr-2" /> View Full Report
            </Button>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
