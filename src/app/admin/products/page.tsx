'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageProducts } from '@/lib/types';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Search, Star, Check, Upload, Link, X, Images } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';
import TagInput from '@/components/TagInput';

interface Category { id: number; name: string; parent_id?: number | null; children?: Category[]; }
interface Tag { id: number; name: string; slug: string; }
interface ProductImage { id: number; url: string; sort_order: number; }
interface Product {
  id: number; name: string; name_secondary: string | null; author: string | null;
  genre: string | null; slug: string; description: string | null;
  price: string; stock: number; image: string | null;
  featured: boolean; active: boolean; category: Category | null; tags?: Tag[];
}
interface PaginatedProducts { data: Product[]; current_page: number; last_page: number; total: number; }

const EMPTY = { name: '', name_secondary: '', author: '', genre: '', description: '', price: '', stock: 0, image: '', featured: false, active: true, category_id: '' };

type EditCell = { id: number; field: string } | null;

export default function AdminProductsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<ProductImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  // Inline edit state
  const [editCell, setEditCell] = useState<EditCell>(null);
  const [editValue, setEditValue] = useState('');
  const [patchingCell, setPatchingCell] = useState<EditCell>(null);
  const [savedCell, setSavedCell] = useState<EditCell>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageProducts(user)) { router.push('/admin'); return; }
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    load(1);
  }, [user]);

  async function load(p: number, q?: string) {
    setLoading(true);
    try {
      const params: any = { page: p, per_page: 20 };
      if (q !== undefined ? q : search) params.search = q !== undefined ? q : search;
      const { data } = await api.get('/admin/products', { params });
      const d: PaginatedProducts = data;
      setProducts(d.data); setPage(d.current_page); setLastPage(d.last_page); setTotal(d.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }

  function handleSearch(e: React.FormEvent) { e.preventDefault(); load(1, search); }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setImageMode(EMPTY.image ? 'url' : 'upload');
    setSelectedTags([]);
    setGalleryImages([]);
    setShowModal(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({ name: p.name, name_secondary: p.name_secondary ?? '', author: p.author ?? '', genre: p.genre ?? '', description: p.description ?? '', price: p.price, stock: p.stock, image: p.image ?? '', featured: p.featured, active: p.active, category_id: String(p.category?.id ?? '') });
    setImageMode(p.image ? 'url' : 'upload');
    setSelectedTags((p.tags ?? []).map(t => t.slug));
    setGalleryImages([]);
    setShowModal(true);
    // Load gallery images
    setGalleryLoading(true);
    api.get(`/admin/products/${p.id}/images`)
      .then(r => setGalleryImages(r.data))
      .catch(() => {})
      .finally(() => setGalleryLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price as string), stock: Number(form.stock), category_id: Number(form.category_id), tags: selectedTags };
      if (editing) { await api.put(`/admin/products/${editing.id}`, payload); toast.success('Product updated'); }
      else { await api.post('/admin/products', payload); toast.success('Product created'); }
      setShowModal(false); load(page);
    } catch (err: any) {
      const errs = err?.response?.data?.errors;
      toast.error(errs ? Object.values(errs).flat().join(', ') : err?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/admin/products/${id}`); toast.success('Deleted'); load(page); }
    catch { toast.error('Delete failed'); }
  }

  // ── Inline edit helpers ──────────────────────────────────────────────────────

  // Flatten nested category tree into a single array for dropdowns
  function flattenCategories(cats: Category[], depth = 0): Array<Category & { depth: number }> {
    return cats.flatMap(c => [
      { ...c, depth },
      ...flattenCategories(c.children ?? [], depth + 1),
    ]);
  }
  const flatCats = flattenCategories(categories);

  function findCatById(id: number): Category | undefined {
    return flatCats.find(c => c.id === id);
  }

  function startEdit(id: number, field: string, currentValue: any) {
    setEditCell({ id, field });
    setEditValue(String(currentValue ?? ''));
  }

  function cancelEdit() { setEditCell(null); setEditValue(''); }

  async function patchProduct(product: Product, changes: Record<string, any>) {
    const cellKey = Object.keys(changes)[0];
    setPatchingCell({ id: product.id, field: cellKey });
    // Optimistic update
    setProducts(prev => prev.map(p => {
      if (p.id !== product.id) return p;
      if (cellKey === 'category_id') {
        const cat = findCatById(Number(changes.category_id));
        return { ...p, category: cat ?? null };
      }
      return { ...p, ...changes };
    }));
    try {
      const payload = {
        name: product.name,
        category_id: product.category?.id,
        price: parseFloat(product.price),
        stock: product.stock,
        active: product.active,
        featured: product.featured,
        name_secondary: product.name_secondary,
        author: product.author,
        genre: product.genre,
        description: product.description,
        image: product.image,
        ...changes,
      };
      const { data } = await api.put(`/admin/products/${product.id}`, payload);
      setProducts(prev => prev.map(p => p.id === product.id ? data : p));
      setSavedCell({ id: product.id, field: cellKey });
      setTimeout(() => setSavedCell(null), 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
      load(page); // revert on error
    } finally {
      setPatchingCell(null);
    }
  }

  async function commitTextEdit(product: Product, field: string, rawValue: string) {
    cancelEdit();
    const value = field === 'price' ? parseFloat(rawValue) : field === 'stock' ? parseInt(rawValue, 10) : rawValue;
    if (String(value) === String(field === 'price' ? parseFloat(product.price) : field === 'stock' ? product.stock : (product as any)[field])) return; // no change
    if ((field === 'price' || field === 'stock') && isNaN(value as number)) { toast.error('Invalid number'); return; }
    await patchProduct(product, { [field]: value });
  }

  async function commitCategoryEdit(product: Product, newCatId: string) {
    cancelEdit();
    if (String(product.category?.id) === newCatId) return;
    await patchProduct(product, { category_id: Number(newCatId) });
  }

  async function toggleStatus(product: Product) {
    await patchProduct(product, { active: !product.active });
  }

  // ── Shared cell renderer ─────────────────────────────────────────────────────

  const isEditing  = (id: number, field: string) => editCell?.id === id && editCell?.field === field;
  const isPatching = (id: number, field: string) => patchingCell?.id === id && patchingCell?.field === field;
  const isSaved    = (id: number, field: string) => savedCell?.id === id && savedCell?.field === field;

  const cellBase = 'cursor-pointer group-hover:border-b group-hover:border-dashed group-hover:border-gray-300 inline-block min-w-[2rem]';

  async function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/admin/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('image', data.url);
      toast.success('Image uploaded');
    } catch { toast.error('Image upload failed'); }
    finally { setUploadingImage(false); }
  }

  async function handleGalleryFile(file: File) {
    if (!editing) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setUploadingGallery(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post(`/admin/products/${editing.id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setGalleryImages(prev => [...prev, data]);
      toast.success('Image added to gallery');
    } catch { toast.error('Gallery upload failed'); }
    finally { setUploadingGallery(false); }
  }

  async function deleteGalleryImage(imgId: number) {
    if (!editing) return;
    try {
      await api.delete(`/admin/products/${editing.id}/images/${imgId}`);
      setGalleryImages(prev => prev.filter(i => i.id !== imgId));
    } catch { toast.error('Delete failed'); }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Products</h1>
          <p className="text-[#6b6b6b] mt-1">{total} total products · <span className="text-xs text-gray-400">click Category, Price, Stock or Status to edit inline</span></p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or author…" className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
        <button type="submit" className="bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm flex items-center gap-1"><Search className="w-4 h-4" /> Search</button>
        {search && <button type="button" onClick={() => { setSearch(''); load(1, ''); }} className="text-sm text-gray-500 hover:text-gray-700 px-2">Clear</button>}
      </form>

      {loading ? <Spinner className="py-16" label="Loading products…" /> : (
        <>
          <div className="bg-white border border-[#cccacc]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Image', 'Name', 'Author', 'Category', 'Price', 'Stock', 'Status', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/60 group">
                    <td className="py-2 px-3 border-b border-gray-50">
                      {p.image ? <img src={p.image} alt="" className="w-10 h-10 object-cover" onError={e => (e.currentTarget.style.display = 'none')} /> : <div className="w-10 h-10 bg-gray-100" />}
                    </td>
                    <td className="py-2 px-3 border-b border-gray-50">
                      <p className="font-medium text-[#1a1a1a] leading-tight">{p.name}</p>
                      {p.name_secondary && <p className="text-xs text-[#6b6b6b]">{p.name_secondary}</p>}
                      {p.featured && <span className="inline-flex items-center gap-0.5 text-[10px] text-yellow-600"><Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" /> Featured</span>}
                    </td>
                    <td className="py-2 px-3 border-b border-gray-50 text-[#6b6b6b]">{p.author ?? '—'}</td>

                    {/* ── Category inline edit ── */}
                    <td className="py-2 px-3 border-b border-gray-50" onClick={() => !isEditing(p.id, 'category') && startEdit(p.id, 'category', p.category?.id ?? '')}>
                      {isEditing(p.id, 'category') ? (
                        <select
                          autoFocus
                          value={editValue}
                          onChange={e => { commitCategoryEdit(p, e.target.value); }}
                          onBlur={() => { commitCategoryEdit(p, editValue); }}
                          onKeyDown={e => e.key === 'Escape' && cancelEdit()}
                          className="bg-transparent border-0 border-b border-[#213885] outline-none text-sm py-0.5 text-[#1a1a1a] cursor-pointer"
                        >
                          <option value="">— none —</option>
                          {flatCats.map(c => (
                            <option key={c.id} value={c.id}>
                              {'  '.repeat(c.depth)}{c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`${cellBase} ${isPatching(p.id, 'category') ? 'opacity-40' : 'text-[#6b6b6b]'}`}>
                          {isPatching(p.id, 'category') ? '…' : isSaved(p.id, 'category') ? <span className="text-green-600 font-semibold text-xs">✓ Saved</span> : (p.category?.name ?? '—')}
                        </span>
                      )}
                    </td>

                    {/* ── Price inline edit ── */}
                    <td className="py-2 px-3 border-b border-gray-50" onClick={() => !isEditing(p.id, 'price') && startEdit(p.id, 'price', parseFloat(p.price).toFixed(2))}>
                      {isEditing(p.id, 'price') ? (
                        <input
                          autoFocus type="number" step="0.01" min="0"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => commitTextEdit(p, 'price', editValue)}
                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') cancelEdit(); }}
                          className="bg-transparent border-0 border-b border-[#213885] outline-none w-20 text-sm py-0.5 font-medium"
                        />
                      ) : (
                        <span className={`${cellBase} font-medium ${isPatching(p.id, 'price') ? 'opacity-40' : ''}`}>
                          {isPatching(p.id, 'price') ? '…' : isSaved(p.id, 'price') ? <span className="text-green-600 font-semibold text-xs">✓ Saved</span> : `$${parseFloat(p.price).toFixed(2)}`}
                        </span>
                      )}
                    </td>

                    {/* ── Stock inline edit ── */}
                    <td className="py-2 px-3 border-b border-gray-50" onClick={() => !isEditing(p.id, 'stock') && startEdit(p.id, 'stock', p.stock)}>
                      {isEditing(p.id, 'stock') ? (
                        <input
                          autoFocus type="number" min="0"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => commitTextEdit(p, 'stock', editValue)}
                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') cancelEdit(); }}
                          className="bg-transparent border-0 border-b border-[#213885] outline-none w-16 text-sm py-0.5"
                        />
                      ) : (
                        <span className={`${cellBase} ${isPatching(p.id, 'stock') ? 'opacity-40' : p.stock === 0 ? 'text-red-600' : p.stock < 5 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {isPatching(p.id, 'stock') ? '…' : isSaved(p.id, 'stock') ? <span className="text-green-600 font-semibold text-xs">✓ Saved</span> : p.stock}
                        </span>
                      )}
                    </td>

                    {/* ── Status toggle ── */}
                    <td className="py-2 px-3 border-b border-gray-50">
                      <button
                        onClick={() => toggleStatus(p)}
                        disabled={isPatching(p.id, 'active')}
                        className={`text-xs px-2 py-0.5 transition-colors disabled:opacity-40 ${p.active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {isPatching(p.id, 'active') ? '…' : isSaved(p.id, 'active') ? '✓ Saved' : p.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>

                    <td className="py-2 px-3 border-b border-gray-50">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-[#213885] hover:text-[#081849]"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lastPage > 1 && (
            <div className="flex gap-2 mt-4 items-center text-sm">
              <button disabled={page === 1} onClick={() => load(page - 1)} className="px-3 py-1 border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <span className="text-[#6b6b6b]">Page {page} of {lastPage}</span>
              <button disabled={page === lastPage} onClick={() => load(page + 1)} className="px-3 py-1 border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name (English) *</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name (Bengali / Secondary)</label>
                  <input value={form.name_secondary} onChange={e => set('name_secondary', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Author</label>
                  <input value={form.author} onChange={e => set('author', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Genre</label>
                  <input value={form.genre} onChange={e => set('genre', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
                  <TagInput selected={selectedTags} onChange={setSelectedTags} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                  <select required value={form.category_id} onChange={e => set('category_id', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]">
                    <option value="">Select category</option>
                    {categories.map(root => (
                      (root.children ?? []).length > 0 ? (
                        (root.children ?? []).map(lang => (
                          (lang.children ?? []).length > 0 ? (
                            <optgroup key={lang.id} label={lang.name}>
                              {(lang.children ?? []).map(genre => (
                                <option key={genre.id} value={genre.id}>{genre.name}</option>
                              ))}
                            </optgroup>
                          ) : (
                            <optgroup key={lang.id} label={root.name}>
                              <option value={lang.id}>{lang.name}</option>
                            </optgroup>
                          )
                        ))
                      ) : (
                        <option key={root.id} value={root.id}>{root.name}</option>
                      )
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price ($) *</label>
                  <input required type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock *</label>
                  <input required type="number" min="0" value={form.stock} onChange={e => set('stock', +e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
              </div>
              {/* ── Image picker ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-gray-600">Product Image</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setImageMode('upload')}
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 transition-colors ${imageMode === 'upload' ? 'bg-[#213885] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      <Upload className="w-3 h-3" /> Upload
                    </button>
                    <button type="button" onClick={() => setImageMode('url')}
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 transition-colors ${imageMode === 'url' ? 'bg-[#213885] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      <Link className="w-3 h-3" /> URL
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  {/* Preview */}
                  <div className="shrink-0 w-20 h-20 border border-[#cccacc] bg-gray-50 flex items-center justify-center overflow-hidden relative">
                    {form.image
                      ? <img src={form.image} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                      : <Upload className="w-6 h-6 text-gray-300" />}
                    {form.image && (
                      <button type="button" onClick={() => set('image', '')}
                        className="absolute top-0.5 right-0.5 bg-white border border-gray-200 text-gray-500 hover:text-red-600 rounded-full p-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1">
                    {imageMode === 'upload' ? (
                      <>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }} />
                        <button type="button" disabled={uploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f); }}
                          className="w-full border-2 border-dashed border-[#cccacc] hover:border-[#213885] py-4 flex flex-col items-center gap-1 text-xs text-[#6b6b6b] hover:text-[#213885] transition-colors disabled:opacity-50 cursor-pointer">
                          <Upload className={`w-5 h-5 ${uploadingImage ? 'animate-bounce' : ''}`} />
                          {uploadingImage ? 'Uploading…' : 'Click or drag & drop'}
                          <span className="text-[10px] text-gray-400">JPEG, PNG, WebP — max 5 MB</span>
                        </button>
                      </>
                    ) : (
                      <input value={form.image} onChange={e => set('image', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                    )}
                  </div>
                </div>
              </div>
              {/* ── Gallery Images (edit mode only) ── */}
              {editing && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Images className="w-3.5 h-3.5 text-gray-400" />
                    <label className="block text-xs font-medium text-gray-600">Image Gallery</label>
                    <span className="text-xs text-gray-400">({galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''})</span>
                  </div>

                  {galleryLoading ? (
                    <Spinner size="sm" className="py-2" />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {galleryImages.map((img, idx) => (
                        <div key={img.id} className="relative group w-20 h-20 border border-[#cccacc] bg-gray-50 overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.opacity = '0.3')} />
                          <button
                            type="button"
                            onClick={() => deleteGalleryImage(img.id)}
                            className="absolute top-0.5 right-0.5 bg-white/90 border border-gray-200 text-gray-500 hover:text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-[#213885]/80 text-white text-[9px] text-center py-0.5 font-semibold tracking-wider">
                              FIRST
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Add image button */}
                      <button
                        type="button"
                        disabled={uploadingGallery}
                        onClick={() => galleryInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleGalleryFile(f); }}
                        className="w-20 h-20 border-2 border-dashed border-[#cccacc] hover:border-[#213885] flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#213885] transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {uploadingGallery
                          ? <Upload className="w-4 h-4 animate-bounce" />
                          : <><Plus className="w-4 h-4" /><span className="text-[10px]">Add</span></>}
                      </button>
                      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleGalleryFile(f); e.target.value = ''; }} />
                    </div>
                  )}
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    Shown as a thumbnail strip on the product page. The first image is displayed on hover in listings.
                  </p>
                </div>
              )}

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="w-4 h-4 accent-[#213885]" /> Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-[#213885]" /> Active
                </label>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={saving} className="bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-6 py-2 text-sm font-medium transition-colors">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
