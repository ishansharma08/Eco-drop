// Mock data for EcoDrop waste management app

export interface WasteCategory {
  id: string;
  name: string;
  unit: 'kg' | 'count';
  pointsPerUnit: number;
  icon: string;
  color: string;
}

export interface BinStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  isActive: boolean;
  hours: string;
  supportedCategories: string[];
  distance?: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  stock: number;
  vendor: string;
  image: string;
}

export interface DropoffSchedule {
  id: string;
  stationName: string;
  scheduledAt: Date;
  items: Array<{
    categoryId: string;
    categoryName: string;
    declaredQty: number;
    unit: string;
  }>;
  status: 'PENDING' | 'CHECKED_IN' | 'CANCELLED';
  totalPoints?: number;
}

export const wasteCategories: WasteCategory[] = [
  {
    id: 'plastic',
    name: 'Plastic Bottles',
    unit: 'kg',
    pointsPerUnit: 10,
    icon: '/images/vectors/plastic-bottle.svg',
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'paper',
    name: 'Paper & Cardboard',
    unit: 'kg',
    pointsPerUnit: 8,
    icon: '/images/vectors/cardboard-box.svg',
    color: 'from-amber-400 to-orange-500'
  },
  {
    id: 'glass',
    name: 'Glass Containers',
    unit: 'kg',
    pointsPerUnit: 12,
    icon: '/images/vectors/glass-bottle.svg',
    color: 'from-emerald-400 to-green-600'
  },
  {
    id: 'metal',
    name: 'Metal Cans',
    unit: 'kg',
    pointsPerUnit: 18,
    icon: '/images/vectors/aluminum-can.svg',
    color: 'from-gray-400 to-slate-600'
  },
  {
    id: 'ewaste',
    name: 'Electronics',
    unit: 'count',
    pointsPerUnit: 50,
    icon: '/images/vectors/smartphone.svg',
    color: 'from-purple-400 to-indigo-600'
  },
  {
    id: 'books',
    name: 'Books & Magazines',
    unit: 'kg',
    pointsPerUnit: 9,
    icon: '/images/vectors/books.svg',
    color: 'from-red-400 to-rose-600'
  }
];

export const binStations: BinStation[] = [
  {
    id: 'station-1',
    name: 'Manipal University Jaipur Campus',
    address: 'Dehmi Kalan, Near GVK Toll Plaza, Jaipur-Delhi Highway, Jaipur, Rajasthan 303007',
    lat: 26.9124,
    lng: 75.7873,
    isActive: true,
    hours: '6:00 AM - 8:00 PM',
    supportedCategories: ['plastic', 'paper', 'glass', 'metal'],
    distance: 0.2
  },
  {
    id: 'station-2',
    name: 'Jaipur City Recycling Hub',
    address: 'C-Scheme, Near Central Park, Jaipur, Rajasthan 302001',
    lat: 26.9220,
    lng: 75.7785,
    isActive: true,
    hours: '24/7',
    supportedCategories: ['plastic', 'paper', 'glass', 'metal', 'ewaste', 'books'],
    distance: 1.8
  },
  {
    id: 'station-3',
    name: 'Bagru Industrial Area Station',
    address: 'Bagru Industrial Area, Near RIICO Office, Jaipur, Rajasthan 303007',
    lat: 26.9056,
    lng: 75.8123,
    isActive: true,
    hours: '7:00 AM - 6:00 PM',
    supportedCategories: ['plastic', 'paper', 'glass'],
    distance: 2.5
  },
  {
    id: 'station-4',
    name: 'IT Park E-Waste Center',
    address: 'Mahindra World City, Near Sitapura Industrial Area, Jaipur, Rajasthan 302022',
    lat: 26.8500,
    lng: 75.8000,
    isActive: true,
    hours: '9:00 AM - 7:00 PM',
    supportedCategories: ['ewaste', 'metal'],
    distance: 4.2
  }
];

