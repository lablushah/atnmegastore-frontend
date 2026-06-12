'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { canManageProducts } from '@/lib/types';
import api from '@/lib/api';
import {
  Plus, Pencil, Trash2, Search, Star, Check, Upload, Link, X, Images,
  Download, FileSpreadsheet, FileText, ChevronDown, Filter, UploadCloud,
  AlertCircle,
} from 'lucide-react';
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

// ── PDF column definitions ────────────────────────────────────────────────────
const PDF_COL_DEFS = [
  { key: 'name',           label: 'Book Name',       defaultOn: true  },
  { key: 'name_secondary', label: 'Secondary Name',  defaultOn: false },
  { key: 'author',         label: 'Author',           defaultOn: true  },
  { key: 'genre',          label: 'Genre / Type',     defaultOn: false },
  { key: 'category',       label: 'Category',         defaultOn: false },
  { key: 'price',          label: 'Price ($)',         defaultOn: false },
  { key: 'stock',          label: 'Qty in Stock',     defaultOn: true  },
  { key: 'active',         label: 'Status',           defaultOn: false },
  { key: 'description',    label: 'Description',      defaultOn: false },
];

function getProductValue(p: Product, key: string): string {
  switch (key) {
    case 'name':           return p.name;
    case 'name_secondary': return p.name_secondary ?? '';
    case 'author':         return p.author ?? '';
    case 'genre':          return p.genre ?? '';
    case 'category':       return p.category?.name ?? '';
    case 'price':          return `$${parseFloat(p.price).toFixed(2)}`;
    case 'stock':          return String(p.stock);
    case 'active':         return p.active ? 'Active' : 'Hidden';
    case 'description':    return (p.description ?? '').slice(0, 80);
    default:               return '';
  }
}

