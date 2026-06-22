export const dashboardCards = [
  { title: 'Total Orders', value: '1,245' },
  { title: 'Active Deliveries', value: '53' },
  { title: 'Available Riders', value: '22' },
  { title: 'Total Revenue', value: 'ETB 125,000' },
]

export const dailyOrders = [
  { day: 'Mon', h: '45%' },
  { day: 'Tue', h: '55%' },
  { day: 'Wed', h: '48%' },
  { day: 'Thu', h: '65%' },
  { day: 'Fri', h: '72%' },
  { day: 'Sat', h: '88%' },
  { day: 'Sun', h: '78%' },
]

export const recentActivity = [
  { t: 'Order #452 assigned to Rider Samuel', m: '2 min ago' },
  { t: 'Order #453 delivered successfully', m: '5 min ago' },
  { t: 'New customer registered: Abel T.', m: '12 min ago' },
  { t: 'Order #451 picked up by Rider Meron', m: '18 min ago' },
]

export const customers = [
  { n: 'Abel Tesfaye', p: '0911234567', o: 23, s: 'Active', d: '2024-03-15' },
  { n: 'Meron Kebede', p: '0922345678', o: 45, s: 'Active', d: '2024-01-10' },
  { n: 'Daniel Solomon', p: '0933456789', o: 12, s: 'Active', d: '2024-05-20' },
  { n: 'Sara Bekele', p: '0944567890', o: 67, s: 'Active', d: '2023-11-05' },
  { n: 'Yonas Haile', p: '0955678901', o: 8, s: 'Inactive', d: '2024-06-01' },
]

export const riders = [
  { n: 'Samuel Tadesse', v: 'Bike', z: 'Central Shakiso', d: 230, r: '4.8', s: 'Online' },
  { n: 'Daniel Mekonnen', v: 'Bike', z: 'Town Center', d: 189, r: '4.9', s: 'Online' },
  { n: 'Meron Girma', v: 'Car', z: 'Market Area', d: 156, r: '4.7', s: 'Offline' },
  { n: 'Yohannes Bekele', v: 'Bike', z: 'Hospital Road', d: 312, r: '4.9', s: 'Busy' },
  { n: 'Bethlehem Assefa', v: 'Car', z: 'New Road', d: 98, r: '4.6', s: 'Online' },
]

export const deliveries = [
  { id: '#120', c: 'Abel Tesfaye', r: 'Samuel Tadesse', l: 'Near Stadium', a: 'ETB 743', s: 'In Transit' },
  { id: '#121', c: 'Meron Kebede', r: 'Daniel Mekonnen', l: 'Town Center', a: 'ETB 733', s: 'Delivered' },
  { id: '#122', c: 'Sara Bekele', r: 'Assign Rider', l: 'Market Area', a: 'ETB 586', s: 'Pending' },
  { id: '#123', c: 'Yonas Haile', r: 'Yohannes Bekele', l: 'Hospital Road', a: 'ETB 290', s: 'Picked Up' },
  { id: '#124', c: 'Daniel Solomon', r: 'Bethlehem Assefa', l: 'New Road', a: 'ETB 410', s: 'In Transit' },
]

export const stores = [
  { n: 'Pizza Palace', type: 'Restaurant', loc: 'Main Street, Shakiso', tel: '+251 911 111 111', pCount: 25, r: '4.8', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=200&fit=crop' },
  { n: 'Burger House', type: 'Fast Food', loc: 'Hospital Road, Shakiso', tel: '+251 922 222 222', pCount: 18, r: '4.6', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=200&fit=crop' },
  { n: 'Ethiopian Kitchen', type: 'Restaurant', loc: 'New Road, Shakiso', tel: '+251 933 333 333', pCount: 32, r: '4.9', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=200&fit=crop' },
  { n: 'Shakiso Supermarket', type: 'Mini Market', loc: 'Town Center, Shakiso', tel: '+251 944 444 444', pCount: 150, r: '4.7', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=200&fit=crop' },
  { n: 'Fresh Juice Bar', type: 'Beverages', loc: 'Market Area, Shakiso', tel: '+251 955 555 555', pCount: 12, r: '4.5', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=200&fit=crop' },
  { n: 'Coffee & Bakery', type: 'Cafe', loc: 'Near Stadium, Shakiso', tel: '+251 966 666 666', pCount: 20, r: '4.8', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=200&fit=crop' },
]

export const storeProducts = [
  { n: 'Cheese Burger', c: 'Burgers', p: 'ETB 180', s: 'Active', emoji: '🍔' },
  { n: 'Double Burger', c: 'Burgers', p: 'ETB 250', s: 'Active', emoji: '🍔' },
  { n: 'Chicken Burger', c: 'Burgers', p: 'ETB 200', s: 'Active', emoji: '🍔' },
  { n: 'French Fries', c: 'Sides', p: 'ETB 60', s: 'Active', emoji: '🍟' },
  { n: 'Onion Rings', c: 'Sides', p: 'ETB 70', s: 'Active', emoji: '🧅' },
]
