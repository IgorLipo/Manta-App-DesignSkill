'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Pencil, Trash2, Users, AlertCircle } from 'lucide-react';
import { regionsApi } from '@/lib/api';
import { toast } from '@/components/ui/toaster';

interface Region {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  scaffolderCount?: number;
}

interface RegionFormData {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

const initialFormData: RegionFormData = {
  name: '',
  code: '',
  description: '',
  isActive: true,
};

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [deletingRegion, setDeletingRegion] = useState<Region | null>(null);
  const [formData, setFormData] = useState<RegionFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRegions = useCallback(async () => {
    setLoading(true);
    try {
      const params: { isActive?: boolean } = {};
      if (statusFilter === 'active') params.isActive = true;
      else if (statusFilter === 'inactive') params.isActive = false;

      const response = await regionsApi.list(params) as { data: Region[] };
      setRegions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      toast({ title: 'Error', description: 'Failed to load regions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const filteredRegions = regions.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && r.isActive) ||
      (statusFilter === 'inactive' && !r.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (region?: Region) => {
    if (region) {
      setEditingRegion(region);
      setFormData({
        name: region.name,
        code: region.code,
        description: region.description || '',
        isActive: region.isActive,
      });
    } else {
      setEditingRegion(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRegion(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editingRegion) {
        await regionsApi.update(editingRegion.id, formData);
        toast({ title: 'Success', description: 'Region updated successfully' });
      } else {
        await regionsApi.create(formData);
        toast({ title: 'Success', description: 'Region created successfully' });
      }
      handleCloseDialog();
      fetchRegions();
    } catch (error) {
      console.error('Failed to save region:', error);
      toast({ title: 'Error', description: 'Failed to save region', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRegion) return;

    if (deletingRegion.scaffolderCount && deletingRegion.scaffolderCount > 0) {
      toast({ title: 'Cannot delete', description: 'Region has assigned scaffolders', variant: 'destructive' });
      setIsDeleteDialogOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await regionsApi.delete(deletingRegion.id);
      toast({ title: 'Success', description: 'Region deleted successfully' });
      setIsDeleteDialogOpen(false);
      setDeletingRegion(null);
      fetchRegions();
    } catch (error) {
      console.error('Failed to delete region:', error);
      toast({ title: 'Error', description: 'Failed to delete region', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Regions</h1>
          <p className="text-text-muted">Manage operating regions and territories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Region
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRegion ? 'Edit Region' : 'Add New Region'}
              </DialogTitle>
              <DialogDescription>
                {editingRegion
                  ? 'Update the region details below.'
                  : 'Create a new operating region for your team.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Region Name</label>
                <Input
                  id="name"
                  placeholder="e.g., South West"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="code" className="text-sm font-medium">Code</label>
                <Input
                  id="code"
                  placeholder="e.g., SW"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  maxLength={5}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Input
                  id="description"
                  placeholder="e.g., Bristol, Exeter, Plymouth area"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              {editingRegion && (
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
                disabled={!formData.name || !formData.code || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : editingRegion ? 'Update' : 'Create'}
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
                placeholder="Search by name or code..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Code</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Description</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase px-5 py-3">Scaffolders</th>
                <th className="text-right text-xs font-medium text-text-muted uppercase px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegions.map((region) => (
                <tr key={region.id} className="border-b border-border hover:bg-slate-50/50">
                  <td className="px-5 py-4 text-sm font-medium text-text">{region.name}</td>
                  <td className="px-5 py-4 text-sm text-primary font-medium">{region.code}</td>
                  <td className="px-5 py-4 text-sm text-text-muted">{region.description}</td>
                  <td className="px-5 py-4">
                    <Badge variant={region.isActive ? 'success' : 'secondary'}>
                      {region.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-sm text-text-muted">
                      <Users className="w-4 h-4" />
                      {region.scaffolderCount}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(region)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingRegion(region);
                          setIsDeleteDialogOpen(true);
                        }}
                        disabled={(region.scaffolderCount ?? 0) > 0}
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
        {filteredRegions.length === 0 && (
          <div className="p-8 text-center text-text-muted">
            No regions found matching your criteria.
          </div>
        )}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Showing {filteredRegions.length} of {regions.length} regions
          </p>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Region</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this region? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingRegion && deletingRegion.scaffolderCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                This region has {deletingRegion.scaffolderCount} assigned scaffolder(s). Please reassign them before deleting.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting || (deletingRegion?.scaffolderCount ?? 0) > 0}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
