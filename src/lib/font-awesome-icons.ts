import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faWallet,
  faMoneyBill,
  faCoins,
  faHandHoldingDollar,
  faPiggyBank,
  faChartLine,
  faArrowTrendUp,
  faCar,
  faBus,
  faTaxi,
  faGasPump,
  faBicycle,
  faUtensils,
  faCoffee,
  faBurger,
  faPizzaSlice,
  faIceCream,
  faShoppingCart,
  faShoppingBag,
  faBagShopping,
  faShirt,
  faGift,
  faFilm,
  faGamepad,
  faMusic,
  faTv,
  faHouse,
  faBolt,
  faWifi,
  faPhone,
  faHeartPulse,
  faPills,
  faStethoscope,
  faHospital,
  faGraduationCap,
  faBook,
  faPenToSquare,
  faLaptop,
  faBriefcase,
  faBuilding,
  faChartBar,
  faMoneyBillTrendUp,
  faCreditCard,
  faReceipt,
  faFileInvoiceDollar,
  faSackDollar,
  faLandmark,
  faUniversity,
  faUserTie,
  faPlaneDeparture,
  faUmbrella,
  faTicket,
  faHotel,
  faDumbbell,
  faFutbol,
  faPaw,
  faBone,
  faDog,
  faCat,
  faTree,
  faSeedling,
  faLeaf,
  faTruck,
  faScrewdriverWrench,
  faGear,
  faPaintbrush,
  faPalette,
  faCamera,
  faGuitar,
  faMicrophone,
  faHeadphones,
  faBell,
  faCalendar,
  faClock,
  faHeart,
  faStar,
  faFire,
  faGem,
  faCrown,
  faTrophy,
  faMedal,
  faRocket,
  faGlobe,
  faMapPin,
} from '@fortawesome/free-solid-svg-icons';

export interface IconData {
  name: string;
  icon: IconDefinition;
  category: 'income' | 'expense' | 'general';
  keywords: string[];
  displayName: string;
}

