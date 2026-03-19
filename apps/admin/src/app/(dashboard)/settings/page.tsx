'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toaster';

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: 'Admin User', email: 'admin@solarops.co.uk', phone: '' });
  const [company, setCompany] = useState({ name: 'SolarOps Ltd', address: '', contactEmail: '' });
  const [notifications, setNotifications] = useState({
    jobCreated: true, jobCompleted: true, quoteSubmitted: false, quoteAccepted: true,
    photoUploaded: true, photoApproved: false, scaffolderAssigned: true
  });
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 500)); // simulate API
      toast.success('Profile saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      toast.success('Company settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Setting updated');
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-text mb-6">Settings</h1>

      {/* Profile */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Name</label>
            <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Email</label>
            <Input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Phone</label>
            <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+44..." />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
        </div>
      </Card>

      {/* Company */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Company</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Company Name</label>
            <Input value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Contact Email</label>
            <Input type="email" value={company.contactEmail} onChange={e => setCompany({ ...company, contactEmail: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text mb-1">Address</label>
            <Input value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveCompany} disabled={saving}>{saving ? 'Saving...' : 'Save Company'}</Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        <div className="space-y-3">
          {[
            { key: 'jobCreated', label: 'New job created' },
            { key: 'jobCompleted', label: 'Job completed' },
            { key: 'quoteSubmitted', label: 'Quote submitted' },
            { key: 'quoteAccepted', label: 'Quote accepted/rejected' },
            { key: 'photoUploaded', label: 'Photo uploaded' },
            { key: 'photoApproved', label: 'Photo approved/rejected' },
            { key: 'scaffolderAssigned', label: 'Scaffolder assigned' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-text">{label}</span>
              <button
                onClick={() => toggleNotification(key as keyof typeof notifications)}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifications[key as keyof typeof notifications] ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications[key as keyof typeof notifications] ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* System */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">System</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Timezone</label>
            <select className="w-full h-10 px-3 border border-border rounded-lg bg-surface text-text">
              <option>Europe/London (GMT)</option>
              <option>Europe/Paris (CET)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Date Format</label>
            <select className="w-full h-10 px-3 border border-border rounded-lg bg-surface text-text">
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Currency</label>
            <select className="w-full h-10 px-3 border border-border rounded-lg bg-surface text-text">
              <option>GBP (£)</option>
              <option>EUR (€)</option>
              <option>USD ($)</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}
