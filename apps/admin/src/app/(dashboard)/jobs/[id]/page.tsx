'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { ArrowLeft, User, Calendar, MapPin, Clock, CheckCircle, XCircle, Edit, FileText } from 'lucide-react';
import Link from 'next/link';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = {
    id: params.id,
    address: '14 Oak Avenue, Bristol BS1 2AB',
    owner: { name: 'Sarah Jones', email: 'sarah.jones@email.com', phone: '07700 900123' },
    status: 'Quote Submitted',
    priority: 'High',
    property: { type: 'Detached', bedrooms: 3, roofType: 'Pitched', access: 'Driveway' },
    timeline: [
      { date: '2024-03-15', action: 'Job created', user: 'Admin' },
      { date: '2024-03-16', action: 'Photos submitted', user: 'Sarah Jones' },
      { date: '2024-03-17', action: 'Validated', user: 'Admin' },
      { date: '2024-03-18', action: 'Quote submitted', user: 'Acme Scaffolding' },
    ],
    quotes: [{ id: 'Q1', company: 'Acme Scaffolding', amount: 850, notes: 'Standard installation', date: '2024-03-18', status: 'Pending' }],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jobs"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text">{job.id}</h1>
            <Badge variant="info">{job.status}</Badge>
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
                <div><p className="text-sm text-text-muted">Type</p><p className="font-medium">{job.property.type}</p></div>
                <div><p className="text-sm text-text-muted">Bedrooms</p><p className="font-medium">{job.property.bedrooms}</p></div>
                <div><p className="text-sm text-text-muted">Roof Type</p><p className="font-medium">{job.property.roofType}</p></div>
                <div><p className="text-sm text-text-muted">Access</p><p className="font-medium">{job.property.access}</p></div>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Owner Information</CardTitle></CardHeader><CardContent>
                <div className="flex items-center gap-4"><Avatar fallback="SJ" /><div><p className="font-medium">{job.owner.name}</p><p className="text-sm text-text-muted">{job.owner.email}</p><p className="text-sm text-text-muted">{job.owner.phone}</p></div></div>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Timeline</CardTitle></CardHeader><CardContent>
                <div className="space-y-4">{job.timeline.map((t, i) => (
                  <div key={i} className="flex gap-4"><div className="w-2 h-2 bg-primary rounded-full mt-2" /><div><p className="font-medium">{t.action}</p><p className="text-sm text-text-muted">{t.date} by {t.user}</p></div></div>
                ))}</div>
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="quotes" className="space-y-4 mt-4">
              {job.quotes.map((q) => (
                <Card key={q.id}><CardContent className="p-4"><div className="flex justify-between items-start"><div><p className="font-medium">{q.company}</p><p className="text-sm text-text-muted">{q.notes}</p><p className="text-xs text-text-muted">{q.date}</p></div><div className="text-right"><p className="text-2xl font-bold">£{q.amount}</p><Badge variant="warning">{q.status}</Badge></div></div><div className="flex gap-2 mt-4"><Button size="sm"><CheckCircle className="w-4 h-4 mr-1" /> Approve</Button><Button size="sm" variant="outline"><XCircle className="w-4 h-4 mr-1" /> Reject</Button><Button size="sm" variant="outline"><Edit className="w-4 h-4 mr-1" /> Request Revision</Button></div></CardContent></Card>
              ))}
            </TabsContent>
            <TabsContent value="schedule" className="mt-4"><Card><CardContent className="p-6 text-center text-text-muted">No schedule proposed yet</CardContent></Card></TabsContent>
            <TabsContent value="schedule" className="mt-4"><Card><CardContent className="p-6 text-center text-text-muted">Activity log empty</CardContent></Card></TabsContent>
            <TabsContent value="activity" className="mt-4"><Card><CardContent className="space-y-4">{job.timeline.map((t, i) => (<div key={i} className="flex gap-4"><div className="w-2 h-2 bg-primary rounded-full mt-2" /><div><p className="font-medium">{t.action}</p><p className="text-sm text-text-muted">{t.date} by {t.user}</p></div></div>))}</CardContent></Card></TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent className="space-y-2">
            <Button className="w-full" variant="outline"><User className="w-4 h-4 mr-2" /> Assign Scaffolder</Button>
            <Button className="w-full" variant="outline"><Edit className="w-4 h-4 mr-2" /> Request More Info</Button>
            <Button className="w-full" variant="outline"><FileText className="w-4 h-4 mr-2" /> View Full Report</Button>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