export const FONT_AWESOME_ICONS: IconData[] = [
  // Income & Money
  { name: 'wallet', icon: faWallet, category: 'income', keywords: ['wallet', 'dompet', 'money', 'uang'], displayName: 'Dompet' },
  { name: 'money-bill', icon: faMoneyBill, category: 'income', keywords: ['money', 'uang', 'cash', 'tunai', 'bill'], displayName: 'Uang' },
  { name: 'coins', icon: faCoins, category: 'income', keywords: ['coins', 'koin', 'money', 'uang'], displayName: 'Koin' },
  { name: 'hand-holding-dollar', icon: faHandHoldingDollar, category: 'income', keywords: ['salary', 'gaji', 'income', 'pemasukan', 'payment'], displayName: 'Gaji' },
  { name: 'piggy-bank', icon: faPiggyBank, category: 'income', keywords: ['saving', 'tabungan', 'bank', 'simpanan'], displayName: 'Tabungan' },
  { name: 'chart-line', icon: faChartLine, category: 'income', keywords: ['investment', 'investasi', 'profit', 'untung', 'growth'], displayName: 'Investasi' },
  { name: 'arrow-trend-up', icon: faArrowTrendUp, category: 'income', keywords: ['growth', 'pertumbuhan', 'increase', 'naik'], displayName: 'Naik' },
  { name: 'sack-dollar', icon: faSackDollar, category: 'income', keywords: ['money', 'uang', 'wealth', 'kaya'], displayName: 'Kekayaan' },
  { name: 'landmark', icon: faLandmark, category: 'income', keywords: ['bank', 'financial', 'keuangan'], displayName: 'Bank' },
  { name: 'money-bill-trend-up', icon: faMoneyBillTrendUp, category: 'income', keywords: ['profit', 'untung', 'income', 'pemasukan'], displayName: 'Profit' },

  // Transportation
  { name: 'car', icon: faCar, category: 'expense', keywords: ['car', 'mobil', 'transport', 'transportasi', 'vehicle'], displayName: 'Mobil' },
  { name: 'bus', icon: faBus, category: 'expense', keywords: ['bus', 'transport', 'transportasi', 'public'], displayName: 'Bus' },
  { name: 'taxi', icon: faTaxi, category: 'expense', keywords: ['taxi', 'transport', 'transportasi', 'ride'], displayName: 'Taksi' },
  { name: 'gas-pump', icon: faGasPump, category: 'expense', keywords: ['gas', 'bensin', 'fuel', 'bbm', 'petrol'], displayName: 'Bensin' },
  { name: 'bicycle', icon: faBicycle, category: 'expense', keywords: ['bicycle', 'sepeda', 'bike', 'transport'], displayName: 'Sepeda' },
  { name: 'truck', icon: faTruck, category: 'expense', keywords: ['truck', 'truk', 'delivery', 'pengiriman'], displayName: 'Truk' },

  // Food & Dining
  { name: 'utensils', icon: faUtensils, category: 'expense', keywords: ['food', 'makanan', 'eat', 'makan', 'restaurant'], displayName: 'Makanan' },
  { name: 'coffee', icon: faCoffee, category: 'expense', keywords: ['coffee', 'kopi', 'drink', 'minuman', 'cafe'], displayName: 'Kopi' },
  { name: 'burger', icon: faBurger, category: 'expense', keywords: ['burger', 'fast food', 'junk food'], displayName: 'Burger' },
  { name: 'pizza', icon: faPizzaSlice, category: 'expense', keywords: ['pizza', 'food', 'makanan'], displayName: 'Pizza' },
  { name: 'ice-cream', icon: faIceCream, category: 'expense', keywords: ['ice cream', 'es krim', 'dessert'], displayName: 'Es Krim' },

  // Shopping
  { name: 'shopping-cart', icon: faShoppingCart, category: 'expense', keywords: ['shopping', 'belanja', 'cart', 'keranjang'], displayName: 'Belanja' },
  { name: 'shopping-bag', icon: faShoppingBag, category: 'expense', keywords: ['shopping', 'belanja', 'bag', 'tas'], displayName: 'Tas Belanja' },
  { name: 'bag-shopping', icon: faBagShopping, category: 'expense', keywords: ['shopping', 'belanja', 'purchase'], displayName: 'Belanja' },
  { name: 'shirt', icon: faShirt, category: 'expense', keywords: ['clothes', 'pakaian', 'fashion', 'shirt'], displayName: 'Pakaian' },
  { name: 'gift', icon: faGift, category: 'expense', keywords: ['gift', 'hadiah', 'present', 'kado'], displayName: 'Hadiah' },

  // Entertainment
  { name: 'film', icon: faFilm, category: 'expense', keywords: ['movie', 'film', 'cinema', 'bioskop', 'entertainment'], displayName: 'Film' },
  { name: 'gamepad', icon: faGamepad, category: 'expense', keywords: ['game', 'gaming', 'play', 'main'], displayName: 'Game' },
  { name: 'music', icon: faMusic, category: 'expense', keywords: ['music', 'musik', 'entertainment'], displayName: 'Musik' },
  { name: 'tv', icon: faTv, category: 'expense', keywords: ['tv', 'television', 'entertainment'], displayName: 'TV' },
  { name: 'guitar', icon: faGuitar, category: 'expense', keywords: ['guitar', 'gitar', 'music', 'musik'], displayName: 'Gitar' },
  { name: 'microphone', icon: faMicrophone, category: 'expense', keywords: ['mic', 'karaoke', 'music'], displayName: 'Mikrofon' },
  { name: 'headphones', icon: faHeadphones, category: 'expense', keywords: ['headphone', 'music', 'audio'], displayName: 'Headphone' },

  // Home & Utilities
  { name: 'house', icon: faHouse, category: 'expense', keywords: ['home', 'rumah', 'house', 'rent', 'sewa'], displayName: 'Rumah' },
  { name: 'bolt', icon: faBolt, category: 'expense', keywords: ['electricity', 'listrik', 'power', 'utility'], displayName: 'Listrik' },
  { name: 'wifi', icon: faWifi, category: 'expense', keywords: ['internet', 'wifi', 'connection'], displayName: 'Internet' },
  { name: 'phone', icon: faPhone, category: 'expense', keywords: ['phone', 'telepon', 'call', 'mobile'], displayName: 'Telepon' },

  // Health
  { name: 'heart-pulse', icon: faHeartPulse, category: 'expense', keywords: ['health', 'kesehatan', 'medical', 'medis'], displayName: 'Kesehatan' },
  { name: 'pills', icon: faPills, category: 'expense', keywords: ['medicine', 'obat', 'pills', 'health'], displayName: 'Obat' },
  { name: 'stethoscope', icon: faStethoscope, category: 'expense', keywords: ['doctor', 'dokter', 'medical', 'health'], displayName: 'Dokter' },
  { name: 'hospital', icon: faHospital, category: 'expense', keywords: ['hospital', 'rumah sakit', 'medical'], displayName: 'Rumah Sakit' },

  // Education
  { name: 'graduation-cap', icon: faGraduationCap, category: 'expense', keywords: ['education', 'pendidikan', 'school', 'sekolah', 'university'], displayName: 'Pendidikan' },
  { name: 'book', icon: faBook, category: 'expense', keywords: ['book', 'buku', 'reading', 'study'], displayName: 'Buku' },
  { name: 'pen-to-square', icon: faPenToSquare, category: 'expense', keywords: ['write', 'tulis', 'study', 'belajar'], displayName: 'Tulis' },
  { name: 'laptop', icon: faLaptop, category: 'expense', keywords: ['laptop', 'computer', 'tech', 'teknologi'], displayName: 'Laptop' },

  // Work & Business
  { name: 'briefcase', icon: faBriefcase, category: 'general', keywords: ['work', 'kerja', 'business', 'bisnis', 'job'], displayName: 'Kerja' },
  { name: 'building', icon: faBuilding, category: 'general', keywords: ['office', 'kantor', 'building', 'gedung'], displayName: 'Kantor' },
  { name: 'chart-bar', icon: faChartBar, category: 'general', keywords: ['analytics', 'analitik', 'business', 'data'], displayName: 'Analitik' },
  { name: 'user-tie', icon: faUserTie, category: 'general', keywords: ['professional', 'profesional', 'business'], displayName: 'Profesional' },

  // Finance & Bills
  { name: 'credit-card', icon: faCreditCard, category: 'expense', keywords: ['credit card', 'kartu kredit', 'payment', 'pembayaran'], displayName: 'Kartu Kredit' },
  { name: 'receipt', icon: faReceipt, category: 'expense', keywords: ['receipt', 'struk', 'bill', 'tagihan'], displayName: 'Struk' },
  { name: 'file-invoice-dollar', icon: faFileInvoiceDollar, category: 'expense', keywords: ['invoice', 'bill', 'tagihan', 'payment'], displayName: 'Tagihan' },

  // Travel
  { name: 'plane-departure', icon: faPlaneDeparture, category: 'expense', keywords: ['travel', 'perjalanan', 'flight', 'plane', 'pesawat'], displayName: 'Pesawat' },
  { name: 'umbrella-beach', icon: faUmbrella, category: 'expense', keywords: ['vacation', 'liburan', 'holiday', 'beach'], displayName: 'Liburan' },
  { name: 'ticket', icon: faTicket, category: 'expense', keywords: ['ticket', 'tiket', 'event'], displayName: 'Tiket' },
  { name: 'hotel', icon: faHotel, category: 'expense', keywords: ['hotel', 'accommodation', 'penginapan'], displayName: 'Hotel' },

  // Sports & Fitness
  { name: 'dumbbell', icon: faDumbbell, category: 'expense', keywords: ['gym', 'fitness', 'exercise', 'olahraga'], displayName: 'Gym' },
  { name: 'futbol', icon: faFutbol, category: 'expense', keywords: ['sport', 'olahraga', 'football', 'soccer'], displayName: 'Sepak Bola' },

  // Pets
  { name: 'paw', icon: faPaw, category: 'expense', keywords: ['pet', 'hewan peliharaan', 'animal'], displayName: 'Hewan' },
  { name: 'dog', icon: faDog, category: 'expense', keywords: ['dog', 'anjing', 'pet'], displayName: 'Anjing' },
  { name: 'cat', icon: faCat, category: 'expense', keywords: ['cat', 'kucing', 'pet'], displayName: 'Kucing' },

  // Nature & Garden
  { name: 'tree', icon: faTree, category: 'expense', keywords: ['tree', 'pohon', 'nature', 'alam'], displayName: 'Pohon' },
  { name: 'seedling', icon: faSeedling, category: 'expense', keywords: ['plant', 'tanaman', 'garden', 'taman'], displayName: 'Tanaman' },
  { name: 'leaf', icon: faLeaf, category: 'general', keywords: ['nature', 'alam', 'eco', 'environment'], displayName: 'Daun' },

  // Tools & Maintenance
  { name: 'screwdriver-wrench', icon: faScrewdriverWrench, category: 'expense', keywords: ['tools', 'alat', 'repair', 'perbaikan', 'maintenance'], displayName: 'Alat' },
  { name: 'gear', icon: faGear, category: 'general', keywords: ['settings', 'pengaturan', 'config'], displayName: 'Pengaturan' },
  { name: 'paintbrush', icon: faPaintbrush, category: 'expense', keywords: ['paint', 'cat', 'art', 'seni'], displayName: 'Cat' },
  { name: 'palette', icon: faPalette, category: 'expense', keywords: ['art', 'seni', 'creative', 'kreatif'], displayName: 'Seni' },
  { name: 'camera', icon: faCamera, category: 'expense', keywords: ['camera', 'kamera', 'photo', 'foto'], displayName: 'Kamera' },

  // General
  { name: 'bell', icon: faBell, category: 'general', keywords: ['notification', 'notifikasi', 'alert', 'reminder'], displayName: 'Notifikasi' },
  { name: 'calendar', icon: faCalendar, category: 'general', keywords: ['calendar', 'kalender', 'date', 'tanggal'], displayName: 'Kalender' },
  { name: 'clock', icon: faClock, category: 'general', keywords: ['time', 'waktu', 'clock', 'jam'], displayName: 'Jam' },
  { name: 'heart', icon: faHeart, category: 'general', keywords: ['heart', 'love', 'cinta', 'favorite'], displayName: 'Hati' },
  { name: 'star', icon: faStar, category: 'general', keywords: ['star', 'bintang', 'favorite', 'rating'], displayName: 'Bintang' },
  { name: 'fire', icon: faFire, category: 'general', keywords: ['fire', 'api', 'hot', 'popular'], displayName: 'Api' },
  { name: 'gem', icon: faGem, category: 'general', keywords: ['gem', 'permata', 'diamond', 'precious'], displayName: 'Permata' },
  { name: 'crown', icon: faCrown, category: 'general', keywords: ['crown', 'mahkota', 'premium', 'king'], displayName: 'Mahkota' },
  { name: 'trophy', icon: faTrophy, category: 'general', keywords: ['trophy', 'trofi', 'award', 'achievement'], displayName: 'Trofi' },
  { name: 'medal', icon: faMedal, category: 'general', keywords: ['medal', 'medali', 'award', 'achievement'], displayName: 'Medali' },
  { name: 'rocket', icon: faRocket, category: 'general', keywords: ['rocket', 'roket', 'fast', 'growth'], displayName: 'Roket' },
  { name: 'globe', icon: faGlobe, category: 'general', keywords: ['globe', 'dunia', 'world', 'international'], displayName: 'Dunia' },
  { name: 'map-pin', icon: faMapPin, category: 'general', keywords: ['location', 'lokasi', 'place', 'tempat'], displayName: 'Lokasi' },
];

// Helper to get icon by name
export function getIconByName(name: string): IconDefinition | null {
  const iconData = FONT_AWESOME_ICONS.find(icon => icon.name === name);
  return iconData?.icon || null;
}

// Helper to get icon data by name
export function getIconDataByName(name: string): IconData | null {
  return FONT_AWESOME_ICONS.find(icon => icon.name === name) || null;
}

// Filter icons by search query
export function searchIcons(query: string): IconData[] {
  if (!query.trim()) return FONT_AWESOME_ICONS;
  
  const lowerQuery = query.toLowerCase();
  return FONT_AWESOME_ICONS.filter(icon =>
    icon.displayName.toLowerCase().includes(lowerQuery) ||
    icon.name.toLowerCase().includes(lowerQuery) ||
    icon.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
}

// Filter icons by category
export function getIconsByCategory(category: IconData['category']): IconData[] {
  return FONT_AWESOME_ICONS.filter(icon => icon.category === category);
}
