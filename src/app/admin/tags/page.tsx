'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

type TagItem = { id: number; name: string; slug: string; products_count: number; posts_count: number };

export default function AdminTagsPage() {
  const [tags, setTags]       = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName]       = useState('');
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [saving, setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/tags').then(r => setTags(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/tags/${editing.id}`, { name });
        toast.success('Tag updated');
      } else {
        await api.post('/admin/tags', { name });
        toast.success('Tag created');
      }
      setName(''); setEditing(null); load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Save failed');
    } finally { setSaving(false); }
  };

  const remove = async (tag: TagItem) => {
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from ${tag.products_count} product(s) and ${tag.posts_count} article(s).`)) return;
    try { await api.delete(`/admin/tags/${tag.id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const startEdit = (tag: TagItem) => { setEditing(tag); setName(tag.name); };
  const cancel    = () => { setEditing(null); setName(''); };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
        <p className="text-sm text-gray-500 mt-1">Manage tags for products and blog articles.</p>
      </div>

      {/* Create / Edit form */}
      <div className="bg-white border rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          {editing ? `Edit: ${editing.name}` : 'New Tag'}
        </h2>
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="Tag name (e.g. Humayun Ahmed)" maxLength={100}
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#213885]/30" />
          <button onClick={save} disabled={saving || !name.trim()}
            className="bg-[#213885] text-white px-4 py-2 rounded text-sm font-semibold hover:bg-[#5f3475] disabled:opacity-50">
            {saving ? 'Saving…' : editing ? 'Save' : 'Create'}
          </button>
          {editing && (
            <button onClick={cancel} className="px-3 py-2 border rounded text-sm text-gray-500 hover:bg-gray-50">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tags table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Tag</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Slug</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Products</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Articles</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12"><Spinner className="mx-auto" label="Loading tags…" /></td></tr>
            ) : tags.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">No tags yet.</td></tr>
            ) : tags.map(tag => (
              <tr key={tag.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-[#213885]" />
                    <span className="font-medium text-gray-900">{tag.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{tag.slug}</td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {tag.products_count}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {tag.posts_count}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => startEdit(tag)} className="text-gray-400 hover:text-[#213885]">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(tag)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
