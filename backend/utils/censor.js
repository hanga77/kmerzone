// Regex for phone numbers (Cameroon and general international)
const phoneRegex = /\b(\+?237\s*)?([6-9])([\s.-]*\d){8}\b|\b(?:\+\d{1,3}\s*)?(?:\d[\s-]*){8,}\d\b/g;

// Regex for email addresses
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export const censorText = (text, storeInfo) => {
    let censoredText = text.replace(phoneRegex, '***NUMÉRO CENSURÉ***');
    censoredText = censoredText.replace(emailRegex, '***EMAIL CENSURÉ***');

    if (storeInfo && storeInfo.physicalAddress && storeInfo.location) {
      // Create a set of unique keywords from the store's location, including neighborhood
      const locationKeywords = new Set([
        ...storeInfo.physicalAddress.toLowerCase().split(/[\s,.-]+/),
        ...(storeInfo.neighborhood ? storeInfo.neighborhood.toLowerCase().split(/[\s,.-]+/) : []),
        ...storeInfo.location.toLowerCase().split(/[\s,.-]+/) // city
      ]);
      
      // Filter out small or common words to avoid false positives
      const commonWords = ['rue', 'de', 'la', 'le', 'et', 'au', 'a', 'des', 'du', 'en', 'face', 'près', 'derrière', 'devant', 'carrefour', 'akwa', 'yaounde', 'douala', 'bonapriso', 'bastos'];
      const significantKeywords = [...locationKeywords].filter(kw => kw.length > 3 && !commonWords.includes(kw));

      if (significantKeywords.length > 0) {
        // Create a regex to find any of these keywords, case-insensitively
        const regex = new RegExp(`\\b(${significantKeywords.join('|')})\\b`, 'gi');
        censoredText = censoredText.replace(regex, '***ADRESSE CENSURÉE***');
      }
    }

    return censoredText;
};