export const rewards: Reward[] = [
  {
    id: 'reward-1',
    name: 'Free Medium Cappuccino',
    description: 'Enjoy a medium beverage of your choice at participating cafes',
    pointsCost: 150,
    stock: 45,
    vendor: 'Café Coffee Day',
    image: '/images/reward-coffee.jpg'
  },
  {
    id: 'reward-2',
    name: 'Jaipur Metro Day Pass',
    description: 'Unlimited travel across Jaipur Metro lines for one full day',
    pointsCost: 250,
    stock: 60,
    vendor: 'Jaipur Metro Rail Corp',
    image: '/images/reward-metro.jpg'
  },
  {
    id: 'reward-3',
    name: '₹100 Grocery Voucher',
    description: 'Redeem on fresh produce and essentials above ₹499',
    pointsCost: 300,
    stock: 25,
    vendor: 'Reliance Fresh',
    image: '/images/reward-grocery.jpg'
  },
  {
    id: 'reward-4',
    name: 'Organic Tea Tin',
    description: 'Premium organic tulsi green tea for your daily routine',
    pointsCost: 400,
    stock: 18,
    vendor: 'Organic India',
    image: '/images/reward-tea.jpg'
  },
  {
    id: 'reward-5',
    name: 'Bamboo Travel Cutlery Set',
    description: 'Reusable fork, spoon, knife, straw, and pouch for daily carry',
    pointsCost: 650,
    stock: 15,
    vendor: 'EcoLife Store',
    image: '/images/reward-bamboo.jpg'
  },
  {
    id: 'reward-6',
    name: 'Movie Ticket Discount',
    description: 'Use this voucher toward standard 2D or 3D movie tickets',
    pointsCost: 450,
    stock: 20,
    vendor: 'PVR INOX Cinemas',
    image: '/images/reward-movie.jpg'
  },
  {
    id: 'reward-7',
    name: 'Green Packaging Credit',
    description: 'Discount for restaurants using 100% plastic-free packaging',
    pointsCost: 200,
    stock: 50,
    vendor: 'Zomato Green',
    image: '/images/reward-food.jpg'
  },
  {
    id: 'reward-8',
    name: 'Sports Gear Voucher',
    description: 'Save on cycling, running, and hiking gear at Decathlon',
    pointsCost: 350,
    stock: 30,
    vendor: 'Decathlon India',
    image: '/images/reward-bike.jpg'
  }
];

export const userHistory: DropoffSchedule[] = [
  {
    id: 'drop-1',
    stationName: 'Green Valley Community Center',
    scheduledAt: new Date('2024-01-15T14:30:00'),
    items: [
      { categoryId: 'plastic', categoryName: 'Plastic Bottles', declaredQty: 2.5, unit: 'kg' },
      { categoryId: 'paper', categoryName: 'Paper & Cardboard', declaredQty: 4.0, unit: 'kg' }
    ],
    status: 'CHECKED_IN',
    totalPoints: 57
  },
  {
    id: 'drop-2',
    stationName: 'Jaipur City Recycling Hub',
    scheduledAt: new Date('2024-01-20T10:00:00'),
    items: [
      { categoryId: 'ewaste', categoryName: 'Electronics', declaredQty: 1, unit: 'count' }
    ],
    status: 'CHECKED_IN',
    totalPoints: 50
  },
  {
    id: 'drop-3',
    stationName: 'Manipal University Jaipur Campus',
    scheduledAt: new Date('2024-01-25T16:00:00'),
    items: [
      { categoryId: 'glass', categoryName: 'Glass Containers', declaredQty: 1.8, unit: 'kg' }
    ],
    status: 'PENDING'
  }
];

export const userProfile = {
  name: 'Ishan Parikh',
  email: 'ishan.parikh@example.com',
  pointsBalance: 847,
  totalDropoffs: 12,
  totalPointsEarned: 1250,
  totalWasteRecycled: 45.6, // kg
  joinedDate: new Date('2023-11-01'),
  locality: 'Bagru',
  address: 'Manipal University Jaipur'
};