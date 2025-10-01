import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { PhotoIcon, SparklesIcon, XIcon } from './Icons';

interface VisualSearchPageProps {
  onSearch: (query: string) => void;
}

const VisualSearchPage: React.FC<VisualSearchPageProps> = ({ onSearch }) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ai = useMemo(() => {
    // Assumer que process.env.API_KEY est disponible dans le contexte d'exécution
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleSearchClick = async () => {
    if (!image) {
      setError("Veuillez d'abord sélectionner une image.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const imagePart = await fileToGenerativePart(image);
      const prompt = "Décris cet objet en 3 à 5 mots-clés pertinents pour une recherche e-commerce. Sépare les mots-clés par des virgules. Ne retourne que les mots-clés. Exemple : robe, pagne, élégante, soirée, coton";
      
      // FIX: Use ai.models.generateContent with the correct model and response parsing.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
      });

      // FIX: Access the 'text' property directly instead of calling it as a function.
      const keywords = response.text.trim();
      if (keywords) {
        onSearch(keywords);
      } else {
        setError("L'IA n'a pas pu identifier d'objets dans l'image. Essayez une autre photo.");
      }
    } catch (err) {
      console.error("Gemini API error:", err);
      setError("Une erreur est survenue lors de l'analyse de l'image. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 flex justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <PhotoIcon className="w-16 h-16 mx-auto text-kmer-green mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Recherche Visuelle</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Trouvez des produits similaires à partir d'une image.</p>
        
        <div className="mt-8">
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="w-full min-h-[200px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              {imagePreview ? (
                <div className="relative">
                    <img src={imagePreview} alt="Aperçu" className="max-h-48 rounded-md" />
                     <button 
                        onClick={(e) => {
                            e.preventDefault();
                            setImage(null);
                            setImagePreview(null);
                        }} 
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
              ) : (
                <>
                  <PhotoIcon className="w-12 h-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cliquez pour téléverser une image</p>
                  <p className="text-xs text-gray-400">PNG, JPG, WEBP</p>
                </>
              )}
            </div>
            <input id="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
          </label>
        </div>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        <button 
          onClick={handleSearchClick}
          disabled={!image || isLoading}
          className="mt-6 w-full bg-kmer-green text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:bg-green-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-wait"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyse en cours...
            </>
          ) : (
            <>
              <SparklesIcon className="w-6 h-6" />
              Rechercher avec l'IA
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VisualSearchPage;