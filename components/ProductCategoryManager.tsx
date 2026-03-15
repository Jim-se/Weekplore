import React from 'react';
import { Image as ImageIcon, Plus, PlusCircle, Trash2 } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { getCategoryKey, getTotalProductsInCategories } from '../lib/productUtils';

export interface ProductDraft {
  category_id?: string;
  title: string;
  description: string;
  price: number;
  image_url?: string;
}

interface ProductCategoryManagerProps {
  heading: string;
  categories: ProductCategory[];
  emptyMessage: string;
  readOnly?: boolean;
  categoryDraftName?: string;
  onCategoryDraftChange?: (value: string) => void;
  onAddCategory?: () => void;
  productDraft?: ProductDraft;
  onProductDraftChange?: (changes: Partial<ProductDraft>) => void;
  onAddProduct?: () => void;
  onProductImageUpload?: (file: File, productId?: string) => void;
  onDeleteCategory?: (category: ProductCategory) => void;
  onDeleteProduct?: (product: Product, category: ProductCategory) => void;
  addCategoryLabel?: string;
  addProductLabel?: string;
}

const ProductCategoryManager: React.FC<ProductCategoryManagerProps> = ({
  heading,
  categories,
  emptyMessage,
  readOnly = false,
  categoryDraftName = '',
  onCategoryDraftChange,
  onAddCategory,
  productDraft,
  onProductDraftChange,
  onAddProduct,
  onProductImageUpload,
  onDeleteCategory,
  onDeleteProduct,
  addCategoryLabel = 'Add Category',
  addProductLabel = 'Add Product',
}) => {
  const totalProducts = getTotalProductsInCategories(categories);
  const categorySummary = `${categories.length} categories | ${totalProducts} products`;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gold">{heading}</h3>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-brand-text/40">
            {categorySummary}
          </p>
          <p className="hidden">
            {categories.length} categories • {totalProducts} products
          </p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-brand-text/35">
              Zero-price products are preselected in booking
            </span>
          </div>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="rounded-[28px] border-2 border-dashed border-brand-border p-10 text-center text-brand-text/40">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-5">
          {categories.map((category) => (
            <div key={getCategoryKey(category.id)} className="rounded-[28px] border border-brand-border bg-brand-bg/20 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-text/35">Category</p>
                  <h4 className="mt-2 text-lg font-bold text-brand-text">{category.name}</h4>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-brand-text/40">
                    {(category.products || []).length} options
                  </p>
                </div>
                {!readOnly && onDeleteCategory && (
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(category)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-red-500 transition-all hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Category
                  </button>
                )}
              </div>

              {(category.products || []).length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-brand-border px-5 py-6 text-center text-[11px] text-brand-text/40">
                  No products in this category yet.
                </div>
              ) : (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {(category.products || []).map((product) => (
                    <div key={product.id} className="flex items-start justify-between gap-4 rounded-2xl border border-brand-border bg-white p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-border bg-brand-bg/30">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-brand-text/30" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-brand-text">{product.title}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                              {Number(product.price) === 0 ? 'Default / Included' : `EUR ${product.price}`}
                            </p>
                            {!readOnly && onProductImageUpload && (
                              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-border px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-text/60 transition-all hover:border-brand-gold hover:text-brand-gold">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      onProductImageUpload(file, String(product.id));
                                    }
                                    e.target.value = '';
                                  }}
                                />
                                <ImageIcon className="h-3.5 w-3.5" />
                                {product.image_url ? 'Replace Photo' : 'Upload Photo'}
                              </label>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-brand-text/60">{product.description || 'No description'}</p>
                      </div>
                      {!readOnly && onDeleteProduct && (
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(product, category)}
                          className="rounded-full p-2 text-red-500 transition-all hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-[28px] border border-brand-border bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                <PlusCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-text/35">Step 1</p>
                <h4 className="mt-1 text-sm font-bold text-brand-text">{addCategoryLabel}</h4>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={categoryDraftName}
                onChange={(e) => onCategoryDraftChange?.(e.target.value)}
                className="w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none transition-all focus:border-brand-gold"
                placeholder="e.g. Cup, Brush, Apron"
              />
              <button
                type="button"
                onClick={onAddCategory}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-text px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-bg transition-all hover:bg-brand-gold"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-brand-border bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-text/35">Step 2</p>
                <h4 className="mt-1 text-sm font-bold text-brand-text">{addProductLabel}</h4>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-brand-text/40">Category</label>
                <select
                  value={productDraft?.category_id || ''}
                  onChange={(e) => onProductDraftChange?.({ category_id: e.target.value })}
                  className="w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none transition-all focus:border-brand-gold"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={getCategoryKey(category.id)} value={getCategoryKey(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-brand-text/40">Product title</label>
                <input
                  type="text"
                  value={productDraft?.title || ''}
                  onChange={(e) => onProductDraftChange?.({ title: e.target.value })}
                  className="w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none transition-all focus:border-brand-gold"
                  placeholder="e.g. Cup Small"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-brand-text/40">Price</label>
                <input
                  type="number"
                  min="0"
                  value={productDraft?.price ?? 0}
                  onChange={(e) => onProductDraftChange?.({ price: e.target.value === '' ? 0 : Number(e.target.value) })}
                  className="w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none transition-all focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-brand-text/40">Description</label>
                <input
                  type="text"
                  value={productDraft?.description || ''}
                  onChange={(e) => onProductDraftChange?.({ description: e.target.value })}
                  className="w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none transition-all focus:border-brand-gold"
                  placeholder="Optional short note"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-brand-text/40">Product photo</label>
                <div className="flex items-center gap-4 rounded-2xl border border-brand-border bg-brand-bg/20 p-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-border bg-white">
                    {productDraft?.image_url ? (
                      <img src={productDraft.image_url} alt={productDraft.title || 'Product preview'} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-brand-text/30" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-brand-text">
                      {productDraft?.image_url ? 'Photo uploaded' : 'Optional product photo'}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-brand-text/40">
                      PNG, JPG or WEBP
                    </p>
                    {onProductImageUpload && (
                      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-text px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-bg transition-all hover:bg-brand-gold">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onProductImageUpload(file);
                            }
                            e.target.value = '';
                          }}
                        />
                        <ImageIcon className="h-3.5 w-3.5" />
                        {productDraft?.image_url ? 'Replace Photo' : 'Upload Photo'}
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onAddProduct}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-brand-gold px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-all hover:bg-brand-text"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductCategoryManager;
