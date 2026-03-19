'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Pencil, Trash2, Mail, Phone, MapPin, AlertCircle, Building2 } from 'lucide-react';
import { scaffoldersApi, regionsApi } from '@/lib/api';
import { toast } from '@/components/ui/toaster';

interface ScaffolderRegion {
  id: string;
  name: string;
}

interface Scaffolder {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  isActive: boolean;
  regionIds: string[];
  regions: ScaffolderRegion[];
  jobCount?: number;
}

interface Region {
  id: string;
  name: string;
}

interface ScaffolderFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  companyName: string;
  regionIds: string[];
  isActive: boolean;
}

const initialFormData: ScaffolderFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  companyName: '',
  regionIds: [],
  isActive: true,
};

export default function ScaffoldersPage() {
  const [scaffolders, setScaffolders] = useState<Scaffolder[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingScaffolder, setEditingScaffolder] = useState<Scaffolder | null>(null);
  const [deletingScaffolder, setDeletingScaffolder] = useState<Scaffolder | null>(null);
  const [formData, setFormData] = useState<ScaffolderFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchScaffolders = useCallback(async () => {
    setLoading(true);
    try {
      const params: { regionId?: string; isActive?: boolean } = {};
      if (regionFilter !== 'all') params.regionId = regionFilter;
      if (statusFilter === 'active') params.isActive = true;
      else if (statusFilter === 'inactive') params.isActive = false;

      const response = await scaffoldersApi.list(params) as { data: Scaffolder[] };
      setScaffolders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch scaffolders:', error);
      toast({ title: 'Error', description: 'Failed to load scaffolders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [regionFilter, statusFilter]);

  const fetchRegions = useCallback(async () => {
    try {
      const response = await regionsApi.list() as { data: Region[] };
      setRegions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
    }
  }, []);

  useEffect(() => {
    fetchScaffolders();
    fetchRegions();
  }, [fetchScaffolders, fetchRegions]);

  const filteredScaffolders = scaffolders.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) ||
      (s.companyName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && s.isActive) ||
      (statusFilter === 'inactive' && !s.isActive);
    const matchesRegion = regionFilter === 'all' ||
      s.regionIds.includes(regionFilter);
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const handleOpenDialog = (scaffolder?: Scaffolder) => {
    if (scaffolder) {
      setEditingScaffolder(scaffolder);
      setFormData({
        firstName: scaffolder.firstName,
        lastName: scaffolder.lastName,
        email: scaffolder.email,
        password: '',
        phone: scaffolder.phone || '',
        companyName: scaffolder.companyName || '',
        regionIds: scaffolder.regionIds,
        isActive: scaffolder.isActive,
      });
    } else {
      setEditingScaffolder(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingScaffolder(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editingScaffolder) {
        await scaffoldersApi.update(editingScaffolder.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          companyName: formData.companyName,
          isActive: formData.isActive,
          regionIds: formData.regionIds,
        });
        toast({ title: 'Success', description: 'Scaffolder updated successfully' });
      } else {
        await scaffoldersApi.create({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          companyName: formData.companyName,
          regionIds: formData.regionIds,
        });
        toast({ title: 'Success', description: 'Scaffolder created successfully' });
      }
      handleCloseDialog();
      fetchScaffolders();
    } catch (error) {
      console.error('Failed to save scaffolder:', error);
      toast({ title: 'Error', description: 'Failed to save scaffolder', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingScaffolder) return;

    setIsSubmitting(true);
    try {
      await scaffoldersApi.delete(deletingScaffolder.id);
      toast({ title: 'Success', description: 'Scaffolder deleted successfully' });
      setIsDeleteDialogOpen(false);
      setDeletingScaffolder(null);
      fetchScaffolders();
    } catch (error) {
      console.error('Failed to delete scaffolder:', error);
      toast({ title: 'Error', description: 'Failed to delete scaffolder', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (scaffolder: Scaffolder) => {
    try {
      if (scaffolder.isActive) {
        await scaffoldersApi.deactivate(scaffolder.id);
        toast({ title: 'Success', description: 'Scaffolder deactivated' });
      } else {
        await scaffoldersApi.reactivate(scaffolder.id);
        toast({ title: 'Success', description: 'Scaffolder activated' });
      }
      fetchScaffolders();
    } catch (error) {
      console.error('Failed to toggle scaffolder status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Scaffolders</h1>
          <p className="text-text-muted">Manage scaffolding company accounts and assignments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Scaffolder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingScaffolder ? 'Edit Scaffolder' : 'Add New Scaffolder'}
              </DialogTitle>
              <DialogDescription>
                {editingScaffolder
                  ? 'Update the scaffolder details below.'
                  : 'Create a new scaffolder account.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                  <Input
                    id="lastName"
                    placeholder="Smith"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.co.uk"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {!editingScaffolder && (
                <div className="grid gap-2">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                <Input
                  id="phone"
                  placeholder="07700 900123"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
                <Input
                  id="companyName"
                  placeholder="Acme Scaffolding"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Regions</label>
                <Select
                  value={formData.regionIds[0] || ''}
                  onValueChange={(value) => setFormData({ ...formData, regionIds: [value] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingScaffolder && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="text-sm">Active</label>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.companyName || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : editingScaffolder ? 'Update' : 'Create'}
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
                placeholder="Search by name, company or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Company</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Contact</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Region</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Jobs</th>
                <th className="text-right text-xs font-medium text-text-muted uppercase px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScaffolders.map((scaffolder) => (
                <tr key={scaffolder.id} className="border-b border-border hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar fallback={getInitials(scaffolder.firstName, scaffolder.lastName)} />
                      <div>
                        <p className="text-sm font-medium text-text">
                          {scaffolder.firstName} {scaffolder.lastName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm text-text">
                      <Building2 className="w-4 h-4 text-text-muted" />
                      {scaffolder.companyName}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <Mail className="w-3.5 h-3.5" />
                        {scaffolder.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <Phone className="w-3.5 h-3.5" />
                        {scaffolder.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {scaffolder.regions.map((region) => (
                        <Badge key={region.id} variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {region.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={scaffolder.isActive ? 'success' : 'secondary'}>
                      {scaffolder.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted">
                    {scaffolder.jobCount}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(scaffolder)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(scaffolder)}
                      >
                        {scaffolder.isActive ? (
                          <span className="text-amber-600 text-xs font-medium">Deactivate</span>
                        ) : (
                          <span className="text-green-600 text-xs font-medium">Activate</span>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingScaffolder(scaffolder);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading scaffolders...</div>
        ) : filteredScaffolders.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No scaffolders found matching your criteria.
          </div>
        ) : null}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Showing {filteredScaffolders.length} of {scaffolders.length} scaffolders
          </p>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scaffolder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scaffolder? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingScaffolder && (deletingScaffolder.jobCount ?? 0) > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                This scaffolder has {deletingScaffolder.jobCount} active job(s). Please reassign them before deleting.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
