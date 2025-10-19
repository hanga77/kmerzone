// This file replaces the old constants.ts and will be used by the backend server.
import type { Category, Product, Order, Store, FlashSale, PickupPoint, SiteSettings, SiteContent, Advertisement, PaymentMethod, ShippingPartner, SiteActivityLog, Zone, EmailTemplate, User } from '../types';

export const initialZones: Zone[] = [
    { id: 'zone-dla-a', name: 'Zone A', city: 'Douala' },
    { id: 'zone-dla-b', name: 'Zone B', city: 'Douala' },
    { id: 'zone-yde-a', name: 'Zone A', city: 'Yaoundé' },
    { id: 'zone-yde-b', name: 'Zone B', city: 'Yaoundé' },
];

const defaultNotificationPrefs = { promotions: true, orderUpdates: true, newsletters: true };

export const initialUsers: User[] = [
    { id: 'assistant-id', name: 'Assistant KMER ZONE', email: 'assistant@kmerzone.com', password: 'password', role: 'customer', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { 
        id: 'customer-1', 
        name: 'Client Test', 
        email: 'customer@example.com', 
        password: 'password', 
        role: 'customer', 
        loyalty: { status: 'premium', orderCount: 12, totalSpent: 62000, premiumStatusMethod: 'loyalty' }, 
        addresses: [
            { id: 'addr1', isDefault: true, label: 'Maison', fullName: 'Client Test', phone: '690123456', address: '123 Rue de la Liberté', city: 'Douala', latitude: 4.0483, longitude: 9.7020 }
        ], 
        followedStores: ['store-1'],
        profilePictureUrl: '/ressources/images/users/customer-1.jpg',
        phone: '690123456',
        birthDate: '1990-05-15',
        gender: 'Homme',
        notificationPreferences: { promotions: true, orderUpdates: true, newsletters: false }
    },
    { id: 'seller-1', name: 'Kmer Fashion', email: 'seller@example.com', password: 'password', role: 'seller', shopName: 'Kmer Fashion', location: 'Douala', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { id: 'seller-2', name: 'Mama Africa', email: 'mamaafrica@example.com', password: 'password', role: 'seller', shopName: 'Mama Africa', location: 'Yaoundé', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { id: 'seller-3', name: 'Electro Plus', email: 'electro@example.com', password: 'password', role: 'seller', shopName: 'Electro Plus', location: 'Yaoundé', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { id: 'seller-4', name: 'Douala Soaps', email: 'soaps@example.com', password: 'password', role: 'seller', shopName: 'Douala Soaps', location: 'Douala', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { id: 'admin-1', name: 'Super Admin', email: 'superadmin@example.com', password: 'password', role: 'superadmin', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { id: 'agent-1', name: 'Paul Atanga', email: 'agent1@example.com', password: 'password', role: 'delivery_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, availabilityStatus: 'available', addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs, zoneId: 'zone-dla-a' },
    { id: 'agent-2', name: 'Brenda Biya', email: 'agent2@example.com', password: 'password', role: 'delivery_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, availabilityStatus: 'available', addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs, zoneId: 'zone-yde-a' },
    { id: 'depot-agent-1', name: 'Agent Dépôt Akwa', email: 'depot@example.com', password: 'password', role: 'depot_agent', depotId: 'pp1', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs, zoneId: 'zone-dla-a' },
    { id: 'depot-manager-1', name: 'Chef de Dépôt Akwa', email: 'depot.manager@example.com', password: 'password', role: 'depot_manager', depotId: 'pp1', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs, zoneId: 'zone-dla-a' },
];

export const initialCategories: Category[] = [
    // Main Categories
    { id: 'cat-vetements', name: 'categories.clothingShoes', imageUrl: '/ressources/images/categories/clothing.jpg' },
    { id: 'cat-accessoires', name: 'categories.accessoriesJewelry', imageUrl: '/ressources/images/categories/accessories.jpg' },
    { id: 'cat-beaute', name: 'categories.beauty', imageUrl: '/ressources/images/categories/beauty.jpg' },
    { id: 'cat-mobilier', name: 'categories.furniture', imageUrl: '/ressources/images/categories/furniture.jpg' },
    { id: 'cat-electronique', name: 'categories.electronics', imageUrl: '/ressources/images/categories/electronics.jpg' },
    { id: 'cat-textile', name: 'categories.homeTextiles', imageUrl: '/ressources/images/categories/textiles.jpg' },
    { id: 'cat-bureau', name: 'categories.officeSupplies', imageUrl: '/ressources/images/categories/office.jpg' },
    { id: 'cat-animaux', name: 'categories.petProducts', imageUrl: '/ressources/images/categories/pets.jpg' },
    { id: 'cat-loisirs', name: 'categories.hobbiesCreativity', imageUrl: '/ressources/images/categories/hobbies.jpg' },
    { id: 'cat-jardin', name: 'categories.homeGarden', imageUrl: '/ressources/images/categories/garden.jpg' },
    { id: 'cat-electronique-grand-public', name: 'categories.consumerElectronics', imageUrl: '/ressources/images/categories/consumer-electronics.jpg' },
    { id: 'cat-enfants', name: 'categories.kidsSchool', imageUrl: '/ressources/images/categories/kids.jpg' },
    { id: 'cat-services', name: 'categories.services', imageUrl: '/ressources/images/categories/services.jpg' },

    // Sub-categories
    { id: 'sub-vetements', parentId: 'cat-vetements', name: 'categories.clothing', imageUrl: '/ressources/images/categories/sub/clothing-sub.jpg' },
    { id: 'sub-chaussures', parentId: 'cat-vetements', name: 'categories.shoes', imageUrl: '/ressources/images/categories/sub/shoes.jpg' },
    { id: 'sub-sacs', parentId: 'cat-accessoires', name: 'categories.bags', imageUrl: '/ressources/images/categories/sub/bags.jpg' },
    { id: 'sub-montres', parentId: 'cat-accessoires', name: 'categories.watches', imageUrl: '/ressources/images/categories/sub/watches.jpg' },
    { id: 'sub-lunettes', parentId: 'cat-accessoires', name: 'categories.glasses', imageUrl: '/ressources/images/categories/sub/glasses.jpg' },
    { id: 'sub-bijoux', parentId: 'cat-accessoires', name: 'categories.jewelry', imageUrl: '/ressources/images/categories/sub/jewelry.jpg' },
    { id: 'sub-accessoires-cheveux', parentId: 'cat-accessoires', name: 'categories.hairAccessories', imageUrl: '/ressources/images/categories/sub/hair.jpg' },
    { id: 'sub-cosmetiques', parentId: 'cat-beaute', name: 'categories.cosmetics', imageUrl: '/ressources/images/categories/sub/cosmetics.jpg' },
    { id: 'sub-parfums', parentId: 'cat-beaute', name: 'categories.perfumes', imageUrl: '/ressources/images/categories/sub/perfumes.jpg' },
    { id: 'sub-chaises', parentId: 'cat-mobilier', name: 'categories.chairs', imageUrl: '/ressources/images/categories/sub/chairs.jpg' },
    { id: 'sub-autres-meubles', parentId: 'cat-mobilier', name: 'categories.otherFurniture', imageUrl: '/ressources/images/categories/sub/other-furniture.jpg' },
    { id: 'sub-chargeurs-cables-batteries', parentId: 'cat-electronique', name: 'categories.chargersCablesBatteries', imageUrl: '/ressources/images/categories/sub/cables.jpg' },
    { id: 'sub-rideaux', parentId: 'cat-textile', name: 'categories.curtains', imageUrl: '/ressources/images/categories/sub/curtains.jpg' },
    { id: 'sub-autres-textiles', parentId: 'cat-textile', name: 'categories.otherHomeTextiles', imageUrl: '/ressources/images/categories/sub/other-textiles.jpg' },
    { id: 'sub-papeterie', parentId: 'cat-bureau', name: 'categories.stationery', imageUrl: '/ressources/images/categories/sub/stationery.jpg' },
    { id: 'sub-office-goods', parentId: 'cat-bureau', name: 'categories.officeGoods', imageUrl: '/ressources/images/categories/sub/office-goods.jpg' },
    { id: 'sub-accessoires-animaux', parentId: 'cat-animaux', name: 'categories.petAccessories', imageUrl: '/ressources/images/categories/sub/pet-accessories.jpg' },
    { id: 'sub-artisanat-jeux', parentId: 'cat-loisirs', name: 'categories.hobbiesCraftsGames', imageUrl: '/ressources/images/categories/sub/crafts.jpg' },
    { id: 'sub-decoration', parentId: 'cat-jardin', name: 'categories.homeDecorLighting', imageUrl: '/ressources/images/categories/sub/decor.jpg' },
    { id: 'sub-telephones-casques', parentId: 'cat-electronique-grand-public', name: 'categories.phonesHeadphonesAppliances', imageUrl: '/ressources/images/categories/sub/phones.jpg' },
    { id: 'sub-jouets-fournitures', parentId: 'cat-enfants', name: 'categories.toysSchoolSupplies', imageUrl: '/ressources/images/categories/sub/toys.jpg' },
    { id: 'sub-serv-education', parentId: 'cat-services', name: 'categories.serv_education', imageUrl: '/ressources/images/categories/sub/serv-education.jpg' },
    { id: 'sub-serv-bricoleur', parentId: 'cat-services', name: 'categories.serv_diy', imageUrl: '/ressources/images/categories/sub/serv-diy.jpg' },
    { id: 'sub-serv-beaute', parentId: 'cat-services', name: 'categories.serv_beauty_health', imageUrl: '/ressources/images/categories/sub/serv-beauty.jpg' },
    { id: 'sub-serv-transport', parentId: 'cat-services', name: 'categories.serv_transport', imageUrl: '/ressources/images/categories/sub/serv-transport.jpg' },
    { id: 'sub-serv-reparation', parentId: 'cat-services', name: 'categories.serv_repair_construction', imageUrl: '/ressources/images/categories/sub/serv-repair.jpg' },
    { id: 'sub-serv-informatique', parentId: 'cat-services', name: 'categories.serv_it', imageUrl: '/ressources/images/categories/sub/serv-it.jpg' },
    { id: 'sub-serv-entreprises', parentId: 'cat-services', name: 'categories.serv_business', imageUrl: '/ressources/images/categories/sub/serv-business.jpg' },
    { id: 'sub-serv-nettoyage', parentId: 'cat-services', name: 'categories.serv_cleaning', imageUrl: '/ressources/images/categories/sub/serv-cleaning.jpg' },
    { id: 'sub-serv-auto', parentId: 'cat-services', name: 'categories.serv_auto', imageUrl: '/ressources/images/categories/sub/serv-auto.jpg' },
    { id: 'sub-serv-equipement', parentId: 'cat-services', name: 'categories.serv_equipment_repair', imageUrl: '/ressources/images/categories/sub/serv-equipment.jpg' },
];

export const initialProducts: Product[] = [
    { id: '1', name: 'Ndolé Royal', price: 3500, promotionPrice: 3000, imageUrls: ['/ressources/images/products/ndole.jpg'], vendor: 'Mama Africa', description: "Le plat national du Cameroun, un délicieux mélange de légumes, d'arachides et de viande ou de poisson.", reviews: [{author: "Jean P.", rating: 5, comment: "Incroyable !", date: "2023-10-10", status: 'approved'}], stock: 15, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '2', name: 'Robe en Tissu Pagne', price: 15000, imageUrls: ['/ressources/images/products/robe-pagne.jpg'], vendor: 'Kmer Fashion', description: "Une robe élégante confectionnée à la main avec du tissu pagne de haute qualité.", reviews: [{author: "Aïcha B.", rating: 4, comment: "Très belles couleurs.", date: "2023-10-11", status: 'approved'}], stock: 8, categoryId: 'sub-vetements', status: 'published', brand: 'Kmer Fashion' },
    { id: '3', name: 'Savon Artisanal à l\'huile d\'olive', price: 1500, imageUrls: ['/ressources/images/products/savon.jpg'], vendor: 'Douala Soaps', description: "Un savon artisanal fabriqué localement. Doux pour la peau et respectueux de l'environnement.", reviews: [], stock: 50, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '4', name: 'Smartphone Pro Max', price: 75000, promotionPrice: 69900, imageUrls: ['/ressources/images/products/smartphone.jpg'], vendor: 'Electro Plus', description: "Un smartphone performant avec un excellent rapport qualité-prix. Grand écran et bonne autonomie.", reviews: [{author: "Eric K.", rating: 5, comment: "Super téléphone pour le prix.", date: "2023-10-12", status: 'approved'}], stock: 4, categoryId: 'sub-telephones-casques', status: 'published', promotionStartDate: '2024-07-01', promotionEndDate: '2024-07-31', brand: 'TechPro' },
    { id: '5', name: 'Miel d\'Oku', price: 5000, imageUrls: ['/ressources/images/products/miel.jpg'], vendor: 'Mama Africa', description: "Un miel blanc rare et primé, récolté sur les flancs du mont Oku.", reviews: [{author: "Fatima G.", rating: 5, comment: "Le meilleur miel que j'ai jamais goûté.", date: "2023-10-13", status: 'approved'}], stock: 25, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '6', name: 'Sandales en cuir', price: 8000, imageUrls: ['/ressources/images/products/sandales.jpg'], vendor: 'Kmer Fashion', description: "Sandales en cuir véritable, faites à la main. Confortables et durables.", reviews: [], stock: 10, categoryId: 'sub-chaussures', status: 'draft', brand: 'Kmer Fashion' },
    { id: '7', name: 'Poulet DG', price: 6500, imageUrls: ['/ressources/images/products/poulet-dg.jpg'], vendor: 'Mama Africa', description: "Un plat de fête succulent avec du poulet frit, des plantains et une sauce riche en légumes.", reviews: [], stock: 12, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '8', name: 'Jus de Bissap Naturel', price: 1000, imageUrls: ['/ressources/images/products/bissap.jpg'], vendor: 'Mama Africa', description: "Boisson rafraîchissante et naturelle à base de fleurs d'hibiscus.", reviews: [], stock: 30, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '9', name: 'Beignets Haricots Bouillie', price: 1500, imageUrls: ['/ressources/images/products/beignets.jpg'], vendor: 'Mama Africa', description: "Le petit-déjeuner camerounais par excellence. Des beignets soufflés accompagnés d'une purée de haricots.", reviews: [], stock: 20, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '10', name: 'Chemise en Toghu', price: 25000, imageUrls: ['/ressources/images/products/toghu.jpg'], vendor: 'Kmer Fashion', description: "Chemise de cérémonie pour homme, en velours noir brodé avec les motifs colorés traditionnels du Toghu.", reviews: [], stock: 5, categoryId: 'sub-vetements', status: 'published', brand: 'Kmer Fashion' },
    { id: '11', name: 'Poivre de Penja', price: 4500, imageUrls: ['/ressources/images/products/poivre.jpg'], vendor: 'Mama Africa', description: "Considéré comme l'un des meilleurs poivres au monde, cultivé sur les terres volcaniques de Penja.", reviews: [], stock: 40, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '12', name: 'Sac à main en pagne', price: 12000, imageUrls: ['/ressources/images/products/sac-pagne.jpg'], vendor: 'Kmer Fashion', description: "Accessoirisez votre tenue avec ce magnifique sac à main fait main, alliant cuir et tissu pagne.", reviews: [], stock: 15, categoryId: 'sub-sacs', status: 'published', brand: 'Kmer Fashion' },
    { id: '13', name: 'Téléviseur LED 32"', price: 85000, imageUrls: ['/ressources/images/products/tv.jpg'], vendor: 'Electro Plus', description: "Un téléviseur LED de 32 pouces avec une image de haute qualité.", reviews: [], stock: 9, categoryId: 'sub-telephones-casques', status: 'published', brand: 'ViewSonic' },
    { id: '14', name: 'Fer à repasser', price: 7500, imageUrls: ['/ressources/images/products/fer-repasser.jpg'], vendor: 'Electro Plus', description: "Simple, efficace et durable. Ce fer à repasser est parfait pour un usage quotidien.", reviews: [], stock: 25, categoryId: 'sub-telephones-casques', status: 'published', brand: 'Generic' },
    { id: '15', name: 'Blender / Mixeur', price: 18000, imageUrls: ['/ressources/images/products/blender.jpg'], vendor: 'Electro Plus', description: "Un mixeur puissant pour préparer vos jus, soupes et sauces. Bol en verre robuste de 1.5L.", reviews: [], stock: 18, categoryId: 'sub-telephones-casques', status: 'published', brand: 'MixWell' },
    { id: '16', name: 'Savon noir gommant', price: 2500, imageUrls: ['/ressources/images/products/savon-noir.jpg'], vendor: 'Douala Soaps', description: "Savon noir africain pour un gommage naturel et une peau douce et purifiée.", reviews: [], stock: 40, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '17', name: 'Huile de coco vierge', price: 4000, imageUrls: ['/ressources/images/products/huile-coco.jpg'], vendor: 'Douala Soaps', description: "Huile de coco 100% pure et pressée à froid. Idéale pour la peau, les cheveux et la cuisson.", reviews: [], stock: 30, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '18', name: 'Beurre de karité', price: 3000, imageUrls: ['/ressources/images/products/karite.jpg'], vendor: 'Douala Soaps', description: "Beurre de karité brut et non raffiné, parfait pour hydrater en profondeur la peau et les cheveux secs.", reviews: [], stock: 60, categoryId: 'sub-cosmetiques', status: 'published', brand: 'Douala Soaps' },
    { id: '19', name: 'Baskets de Ville', price: 22000, imageUrls: ['/ressources/images/products/baskets.jpg'], vendor: 'Kmer Fashion', description: "Baskets confortables et stylées pour un usage quotidien.", reviews: [], stock: 20, categoryId: 'sub-chaussures', status: 'published', brand: 'CityWalkers' },
    { id: '20', name: 'Eau de Parfum "Sawa"', price: 28000, imageUrls: ['/ressources/images/products/parfum.jpg'], vendor: 'Douala Soaps', description: "Un parfum boisé et épicé pour homme, inspiré par la côte camerounaise.", reviews: [], stock: 15, categoryId: 'sub-parfums', status: 'published', brand: 'Douala Soaps' },
    { id: '21', name: 'Fauteuil en Rotin', price: 45000, imageUrls: ['/ressources/images/products/fauteuil-rotin.jpg'], vendor: 'Electro Plus', description: "Fauteuil artisanal en rotin, parfait pour votre salon ou votre terrasse.", reviews: [], stock: 5, categoryId: 'sub-chaises', status: 'published', brand: 'HomeDecor' },
    { id: '22', name: 'Masque décoratif Fang', price: 18000, imageUrls: ['/ressources/images/products/masque.jpg'], vendor: 'Kmer Fashion', description: "Authentique masque décoratif de l'ethnie Fang, sculpté à la main.", reviews: [], stock: 10, categoryId: 'sub-decoration', status: 'published', brand: 'Artisanat Local' },
    { id: '23', name: 'Lampe de chevet "Wouri"', price: 13500, imageUrls: ['/ressources/images/products/lampe.jpg'], vendor: 'Electro Plus', description: "Lampe de chevet au design moderne avec une base en bois local.", reviews: [], stock: 22, categoryId: 'sub-decoration', status: 'published', brand: 'HomeDecor' },
    { id: '24', name: 'Collier de perles', price: 9500, imageUrls: ['/ressources/images/products/collier.jpg'], vendor: 'Kmer Fashion', description: "Collier artisanal fait de perles traditionnelles colorées.", reviews: [], stock: 30, categoryId: 'sub-bijoux', status: 'published', brand: 'Artisanat Local' },
    { id: '25', name: 'Montre Classique Homme', price: 32000, imageUrls: ['/ressources/images/products/montre.jpg'], vendor: 'Electro Plus', description: "Montre élégante avec bracelet en cuir, idéale pour le bureau ou les sorties.", reviews: [], stock: 12, categoryId: 'sub-montres', status: 'published', brand: 'TimeMaster' },
    { id: '26', name: 'Poupée "Penda"', price: 7000, imageUrls: ['/ressources/images/products/poupee.jpg'], vendor: 'Kmer Fashion', description: "Poupée en tissu pagne, faite à la main, pour le bonheur des plus petits.", reviews: [], stock: 25, categoryId: 'sub-jouets-fournitures', status: 'published', brand: 'Artisanat Local' },
    { id: '27', name: 'Lot de 10 Cahiers', price: 2500, imageUrls: ['/ressources/images/products/cahiers.jpg'], vendor: 'Electro Plus', description: "Un lot de 10 cahiers de 100 pages pour la rentrée scolaire.", reviews: [], stock: 100, categoryId: 'sub-papeterie', status: 'published', brand: 'School Essentials' },
    { id: '28', name: 'Bière "33" Export (Pack de 6)', price: 4000, imageUrls: ['/ressources/images/products/biere-33.jpg'], vendor: 'Mama Africa', description: "La bière blonde de référence au Cameroun. Pack de 6 bouteilles de 65cl.", reviews: [], stock: 50, categoryId: 'sub-autres-textiles', status: 'published' },
    { id: '29', name: 'Café Arabica en Grains', price: 6000, imageUrls: ['/ressources/images/products/cafe-arabica.jpg'], vendor: 'Bafoussam Brews', description: "Café Arabica de l'Ouest Cameroun, torréfaction artisanale. Sachet de 500g.", reviews: [], stock: 30, categoryId: 'sub-autres-textiles', status: 'published', brand: 'Bafoussam Brews' },
    { id: '30', name: 'Statuette en bois d\'ébène', price: 22000, imageUrls: ['/ressources/images/products/statuette.jpg'], vendor: 'Limbe Arts & Crafts', description: "Statuette finement sculptée à la main par des artisans de la région du Sud-Ouest.", reviews: [], stock: 8, categoryId: 'sub-decoration', status: 'published', brand: 'Limbe Arts & Crafts' },
    { id: '31', name: 'Tableau d\'art contemporain', price: 48000, imageUrls: ['/ressources/images/products/tableau.jpg'], vendor: 'Limbe Arts & Crafts', description: "Peinture sur toile vibrante, représentant une scène de marché local.", reviews: [], stock: 3, categoryId: 'sub-decoration', status: 'published', brand: 'Limbe Arts & Crafts' },
    { id: '32', name: 'Écouteurs sans fil', price: 12500, imageUrls: ['/ressources/images/products/ecouteurs.jpg'], vendor: 'Kribi Digital', description: "Écouteurs Bluetooth avec une bonne autonomie et un son clair. Idéal pour la musique et les appels.", reviews: [], stock: 25, categoryId: 'sub-chargeurs-cables-batteries', status: 'draft' }, // In draft, store is pending
    { id: '33', name: 'Café Robusta Moulu', price: 4500, imageUrls: ['/ressources/images/products/cafe-robusta.jpg'], vendor: 'Bafoussam Brews', description: "Café Robusta puissant et aromatique, parfait pour un expresso corsé. Sachet de 500g.", reviews: [], stock: 40, categoryId: 'sub-autres-textiles', status: 'published', brand: 'Bafoussam Brews' },
    { id: 'serv-1', name: "Assistance Informatique à Domicile", price: 20000, imageUrls: ['/ressources/images/services/it-support.jpg'], vendor: 'KMER Enterprise', description: "Un expert se déplace chez vous pour résoudre tous vos problèmes informatiques : virus, lenteurs, installation de logiciels, configuration réseau et bien plus. Service rapide et efficace.", reviews: [], stock: 1, categoryId: 'sub-serv-informatique', status: 'published', type: 'service', duration: "par heure", locationType: 'on-site', serviceArea: 'Douala & Yaoundé', availability: "Lundi - Samedi, 9h - 18h"},
    { id: 'serv-2', name: "Cours de soutien en Mathématiques", price: 15000, imageUrls: ['/ressources/images/services/tutoring.jpg'], vendor: 'KMER Enterprise', description: "Professeur expérimenté propose des cours de soutien en mathématiques pour les élèves de niveau lycée. Préparation aux examens, aide aux devoirs et consolidation des acquis. Sessions en ligne ou à domicile.", reviews: [], stock: 1, categoryId: 'sub-serv-education', status: 'published', type: 'service', duration: "par séance de 2h", locationType: 'flexible', serviceArea: "National (en ligne) / Douala (à domicile)", availability: "Sur rendez-vous"},
    { id: 'serv-3', name: "Maquillage professionnel pour événements", price: 30000, imageUrls: ['/ressources/images/services/makeup.jpg'], vendor: 'Kmer Fashion', description: "Sublimez votre beauté pour vos occasions spéciales (mariages, soirées, galas). Maquilleuse professionnelle utilisant des produits de haute qualité pour un résultat impeccable et longue tenue.", reviews: [], stock: 1, categoryId: 'sub-serv-beaute', status: 'published', type: 'service', duration: "par personne", locationType: 'on-site', serviceArea: 'Douala', availability: "Sur rendez-vous"},
    { id: 'serv-4', name: "Nettoyage résidentiel complet", price: 25000, imageUrls: ['/ressources/images/services/cleaning.jpg'], vendor: 'KMER Enterprise', description: "Service de nettoyage complet pour votre appartement ou maison. Dépoussiérage, lavage des sols, nettoyage des vitres, et désinfection des sanitaires et de la cuisine. Retrouvez un intérieur impeccable.", reviews: [], stock: 1, categoryId: 'sub-serv-nettoyage', status: 'published', type: 'service', duration: "par intervention (3h max)", locationType: 'on-site', serviceArea: 'Douala uniquement', availability: "7j/7, 8h - 16h"},
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
        id: 'store-1', sellerId: 'seller-1', name: 'Kmer Fashion', logoUrl: '/ressources/logos/kmer-fashion.jpg', 
        bannerUrl: '/ressources/banners/kmer-fashion-banner.jpg',
        category: 'Mode et Vêtements', warnings: [], status: 'active', premiumStatus: 'premium',
        location: 'Douala', neighborhood: 'Akwa', sellerFirstName: 'Aïcha', sellerLastName: 'Bakari', sellerPhone: '699887766',
        physicalAddress: '45 Avenue de la Mode, Akwa', latitude: 4.0483, longitude: 9.7020, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-15T00:00:00.000Z',
        documents: [
            { name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '/ressources/documents/cni-sample.png' },
            { name: "Registre de Commerce", status: 'uploaded', fileUrl: '/ressources/documents/rccm-sample.png' },
        ],
        stories: [{id: 's1', imageUrl: '/ressources/images/stories/story1.jpg', createdAt: new Date().toISOString() }],
        visits: 258,
        collections: [{ id: 'coll1', storeId: 'store-1', name: 'Nouveautés Pagne', description: 'Nos dernières créations en tissu pagne, parfaites pour toutes les occasions.', productIds: ['2', '12', '10'] }],
        shippingSettings: {
            enabledPartners: ['sp1', 'sp3'],
            customRates: { local: 500, national: 1500 },
            freeShippingThreshold: 20000,
        },
    },
    { 
        id: 'store-2', sellerId: 'seller-2', name: 'Mama Africa', logoUrl: '/ressources/logos/mama-africa.jpg', 
        bannerUrl: '/ressources/banners/mama-africa-banner.jpg',
        category: 'Alimentation', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Bastos', sellerFirstName: 'Jeanne', sellerLastName: 'Abena', sellerPhone: '677665544',
        physicalAddress: '12 Rue des Saveurs, Bastos', latitude: 3.8968, longitude: 11.5213, subscriptionStatus: 'overdue', subscriptionDueDate: '2024-07-10T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'requested' }],
        visits: 134,
        collections: []
    },
    { 
        id: 'store-3', sellerId: 'seller-3', name: 'Electro Plus', logoUrl: '/ressources/logos/electro-plus.jpg', 
        bannerUrl: '/ressources/banners/electro-plus-banner.jpg',
        category: 'Électronique', warnings: [], status: 'active', premiumStatus: 'super_premium',
        location: 'Yaoundé', neighborhood: 'Mokolo', sellerFirstName: 'Paul', sellerLastName: 'Kouam', sellerPhone: '655443322',
        physicalAddress: 'Grand Marché Mokolo, Stand 52', latitude: 3.8731, longitude: 11.5152, subscriptionStatus: 'active', subscriptionDueDate: '2024-08-20T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }],
        visits: 197,
        collections: []
    },
    { 
        id: 'store-4', sellerId: 'seller-4', name: 'Douala Soaps', logoUrl: '/ressources/logos/douala-soaps.jpg', 
        bannerUrl: '/ressources/banners/douala-soaps-banner.jpg',
        category: 'Beauté et Hygiène', warnings: [], status: 'suspended', premiumStatus: 'standard',
        location: 'Douala', neighborhood: 'Bonapriso', sellerFirstName: 'Céline', sellerLastName: 'Ngassa', sellerPhone: '691234567',
        physicalAddress: 'Rue Njo-Njo, Bonapriso', latitude: 4.0321, longitude: 9.715, subscriptionStatus: 'inactive',
        documents: [{ name: "Registre de Commerce", status: 'rejected', rejectionReason: 'Document illisible.', fileUrl: '...' }],
        visits: 45,
        collections: []
    },
     { 
        id: 'store-5', sellerId: 'seller-5', name: 'Yaoundé Style', logoUrl: '/ressources/logos/yaounde-style.jpg', category: 'Mode et Vêtements', warnings: [], status: 'pending', premiumStatus: 'standard',
        location: 'Yaoundé', neighborhood: 'Mvog-Ada', sellerFirstName: 'Franck', sellerLastName: 'Essomba', sellerPhone: '698765432',
        physicalAddress: 'Avenue Kennedy', latitude: 3.8647, longitude: 11.521,
        documents: [],
        visits: 0,
        collections: []
    },
    { 
        id: 'store-6', sellerId: 'seller-6', name: 'Bafoussam Brews', logoUrl: '/ressources/logos/bafoussam-brews.png', category: 'Alimentation & Boissons', warnings: [], status: 'active', premiumStatus: 'standard',
        location: 'Bafoussam', neighborhood: 'Centre Ville', sellerFirstName: 'Pierre', sellerLastName: 'Kamdem', sellerPhone: '696543210',
        physicalAddress: 'Marché Central, Bafoussam', latitude: 5.4744, longitude: 10.4193, subscriptionStatus: 'active', subscriptionDueDate: '2024-09-01T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }],
        visits: 88,
        collections: []
    },
    { 
        id: 'store-7', sellerId: 'seller-7', name: 'Limbe Arts & Crafts', logoUrl: '/ressources/logos/limbe-arts.jpg', category: 'Artisanat & Décoration', warnings: [], status: 'active', premiumStatus: 'premium',
        location: 'Limbe', neighborhood: 'Down Beach', sellerFirstName: 'Sarah', sellerLastName: 'Eko', sellerPhone: '695432109',
        physicalAddress: 'Down Beach, Limbe', latitude: 4.0145, longitude: 9.2133, subscriptionStatus: 'active', subscriptionDueDate: '2024-09-10T00:00:00.000Z',
        documents: [{ name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' }],
        visits: 120,
        collections: [],
    },
    { 
        id: 'store-8',
        sellerId: 'enterprise-1',
        name: 'KMER Enterprise',
        logoUrl: '/ressources/logos/kmer-enterprise.png',
        bannerUrl: '/ressources/banners/kmer-enterprise-banner.jpg',
        category: 'Services & Entreprise',
        warnings: [],
        status: 'active',
        premiumStatus: 'super_premium',
        location: 'Douala',
        neighborhood: 'Bonanjo',
        sellerFirstName: 'KMER',
        sellerLastName: 'Enterprise',
        sellerPhone: '691122334',
        physicalAddress: '100 Boulevard de la Liberté, Bonanjo',
        latitude: 4.044,
        longitude: 9.691,
        subscriptionStatus: 'active',
        subscriptionDueDate: '2025-01-01T00:00:00.000Z',
        documents: [
            { name: "CNI (Carte Nationale d'Identité)", status: 'verified', fileUrl: '...' },
            { name: "Registre de Commerce", status: 'verified', fileUrl: '...' },
        ],
        stories: [],
        visits: 500,
        collections: [],
        isCertified: true,
    }
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
  logoUrl: '/ressources/logos/kmer-fashion.jpg',
  bannerUrl: '/ressources/banners/main-banner.jpg',
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
  customerLoyaltyProgram: { isEnabled: false, premium: { thresholds: { orders: 10, spending: 50000 }, cautionAmount: 10000, benefits: ["Livraison prioritaire", "Accès anticipé aux ventes flash"] }, premiumPlus: { isEnabled: true, annualFee: 25000, benefits: ["Tous les avantages Premium", "Livraison gratuite sur 5 commandes", "Support client dédié"] }},
  deliverySettings: { intraUrbanBaseFee: 1000, interUrbanBaseFee: 2500, costPerKg: 500, premiumDeliveryDiscountPercentage: 15 },
  maintenanceMode: { isEnabled: false, message: "Nous serons de retour bientôt !", reopenDate: "" },
  seo: { metaTitle: "KMER ZONE - Le meilleur du Cameroun, livré chez vous.", metaDescription: "Achetez et vendez en ligne au Cameroun. Vêtements, électronique, alimentation et plus encore.", ogImageUrl: "" },
  socialLinks: { facebook: { linkUrl: "#", iconUrl: ""}, twitter: { linkUrl: "#", iconUrl: "" }, instagram: { linkUrl: "#", iconUrl: "" } },
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
    { id: 'ad-1', imageUrl: '/ressources/banners/ad-banner-1.jpg', linkUrl: '#', location: 'homepage-banner', isActive: true },
];

export const initialPaymentMethods: PaymentMethod[] = [
    { id: 'pm1', name: 'Orange Money', imageUrl: '' },
    { id: 'pm2', name: 'MTN Mobile Money', imageUrl: '' },
    { id: 'pm3', name: 'Visa', imageUrl: '' },
    { id: 'pm4', name: 'Mastercard', imageUrl: '' },
    { id: 'pm5', name: 'PayPal', imageUrl: '' },
];

export const initialSiteActivityLogs: SiteActivityLog[] = [];