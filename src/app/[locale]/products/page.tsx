'use client';

import { Suspense, useEffect, useState } from 'react';
import Pagination from '@/components/ui/Pagination';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, X, Star } from 'lucide-react';
import api from '@/lib/api';
import { Product, Category, PaginatedResponse } from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';

function ProductsContent() {
  const t = useTranslations('filters');
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total,    setTotal]    = useState(0);
  const [perPage,  setPerPage]  = useState(12);

  const [filters, setFilters] = useState({
    category:   searchParams.get('category')  || '',
    search:     searchParams.get('search')    || '',
    min_price:  searchParams.get('min_price') || '',
    max_price:  searchParams.get('max_price') || '',
    sort:       searchParams.get('sort')      || 'created_at',
    dir:        searchParams.get('dir')       || 'desc',
    featured:   searchParams.get('featured')  || '',
    min_rating: searchParams.get('min_rating')|| '',
  });

  useEffect(() => {
    setFilters({
      category:   searchParams.get('category')  || '',
      search:     searchParams.get('search')    || '',
      min_price:  searchParams.get('min_price') || '',
      max_price:  searchParams.get('max_price') || '',
      sort:       searchParams.get('sort')      || 'created_at',
      dir:        searchParams.get('dir')       || 'desc',
      featured:   searchParams.get('featured')  || '',
      min_rating: searchParams.get('min_rating')|| '',
    });
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    if (filters.featured)   params.featured   = filters.featured;
    if (filters.min_rating) params.min_rating = filters.min_rating;
    params.sort = filters.sort;
    params.dir = filters.dir;

    api
      .get('/products', { params })
      .then((r) => {
        const data: PaginatedResponse<Product> = r.data;
        setProducts(data.data);
        setLastPage(data.last_page);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [filters, page, perPage]);

  const clearFilters = () => {
    setFilters({ category: '', search: '', min_price: '', max_price: '', sort: 'created_at', dir: 'desc', featured: '', min_rating: '' });
    setPage(1);
  };

  const hasFilters = filters.category || filters.search || filters.min_price || filters.max_price || filters.min_rating;

  function findCategoryName(slug: string): string {
    for (const cat of categories) {
      if (cat.slug === slug) return cat.name;
      for (const sub of cat.children ?? []) {
        if (sub.slug === slug) return sub.name;
        for (const genre of sub.children ?? []) {
          if (genre.slug === slug) return genre.name;
        }
      }
    }
    return t('all_products');
  }

  const ratingOptions = [
    { value: '',  label: t('all_ratings') },
    { value: '4', label: t('stars_up', { n: 4 }) },
    { value: '3', label: t('stars_up', { n: 3 }) },
    { value: '2', label: t('stars_up', { n: 2 }) },
    { value: '1', label: t('any_reviewed') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="md:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> {t('title')}
              </h2>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" /> {t('clear')}
                </button>
              )}
            </div>

            {/* Search */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-1 block">{t('search')}</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
                placeholder={t('search_placeholder')}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-2 block">{t('category')}</label>
              <div className="space-y-1">
                <button
                  onClick={() => { setFilters((f) => ({ ...f, category: '' })); setPage(1); }}
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg ${!filters.category ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {t('all_categories')}
                </button>
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <button
                      onClick={() => { setFilters((f) => ({ ...f, category: cat.slug })); setPage(1); }}
                      className={`block w-full text-left text-sm px-3 py-2 rounded-lg font-semibold ${filters.category === cat.slug ? 'bg-indigo-50 text-indigo-700' : 'text-gray-800 hover:bg-gray-50'}`}
                    >
                      {cat.name}
                    </button>
                    {cat.children && cat.children.length > 0 && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-2">
                        {cat.children.filter(sub =>
                          (sub.children?.length ?? 0) > 0 || (sub.products_count ?? 0) > 0
                        ).map((sub) => (
                          <div key={sub.id}>
                            <button
                              onClick={() => { setFilters((f) => ({ ...f, category: sub.slug })); setPage(1); }}
                              className={`block w-full text-left text-xs px-2 py-1.5 rounded font-medium ${filters.category === sub.slug ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
                            >
                              {sub.name}
                            </button>
                            {sub.children && sub.children.length > 0 && (
                              <div className="ml-2 mt-0.5 space-y-0 border-l-2 border-gray-50 pl-2">
                                {sub.children.map((genre) => (
                                  <button
                                    key={genre.id}
                                    onClick={() => { setFilters((f) => ({ ...f, category: genre.slug })); setPage(1); }}
                                    className={`block w-full text-left text-xs px-2 py-1 rounded ${filters.category === genre.slug ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'}`}
                                  >
                                    {genre.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-2 block">{t('price_range')}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.min_price}
                  onChange={(e) => { setFilters((f) => ({ ...f, min_price: e.target.value })); setPage(1); }}
                  placeholder={t('min')}
                  className="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="number"
                  value={filters.max_price}
                  onChange={(e) => { setFilters((f) => ({ ...f, max_price: e.target.value })); setPage(1); }}
                  placeholder={t('max')}
                  className="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Customer Rating */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-2 block">{t('rating')}</label>
              <div className="space-y-1">
                {ratingOptions.map(({ value, label }) => {
                  const isActive = value === '' ? filters.min_rating === '' : filters.min_rating === value;
                  const isAll    = value === '';
                  return (
                    <button
                      key={value}
                      onClick={() => { setFilters((f) => ({ ...f, min_rating: isActive && !isAll ? '' : value })); setPage(1); }}
                      className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {value === '' ? (
                        <span className="text-gray-400 text-xs">★★★★★</span>
                      ) : (
                        <span className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= Number(value)
                                  ? 'fill-[#893172] text-[#893172]'
                                  : 'fill-gray-200 text-gray-300'
                              }`}
                            />
                          ))}
                        </span>
                      )}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">{t('sort_by')}</label>
              <select
                value={`${filters.sort}-${filters.dir}`}
                onChange={(e) => {
                  const [sort, dir] = e.target.value.split('-');
                  setFilters((f) => ({ ...f, sort, dir }));
                  setPage(1);
                }}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="created_at-desc">{t('newest')}</option>
                <option value="created_at-asc">{t('oldest')}</option>
                <option value="price-asc">{t('price_low')}</option>
                <option value="price-desc">{t('price_high')}</option>
                <option value="name-asc">{t('name_az')}</option>
                <option value="name-desc">{t('name_za')}</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {filters.category
                ? findCategoryName(filters.category)
                : filters.search
                ? t('results_for', { q: filters.search })
                : t('all_products')}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 shrink-0">{t('count', { n: total })}</span>
              <div className="flex items-center gap-1.5">
                <label className="text-sm text-gray-500 shrink-0">{t('show')}</label>
                <select
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                  className="border border-[#cccacc] rounded px-2 py-1.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#213885] bg-white"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
                <span className="text-sm text-gray-500 shrink-0">{t('per_page')}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg">{t('no_results')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              <Pagination page={page} lastPage={lastPage} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
