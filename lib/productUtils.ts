import { Product, ProductCategory } from '../types';

const safeNumber = (value: unknown) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

const safeString = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export const getCategoryKey = (categoryId: ProductCategory['id']) => String(categoryId);

export const sortProducts = (products: Product[] = []) =>
  [...products].sort((left, right) => {
    const priceDiff = safeNumber(left.price) - safeNumber(right.price);
    if (priceDiff !== 0) {
      return priceDiff;
    }

    return safeString(left.title).localeCompare(safeString(right.title));
  });

export const sortProductCategories = (categories: ProductCategory[] = []) =>
  [...categories]
    .map((category) => ({
      ...category,
      products: sortProducts(category.products || []),
    }))
    .sort((left, right) => {
      const leftCreatedAt = left.created_at ? new Date(left.created_at).getTime() : 0;
      const rightCreatedAt = right.created_at ? new Date(right.created_at).getTime() : 0;

      if (leftCreatedAt && rightCreatedAt && leftCreatedAt !== rightCreatedAt) {
        return leftCreatedAt - rightCreatedAt;
      }

      return safeString(left.name).localeCompare(safeString(right.name));
    });

export const flattenProductCategories = (categories: ProductCategory[] = []) =>
  sortProductCategories(categories).flatMap((category) => category.products || []);

export const getSelectableProductCategories = (categories: ProductCategory[] = []) =>
  sortProductCategories(categories).filter((category) => (category.products?.length || 0) > 0);

export const getDefaultProductForCategory = (category: ProductCategory) => {
  const sortedProducts = sortProducts(category.products || []);
  return sortedProducts.find((product) => safeNumber(product.price) === 0) || sortedProducts[0] || null;
};

export const getTotalProductsInCategories = (categories: ProductCategory[] = []) =>
  categories.reduce((sum, category) => sum + (category.products?.length || 0), 0);
