import type { Category, Product, Order, Store, FlashSale, PickupPoint, SiteSettings, SiteContent, Advertisement, PaymentMethod, ShippingPartner, SiteActivityLog, Zone, EmailTemplate } from './types';

export const initialZones: Zone[] = [
    { id: 'zone-dla-a', name: 'Zone A', city: 'Douala' },
    { id: 'zone-dla-b', name: 'Zone B', city: 'Douala' },
    { id: 'zone-yde-a', name: 'Zone A', city: 'Yaoundé' },
    { id: 'zone-yde-b', name: 'Zone B', city: 'Yaoundé' },
];

export const initialCategories: Category[] = [
    // Main Categories
    { id: 'cat-vetements', name: 'categories.clothingShoes', imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop' },
    { id: 'cat-accessoires', name: 'categories.accessoriesJewelry', imageUrl: 'https://images.unsplash.com/photo-1611652022417-a551155e9984?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-beaute', name: 'categories.beauty', imageUrl: 'https://images.unsplash.com/photo-1596422221063-654854db2583?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-mobilier', name: 'categories.furniture', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop' },
    { id: 'cat-electronique', name: 'categories.electronics', imageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=1925&auto=format&fit=crop' },
    { id: 'cat-textile', name: 'categories.homeTextiles', imageUrl: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-bureau', name: 'categories.officeSupplies', imageUrl: 'https://images.unsplash.com/photo-1456735185569-8a8b122b1236?q=80&w=2068&auto=format&fit=crop' },
    { id: 'cat-animaux', name: 'categories.petProducts', imageUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-loisirs', name: 'categories.hobbiesCreativity', imageUrl: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?q=80&w=1974&auto=format&fit=crop' },
    { id: 'cat-jardin', name: 'categories.homeGarden', imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1925&auto=format&fit=crop' },
    { id: 'cat-electronique-grand-public', name: 'categories.consumerElectronics', imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f82acb?q=80&w=2070&auto=format&fit=crop' },
    { id: 'cat-enfants', name: 'categories.kidsSchool', imageUrl: 'https://images.unsplash.com/photo-1518498391512-42f5b89a81c1?q=80&w=2070&auto=format&fit=crop' },

    // Sub-categories
    { id: 'sub-vetements', parentId: 'cat-vetements', name: 'categories.clothing', imageUrl: 'https://images.unsplash.com/photo-1612053648936-285a2b342c8d?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-chaussures', parentId: 'cat-vetements', name: 'categories.shoes', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-sacs', parentId: 'cat-accessoires', name: 'categories.bags', imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1935&auto=format&fit=crop' },
    { id: 'sub-montres', parentId: 'cat-accessoires', name: 'categories.watches', imageUrl: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-lunettes', parentId: 'cat-accessoires', name: 'categories.glasses', imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1780&auto=format&fit=crop' },
    { id: 'sub-bijoux', parentId: 'cat-accessoires', name: 'categories.jewelry', imageUrl: 'https://images.unsplash.com/photo-1611591437281-462bf4d3ab45?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-accessoires-cheveux', parentId: 'cat-accessoires', name: 'categories.hairAccessories', imageUrl: 'https://images.unsplash.com/photo-1599386348459-717a6a70a040?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-cosmetiques', parentId: 'cat-beaute', name: 'categories.cosmetics', imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90137ba0a43?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-parfums', parentId: 'cat-beaute', name: 'categories.perfumes', imageUrl: 'https://images.unsplash.com/photo-1585399009939-f4639a4f78d1?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-chaises', parentId: 'cat-mobilier', name: 'categories.chairs', imageUrl: 'https://images.unsplash.com/photo-1561582299-a403c00a0063?q=80&w=1964&auto=format&fit=crop' },
    { id: 'sub-autres-meubles', parentId: 'cat-mobilier', name: 'categories.otherFurniture', imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=2160&auto=format&fit=crop' },
    { id: 'sub-chargeurs-cables-batteries', parentId: 'cat-electronique', name: 'categories.chargersCablesBatteries', imageUrl: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-rideaux', parentId: 'cat-textile', name: 'categories.curtains', imageUrl: 'https://images.unsplash.com/photo-1605334182479-54a4347781c7?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-autres-textiles', parentId: 'cat-textile', name: 'categories.otherHomeTextiles', imageUrl: 'https://images.unsplash.com/photo-1617325247854-dce5e6a83607?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-papeterie', parentId: 'cat-bureau', name: 'categories.stationery', imageUrl: 'https://images.unsplash.com/photo-1600869158702-818a7c168305?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-office-goods', parentId: 'cat-bureau', name: 'categories.officeGoods', imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-accessoires-animaux', parentId: 'cat-animaux', name: 'categories.petAccessories', imageUrl: 'https://images.unsplash.com/photo-1598808520297-8c24c7f76d23?q=80&w=2071&auto=format&fit=crop' },
    { id: 'sub-artisanat-jeux', parentId: 'cat-loisirs', name: 'categories.hobbiesCraftsGames', imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop' },
    { id: 'sub-decoration', parentId: 'cat-jardin', name: 'categories.homeDecorLighting', imageUrl: 'https://images.unsplash.com/photo-1534349762230-e08968f43152?q=80&w=1974&auto=format&fit=crop' },
    { id: 'sub-telephones-casques', parentId: 'cat-electronique-grand-public', name: 'categories.phonesHeadphonesAppliances', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1780&auto=format&fit=crop' },
    { id: 'sub-jouets-fournitures', parentId: 'cat-enfants', name: 'categories.toysSchoolSupplies', imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=2070&auto=format&fit=crop' },
];

export const initialProducts: Product[] = [
    { id: '1', name: 'Ndolé Royal', price: 3500, promotionPrice: 3000, imageUrls: ['https://images.unsplash.com/photo-1604329352680-e4a2896d8c22?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Le plat national du Cameroun, un délicieux mélange de légumes, d'arachides et de viande ou de poisson.", reviews: [{author: "Jean P.", rating: 5, comment: "Incroyable !", date: "2023-10-10", status: 'approved'}], stock: 15, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '2', name: 'Robe en Tissu Pagne', price: 15000, imageUrls: ['https://images.unsplash.com/photo-1617051395299-52d33b7336b1?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Une robe élégante confectionnée à la main avec du tissu pagne de haute qualité.", reviews: [{author: "Aïcha B.", rating: 4, comment: "Très belles couleurs.", date: "2023-10-11", status: 'approved'}], stock: 8, categoryId: 'sub-vetements', status: 'published', brand: 'Kmer Fashion' },
    { id: '3', name: 'Savon Artisanal à l\'huile d\'olive', price: 1500, imageUrls: ['https://images.unsplash.com/photo-1600966492337-1d83c4bee955?q=80&w=2070&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Un savon artisanal fabriqué localement. Doux pour la peau et respectueux de l'environnement.", reviews: [], stock: 50, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '4', name: 'Smartphone Pro Max', price: 75000, promotionPrice: 69900, imageUrls: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1965&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un smartphone performant avec un excellent rapport qualité-prix. Grand écran et bonne autonomie.", reviews: [{author: "Eric K.", rating: 5, comment: "Super téléphone pour le prix.", date: "2023-10-12", status: 'approved'}], stock: 4, categoryId: 'sub-telephones-casques', status: 'published', promotionStartDate: '2024-07-01', promotionEndDate: '2024-07-31', brand: 'TechPro' },
    { id: '5', name: 'Miel d\'Oku', price: 5000, imageUrls: ['https://images.unsplash.com/photo-1558642754-b27b3b95a8a9?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Un miel blanc rare et primé, récolté sur les flancs du mont Oku.", reviews: [{author: "Fatima G.", rating: 5, comment: "Le meilleur miel que j'ai jamais goûté.", date: "2023-10-13", status: 'approved'}], stock: 25, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '6', name: 'Sandales en cuir', price: 8000, imageUrls: ['https://images.unsplash.com/photo-1620652755231-c2f8b16a2b8e?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Sandales en cuir véritable, faites à la main. Confortables et durables.", reviews: [], stock: 10, categoryId: 'sub-chaussures', status: 'draft', brand: 'Kmer Fashion' },
    { id: '7', name: 'Poulet DG', price: 6500, imageUrls: ['https://images.unsplash.com/photo-1543339308-43e59d6b70a6?q=80&w=2070&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Un plat de fête succulent avec du poulet frit, des plantains et une sauce riche en légumes.", reviews: [], stock: 12, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '8', name: 'Jus de Bissap Naturel', price: 1000, imageUrls: ['https://images.unsplash.com/photo-1623341214825-9f4f96d62c54?q=80&w=1974&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Boisson rafraîchissante et naturelle à base de fleurs d'hibiscus.", reviews: [], stock: 30, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '9', name: 'Beignets Haricots Bouillie', price: 1500, imageUrls: ['https://img.cuisineaz.com/660x660/2022/01/24/i181710-beignets-souffles-camerounais.jpeg'], vendor: 'Mama Africa', description: "Le petit-déjeuner camerounais par excellence. Des beignets soufflés accompagnés d'une purée de haricots.", reviews: [], stock: 20, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '10', name: 'Chemise en Toghu', price: 25000, imageUrls: ['https://i.pinimg.com/564x/a0/0c/37/a00c3755255673a5a415958253a5f82c.jpg'], vendor: 'Kmer Fashion', description: "Chemise de cérémonie pour homme, en velours noir brodé avec les motifs colorés traditionnels du Toghu.", reviews: [], stock: 5, categoryId: 'sub-vetements', status: 'published', brand: 'Kmer Fashion' },
    { id: '11', name: 'Poivre de Penja', price: 4500, imageUrls: ['https://images.unsplash.com/photo-1508616258423-f3e4e73b29b4?q=80&w=1935&auto=format&fit=crop'], vendor: 'Mama Africa', description: "Considéré comme l'un des meilleurs poivres au monde, cultivé sur les terres volcaniques de Penja.", reviews: [], stock: 40, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '12', name: 'Sac à main en pagne', price: 12000, imageUrls: ['https://images.unsplash.com/photo-1566150905458-1bf1f2961239?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Accessoirisez votre tenue avec ce magnifique sac à main fait main, alliant cuir et tissu pagne.", reviews: [], stock: 15, categoryId: 'sub-sacs', status: 'published', brand: 'Kmer Fashion' },
    { id: '13', name: 'Téléviseur LED 32"', price: 85000, imageUrls: ['https://images.unsplash.com/photo-1593359677879-a4bb92f82acb?q=80&w=2070&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un téléviseur LED de 32 pouces avec une image de haute qualité.", reviews: [], stock: 9, categoryId: 'sub-telephones-casques', status: 'published', brand: 'ViewSonic' },
    { id: '14', name: 'Fer à repasser', price: 7500, imageUrls: ['https://images.unsplash.com/photo-1622629734636-95a239552382?q=80&w=1932&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Simple, efficace et durable. Ce fer à repasser est parfait pour un usage quotidien.", reviews: [], stock: 25, categoryId: 'sub-telephones-casques', status: 'published', brand: 'Generic' },
    { id: '15', name: 'Blender / Mixeur', price: 18000, imageUrls: ['https://images.unsplash.com/photo-1582142391035-61f20a003881?q=80&w=1974&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un mixeur puissant pour préparer vos jus, soupes et sauces. Bol en verre robuste de 1.5L.", reviews: [], stock: 18, categoryId: 'sub-telephones-casques', status: 'published', brand: 'MixWell' },
    { id: '16', name: 'Savon noir gommant', price: 2500, imageUrls: ['https://images.unsplash.com/photo-1623461624469-8a964343169f?q=80&w=1974&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Savon noir africain pour un gommage naturel et une peau douce et purifiée.", reviews: [], stock: 40, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '17', name: 'Huile de coco vierge', price: 4000, imageUrls: ['https://images.unsplash.com/photo-1590945259635-e1a532ac9695?q=80&w=1974&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Huile de coco 100% pure et pressée à froid. Idéale pour la peau, les cheveux et la cuisson.", reviews: [], stock: 30, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '18', name: 'Beurre de karité', price: 3000, imageUrls: ['https://images.unsplash.com/photo-1554153041-33924bb6aa67?q=80&w=2070&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Beurre de karité brut et non raffiné, parfait pour hydrater en profondeur la peau et les cheveux secs.", reviews: [], stock: 60, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '19', name: 'Baskets de Ville', price: 22000, imageUrls: ['https://images.unsplash.com/photo-1515955656352-a1fa3ffcdda9?q=80&w=2070&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Baskets confortables et stylées pour un usage quotidien.", reviews: [], stock: 20, categoryId: 'sub-chaussures', status: 'published', brand: 'CityWalkers' },
    { id: '20', name: 'Eau de Parfum "Sawa"', price: 28000, imageUrls: ['https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1904&auto=format&fit=crop'], vendor: 'Douala Soaps', description: "Un parfum boisé et épicé pour homme, inspiré par la côte camerounaise.", reviews: [], stock: 15, categoryId: 'sub-parfums', status: 'published', brand: 'Douala Soaps' },
    { id: '21', name: 'Fauteuil en Rotin', price: 45000, imageUrls: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1965&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Fauteuil artisanal en rotin, parfait pour votre salon ou votre terrasse.", reviews: [], stock: 5, categoryId: 'sub-chaises', status: 'published', brand: 'HomeDecor' },
    { id: '22', name: 'Masque décoratif Fang', price: 18000, imageUrls: ['https://images.unsplash.com/photo-1513480749022-2f7a0b1e4a1a?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Authentique masque décoratif de l'ethnie Fang, sculpté à la main.", reviews: [], stock: 10, categoryId: 'sub-decoration', status: 'published', brand: 'Artisanat Local' },
    { id: '23', name: 'Lampe de chevet "Wouri"', price: 13500, imageUrls: ['https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=1974&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Lampe de chevet au design moderne avec une base en bois local.", reviews: [], stock: 22, categoryId: 'sub-decoration', status: 'published', brand: 'HomeDecor' },
    { id: '24', name: 'Collier de perles', price: 9500, imageUrls: ['https://images.unsplash.com/photo-1599643477877-539eb8a52f18?q=80&w=1974&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Collier artisanal fait de perles traditionnelles colorées.", reviews: [], stock: 30, categoryId: 'sub-bijoux', status: 'published', brand: 'Artisanat Local' },
    { id: '25', name: 'Montre Classique Homme', price: 32000, imageUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Montre élégante avec bracelet en cuir, idéale pour le bureau ou les sorties.", reviews: [], stock: 12, categoryId: 'sub-montres', status: 'published', brand: 'TimeMaster' },
    { id: '26', name: 'Poupée "Penda"', price: 7000, imageUrls: ['https://images.unsplash.com/photo-1620243423599-da1c88a51e6c?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kmer Fashion', description: "Poupée en tissu pagne, faite à la main, pour le bonheur des plus petits.", reviews: [], stock: 25, categoryId: 'sub-jouets-fournitures', status: 'published', brand: 'Artisanat Local' },
    { id: '27', name: 'Lot de 10 Cahiers', price: 2500, imageUrls: ['https://images.unsplash.com/photo-1529142893173-665a0a1027c4?q=80&w=2070&auto=format&fit=crop'], vendor: 'Electro Plus', description: "Un lot de 10 cahiers de 100 pages pour la rentrée scolaire.", reviews: [], stock: 100, categoryId: 'sub-papeterie', status: 'published', brand: 'School Essentials' },
    { id: '28', name: 'Bière "33" Export (Pack de 6)', price: 4000, imageUrls: ['https://www.bebe-cash.com/wp-content/uploads/2021/07/33-export.jpg'], vendor: 'Mama Africa', description: "La bière blonde de référence au Cameroun. Pack de 6 bouteilles de 65cl.", reviews: [], stock: 50, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '29', name: 'Café Arabica en Grains', price: 6000, imageUrls: ['https://images.unsplash.com/photo-1559449272-4d24b2f27b72?q=80&w=1974&auto=format&fit=crop'], vendor: 'Bafoussam Brews', description: "Café Arabica de l'Ouest Cameroun, torréfaction artisanale. Sachet de 500g.", reviews: [], stock: 30, categoryId: 'sub-autres-textiles', status: 'published', brand: 'Bafoussam Brews' },
    { id: '30', name: 'Statuette en bois d\'ébène', price: 22000, imageUrls: ['https://i.pinimg.com/564x/7d/50/e0/7d50e0529d1ccf1b36952d76d4a52efc.jpg'], vendor: 'Limbe Arts & Crafts', description: "Statuette finement sculptée à la main par des artisans de la région du Sud-Ouest.", reviews: [], stock: 8, categoryId: 'sub-decoration', status: 'published', brand: 'Limbe Arts & Crafts' },
    { id: '31', name: 'Tableau d\'art contemporain', price: 48000, imageUrls: ['https://i.pinimg.com/564x/e7/7d/1f/e77d1f6d396a84c25f573453347f31b2.jpg'], vendor: 'Limbe Arts & Crafts', description: "Peinture sur toile vibrante, représentant une scène de marché local.", reviews: [], stock: 3, categoryId: 'sub-decoration', status: 'published', brand: 'Limbe Arts & Crafts' },
    { id: '32', name: 'Écouteurs sans fil', price: 12500, imageUrls: ['https://images.unsplash.com/photo-1606220588913-b35474623dc5?q=80&w=1964&auto=format&fit=crop'], vendor: 'Kribi Digital', description: "Écouteurs Bluetooth avec une bonne autonomie et un son clair. Idéal pour la musique et les appels.", reviews: [], stock: 25, categoryId: 'sub-chargeurs-cables-batteries', status: 'draft' }, // In draft, store is pending
    { id: '33', name: 'Café Robusta Moulu', price: 4500, imageUrls: ['https://images.unsplash.com/photo-1611162458022-20c24b071a2a?q=80&w=2070&auto=format&fit=crop'], vendor: 'Bafoussam Brews', description: "Café Robusta puissant et aromatique, parfait pour un expresso corsé. Sachet de 500g.", reviews: [], stock: 40, categoryId: 'sub-autres-textiles', status: 'published', brand: 'Bafoussam Brews' },
];

export const sampleDeliveredOrder: Order = {
    id: 'ORDER-SAMPLE-1',
    userId: 'customer-1', 
    items: [
        { ...initialProducts.find(p => p.id === '1')!, quantity: 1 }, 
        { ...initialProducts.find(p => p.id === '5')!, quantity: 2 } 
    ],
    subtotal: 13000, 
    deliveryFee: 1000,
    total: 14000,
    shippingAddress: { fullName: 'Client de Test', phone: '655555555', address: '123 Rue du Test', city: 'Yaoundé', latitude: 3.8480, longitude: 11.5021 },
    deliveryMethod: 'home-delivery',
    orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
    trackingNumber: 'KZSAMPLE1',
    agentId: 'agent-1',
    trackingHistory: [
        { status: 'confirmed', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), location: 'Mama Africa', details: 'Commande confirmée' },
        { status: 'picked-up', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), location: 'Livreur', details: 'Colis pris en charge' },
        { status: 'delivered', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), location: 'Yaoundé', details: 'Livré avec succès' }
    ],
    statusChangeLog: []
};

export const sampleDeliveredOrder2: Order = {
    id: 'ORDER-SAMPLE-2',
    userId: 'customer-1',
    items: [
        { ...initialProducts.find(p => p.id === '2')!, quantity: 1 }, 
        { ...initialProducts.find(p => p.id === '12')!, quantity: 1 } 
    ],
    subtotal: 27000,
    deliveryFee: 1000,
    total: 28000,
    shippingAddress: { fullName: 'Client de Test 2', phone: '655555556', address: '456 Rue du Test', city: 'Douala', latitude: 4.0511, longitude: 9.7679 },
    deliveryMethod: 'home-delivery',
    orderDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), 
    status: 'picked-up',
    agentId: 'agent-1',
    trackingNumber: 'KZSAMPLE2',
    trackingHistory: [],
    statusChangeLog: []
};

export const sampleDeliveredOrder3: Order = {
    id: 'ORDER-SAMPLE-3',
    userId: 'customer-1',
    items: [
        { ...initialProducts.find(p => p.id === '13')!, quantity: 1 }
    ],
    subtotal: 85000,
    deliveryFee: 2500,
    total: 87500,
    shippingAddress: { fullName: 'Client de Test 3', phone: '655555557', address: '789 Rue du Test', city: 'Yaoundé', latitude: 3.8647, longitude: 11.521 },
    deliveryMethod: 'home-delivery',
    orderDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), 
    status: 'delivered',
    trackingNumber: 'KZSAMPLE3',
    trackingHistory: [],
    statusChangeLog: []
};

export const sampleNewMissionOrder: Order = {
    id: 'ORDER-SAMPLE-4',
    userId: 'customer-2',
    items: [ { ...initialProducts.find(p => p.id === '25')!, quantity: 1 } ],
    subtotal: 32000,
    deliveryFee: 1000,
    total: 33000,
    shippingAddress: { fullName: 'Nouveau Client', phone: '655555558', address: 'Point de retrait Akwa', city: 'Douala' },
    deliveryMethod: 'pickup',
    pickupPointId: 'pp1',
    orderDate: new Date().toISOString(),
    status: 'ready-for-pickup',
    agentId: 'agent-1',
    trackingNumber: 'KZSAMPLE4',
    trackingHistory: [
         { status: 'confirmed', date: new Date().toISOString(), location: 'Electro Plus', details: 'Commande confirmée' },
         { status: 'ready-for-pickup', date: new Date().toISOString(), location: 'Electro Plus', details: 'Prêt pour enlèvement par le livreur' },
    ],
    statusChangeLog: []
};

export const initialShippingPartners: ShippingPartner[] = [
  { id: 'sp1', name: 'Transporteur Standard A', isPremium: false },
  { id: 'sp2', name: 'Transporteur Standard B', isPremium: false },
  { id: 'sp3', name: 'KMER ZONE Express', isPremium: true },
  { id: 'sp4', name: 'Livraison Prioritaire KMER', isPremium: true },
];

export const initialStores: Store[] = [
    { 
        id: 'store-1', sellerId: 'seller-1', name: 'Kmer Fashion', logoUrl: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/fashion-brand-logo-design-template-5355651c6b65163155af4e2c246f5647_screen.jpg?ts=1675753069', 
        bannerUrl: 'https://images.unsplash.com/photo-1555529669-e69e70197a29?q=80&w=2070&auto=format&fit=crop',
        category: 'Mode et Vêtements', warnings: [], status: 'active', premiumStatus: 'premium',
        location: 'Douala', neighborhood: 'Akwa', sellerFirstName: 'Aïcha', sellerLastName: 'Bakari', sellerPhone: '699887766',
        physicalAddress: '45 Avenue de la Mode, Akwa', latitude: 4.0483, longitude: 9.7020, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-15T00:00:00.000Z',
        documents: [
            { name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' },
            { name: "Registre de Commerce", status: 'uploaded', fileUrl: '...' },
        ],
        stories: [{id: 's1', imageUrl: 'https://i.pinimg.com/564x/08/94/a3/0894a30e8a719c676767576f3f054812.jpg', createdAt: new Date().toISOString() }],
        visits: 258,
        collections: [{ id: 'coll1', storeId: 'store-1', name: 'Nouveautés Pagne', description: 'Nos dernières créations en tissu pagne, parfaites pour toutes les occasions.', productIds: ['2', '12', '10'] }],
        shippingSettings: {
            enabledPartners: ['sp1', 'sp3'],
            customRates: { local: 500, national: 1500 },
            freeShippingThreshold: 20000,
        },
    },
    { 
        id: 'store-2', sellerId: 'seller-2', name: 'Mama Africa', logoUrl: 'https://img.freepik.com/vecteurs-premium/modele-logo-cuisine-africaine_210834-31.jpg', 
        bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop',
        category: 'Alimentation', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Bastos', sellerFirstName: 'Jeanne', sellerLastName: 'Abena', sellerPhone: '677665544',
        physicalAddress: '12 Rue des Saveurs, Bastos', latitude: 3.8968, longitude: 11.5213, subscriptionStatus: 'overdue', subscriptionDueDate: '2024-07-10T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'requested' }],
        visits: 134,
        collections: []
    },
    { 
        id: 'store-3', sellerId: 'seller-3', name: 'Electro Plus', logoUrl: 'https://cdn.dribbble.com/users/188652/screenshots/1029415/electro-logo-2.jpg', 
        bannerUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=2069&auto=format&fit=crop',
        category: 'Électronique', warnings: [], status: 'active', premiumStatus: 'super_premium',
        location: 'Yaoundé', neighborhood: 'Mokolo', sellerFirstName: 'Paul', sellerLastName: 'Kouam', sellerPhone: '655443322',
        physicalAddress: 'Grand Marché Mokolo, Stand 52', latitude: 3.8731, longitude: 11.5152, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-20T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }],
        visits: 197,
        collections: []
    },
    { 
        id: 'store-4', sellerId: 'seller-4', name: 'Douala Soaps', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-M3k_vJXuV2zD6D3XoJzQZzO8Z6O8Z6O8Q&s', 
        bannerUrl: 'https://images.unsplash.com/photo-1583947581920-802581a58a7?q=80&w=2071&auto=format&fit=crop',
        category: 'Beauté et Hygiène', warnings: [], status: 'suspended', premiumStatus: 'standard',
        location: 'Douala', neighborhood: 'Bonapriso', sellerFirstName: 'Céline', sellerLastName: 'Ngassa', sellerPhone: '691234567',
        physicalAddress: 'Rue Njo-Njo, Bonapriso', latitude: 4.0321, longitude: 9.715, subscriptionStatus: 'inactive',
        documents: [{ name: "Registre de Commerce", status: 'rejected', rejectionReason: 'Document illisible.' }],
        visits: 45,
        collections: []
    },
     { 
        id: 'store-5', sellerId: 'seller-5', name: 'Yaoundé Style', logoUrl: 'https://img.freepik.com/premium-vector/traditional-african-woman-head-wrap-turban-logo_103045-81.jpg', category: 'Mode et Vêtements', warnings: [], status: 'pending', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Mvog-Ada', sellerFirstName: 'Franck', sellerLastName: 'Essomba', sellerPhone: '698765432',
        physicalAddress: 'Avenue Kennedy', latitude: 3.8647, longitude: 11.521,
        documents: [],
        visits: 0,
        collections: []
    },
    { 
        id: 'store-6', sellerId: 'seller-6', name: 'Bafoussam Brews', logoUrl: 'https://cdn.dribbble.com/users/1586931/screenshots/3443128/coffee-logo-design.png', category: 'Alimentation & Boissons', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Bafoussam', neighborhood: 'Centre Ville', sellerFirstName: 'Pierre', sellerLastName: 'Kamdem', sellerPhone: '696543210',
        physicalAddress: 'Marché Central, Bafoussam', latitude: 5.4744, longitude: 10.4193, subscriptionStatus: 'active', subscriptionDueDate: '2024-09-01T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }],
        visits: 88,
        collections: []
    },
    { 
        id: 'store-7', sellerId: 'seller-7', name: 'Limbe Arts & Crafts', logoUrl: 'https://i.pinimg.com/736x/8a/9e-12/8a9e-1261a8779728283575647585355e.jpg', category: 'Artisanat & Décoration', warnings: [], status: 'active', premiumStatus: 'premium',
        location: 'Limbe', neighborhood: 'Down Beach', sellerFirstName: 'Sarah', sellerLastName: 'Eko', sellerPhone: '695432109',
        physicalAddress: 'Down Beach, Limbe', latitude: 4.0145, longitude: 9.2133, subscriptionStatus: 'active', subscriptionDueDate: '2024-09-10T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }],
        visits: 120,
        collections: [],
    },
];

export const initialFlashSales: FlashSale[] = [
    {
        id: 'fs-1',
        name: 'Vente Flash de la Rentrée',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        products: [
            { productId: '4', sellerShopName: 'Electro Plus', flashPrice: 65000, status: 'approved' },
            { productId: '27', sellerShopName: 'Electro Plus', flashPrice: 2000, status: 'approved' }
        ]
    }
];

export const initialPickupPoints: PickupPoint[] = [
    { id: 'pp1', name: 'Dépôt Akwa', city: 'Douala', neighborhood: 'Akwa', street: 'Rue de la Joie', latitude: 4.0454, longitude: 9.7028, managerId: 'depot-manager-1', zoneId: 'zone-dla-a', layout: {aisles: 10, shelves: 5, locations: 10} },
    { id: 'pp2', name: 'Dépôt Bastos', city: 'Yaoundé', neighborhood: 'Bastos', street: 'Avenue des Ambassades', latitude: 3.8968, longitude: 11.5213, zoneId: 'zone-yde-a' },
];

export const initialSiteSettings: SiteSettings = {
  logoUrl: 'https://kmer-zone-logo.svg',
  bannerUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop',
  companyName: "KMER ZONE Inc.",
  isStoriesEnabled: true,
  requiredSellerDocuments: { "CNI (Carte Nationale d'Identité)": true, "Registre de Commerce": true },
  isRentEnabled: false,
  rentAmount: 0,
  canSellersCreateCategories: false,
  commissionRate: 8.5,
  standardPlan: { price: 10000, durationDays: 30, productLimit: 20, commissionRate: 8.5, photoServiceIncluded: false, featuredOnHomepage: false, prioritySupport: false },
  premiumPlan: { price: 25000, durationDays: 30, productLimit: 100, commissionRate: 6, photoServiceIncluded: true, featuredOnHomepage: false, prioritySupport: true },
  superPremiumPlan: { price: 50000, durationDays: 30, productLimit: 500, commissionRate: 4, photoServiceIncluded: true, featuredOnHomepage: true, prioritySupport: true },
  customerLoyaltyProgram: { isEnabled: true, premium: { thresholds: { orders: 10, spending: 50000 }, cautionAmount: 10000, benefits: ["Livraison prioritaire", "Accès anticipé aux ventes flash"] }, premiumPlus: { isEnabled: true, annualFee: 25000, benefits: ["Tous les avantages Premium", "Livraison gratuite sur 5 commandes", "Support client dédié"] }},
  deliverySettings: { intraUrbanBaseFee: 1000, interUrbanBaseFee: 2500, costPerKg: 500, premiumDeliveryDiscountPercentage: 15 },
  maintenanceMode: { isEnabled: false, message: "Nous serons de retour bientôt !", reopenDate: "" },
  seo: { metaTitle: "KMER ZONE - Le meilleur du Cameroun, livré chez vous.", metaDescription: "Achetez et vendez en ligne au Cameroun. Vêtements, électronique, alimentation et plus encore.", ogImageUrl: "" },
  socialLinks: { facebook: { linkUrl: "#", iconUrl: "https://example.com/facebook.svg"}, twitter: { linkUrl: "#", iconUrl: "https://example.com/twitter.svg" }, instagram: { linkUrl: "#", iconUrl: "https://example.com/instagram.svg" } },
  emailTemplates: [
    {
      id: 'welcome-customer',
      name: 'Bienvenue au nouveau client',
      subject: 'Bienvenue sur KMER ZONE !',
      body: 'Bonjour {customerName},\n\nBienvenue sur KMER ZONE ! Nous sommes ravis de vous compter parmi nous.\n\nExplorez nos produits dès maintenant !\n\nL\'équipe KMER ZONE',
      variables: '{customerName}'
    },
    {
      id: 'order-shipped',
      name: 'Commande expédiée',
      subject: 'Votre commande KMER ZONE a été expédiée !',
      body: 'Bonjour {customerName},\n\nBonne nouvelle ! Votre commande #{orderId} a été expédiée et est en route.\n\nVous pouvez suivre son avancement depuis votre compte.\n\nMerci pour votre confiance,\nL\'équipe KMER ZONE',
      variables: '{customerName}, {orderId}'
    },
    {
      id: 'promo-newsletter',
      name: 'Newsletter promotionnelle',
      subject: '🔥 Ne manquez pas nos offres spéciales !',
      body: 'Bonjour {customerName},\n\n{emailContent}\n\nProfitez-en vite sur KMER ZONE !\n\nCordialement,\nL\'équipe Marketing',
      variables: '{customerName}, {emailContent}'
    }
  ],
  isChatEnabled: true,
  isComparisonEnabled: true,
};

export const initialSiteContent: SiteContent[] = [
    { slug: 'about', title: 'À Propos de Nous', content: '<h2>Notre Mission</h2><p>KMER ZONE a pour mission de connecter les commerçants talentueux du Cameroun avec les acheteurs de tout le pays et au-delà. Nous croyons au potentiel de l\'artisanat local et des produits camerounais. Notre plateforme offre les outils et la visibilité nécessaires pour permettre aux petites et grandes entreprises de prospérer dans l\'économie numérique.</p>' },
    { slug: 'contact', title: 'Contactez-Nous', content: '<h2>Contact</h2><p>Pour toute question, demande de support ou partenariat, veuillez nous contacter :</p><ul><li><strong>Email :</strong> support@kmerzone.cm</li><li><strong>Téléphone :</strong> +237 690 00 00 00</li><li><strong>Adresse :</strong> 123 Rue de l\'Innovation, Akwa, Douala, Cameroun</li></ul>' },
    { slug: 'faq', title: 'Foire Aux Questions', content: '<h2>FAQ</h2><h3>Comment puis-je vendre sur KMER ZONE ?</h3><p>C\'est simple ! Cliquez sur le lien "Devenir vendeur" en haut de la page et suivez les instructions pour créer votre boutique. Vous devrez fournir quelques informations sur votre entreprise et vos produits.</p><h3>Quels sont les moyens de paiement acceptés ?</h3><p>Nous acceptons les paiements sécurisés via Orange Money et MTN Mobile Money.</p><h3>Comment fonctionne la livraison ?</h3><p>Nous avons un réseau de livreurs partenaires qui récupèrent les colis chez les vendeurs et les livrent directement à votre porte. Vous pouvez suivre l\'avancement de votre livraison en temps réel depuis votre compte.</p>' },
    { slug: 'sitemap', title: 'Plan du site', content: 'Liste de toutes les pages du site.' },
    { slug: 'careers', title: 'Carrières', content: '<h2>Rejoignez Notre Équipe</h2><p>Nous sommes une entreprise en pleine croissance et nous sommes toujours à la recherche de talents passionnés pour rejoindre notre aventure. Si vous êtes motivé par l\'innovation et le développement de l\'écosystème numérique au Cameroun, nous voulons vous connaître.</p><p>Consultez nos offres d\'emploi sur notre page LinkedIn ou envoyez-nous votre candidature spontanée à <strong>careers@kmerzone.cm</strong>.</p>' },
    { slug: 'terms-of-service', title: 'Conditions d\'Utilisation', content: '<h2>Conditions Générales d\'Utilisation</h2><p>En utilisant notre site, vous acceptez nos conditions d\'utilisation. Celles-ci régissent votre accès et votre utilisation de la plateforme KMER ZONE, incluant les politiques d\'achat, de vente, de retour et de contenu. Nous vous invitons à les lire attentivement.</p>' },
    { slug: 'privacy-policy', title: 'Politique de Confidentialité', content: '<h2>Politique de Confidentialité</h2><p>Nous nous engageons à protéger votre vie privée. Cette politique explique comment nous collectons, utilisons et protégeons vos données personnelles lorsque vous utilisez nos services. Votre confiance est notre priorité.</p>' },
    { slug: 'training-center', title: 'Centre de Formation Vendeur', content: '<h2>Centre de Formation</h2><p>Maximisez votre succès sur KMER ZONE ! Notre centre de formation vous offre des ressources exclusives pour vous aider à :</p><ul><li>Optimiser votre boutique pour attirer plus de clients.</li><li>Prendre des photos de produits professionnelles avec votre smartphone.</li><li>Gérer vos commandes et vos stocks efficacement.</li><li>Comprendre nos outils d\'analyse pour booster vos ventes.</li></ul>' },
    { slug: 'logistics', title: 'Logistique & Livraison', content: '<h2>Logistique et Livraison</h2><p>Notre service de logistique intégré est conçu pour vous simplifier la vie. Nous nous occupons de la collecte de vos colis et de leur livraison sécurisée à vos clients.</p><p>Découvrez nos partenaires, nos tarifs compétitifs pour les livraisons locales et nationales, et comment suivre vos colis en temps réel depuis votre tableau de bord vendeur.</p>' }
];

export const initialAdvertisements: Advertisement[] = [
    { id: 'ad-1', imageUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=2070&auto=format&fit=crop', linkUrl: '#', location: 'homepage-banner', isActive: true },
];

export const initialPaymentMethods: PaymentMethod[] = [
    { id: 'pm1', name: 'Orange Money', imageUrl: '' },
    { id: 'pm2', name: 'MTN Mobile Money', imageUrl: '' },
    { id: 'pm3', name: 'Visa', imageUrl: '' },
    { id: 'pm4', name: 'Mastercard', imageUrl: '' },
    { id: 'pm5', name: 'PayPal', imageUrl: '' },
];

export const initialSiteActivityLogs: SiteActivityLog[] = [];