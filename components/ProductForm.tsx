import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Category, Variant, VariantDetail, SiteSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PhotoIcon, XCircleIcon, TrashIcon } from './Icons';

interface ProductFormProps {
  onSave: (product: Product) => void;
  onCancel: () => void;
  productToEdit: Product | null;
  categories: Category[];
  onAddCategory: (categoryName: string) => Category;
  siteSettings: SiteSettings;
}

// Helper function to generate combinations
const getCombinations = (variants: Variant[]): Record<string, string>[] => {
  if (variants.length === 0 || variants.some(v => v.options.length === 0)) {
    return [];
  }

  const combinations: Record<string, string>[] = [];
  const variantNames = variants.map(v => v.name);

  const recurse = (index: number, currentCombination: Record<string, string>) => {
    if (index === variants.length) {
      combinations.push(currentCombination);
      return;
    }

    const variant = variants[index];
    for (const option of variant.options) {
      const newCombination = { ...currentCombination, [variant.name]: option };
      recurse(index + 1, newCombination);
    }
  };

  recurse(0, {});
  return combinations;
};

const ProductForm: React.FC<ProductFormProps> = ({ onSave, onCancel, productToEdit, categories, onAddCategory, siteSettings }) => {
  const { user } = useAuth();
  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    promotionPrice: undefined,
    stock: 0,
    categoryId: '',
    description: '',
    imageUrls: [],
    status: 'draft',
    brand: '',
    weight: '',
    dimensions: '',
    material: '',
    gender: 'Unisexe',
    serialNumber: '',
    productionDate: '',
    expirationDate: '',
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const categoryTree = useMemo(() => {
    const mainCategories = categories.filter(c => !c.parentId);
    return mainCategories.map(mainCat => ({
        ...mainCat,
        subCategories: categories.filter(c => c.parentId === mainCat.id)
    }));
  }, [categories]);

  // Variant state management
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantDetails, setVariantDetails] = useState<VariantDetail[]>([]);

  const variantCombinations = useMemo(() => getCombinations(variants), [variants]);
  const hasVariants = variants.length > 0 && variants.every(v => v.name && v.options.length > 0);

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        ...productToEdit,
        productionDate: productToEdit.productionDate ? productToEdit.productionDate.split('T')[0] : '',
        expirationDate: productToEdit.expirationDate ? productToEdit.expirationDate.split('T')[0] : '',
      });
      setImagePreviews(productToEdit.imageUrls);
      setVariants(productToEdit.variants || []);
      setVariantDetails(productToEdit.variantDetails || []);
    } else if (categoryTree.length > 0 && categoryTree[0].subCategories.length > 0) {
      // Set default category
      setProduct(prev => ({ ...prev, categoryId: categoryTree[0].subCategories[0].id }));
    }
  }, [productToEdit, categoryTree]);
  
  // Effect to update total stock from variants
  useEffect(() => {
      if (hasVariants) {
          const totalStock = variantDetails.reduce((sum, detail) => sum + detail.stock, 0);
          setProduct(prev => ({...prev, stock: totalStock }));
      }
  }, [variantDetails, hasVariants]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const numberValue = value === '' ? undefined : parseFloat(value);
      setProduct(prev => ({ ...prev, [name]: numberValue }));
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const currentImageCount = imagePreviews.length;
      if (files.length + currentImageCount > 5) {
        alert("Vous ne pouvez télécharger que 5 images au maximum.");
        return;
      }
      
      files.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            setImagePreviews(prev => [...prev, result]);
            setProduct(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), result] }));
          };
          reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setProduct(prev => ({ ...prev, imageUrls: prev.imageUrls?.filter((_, i) => i !== index) }));
  }

  const handleAddVariantType = () => {
    if(variants.length < 3) {
      setVariants(prev => [...prev, { name: '', options: [] }]);
    }
  };

  const handleRemoveVariantType = (index: number) => {
      setVariants(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleVariantChange = (index: number, field: 'name' | 'options', value: string) => {
    setVariants(prev => prev.map((variant, i) => {
        if (i === index) {
            if (field === 'name') {
                return { ...variant, name: value };
            }
            if (field === 'options') {
                const optionsArray = value.split(',').map(opt => opt.trim()).filter(Boolean);
                return { ...variant, options: optionsArray };
            }
        }
        return variant;
    }));
  };

  const handleVariantDetailChange = (combination: Record<string, string>, field: 'stock' | 'price', value: string) => {
      const numValue = parseFloat(value);
      setVariantDetails(prev => {
          const existingDetailIndex = prev.findIndex(d => 
              JSON.stringify(d.options) === JSON.stringify(combination)
          );
          
          if (existingDetailIndex > -1) {
              const newDetails = [...prev];
              newDetails[existingDetailIndex] = {
                  ...newDetails[existingDetailIndex],
                  [field]: isNaN(numValue) ? (field === 'price' ? undefined : 0) : numValue
              };
              return newDetails;
          } else {
               const newDetail: VariantDetail = {
                   options: combination,
                   stock: field === 'stock' ? (isNaN(numValue) ? 0 : numValue) : 0,
                   price: field === 'price' ? (isNaN(numValue) ? undefined : numValue) : undefined
               };
               return [...prev, newDetail];
          }
      });
  };

  const getVariantDetailValue = (combination: Record<string, string>, field: 'stock' | 'price') => {
      const detail = variantDetails.find(d => JSON.stringify(d.options) === JSON.stringify(combination));
      return detail?.[field] ?? '';
  };


  const handleSubmit = (status: 'published' | 'draft') => {
    if (!user?.shopName) {
        alert("Erreur: nom de la boutique non trouvé.");
        return;
    }
    if (!product.name || !product.price || product.stock === undefined || !product.imageUrls || product.imageUrls.length === 0 || !product.categoryId) {
        alert("Veuillez remplir tous les champs obligatoires (Nom, Prix, Stock, Catégorie et au moins une Image).");
        return;
    }
    
    const finalProduct: Product = {
        id: productToEdit ? productToEdit.id : new Date().getTime().toString(),
        vendor: user.shopName,
        reviews: productToEdit ? productToEdit.reviews : [],
        ...product,
        name: product.name!,
        price: product.price!,
        stock: product.stock!,
        categoryId: product.categoryId!,
        description: product.description!,
        imageUrls: product.imageUrls!,
        status: status,
        variants: hasVariants ? variants : undefined,
        variantDetails: hasVariants ? variantDetails : undefined,
    };
    onSave(finalProduct);
  };

    const renderCategorySpecificFields = () => {
        const categoryId = product.categoryId || '';
        const category = categories.find(c => c.id === categoryId);
        const categoryName = category?.name || '';

        if (['Vêtements', 'Chaussures', 'Sacs & Accessoires'].includes(categoryName)) {
            return (
                <>
                    <div>
                        <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marque</label>
                        <input type="text" name="brand" id="brand" value={product.brand || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="material" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Matériau</label>
                        <input type="text" name="material" id="material" value={product.material || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Genre</label>
                        <select name="gender" id="gender" value={product.gender} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600">
                            <option value="Unisexe">Unisexe</option>
                            <option value="Homme">Homme</option>
                            <option value="Femme">Femme</option>
                        </select>
                    </div>
                </>
            );
        }
        if (['Plats préparés', 'Épicerie', 'Boissons'].includes(categoryName)) {
            return (
                <>
                    <div>
                        <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marque</label>
                        <input type="text" name="brand" id="brand" value={product.brand || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Poids (ex: 500g)</label>
                        <input type="text" name="weight" id="weight" value={product.weight || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date d'expiration</label>
                        <input type="date" name="expirationDate" id="expirationDate" value={product.expirationDate || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </>
            );
        }
        if (['Électronique', 'Électroménager'].includes(categoryName)) {
            return (
                 <>
                    <div>
                       <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marque</label>
                       <input type="text" name="brand" id="brand" value={product.brand || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                       <label htmlFor="modelNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Numéro de modèle</label>
                       <input type="text" name="modelNumber" id="modelNumber" value={product.modelNumber || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div>
                       <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Couleur</label>
                       <input type="text" name="color" id="color" value={product.color || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                       <label htmlFor="warranty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Garantie</label>
                       <input type="text" name="warranty" id="warranty" placeholder="Ex: 1 an" value={product.warranty || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                 </>
            );
        }
        return null;
    }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">{productToEdit ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</h1>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom du produit</label>
                <input type="text" name="name" id="name" value={product.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prix de base (FCFA)</label>
                  <input type="number" name="price" id="price" value={product.price || ''} onChange={handlePriceChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                 <div>
                  <label htmlFor="promotionPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prix promo (optionnel)</label>
                  <input type="number" name="promotionPrice" id="promotionPrice" value={product.promotionPrice || ''} onChange={handlePriceChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                </div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock total</label>
                    <input type="number" name="stock" id="stock" value={product.stock ?? ''} onChange={handleChange} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 ${hasVariants ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`} required readOnly={hasVariants} />
                    {hasVariants && <p className="text-xs text-gray-500 mt-1">Calculé à partir des variantes.</p>}
                  </div>
                  <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Catégorie</label>
                    <select name="categoryId" id="categoryId" value={product.categoryId} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600">
                      <option value="" disabled>-- Sélectionner une sous-catégorie --</option>
                      {categoryTree.map(mainCat => (
                        <optgroup label={mainCat.name} key={mainCat.id}>
                          {mainCat.subCategories.map(subCat => (
                            <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
               </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea name="description" id="description" rows={4} value={product.description} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" required></textarea>
                </div>
            </div>
            
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Images du produit (max 5)</label>
                 <div className="mt-1 grid grid-cols-3 gap-2">
                    {imagePreviews.map((src, index) => (
                        <div key={index} className="relative group">
                            <img src={src} alt={`Aperçu ${index + 1}`} className="h-24 w-full object-cover rounded-md" />
                            <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <XCircleIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {imagePreviews.length < 5 && (
                        <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                            <PhotoIcon className="w-8 h-8 text-gray-400"/>
                            <span className="text-xs text-gray-500">Ajouter</span>
                            <input id="image-upload" name="image-upload" type="file" multiple className="sr-only" onChange={handleImageChange} accept="image/*" />
                        </label>
                    )}
                </div>
            </div>
          </div>

          {/* Variants Section */}
          <div className="pt-6 border-t dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Variantes (Taille, Couleur, etc.)</h2>
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="flex items-end gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium">Type de variante (ex: Taille)</label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={e => handleVariantChange(index, 'name', e.target.value)}
                      className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex-grow">
                    <label className="block text-sm font-medium">Options (séparées par des virgules)</label>
                    <input
                      type="text"
                      value={variant.options.join(', ')}
                      onChange={e => handleVariantChange(index, 'options', e.target.value)}
                      placeholder="S, M, L, XL"
                      className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariantType(index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddVariantType}
              disabled={variants.length >= 3}
              className="mt-4 text-sm font-semibold text-kmer-green hover:underline disabled:text-gray-400 dark:disabled:text-gray-500"
            >
              + Ajouter un type de variante
            </button>
          </div>

          {hasVariants && (
            <div className="pt-6 border-t dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Détails des variantes</h2>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 text-left font-semibold">Variante</th>
                      <th className="p-2 text-left font-semibold w-28">Stock</th>
                      <th className="p-2 text-left font-semibold w-40">Prix (optionnel)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantCombinations.map((combo, index) => (
                      <tr key={index} className="border-b dark:border-gray-700">
                        <td className="p-2 font-medium">{Object.values(combo).join(' / ')}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={getVariantDetailValue(combo, 'stock')}
                            onChange={e => handleVariantDetailChange(combo, 'stock', e.target.value)}
                            className="w-full p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            placeholder={product.price?.toString()}
                            value={getVariantDetailValue(combo, 'price')}
                            onChange={e => handleVariantDetailChange(combo, 'price', e.target.value)}
                            className="w-full p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Category-specific fields */}
          <div className="pt-6 border-t dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Champs Spécifiques</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderCategorySpecificFields()}
              </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-700">
            <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
              Annuler
            </button>
            <button type="button" onClick={() => handleSubmit('draft')} className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600">
              Enregistrer en brouillon
            </button>
            <button type="button" onClick={() => handleSubmit('published')} className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">
              Enregistrer et Publier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;