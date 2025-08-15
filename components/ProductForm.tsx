import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Category, Variant, VariantDetail } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PhotoIcon, XCircleIcon, TrashIcon } from './Icons';

interface ProductFormProps {
  onSave: (product: Product) => void;
  onCancel: () => void;
  productToEdit: Product | null;
  categories: Category[];
  onAddCategory: (categoryName: string) => Category;
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

const ProductForm: React.FC<ProductFormProps> = ({ onSave, onCancel, productToEdit, categories, onAddCategory }) => {
  const { user } = useAuth();
  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    promotionPrice: undefined,
    stock: 0,
    category: categories.length > 0 ? categories[0].name : '',
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
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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
    }
  }, [productToEdit]);
  
  // Effect to update total stock from variants
  useEffect(() => {
      if (hasVariants) {
          const totalStock = variantDetails.reduce((sum, detail) => sum + detail.stock, 0);
          setProduct(prev => ({...prev, stock: totalStock }));
      }
  }, [variantDetails, hasVariants]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "category" && value === "add_new") {
        setIsAddingCategory(true);
    } else {
       setProduct(prev => ({ ...prev, [name]: value }));
       if (name === "category") setIsAddingCategory(false);
    }
  };
  
  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
        const newCategory = onAddCategory(newCategoryName.trim());
        setProduct(prev => ({...prev, category: newCategory.name }));
        setNewCategoryName('');
        setIsAddingCategory(false);
    }
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
    if (!product.name || !product.price || product.stock === undefined || !product.imageUrls || product.imageUrls.length === 0) {
        alert("Veuillez remplir tous les champs obligatoires (Nom, Prix, Stock, et au moins une Image).");
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
        category: product.category!,
        description: product.description!,
        imageUrls: product.imageUrls!,
        status: status,
        variants: hasVariants ? variants : undefined,
        variantDetails: hasVariants ? variantDetails : undefined,
    };
    onSave(finalProduct);
  };

    const renderCategorySpecificFields = () => {
        const category = product.category || '';
        if (['Vêtements', 'Chaussures', 'Accessoires'].includes(category)) {
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
        if (category === 'Alimentation alimentaire') {
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
        if (['Électronique', 'Appareils électroménagers'].includes(category)) {
            return (
                 <>
                    <div>
                       <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marque</label>
                       <input type="text" name="brand" id="brand" value={product.brand || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                       <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Poids (ex: 1.2kg)</label>
                       <input type="text" name="weight" id="weight" value={product.weight || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                       <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dimensions (ex: 10x5x3 cm)</label>
                       <input type="text" name="dimensions" id="dimensions" value={product.dimensions || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                       <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">N° de série</label>
                       <input type="text" name="serialNumber" id="serialNumber" value={product.serialNumber || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                 </>
            );
        }
        return null; // No specific fields for other categories
    }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{productToEdit ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</h1>
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
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Catégorie</label>
                    <select name="category" id="category" value={isAddingCategory ? 'add_new' : product.category} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600">
                      <option value="" disabled>-- Sélectionner --</option>
                      {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      <option value="add_new">-- Créer une nouvelle catégorie --</option>
                    </select>
                     {isAddingCategory && (
                        <div className="mt-2 flex gap-2">
                            <input 
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nom de la catégorie"
                                className="block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600"
                            />
                            <button type="button" onClick={handleAddNewCategory} className="bg-kmer-green text-white px-3 rounded-md">Ajouter</button>
                        </div>
                    )}
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
                            <img src={src} alt={`Aperçu ${index+1}`} className="h-24 w-full object-cover rounded-md"/>
                            <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-600/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <XCircleIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    ))}
                 </div>
                 {imagePreviews.length < 5 && (
                    <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                        <div className="space-y-1 text-center">
                            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-kmer-green hover:text-green-700 focus-within:outline-none">
                                    <span>Télécharger des fichiers</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" multiple/>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF jusqu'à 10MB</p>
                        </div>
                    </div>
                 )}
            </div>
          </div>

            <div className="border-t pt-6 mt-6 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Variantes du produit</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ajoutez des options comme la taille ou la couleur. Vous pourrez ensuite définir le stock et le prix pour chaque combinaison.</p>
                <div className="mt-4 space-y-4">
                    {variants.map((variant, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                           <div className="sm:col-span-4">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type de variante (ex: Taille)</label>
                             <input type="text" placeholder="Taille" value={variant.name} onChange={(e) => handleVariantChange(index, 'name', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600"/>
                           </div>
                           <div className="sm:col-span-7">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Options (séparées par une virgule)</label>
                             <input type="text" placeholder="S, M, L, XL" value={variant.options.join(', ')} onChange={(e) => handleVariantChange(index, 'options', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600"/>
                           </div>
                           <div className="sm:col-span-1">
                               <label className="block text-sm font-medium text-transparent">.</label>
                               <button onClick={() => handleRemoveVariantType(index)} className="mt-1 text-red-500 hover:text-red-700 p-2"><TrashIcon className="w-5 h-5"/></button>
                           </div>
                        </div>
                    ))}
                </div>
                {variants.length < 3 && <button type="button" onClick={handleAddVariantType} className="mt-4 text-sm font-semibold text-kmer-green hover:underline">Ajouter un type de variante</button>}
                
                {hasVariants && variantCombinations.length > 0 && (
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-sm">
                           <thead className="text-left bg-gray-50 dark:bg-gray-700">
                               <tr>
                                   {variants.map(v => <th key={v.name} className="px-4 py-2 font-semibold">{v.name}</th>)}
                                   <th className="px-4 py-2 font-semibold">Stock</th>
                                   <th className="px-4 py-2 font-semibold">Prix (FCFA, optionnel)</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y dark:divide-gray-600">
                              {variantCombinations.map((combo, i) => (
                                 <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                     {variants.map(v => <td key={v.name} className="px-4 py-2 font-medium">{combo[v.name]}</td>)}
                                     <td className="px-4 py-2">
                                         <input type="number" value={getVariantDetailValue(combo, 'stock')} onChange={e => handleVariantDetailChange(combo, 'stock', e.target.value)} className="w-20 p-1 border-gray-300 rounded-md shadow-sm dark:bg-gray-600 dark:border-gray-500"/>
                                     </td>
                                     <td className="px-4 py-2">
                                         <input type="number" placeholder={product.price?.toString()} value={getVariantDetailValue(combo, 'price')} onChange={e => handleVariantDetailChange(combo, 'price', e.target.value)} className="w-24 p-1 border-gray-300 rounded-md shadow-sm dark:bg-gray-600 dark:border-gray-500"/>
                                     </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="border-t pt-6 mt-6 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Caractéristiques Détaillées (optionnel)</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Les champs affichés dépendent de la catégorie sélectionnée.</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {renderCategorySpecificFields()}
                 </div>
             </div>

          <div className="pt-5">
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onCancel} className="bg-white dark:bg-gray-700 dark:text-white py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button type="button" onClick={() => handleSubmit('draft')} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                Enregistrer en brouillon
              </button>
              <button type="button" onClick={() => handleSubmit('published')} className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">
                {productToEdit && productToEdit.status === 'published' ? 'Mettre à jour' : 'Sauvegarder et Publier'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;