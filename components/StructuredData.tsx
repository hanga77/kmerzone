import React, { useMemo } from 'react';
import type { Product, Category } from '../types';

interface StructuredDataProps {
  navigation: any;
  siteData: any;
  t: (key: string) => string;
}

const StructuredData: React.FC<StructuredDataProps> = ({ navigation, siteData, t }) => {
  const { page, selectedProduct, selectedCategoryId } = navigation;
  const { allCategories } = siteData;

  const getCategoryBreadcrumbs = (categoryId: string | null) => {
    if (!categoryId) return [];
    const breadcrumbs = [];
    let currentCategory = allCategories.find((c: Category) => c.id === categoryId);
    while (currentCategory) {
      breadcrumbs.unshift({
        '@type': 'ListItem',
        position: breadcrumbs.length + 2,
        name: t(currentCategory.name),
        item: `https://www.kmerzone.cm?page=category&id=${currentCategory.id}`
      });
      currentCategory = allCategories.find((c: Category) => c.id === currentCategory?.parentId);
    }
    return breadcrumbs;
  };

  const jsonLd = useMemo(() => {
    const baseBreadcrumb = {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: 'https://www.kmerzone.cm'
    };

    switch (page) {
      case 'product':
        if (selectedProduct) {
          const approvedReviews = selectedProduct.reviews.filter((r: any) => r.status === 'approved');
          const breadcrumbs = getCategoryBreadcrumbs(selectedProduct.categoryId);
          
          const productSchema = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: selectedProduct.name,
            image: selectedProduct.imageUrls,
            description: selectedProduct.description,
            sku: selectedProduct.sku || selectedProduct.id,
            brand: {
              '@type': 'Brand',
              name: selectedProduct.brand || selectedProduct.vendor,
            },
            offers: {
              '@type': 'Offer',
              url: `https://www.kmerzone.cm?page=product&id=${selectedProduct.id}`,
              priceCurrency: 'XAF',
              price: selectedProduct.promotionPrice || selectedProduct.price,
              availability: selectedProduct.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              seller: {
                '@type': 'Organization',
                name: selectedProduct.vendor
              }
            },
            ...(approvedReviews.length > 0 && {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: (approvedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / approvedReviews.length).toFixed(1),
                reviewCount: approvedReviews.length
              }
            })
          };

          const breadcrumbSchema = {
             '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                baseBreadcrumb,
                ...breadcrumbs,
                {
                    '@type': 'ListItem',
                    position: breadcrumbs.length + 2,
                    name: selectedProduct.name,
                }
            ]
          };

          return [productSchema, breadcrumbSchema];
        }
        break;
        
      case 'category':
         const breadcrumbs = getCategoryBreadcrumbs(selectedCategoryId);
         if(breadcrumbs.length > 0) {
             const breadcrumbSchema = {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [ baseBreadcrumb, ...breadcrumbs ]
            };
            return [breadcrumbSchema];
         }
         break;

      default:
        return [{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            url: 'https://www.kmerzone.cm',
            potentialAction: {
                '@type': 'SearchAction',
                target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://www.kmerzone.cm?search={search_term_string}'
                },
                'query-input': 'required name=search_term_string'
            }
        }];
    }
    return [];
  }, [page, selectedProduct, selectedCategoryId, allCategories, t]);

  if (!jsonLd || jsonLd.length === 0) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd) }}
    />
  );
};

export default StructuredData;
