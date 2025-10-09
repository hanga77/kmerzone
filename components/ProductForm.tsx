import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Category, Variant, VariantDetail, SiteSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PhotoIcon, XCircleIcon, TrashIcon, SparklesIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductFormProps {
  onSave: (product: Product) => void;
  onCancel: () => void;
  productToEdit: Product | null;
  categories: Category[];
  onAddCategory: (categoryName: string) => void;
  siteSettings: SiteSettings;
}

const getCombinations = (variants: Variant[]): Record<string, string>[] => {
  if (variants.length === 0 || variants.some(v => v.options.length === 0)) return [];
  const combinations: Record<string, string>[] = [];
  const recurse = (index: number, currentCombination: Record<string, string>) => {
    if (index === variants.length) {
      combinations.push(currentCombination);
      return;
    }
    const variant = variants[index];
    for (const option of variant.options) {
      recurse(index + 1, { ...currentCombination, [variant.name]: option });
    }
  };
  recurse(0, {});
  return combinations;
};

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    {children}
  </div>
);

const CategorySpecificFields: React.FC<{
  product: Partial<Product>;
  categories: Category[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}> = ({ product, categories, handleChange }) => {
    const selectedCategory = useMemo(() => categories.find(c => c.id === product.categoryId), [product.categoryId, categories]);
    const parentCategory = useMemo(() => {
        if (!selectedCategory) return null;
        return selectedCategory.parentId ? categories.find(c => c.id === selectedCategory.parentId) : selectedCategory;
    }, [selectedCategory, categories]);

    const parentId = parentCategory?.id;

    if (!parentId) return null;

    let fields = null;
    switch (parentId) {
        case 'cat-vetements':
            fields = (
                <>
                    <FieldWrapper label="Matière (coton, polyester...)">
                        <input type="text" name="material" value={product.material || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                    <FieldWrapper label="Genre">
                        <select name="gender" value={product.gender || 'Unisexe'} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600">
                            <option value="Unisexe">Unisexe</option>
                            <option value="Homme">Homme</option>
                            <option value="Femme">Femme</option>
                            <option value="Enfant">Enfant</option>
                        </select>
                    </FieldWrapper>
                </>
            );
            break;
        case 'cat-electronique':
        case 'cat-electronique-grand-public':
             fields = (
                <>
                    <FieldWrapper label="Marque">
                        <input type="text" name="brand" value={product.brand || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                     <FieldWrapper label="Modèle / Référence">
                        <input type="text" name="modelNumber" value={product.modelNumber || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                     <FieldWrapper label="Système d’exploitation">
                        <input type="text" name="operatingSystem" value={product.operatingSystem || ''} placeholder="Android, iOS, Windows..." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                     <FieldWrapper label="Garantie (durée, conditions)">
                        <input type="text" name="warranty" value={product.warranty || ''} placeholder="Ex: 1 an" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                    <FieldWrapper label="Accessoires inclus">
                        <input type="text" name="accessories" value={product.accessories || ''} placeholder="Chargeur, écouteurs..." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                </>
            );
            break;
        case 'cat-textile':
            // Dirty hack because the food items are in this category
            if (product.categoryId === 'sub-autres-textiles') { 
                fields = (
                    <>
                        <FieldWrapper label="Poids / Volume (ex: 1kg, 500ml)">
                             <input type="text" name="weight" value={product.weight || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                        </FieldWrapper>
                        <FieldWrapper label="Date de péremption">
                             <input type="date" name="expirationDate" value={product.expirationDate || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                        </FieldWrapper>
                        <FieldWrapper label="Ingrédients (séparés par des virgules)">
                            <input type="text" name="ingredients" value={product.ingredients || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                        </FieldWrapper>
                        <FieldWrapper label="Allergènes (séparés par des virgules)">
                            <input type="text" name="allergens" value={product.allergens || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                        </FieldWrapper>
                        <FieldWrapper label="Mode de conservation">
                             <input type="text" name="storageInstructions" placeholder="Frais, congelé, ambiant" value={product.storageInstructions || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                        </FieldWrapper>
                        <FieldWrapper label="Origine (pays/région)">
                            <input type="text" name="origin" value={product.origin || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                        </FieldWrapper>
                    </>
                );
            }
            break;
        case 'cat-mobilier':
        case 'cat-jardin':
            fields = (
                 <>
                    <FieldWrapper label="Dimensions (LxlxH cm)">
                         <input type="text" name="dimensions" value={product.dimensions || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                     <FieldWrapper label="Poids (ex: 15kg)">
                         <input type="text" name="weight" value={product.weight || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                     <FieldWrapper label="Matière (bois, métal...)">
                        <input type="text" name="material" value={product.material || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                     <FieldWrapper label="Couleur principale">
                        <input type="text" name="color" value={product.color || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                    <FieldWrapper label="Instructions de montage">
                        <input type="text" name="assemblyInstructions" placeholder="Oui, manuel PDF inclus" value={product.assemblyInstructions || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                </>
            );
            break;
        case 'cat-beaute':
            fields = (
                 <>
                    <FieldWrapper label="Marque">
                        <input type="text" name="brand" value={product.brand || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                    <FieldWrapper label="Type de produit">
                        <input type="text" name="productType" placeholder="Maquillage, soin, parfum..." value={product.productType || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                    <FieldWrapper label="Contenance (ml, g...)">
                        <input type="text" name="volume" value={product.volume || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                     <FieldWrapper label="Ingrédients (séparés par des virgules)">
                        <input type="text" name="ingredients" value={product.ingredients || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                    <FieldWrapper label="Convient pour (type de peau)">
                        <input type="text" name="skinType" placeholder="Peau grasse, sèche, mixte..." value={product.skinType || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                     <FieldWrapper label="Date d'expiration">
                         <input type="date" name="expirationDate" value={product.expirationDate || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </FieldWrapper>
                </>
            );
            break;
    }

    if (!fields) return null;

    return (
        <div className="pt-6 border-t dark:border-gray-700 col-span-1 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Caractéristiques Spécifiques à la Catégorie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields}
            </div>
        </div>
    );
};


const ProductForm: React.FC<ProductFormProps> = ({ onSave, onCancel, productToEdit, categories, onAddCategory, siteSettings }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    promotionPrice: undefined,
    stock: 0,
    categoryId: '',
    description: '',
    imageUrls: [],
    status: 'draft',
    sku: '',
    type: 'product',
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);
  
  const categoryTree = useMemo(() => {
    const mainCategories = categories.filter(c => !c.parentId);
    return mainCategories.map(mainCat => ({
        ...mainCat,
        subCategories: categories.filter(c => c.parentId === mainCat.id)
    }));
  }, [categories]);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantDetails, setVariantDetails] = useState<VariantDetail[]>([]);
  const variantCombinations = useMemo(() => getCombinations(variants), [variants]);
  const hasVariants = variants.length > 0 && variants.every(v => v.name && v.options.length > 0);

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        ...productToEdit,
        type: productToEdit.type || 'product',
        productionDate: productToEdit.productionDate ? productToEdit.productionDate.split('T')[0] : '',
        expirationDate: productToEdit.expirationDate ? productToEdit.expirationDate.split('T')[0] : '',
      });
      setImagePreviews(productToEdit.imageUrls);
      setVariants(productToEdit.variants || []);
      setVariantDetails(productToEdit.variantDetails || []);
    } else if (categoryTree.length > 0 && categoryTree[0].subCategories.length > 0) {
      setProduct(prev => ({ ...prev, categoryId: categoryTree[0].subCategories[0].id }));
    }
  }, [productToEdit, categoryTree]);
  
  useEffect(() => {
      if (hasVariants && product.type !== 'service') {
          const totalStock = variantDetails.reduce((sum, detail) => sum + detail.stock, 0);
          setProduct(prev => ({...prev, stock: totalStock }));
      }
  }, [variantDetails, hasVariants, product.type]);

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
      if (files.length + imagePreviews.length > 5) {
        alert("Vous ne pouvez télécharger que 5 images au maximum.");
        return;
      }
      
      files.forEach((file: Blob) => {
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

  const handleImageUrlAdd = () => {
    if (!imageUrlInput.trim()) return;
    try {
        new URL(imageUrlInput); // Basic URL validation
    } catch (_) {
        alert("Veuillez entrer une URL valide.");
        return;
    }
    if (imagePreviews.length >= 5) {
        alert("Vous ne pouvez avoir que 5 images au maximum.");
        return;
    }
    
    setImagePreviews(prev => [...prev, imageUrlInput]);
    setProduct(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), imageUrlInput] }));
    setImageUrlInput('');
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
            if (field === 'name') return { ...variant, name: value };
            if (field === 'options') return { ...variant, options: value.split(',').map(opt => opt.trim()).filter(Boolean) };
        }
        return variant;
    }));
  };

  const handleVariantDetailChange = (combination: Record<string, string>, field: 'stock' | 'price', value: string) => {
      const numValue = parseFloat(value);
      setVariantDetails(prev => {
          const existingDetailIndex = prev.findIndex(d => JSON.stringify(d.options) === JSON.stringify(combination));
          if (existingDetailIndex > -1) {
              const newDetails = [...prev];
              newDetails[existingDetailIndex] = { ...newDetails[existingDetailIndex], [field]: isNaN(numValue) ? (field === 'price' ? undefined : 0) : numValue };
              return newDetails;
          } else {
               const newDetail: VariantDetail = { options: combination, stock: field === 'stock' ? (isNaN(numValue) ? 0 : numValue) : 0, price: field === 'price' ? (isNaN(numValue) ? undefined : numValue) : undefined };
               return [...prev, newDetail];
          }
      });
  };

  const getVariantDetailValue = (combination: Record<string, string>, field: 'stock' | 'price') => {
      const detail = variantDetails.find(d => JSON.stringify(d.options) === JSON.stringify(combination));
      return detail?.[field] ?? '';
  };

  const handleGenerateDescription = async () => {
    if (!keywords.trim()) {
        alert("Veuillez entrer des mots-clés.");
        return;
    }
    setIsGenerating(true);
    try {
        const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'générale';
        const prompt = `En tant qu'expert en marketing pour un site e-commerce camerounais, rédige une description de produit attrayante et vendeuse en français. La description doit être bien structurée, mettre en avant les points forts et inciter à l'achat.

        Informations sur le produit :
        - Nom : ${product.name || 'Produit'}
        - Catégorie : ${categoryName}
        - Mots-clés fournis par le vendeur : ${keywords}

        Génère uniquement la description du produit.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const description = response.text;
        setProduct(prev => ({ ...prev, description }));
    } catch (error) {
        console.error("Error generating description:", error);
        alert("Une erreur est survenue lors de la génération de la description.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = (status: 'published' | 'draft' | 'archived') => {
    let finalProductData = { ...product };
    
    if (finalProductData.type === 'service') {
        finalProductData.stock = 1; // Services are generally available
        finalProductData.variants = undefined;
        finalProductData.variantDetails = undefined;
        finalProductData.weight = undefined;
        finalProductData.dimensions = undefined;
    } else {
        finalProductData.type = 'product'; // ensure default
        finalProductData.duration = undefined;
        finalProductData.locationType = undefined;
        finalProductData.serviceArea = undefined;
        finalProductData.availability = undefined;
    }

    if (!user?.shopName || !finalProductData.name || !finalProductData.price || finalProductData.stock === undefined || !finalProductData.imageUrls || finalProductData.imageUrls.length === 0 || !finalProductData.categoryId) {
        alert("Veuillez remplir tous les champs obligatoires (Type, Nom, Prix, Catégorie et au moins une Image). Le stock est aussi requis pour les produits physiques.");
        return;
    }
    
    const finalProduct: Product = {
        id: productToEdit ? productToEdit.id : new Date().getTime().toString(),
        vendor: user.shopName,
        reviews: productToEdit ? productToEdit.reviews : [],
        ...finalProductData,
        name: finalProductData.name!, 
        price: finalProductData.price!, 
        stock: finalProductData.stock!, 
        categoryId: finalProductData.categoryId!, 
        description: finalProductData.description!, 
        imageUrls: finalProductData.imageUrls!, 
        status: status,
    };
    onSave(finalProduct);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">{productToEdit ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</h1>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <h2 className="text-xl font-semibold -mb-2 dark:text-white">Informations Générales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-gray-700">
                <div className="space-y-6">
                    <FieldWrapper label="Type d'article">
                         <div className="flex rounded-md shadow-sm mt-1">
                            <button type="button" onClick={() => setProduct(p => ({...p, type: 'product'}))} className={`px-4 py-2 block w-full text-sm font-medium rounded-l-md ${product.type !== 'service' ? 'bg-kmer-green text-white z-10 ring-2 ring-kmer-green' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50'}`}>Produit Physique</button>
                            <button type="button" onClick={() => setProduct(p => ({...p, type: 'service'}))} className={`px-4 py-2 block w-full text-sm font-medium rounded-r-md -ml-px ${product.type === 'service' ? 'bg-kmer-green text-white z-10 ring-2 ring-kmer-green' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50'}`}>Service</button>
                        </div>
                    </FieldWrapper>

                    <FieldWrapper label="Nom du produit/service">
                        <input type="text" name="name" id="name" value={product.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" required />
                    </FieldWrapper>
                    <div className="grid grid-cols-2 gap-4">
                        <FieldWrapper label="Prix de base (FCFA)">
                          <input type="number" name="price" id="price" value={product.price || ''} onChange={handlePriceChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" required />
                        </FieldWrapper>
                         <FieldWrapper label="Prix promo (optionnel)">
                          <input type="number" name="promotionPrice" id="promotionPrice" value={product.promotionPrice || ''} onChange={handlePriceChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                        </FieldWrapper>
                    </div>
                    {product.type !== 'service' && (
                        <div className="grid grid-cols-2 gap-4">
                            <FieldWrapper label="Stock total">
                                <input type="number" name="stock" id="stock" value={product.stock ?? ''} onChange={handleChange} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 ${hasVariants ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`} required readOnly={hasVariants} />
                                {hasVariants && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Calculé à partir des variantes.</p>}
                            </FieldWrapper>
                            <FieldWrapper label="SKU (Réf. article)">
                              <input type="text" name="sku" id="sku" value={product.sku || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                            </FieldWrapper>
                        </div>
                    )}
                     <FieldWrapper label="Catégorie">
                        <select name="categoryId" id="categoryId" value={product.categoryId} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600">
                            <option value="" disabled>{t('productForm.selectSubcategory')}</option>
                            {categoryTree.map(mainCat => (
                                <optgroup label={t(mainCat.name)} key={mainCat.id}>
                                {mainCat.subCategories.map(subCat => (
                                    <option key={subCat.id} value={subCat.id}>{t(subCat.name)}</option>
                                ))}
                                </optgroup>
                            ))}
                        </select>
                    </FieldWrapper>
                    <FieldWrapper label="Description">
                        <div className="flex items-center gap-2 mb-2">
                            <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Mots-clés (robe, pagne, soirée...)" className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="flex items-center gap-2 bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 disabled:bg-purple-300">
                                <SparklesIcon className="w-5 h-5"/>
                                {isGenerating ? 'Génération...' : "Générer avec l'IA"}
                            </button>
                        </div>
                        <textarea name="description" id="description" rows={6} value={product.description} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" required placeholder="Décrivez votre produit ici ou générez une description avec l'IA."></textarea>
                    </FieldWrapper>
                </div>
                <FieldWrapper label="Images du produit (max 5)">
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
                                <span className="text-xs text-gray-500 dark:text-gray-400">Téléverser</span>
                                <input id="image-upload" name="image-upload" type="file" multiple className="sr-only" onChange={handleImageChange} accept="image/*" />
                            </label>
                        )}
                    </div>
                    {imagePreviews.length < 5 && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ou ajouter depuis une URL</label>
                            <div className="flex gap-2 mt-1">
                                <input
                                    type="url"
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleImageUrlAdd(); } }}
                                    placeholder="https://exemple.com/image.jpg"
                                    className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                />
                                <button
                                    type="button"
                                    onClick={handleImageUrlAdd}
                                    className="bg-gray-200 dark:bg-gray-600 font-semibold px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    )}
                </FieldWrapper>

                {product.type !== 'service' && (
                    <CategorySpecificFields product={product} categories={categories} handleChange={handleChange} />
                )}
                
                {product.type === 'service' && (
                    <div className="pt-6 border-t dark:border-gray-700 col-span-1 md:col-span-2">
                        <h2 className="text-xl font-semibold mb-4 dark:text-white">Détails du Service</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldWrapper label="Durée (ex: 1 heure, par session)"><input type="text" name="duration" value={product.duration || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></FieldWrapper>
                            <FieldWrapper label="Type de lieu"><select name="locationType" value={product.locationType || 'flexible'} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="remote">À distance</option><option value="on-site">Sur site</option><option value="flexible">Flexible</option></select></FieldWrapper>
                            <FieldWrapper label="Zone de service (ex: Douala uniquement)"><input type="text" name="serviceArea" value={product.serviceArea || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></FieldWrapper>
                            <FieldWrapper label="Disponibilité (ex: Lun-Ven, 9h-17h)"><input type="text" name="availability" value={product.availability || ''} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></FieldWrapper>
                        </div>
                    </div>
                )}
            </div>

          {product.type !== 'service' && (
            <div className="pt-6 border-t dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Variantes (Taille, Couleur, etc.)</h2>
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index} className="flex items-end gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <div className="flex-grow"><FieldWrapper label="Type de variante (ex: Taille)"><input type="text" value={variant.name} onChange={e => handleVariantChange(index, 'name', e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/></FieldWrapper></div>
                    <div className="flex-grow"><FieldWrapper label="Options (séparées par des virgules)"><input type="text" value={variant.options.join(', ')} onChange={e => handleVariantChange(index, 'options', e.target.value)} placeholder="S, M, L, XL" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/></FieldWrapper></div>
                    <button type="button" onClick={() => handleRemoveVariantType(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleAddVariantType} disabled={variants.length >= 3} className="mt-4 text-sm font-semibold text-kmer-green hover:underline disabled:text-gray-400 dark:disabled:text-gray-500">+ Ajouter un type de variante</button>
            </div>
          )}

          {hasVariants && product.type !== 'service' && (
            <div className="pt-6 border-t dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Détails des variantes</h2>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm"><thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-2 text-left font-semibold dark:text-gray-200">Variante</th><th className="p-2 text-left font-semibold w-28 dark:text-gray-200">Stock</th><th className="p-2 text-left font-semibold w-40 dark:text-gray-200">Prix (optionnel)</th></tr></thead>
                  <tbody>
                    {variantCombinations.map((combo, index) => (
                      <tr key={index} className="border-b dark:border-gray-700">
                        <td className="p-2 font-medium dark:text-gray-300">{Object.values(combo).join(' / ')}</td>
                        <td className="p-2"><input type="number" value={getVariantDetailValue(combo, 'stock')} onChange={e => handleVariantDetailChange(combo, 'stock', e.target.value)} className="w-full p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500"/></td>
                        <td className="p-2"><input type="number" placeholder={product.price?.toString()} value={getVariantDetailValue(combo, 'price')} onChange={e => handleVariantDetailChange(combo, 'price', e.target.value)} className="w-full p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500"/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-700">
            <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Annuler</button>
            <button type="button" onClick={() => handleSubmit('draft')} className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600">Enregistrer en brouillon</button>
            <button type="button" onClick={() => handleSubmit('published')} className="bg-kmer-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">Enregistrer et Publier</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;