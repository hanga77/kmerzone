import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// @desc    Generate product description
// @route   POST /api/ai/generate-description
// @access  Private/Seller
const generateDescription = async (req, res, next) => {
    const { productName, keywords, categoryName } = req.body;

    if (!productName || !keywords) {
        res.status(400);
        return next(new Error('Product name and keywords are required'));
    }

    try {
        const prompt = `En tant qu'expert en marketing pour un site e-commerce camerounais nommé KMER ZONE, rédige une description de produit attrayante et vendeuse en français. La description doit être bien structurée, mettre en avant les points forts et inciter à l'achat.

        Informations sur le produit :
        - Nom : ${productName}
        - Catégorie : ${categoryName || 'Générale'}
        - Mots-clés fournis par le vendeur : ${keywords}

        Génère uniquement la description du produit. N'ajoute pas de titre comme "Description :".`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const description = response.text;
        res.json({ description });

    } catch (error) {
        console.error("Error generating description with Gemini API:", error);
        next(new Error('Failed to generate description'));
    }
};

// @desc    Analyze an image and return search keywords
// @route   POST /api/ai/visual-search
// @access  Private
const visualSearch = async (req, res, next) => {
    const { image_base64, mime_type } = req.body;
    if (!image_base64 || !mime_type) {
        res.status(400);
        return next(new Error('Image data and mime type are required.'));
    }

    try {
        const imagePart = {
            inlineData: {
              data: image_base64,
              mimeType: mime_type,
            },
        };

        const prompt = "Décris l'objet principal dans cette image en 3 à 5 mots-clés pertinents pour une recherche e-commerce. Sépare les mots-clés par des virgules. Ne retourne que les mots-clés. Exemple : robe, pagne, élégante, soirée, coton";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
        });

        const keywords = response.text.trim();
        res.json({ keywords });

    } catch (error) {
        console.error("Error with Gemini visual search:", error);
        next(new Error('Failed to analyze image'));
    }
};

export { generateDescription, visualSearch };