// ── Logo → base64 for jsPDF ──────────────────────────────────────────────────
async function logoToBase64(src: string): Promise<string | null> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth  || 300;
        canvas.height = img.naturalHeight || 90;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default function AdminProductsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [products, setProducts]         = useState<Product[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [page, setPage]                 = useState(1);
  const [lastPage, setLastPage]         = useState(1);
  const [total, setTotal]               = useState(0);
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editing, setEditing]           = useState<Product | null>(null);
  const [form, setForm]                 = useState(EMPTY);
  const [saving, setSaving]             = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMode, setImageMode]       = useState<'upload' | 'url'>('upload');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [galleryImages, setGalleryImages]   = useState<ProductImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef   = useRef<HTMLDivElement>(null);

  // Inline edit state
  const [editCell, setEditCell]       = useState<EditCell>(null);
  const [editValue, setEditValue]     = useState('');
  const [patchingCell, setPatchingCell] = useState<EditCell>(null);
  const [savedCell, setSavedCell]     = useState<EditCell>(null);

  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPdfModal, setShowPdfModal]     = useState(false);
  const [pdfCols, setPdfCols]               = useState<string[]>(
    PDF_COL_DEFS.filter(c => c.defaultOn).map(c => c.key)
  );
  const [exportLoading, setExportLoading] = useState(false);

  // Import state
  const importFileRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows]           = useState<any[]>([]);
  const [importFilename, setImportFilename]   = useState('');
  const [importLoading, setImportLoading]     = useState(false);
  const [importResult, setImportResult]       = useState<{ updated: number; skipped: number; errors: string[]; total: number } | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!canManageProducts(user)) { router.push('/admin'); return; }
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    load(1);
  }, [user]);

  // Close export menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function load(p: number, q?: string, cat?: string) {
    setLoading(true);
    try {
      const params: any = { page: p, per_page: 20 };
      const sq  = q   !== undefined ? q   : search;
      const sca = cat !== undefined ? cat : categoryFilter;
      if (sq)  params.search      = sq;
      if (sca) params.category_id = sca;
      const { data } = await api.get('/admin/products', { params });
      const d: PaginatedProducts = data;
      setProducts(d.data); setPage(d.current_page); setLastPage(d.last_page); setTotal(d.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }

  function handleSearch(e: React.FormEvent) { e.preventDefault(); load(1, search, categoryFilter); }

  function handleCategoryFilter(catId: string) {
    setCategoryFilter(catId);
    load(1, search, catId);
  }

  // ── Flatten categories ────────────────────────────────────────────────────
  function flattenCategories(cats: Category[], depth = 0): Array<Category & { depth: number }> {
    return cats.flatMap(c => [{ ...c, depth }, ...flattenCategories(c.children ?? [], depth + 1)]);
  }
  const flatCats = flattenCategories(categories);

  function findCatById(id: number): Category | undefined {
    return flatCats.find(c => c.id === id);
  }

  function selectedCatName(): string {
    if (!categoryFilter) return 'All Categories';
    return flatCats.find(c => String(c.id) === categoryFilter)?.name ?? 'Category';
  }

  // ── Export helpers ────────────────────────────────────────────────────────
  async function fetchAllForExport(): Promise<Product[]> {
    const params: any = { per_page: 2000, page: 1 };
    if (categoryFilter) params.category_id = categoryFilter;
    if (search)         params.search = search;
    const { data } = await api.get('/admin/products', { params });
    return (data.data ?? []) as Product[];
  }

  // ── Import helpers ────────────────────────────────────────────────────────
  async function handleImportFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) { toast.error('Please select an .xlsx or .xls file'); return; }
    try {
      const XLSX = (await import('xlsx')).default;
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const raw  = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

      // Map header names → internal keys. We look for the locked "ID" column to match rows.
      const rows = raw
        .map((r: any) => {
          const id = parseInt(r['ID'] ?? r['id'] ?? '', 10);
          if (!id || isNaN(id)) return null;

          const parseYesNo = (v: any): boolean | null => {
            if (typeof v === 'boolean') return v;
            if (typeof v === 'number')  return v !== 0;
            const s = String(v ?? '').trim().toLowerCase();
            if (s === 'yes' || s === '1' || s === 'true')  return true;
            if (s === 'no'  || s === '0' || s === 'false') return false;
            return null;
          };

          const trimOrNull = (v: any) => { const s = String(v ?? '').trim(); return s === '' ? null : s; };

          const stockRaw = r['Stock (Qty)'] ?? r['Stock'] ?? r['stock'] ?? '';
          const priceRaw = (r['Price ($)'] ?? r['Price'] ?? r['price'] ?? '').toString().replace(/[$,]/g, '');

          return {
            id,
            stock:       stockRaw !== '' && stockRaw !== null ? parseInt(String(stockRaw), 10)  : null,
            price:       priceRaw !== ''                      ? parseFloat(priceRaw)             : null,
            active:      parseYesNo(r['Active']   ?? r['active']),
            featured:    parseYesNo(r['Featured'] ?? r['featured']),
            author:      trimOrNull(r['Author']      ?? r['author']),
            genre:       trimOrNull(r['Genre']       ?? r['genre']),
            description: trimOrNull(r['Description'] ?? r['description']),
          };
        })
        .filter(Boolean);

      if (rows.length === 0) { toast.error('No valid rows found — make sure the file has an ID column'); return; }

      setImportRows(rows);
      setImportFilename(file.name);
      setImportResult(null);
      setShowImportModal(true);
    } catch (err) {
      console.error(err);
      toast.error('Could not read the Excel file');
    }
  }

  async function submitImport() {
    setImportLoading(true);
    try {
      const { data } = await api.post('/admin/products/import', { products: importRows });
      setImportResult(data);
      if (data.updated > 0) {
        toast.success(`${data.updated} products updated`);
        load(page, search, categoryFilter);
      } else {
        toast.error('No products were updated');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed');
    } finally {
      setImportLoading(false);
    }
  }

  async function exportExcel() {
    setShowExportMenu(false);
    setExportLoading(true);
    try {
      const all = await fetchAllForExport();
      const XLSX = (await import('xlsx')).default;
      const rows = all.map(p => ({
        'ID':             p.id,
        'Name':           p.name,
        'Secondary Name': p.name_secondary ?? '',
        'Author':         p.author ?? '',
        'Genre':          p.genre ?? '',
        'Category':       p.category?.name ?? '',
        'Price ($)':      parseFloat(p.price),
        'Stock (Qty)':    p.stock,
        'Active':         p.active ? 'Yes' : 'No',
        'Featured':       p.featured ? 'Yes' : 'No',
        'Description':    p.description ?? '',
        'Slug':           p.slug,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      // Column widths
      ws['!cols'] = [
        {wch:6},{wch:50},{wch:30},{wch:28},{wch:18},{wch:22},
        {wch:10},{wch:10},{wch:8},{wch:10},{wch:60},{wch:40},
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, selectedCatName().slice(0, 31));
      const filename = `products_${selectedCatName().replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`Excel exported — ${all.length} products`);
    } catch (err) {
      console.error(err);
      toast.error('Excel export failed');
    } finally { setExportLoading(false); }
  }

  async function exportPdf() {
    setShowPdfModal(false);
    setExportLoading(true);
    try {
      const all = await fetchAllForExport();
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const catLabel = categoryFilter ? selectedCatName() : 'All Products';
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.width;   // 210mm
      const pageH = doc.internal.pageSize.height;  // 297mm
      const ML = 14, MR = 14;                      // margins

      // ── Embed Bengali-supporting font ───────────────────────────────────
      let bengaliFont = 'helvetica';
      try {
        const fontResp = await fetch('/fonts/NotoSansBengali-Regular.ttf');
        if (fontResp.ok) {
          const buf   = await fontResp.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let bin = '';
          for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
          const b64 = btoa(bin);
          doc.addFileToVFS('NotoSansBengali-Regular.ttf', b64);
          doc.addFont('NotoSansBengali-Regular.ttf', 'NotoSansBengali', 'normal');
          bengaliFont = 'NotoSansBengali';
        }
      } catch { /* fall back to helvetica */ }

      // ── Logo (left) ─────────────────────────────────────────────────────
      const logoB64 = await logoToBase64('/logo.svg');
      const LOGO_W = 38, LOGO_H = 12;
      if (logoB64) {
        doc.addImage(logoB64, 'PNG', ML, 8, LOGO_W, LOGO_H);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(33, 56, 133);
        doc.text('ATN Book & Crafts', ML, 15);
      }

      // ── Company info (right) ─────────────────────────────────────────────
      const RX = pageW - MR;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(33, 56, 133);
      doc.text('ATN Book & Crafts', RX, 10, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      doc.text('416-671-6382  ·  416-686-3134', RX, 14.5, { align: 'right' });
      doc.text('info@atnmegastore.ca', RX, 18.5, { align: 'right' });
      doc.text('atnmegastore.ca', RX, 22.5, { align: 'right' });

      // ── Divider ──────────────────────────────────────────────────────────
      doc.setDrawColor(220, 220, 230);
      doc.setLineWidth(0.3);
      doc.line(ML, 27, pageW - MR, 27);

      // ── Report title ─────────────────────────────────────────────────────
      doc.setFont(bengaliFont, 'normal');
      doc.setFontSize(13);
      doc.setTextColor(33, 56, 133);
      doc.text(`List of ${catLabel}`, ML, 33);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 130);
      const dateStr = new Date().toLocaleDateString('en-CA', { dateStyle: 'long' });
      doc.text(`Exported ${dateStr}  ·  ${all.length} products`, ML, 38);

      // ── Table ────────────────────────────────────────────────────────────
      const selectedDefs = PDF_COL_DEFS.filter(c => pdfCols.includes(c.key));
      const head = [selectedDefs.map(c => c.label)];
      const body = all.map(p => selectedDefs.map(col => getProductValue(p, col.key)));

      const descIdx = pdfCols.indexOf('description');
      const colStyles: Record<number, any> = {};
      if (descIdx >= 0) colStyles[descIdx] = { cellWidth: 55 };

      autoTable(doc, {
        head,
        body,
        startY: 42,
        styles: {
          font:        bengaliFont,
          fontSize:    8,
          cellPadding: 2.5,
          overflow:    'linebreak',
          textColor:   [30, 30, 30],
        },
        headStyles: {
          font:      'helvetica',
          fontStyle: 'bold',
          fontSize:  8,
          fillColor: [33, 56, 133],
          textColor: [255, 255, 255],
        },
        alternateRowStyles: { fillColor: [243, 246, 255] },
        columnStyles: colStyles,
        margin: { left: ML, right: MR, bottom: 18 },
      });

      // ── Footer on every page (added after table so total is known) ───────
      const totalPages = doc.getNumberOfPages();
      for (let pg = 1; pg <= totalPages; pg++) {
        doc.setPage(pg);
        doc.setFont('helvetica', 'normal');

        // Address line
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.text(
          '2972 Danforth Avenue, Toronto, ON  M4C 1M6, Canada  ·  Mon – Sun · 2:00 PM – 8:00 PM',
          pageW / 2, pageH - 9,
          { align: 'center' }
        );

        // Separator
        doc.setDrawColor(220, 220, 230);
        doc.setLineWidth(0.25);
        doc.line(ML, pageH - 12, pageW - MR, pageH - 12);

        // Page number
        doc.setFontSize(6.5);
        doc.setTextColor(170, 170, 170);
        doc.text(
          `Page ${pg} of ${totalPages}  ·  ATN Book & Crafts  ·  atnmegastore.ca`,
          pageW / 2, pageH - 5,
          { align: 'center' }
        );
      }

      const filename = `${catLabel.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      toast.success(`PDF saved — ${all.length} products`);
    } catch (err) {
      console.error(err);
      toast.error('PDF export failed');
    } finally { setExportLoading(false); }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null); setForm(EMPTY); setImageMode('upload'); setSelectedTags([]); setGalleryImages([]); setShowModal(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({ name: p.name, name_secondary: p.name_secondary ?? '', author: p.author ?? '', genre: p.genre ?? '', description: p.description ?? '', price: p.price, stock: p.stock, image: p.image ?? '', featured: p.featured, active: p.active, category_id: String(p.category?.id ?? '') });
    setImageMode(p.image ? 'url' : 'upload');
    setSelectedTags((p.tags ?? []).map(t => t.slug));
    setGalleryImages([]);
    setShowModal(true);
    setGalleryLoading(true);
    api.get(`/admin/products/${p.id}/images`).then(r => setGalleryImages(r.data)).catch(() => {}).finally(() => setGalleryLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price as string), stock: Number(form.stock), category_id: Number(form.category_id), tags: selectedTags };
      if (editing) { await api.put(`/admin/products/${editing.id}`, payload); toast.success('Product updated'); }
      else         { await api.post('/admin/products', payload);               toast.success('Product created'); }
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

  // ── Inline edit ─────────────────────────────────────────────────────────
  function startEdit(id: number, field: string, currentValue: any) { setEditCell({ id, field }); setEditValue(String(currentValue ?? '')); }
  function cancelEdit() { setEditCell(null); setEditValue(''); }

  async function patchProduct(product: Product, changes: Record<string, any>) {
    const cellKey = Object.keys(changes)[0];
    setPatchingCell({ id: product.id, field: cellKey });
    setProducts(prev => prev.map(p => {
      if (p.id !== product.id) return p;
      if (cellKey === 'category_id') { const cat = findCatById(Number(changes.category_id)); return { ...p, category: cat ?? null }; }
      return { ...p, ...changes };
    }));
    try {
      const payload = { name: product.name, category_id: product.category?.id, price: parseFloat(product.price), stock: product.stock, active: product.active, featured: product.featured, name_secondary: product.name_secondary, author: product.author, genre: product.genre, description: product.description, image: product.image, ...changes };
      const { data } = await api.put(`/admin/products/${product.id}`, payload);
      setProducts(prev => prev.map(p => p.id === product.id ? data : p));
      setSavedCell({ id: product.id, field: cellKey });
      setTimeout(() => setSavedCell(null), 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
      load(page);
    } finally { setPatchingCell(null); }
  }

  async function commitTextEdit(product: Product, field: string, rawValue: string) {
    cancelEdit();
    const value = field === 'price' ? parseFloat(rawValue) : field === 'stock' ? parseInt(rawValue, 10) : rawValue;
    if (String(value) === String(field === 'price' ? parseFloat(product.price) : field === 'stock' ? product.stock : (product as any)[field])) return;
    if ((field === 'price' || field === 'stock') && isNaN(value as number)) { toast.error('Invalid number'); return; }
    await patchProduct(product, { [field]: value });
  }

  async function commitCategoryEdit(product: Product, newCatId: string) {
    cancelEdit();
    if (String(product.category?.id) === newCatId) return;
    await patchProduct(product, { category_id: Number(newCatId) });
  }

  async function toggleStatus(product: Product) { await patchProduct(product, { active: !product.active }); }

  const isEditing  = (id: number, field: string) => editCell?.id === id && editCell?.field === field;
  const isPatching = (id: number, field: string) => patchingCell?.id === id && patchingCell?.field === field;
  const isSaved    = (id: number, field: string) => savedCell?.id === id && savedCell?.field === field;
  const cellBase   = 'cursor-pointer group-hover:border-b group-hover:border-dashed group-hover:border-gray-300 inline-block min-w-[2rem]';

  // ── Image handlers ───────────────────────────────────────────────────────
  async function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setUploadingImage(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const { data } = await api.post('/admin/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('image', data.url); toast.success('Image uploaded');
    } catch { toast.error('Image upload failed'); }
    finally { setUploadingImage(false); }
  }

  async function handleGalleryFile(file: File) {
    if (!editing || !file.type.startsWith('image/')) return;
    setUploadingGallery(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const { data } = await api.post(`/admin/products/${editing.id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setGalleryImages(prev => [...prev, data]); toast.success('Image added to gallery');
    } catch { toast.error('Gallery upload failed'); }
    finally { setUploadingGallery(false); }
  }

  async function deleteGalleryImage(imgId: number) {
    if (!editing) return;
    try { await api.delete(`/admin/products/${editing.id}/images/${imgId}`); setGalleryImages(prev => prev.filter(i => i.id !== imgId)); }
    catch { toast.error('Delete failed'); }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}>Products</h1>
          <p className="text-[#6b6b6b] mt-1">{total} total · <span className="text-xs text-gray-400">click Category, Price or Stock to edit inline</span></p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] text-white px-4 py-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* ── Toolbar: search + category filter + export ───────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4 items-end">

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or author…"
            className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]"
          />
          <button type="submit" className="bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm flex items-center gap-1">
            <Search className="w-4 h-4" /> Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); load(1, '', categoryFilter); }} className="text-sm text-gray-500 hover:text-gray-700 px-2">Clear</button>
          )}
        </form>

        {/* Category filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={e => handleCategoryFilter(e.target.value)}
            className="border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885] min-w-36 bg-white"
          >
            <option value="">All Categories</option>
            {flatCats.map(c => (
              <option key={c.id} value={String(c.id)}>
                {'  '.repeat(c.depth)}{c.name}
              </option>
            ))}
          </select>
          {categoryFilter && (
            <button onClick={() => handleCategoryFilter('')} className="text-gray-400 hover:text-gray-600" title="Clear filter">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Import Excel button */}
        <>
          <input
            ref={importFileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ''; }}
          />
          <button
            onClick={() => importFileRef.current?.click()}
            className="flex items-center gap-1.5 border border-green-600 bg-green-50 hover:bg-green-100 px-3 py-2 text-sm text-green-700 font-medium transition-colors"
            title="Upload an edited Excel file to update products"
          >
            <UploadCloud className="w-4 h-4" />
            Import Excel
          </button>
        </>

        {/* Export dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(v => !v)}
            disabled={exportLoading}
            className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors disabled:opacity-50"
          >
            {exportLoading
              ? <span className="w-4 h-4 border-2 border-gray-300 border-t-[#213885] rounded-full animate-spin" />
              : <Download className="w-4 h-4" />}
            Export
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-48 py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                {categoryFilter ? `Category: ${selectedCatName()}` : 'All Products'}
              </div>
              <button
                onClick={exportExcel}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">Export as Excel</p>
                  <p className="text-xs text-gray-400">All fields · .xlsx</p>
                </div>
              </button>
              <button
                onClick={() => { setShowExportMenu(false); setShowPdfModal(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4 text-red-500" />
                <div className="text-left">
                  <p className="font-medium">Export as PDF…</p>
                  <p className="text-xs text-gray-400">Choose columns · ATN logo</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Product table ────────────────────────────────────────────────── */}
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
                      {p.image
                        ? <img src={p.image} alt="" className="w-10 h-10 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                        : <div className="w-10 h-10 bg-gray-100" />}
                    </td>
                    <td className="py-2 px-3 border-b border-gray-50">
                      <p className="font-medium text-[#1a1a1a] leading-tight">{p.name}</p>
                      {p.name_secondary && <p className="text-xs text-[#6b6b6b]">{p.name_secondary}</p>}
                      {p.featured && <span className="inline-flex items-center gap-0.5 text-[10px] text-yellow-600"><Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" /> Featured</span>}
                    </td>
                    <td className="py-2 px-3 border-b border-gray-50 text-[#6b6b6b]">{p.author ?? '—'}</td>

                    {/* Category inline edit */}
                    <td className="py-2 px-3 border-b border-gray-50" onClick={() => !isEditing(p.id, 'category') && startEdit(p.id, 'category', p.category?.id ?? '')}>
                      {isEditing(p.id, 'category') ? (
                        <select autoFocus value={editValue}
                          onChange={e => { commitCategoryEdit(p, e.target.value); }}
                          onBlur={() => { commitCategoryEdit(p, editValue); }}
                          onKeyDown={e => e.key === 'Escape' && cancelEdit()}
                          className="bg-transparent border-0 border-b border-[#213885] outline-none text-sm py-0.5 text-[#1a1a1a] cursor-pointer">
                          <option value="">— none —</option>
                          {flatCats.map(c => <option key={c.id} value={c.id}>{'  '.repeat(c.depth)}{c.name}</option>)}
                        </select>
                      ) : (
                        <span className={`${cellBase} ${isPatching(p.id, 'category') ? 'opacity-40' : 'text-[#6b6b6b]'}`}>
                          {isPatching(p.id, 'category') ? '…' : isSaved(p.id, 'category') ? <span className="text-green-600 font-semibold text-xs">✓</span> : (p.category?.name ?? '—')}
                        </span>
                      )}
                    </td>

                    {/* Price inline edit */}
                    <td className="py-2 px-3 border-b border-gray-50" onClick={() => !isEditing(p.id, 'price') && startEdit(p.id, 'price', parseFloat(p.price).toFixed(2))}>
                      {isEditing(p.id, 'price') ? (
                        <input autoFocus type="number" step="0.01" min="0" value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => commitTextEdit(p, 'price', editValue)}
                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') cancelEdit(); }}
                          className="bg-transparent border-0 border-b border-[#213885] outline-none w-20 text-sm py-0.5 font-medium" />
                      ) : (
                        <span className={`${cellBase} font-medium ${isPatching(p.id, 'price') ? 'opacity-40' : ''}`}>
                          {isPatching(p.id, 'price') ? '…' : isSaved(p.id, 'price') ? <span className="text-green-600 font-semibold text-xs">✓</span> : `$${parseFloat(p.price).toFixed(2)}`}
                        </span>
                      )}
                    </td>

                    {/* Stock inline edit */}
                    <td className="py-2 px-3 border-b border-gray-50" onClick={() => !isEditing(p.id, 'stock') && startEdit(p.id, 'stock', p.stock)}>
                      {isEditing(p.id, 'stock') ? (
                        <input autoFocus type="number" min="0" value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => commitTextEdit(p, 'stock', editValue)}
                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') cancelEdit(); }}
                          className="bg-transparent border-0 border-b border-[#213885] outline-none w-16 text-sm py-0.5" />
                      ) : (
                        <span className={`${cellBase} ${isPatching(p.id, 'stock') ? 'opacity-40' : p.stock === 0 ? 'text-red-600 font-semibold' : p.stock < 5 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {isPatching(p.id, 'stock') ? '…' : isSaved(p.id, 'stock') ? <span className="text-green-600 font-semibold text-xs">✓</span> : p.stock}
                        </span>
                      )}
                    </td>

                    {/* Status toggle */}
                    <td className="py-2 px-3 border-b border-gray-50">
                      <button onClick={() => toggleStatus(p)} disabled={isPatching(p.id, 'active')}
                        className={`text-xs px-2 py-0.5 transition-colors disabled:opacity-40 ${p.active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {isPatching(p.id, 'active') ? '…' : isSaved(p.id, 'active') ? '✓' : p.active ? 'Active' : 'Hidden'}
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

      {/* ── Import Excel modal ──────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg shadow-xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#1a1a1a] flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-green-600" /> Import from Excel
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{importFilename}</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4">
              {!importResult ? (
                <>
                  {/* Preview summary */}
                  <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                    <p className="text-sm text-green-800 font-medium">{importRows.length} products ready to update</p>
                    <p className="text-xs text-green-600 mt-1">
                      Editable fields: Stock, Price, Active, Featured, Author, Genre, Description
                    </p>
                    <p className="text-xs text-green-600">
                      Read-only fields will be ignored: Name, Secondary Name, Category, Slug
                    </p>
                  </div>

                  {/* Sample preview — first 5 rows */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Preview (first 5 rows)</p>
                    <div className="overflow-x-auto border border-gray-100 rounded">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            {['ID', 'Stock', 'Price', 'Active', 'Author'].map(h => (
                              <th key={h} className="px-2 py-1.5 text-left text-gray-500 font-medium border-b border-gray-100 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.slice(0, 5).map((r, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="px-2 py-1.5 text-gray-500">{r.id}</td>
                              <td className="px-2 py-1.5">{r.stock ?? '—'}</td>
                              <td className="px-2 py-1.5">{r.price != null ? `$${r.price.toFixed(2)}` : '—'}</td>
                              <td className="px-2 py-1.5">{r.active === null ? '—' : r.active ? 'Yes' : 'No'}</td>
                              <td className="px-2 py-1.5 max-w-24 truncate">{r.author ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importRows.length > 5 && (
                      <p className="text-xs text-gray-400 mt-1 text-right">…and {importRows.length - 5} more rows</p>
                    )}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 flex gap-2 text-xs text-amber-700">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>This will overwrite existing values for all rows in the file. Rows where nothing changed will be skipped automatically.</span>
                  </div>
                </>
              ) : (
                /* Result panel */
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{importResult.updated}</p>
                      <p className="text-xs text-green-600 mt-0.5">Updated</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                      <p className="text-2xl font-bold text-gray-500">{importResult.skipped}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Skipped</p>
                    </div>
                    <div className={`border rounded p-3 text-center ${importResult.errors.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-2xl font-bold ${importResult.errors.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{importResult.errors.length}</p>
                      <p className={`text-xs mt-0.5 ${importResult.errors.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>Errors</p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                      <p className="text-xs font-semibold text-red-600 mb-1">Errors:</p>
                      {importResult.errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-500">{e}</p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 text-center">{importResult.total} total rows processed</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => { setShowImportModal(false); setImportResult(null); setImportRows([]); }}
                className="border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                {importResult ? 'Close' : 'Cancel'}
              </button>
              {!importResult && (
                <button
                  onClick={submitImport}
                  disabled={importLoading || importRows.length === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-1.5 text-sm font-medium transition-colors"
                >
                  {importLoading
                    ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Importing…</>
                    : <><UploadCloud className="w-4 h-4" /> Update {importRows.length} Products</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PDF column picker modal ──────────────────────────────────────── */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#1a1a1a]">Export as PDF</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {categoryFilter ? `Category: ${selectedCatName()}` : 'All products'} · ATN logo included
                </p>
              </div>
              <button onClick={() => setShowPdfModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Choose columns to include in PDF
              </p>
              <div className="space-y-2">
                {PDF_COL_DEFS.map(col => (
                  <label key={col.key} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setPdfCols(prev =>
                        prev.includes(col.key)
                          ? prev.filter(k => k !== col.key)
                          : [...prev, col.key]
                      )}
                      className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center shrink-0 transition-colors
                        ${pdfCols.includes(col.key) ? 'bg-[#213885] border-[#213885]' : 'border-gray-300 group-hover:border-[#213885]'}`}
                    >
                      {pdfCols.includes(col.key) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <span
                      className={`text-sm ${pdfCols.includes(col.key) ? 'text-[#1a1a1a] font-medium' : 'text-gray-500'}`}
                      onClick={() => setPdfCols(prev =>
                        prev.includes(col.key)
                          ? prev.filter(k => k !== col.key)
                          : [...prev, col.key]
                      )}
                    >
                      {col.label}
                    </span>
                    {col.defaultOn && <span className="text-[10px] text-gray-400 ml-auto">default</span>}
                  </label>
                ))}
              </div>

              <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setPdfCols(PDF_COL_DEFS.filter(c => c.defaultOn).map(c => c.key))}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Reset defaults
                </button>
                <button
                  onClick={() => setPdfCols(PDF_COL_DEFS.map(c => c.key))}
                  className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                >
                  Select all
                </button>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-3 items-center justify-end">
              <span className="text-xs text-gray-400">{pdfCols.length} column{pdfCols.length !== 1 ? 's' : ''} selected</span>
              <button onClick={() => setShowPdfModal(false)} className="border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={exportPdf}
                disabled={pdfCols.length === 0}
                className="flex items-center gap-2 bg-[#213885] hover:bg-[#081849] disabled:opacity-50 text-white px-4 py-1.5 text-sm font-medium transition-colors"
              >
                <FileText className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit product modal ─────────────────────────────────────── */}
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
                              {(lang.children ?? []).map(genre => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
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

              {/* Image picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-gray-600">Product Image</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setImageMode('upload')} className={`flex items-center gap-1 text-xs px-2 py-0.5 transition-colors ${imageMode === 'upload' ? 'bg-[#213885] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Upload className="w-3 h-3" /> Upload</button>
                    <button type="button" onClick={() => setImageMode('url')} className={`flex items-center gap-1 text-xs px-2 py-0.5 transition-colors ${imageMode === 'url' ? 'bg-[#213885] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Link className="w-3 h-3" /> URL</button>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="shrink-0 w-20 h-20 border border-[#cccacc] bg-gray-50 flex items-center justify-center overflow-hidden relative">
                    {form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} /> : <Upload className="w-6 h-6 text-gray-300" />}
                    {form.image && <button type="button" onClick={() => set('image', '')} className="absolute top-0.5 right-0.5 bg-white border border-gray-200 text-gray-500 hover:text-red-600 rounded-full p-0.5"><X className="w-2.5 h-2.5" /></button>}
                  </div>
                  <div className="flex-1">
                    {imageMode === 'upload' ? (
                      <>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }} />
                        <button type="button" disabled={uploadingImage} onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f); }}
                          className="w-full border-2 border-dashed border-[#cccacc] hover:border-[#213885] py-4 flex flex-col items-center gap-1 text-xs text-[#6b6b6b] hover:text-[#213885] transition-colors disabled:opacity-50 cursor-pointer">
                          <Upload className={`w-5 h-5 ${uploadingImage ? 'animate-bounce' : ''}`} />
                          {uploadingImage ? 'Uploading…' : 'Click or drag & drop'}
                          <span className="text-[10px] text-gray-400">JPEG, PNG, WebP — max 5 MB</span>
                        </button>
                      </>
                    ) : (
                      <input value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://example.com/image.jpg" className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#213885]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Gallery */}
              {editing && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Images className="w-3.5 h-3.5 text-gray-400" />
                    <label className="block text-xs font-medium text-gray-600">Image Gallery</label>
                    <span className="text-xs text-gray-400">({galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''})</span>
                  </div>
                  {galleryLoading ? <Spinner size="sm" className="py-2" /> : (
                    <div className="flex flex-wrap gap-2">
                      {galleryImages.map((img, idx) => (
                        <div key={img.id} className="relative group w-20 h-20 border border-[#cccacc] bg-gray-50 overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.opacity = '0.3')} />
                          <button type="button" onClick={() => deleteGalleryImage(img.id)} className="absolute top-0.5 right-0.5 bg-white/90 border border-gray-200 text-gray-500 hover:text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-2.5 h-2.5" /></button>
                          {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-[#213885]/80 text-white text-[9px] text-center py-0.5 font-semibold tracking-wider">FIRST</span>}
                        </div>
                      ))}
                      <button type="button" disabled={uploadingGallery} onClick={() => galleryInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleGalleryFile(f); }}
                        className="w-20 h-20 border-2 border-dashed border-[#cccacc] hover:border-[#213885] flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#213885] transition-colors disabled:opacity-50 cursor-pointer shrink-0">
                        {uploadingGallery ? <Upload className="w-4 h-4 animate-bounce" /> : <><Plus className="w-4 h-4" /><span className="text-[10px]">Add</span></>}
                      </button>
                      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleGalleryFile(f); e.target.value = ''; }} />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="w-4 h-4 accent-[#213885]" /> Featured</label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-[#213885]" /> Active</label>
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
