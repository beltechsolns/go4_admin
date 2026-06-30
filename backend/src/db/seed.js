import { pool, query } from '../config/db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...\n');

    // -- Clear existing data & reset sequences --
    await client.query('TRUNCATE delivery_status_history, deliveries, riders, customers, stores, admins RESTART IDENTITY CASCADE');

    // -- Admin --
    const hash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO admins (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
      ['Super Admin', 'admin@g4delivery.com', hash, 'superadmin']
    );
    console.log('✅ Admin: admin@g4delivery.com / admin123');

    // -- Customers --
    const customerNames = [
      'Abel Tesfaye', 'Meron Kebede', 'Daniel Solomon', 'Sara Bekele', 'Yonas Haile',
      'Bethlehem Assefa', 'Ephrem Girmay', 'Tsion Wondimu', 'Henok Tadesse', 'Selam Ayele',
    ];
    for (const name of customerNames) {
      await client.query(
        `INSERT INTO customers (full_name, phone, email, status, total_orders)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          name,
          `09${String(Math.floor(10000000 + Math.random() * 90000000)).slice(0, 9)}`,
          `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
          Math.random() > 0.2 ? 'Active' : 'Inactive',
          Math.floor(Math.random() * 80) + 1,
        ]
      );
    }
    console.log(`✅ ${customerNames.length} customers`);

    // -- Riders --
    const riderData = [
      ['Samuel Tadesse', 'Motorcycle', 'Central', 'Online', 4.9, 312],
      ['Daniel Mekonnen', 'Motorcycle', 'Town Center', 'Online', 4.8, 289],
      ['Meron Girma', 'Car', 'Market Area', 'Online', 4.7, 256],
      ['Yohannes Bekele', 'Motorcycle', 'Hospital Road', 'Online', 4.9, 340],
      ['Bethlehem Assefa', 'Car', 'New Road', 'Online', 4.6, 198],
      ['Kebede Desta', 'Motorcycle', 'Central', 'Offline', 4.5, 145],
      ['Hiwot Alemu', 'Bike', 'Town Center', 'Online', 4.8, 267],
      ['Tekle Berhan', 'Motorcycle', 'Market Area', 'Online', 4.4, 123],
      ['Almaz Worku', 'Car', 'Hospital Road', 'Offline', 4.7, 210],
      ['Biruk Tadese', 'Motorcycle', 'New Road', 'Online', 4.3, 89],
    ];
    for (const [name, vehicle, zone, status, rating, deliveries] of riderData) {
      await client.query(
        `INSERT INTO riders (full_name, phone, vehicle_type, zone, status, rating, total_deliveries, is_active, current_lat, current_lng)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)`,
        [
          name,
          `09${String(Math.floor(10000000 + Math.random() * 90000000)).slice(0, 9)}`,
          vehicle, zone, status, rating, deliveries,
          5.5 + Math.random() * 0.5, -0.5 + Math.random() * 0.5,
        ]
      );
    }
    console.log(`✅ ${riderData.length} riders`);

    // -- Stores --
    const storeData = [
      ['Pizza Palace', 'Restaurant', 'Main Street, Shakiso', '+251 911 111 111', 4.8],
      ['Burger House', 'Fast Food', 'Hospital Road, Shakiso', '+251 922 222 222', 4.6],
      ['Ethiopian Kitchen', 'Restaurant', 'New Road, Shakiso', '+251 933 333 333', 4.9],
      ['Shakiso Supermarket', 'Mini Market', 'Town Center, Shakiso', '+251 944 444 444', 4.7],
      ['Fresh Juice Bar', 'Beverages', 'Market Area, Shakiso', '+251 955 555 555', 4.5],
      ['Coffee & Bakery', 'Cafe', 'Near Stadium, Shakiso', '+251 966 666 666', 4.8],
      ['Tasty Bites', 'Fast Food', 'Central, Shakiso', '+251 977 777 777', 4.4],
      ['Green Grocers', 'Mini Market', 'New Road, Shakiso', '+251 988 888 888', 4.3],
    ];
    const storeIds = [];
    for (const [name, type, loc, phone, rating] of storeData) {
      const res = await client.query(
        `INSERT INTO stores (name, type, location, phone, rating)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [name, type, loc, phone, rating]
      );
      storeIds.push(res.rows[0].id);
    }
    console.log(`✅ ${storeData.length} stores`);

    // -- Categories & Products --
    const productsByStore = {
      'Pizza Palace': [
        { cat: 'Pizzas', icon: '🍕', items: [['Margherita Pizza', 250], ['Pepperoni Pizza', 320], ['Hawaiian Pizza', 300], ['Vegetarian Pizza', 280]] },
        { cat: 'Drinks', icon: '🥤', items: [['Coca Cola', 40], ['Sprite', 40], ['Mineral Water', 25]] },
      ],
      'Burger House': [
        { cat: 'Burgers', icon: '🍔', items: [['Classic Burger', 180], ['Cheese Burger', 220], ['Chicken Burger', 200], ['Double Burger', 280]] },
        { cat: 'Sides', icon: '🍟', items: [['French Fries', 60], ['Onion Rings', 70], ['Chicken Nuggets', 120]] },
      ],
      'Ethiopian Kitchen': [
        { cat: 'Main Dishes', icon: '🍲', items: [['Doro Wat', 180], ['Kitfo', 200], ['Tibs', 160], ['Shiro', 120]] },
        { cat: 'Drinks', icon: '☕', items: [['Ethiopian Coffee', 30], ['Tea', 20],['Fruit Juice', 50]] },
      ],
      'Shakiso Supermarket': [
        { cat: 'Groceries', icon: '🛒', items: [['Rice 1kg', 80], ['Sugar 1kg', 55], ['Cooking Oil 1L', 120], ['Pasta 500g', 35]] },
        { cat: 'Beverages', icon: '🧃', items: [['Milk 1L', 60], ['Juice Pack', 45], ['Water 1.5L', 25]] },
      ],
      'Fresh Juice Bar': [
        { cat: 'Juices', icon: '🧃', items: [['Mango Juice', 70], ['Avocado Juice', 80], ['Mix Fruit Juice', 90], ['Orange Juice', 60]] },
        { cat: 'Smoothies', icon: '🥤', items: [['Berry Smoothie', 100], ['Banana Smoothie', 85], ['Green Smoothie', 95]] },
      ],
      'Coffee & Bakery': [
        { cat: 'Coffee', icon: '☕', items: [['Espresso', 35], ['Cappuccino', 50], ['Latte', 55], ['Americano', 40]] },
        { cat: 'Pastries', icon: '🥐', items: [['Croissant', 45], ['Donut', 35], ['Muffin', 40], ['Bagel', 50]] },
      ],
      'Tasty Bites': [
        { cat: 'Snacks', icon: '🥨', items: [['Samosa', 25], ['Spring Roll', 30], ['Puff Pastry', 35], ['Sandwich', 60]] },
      ],
      'Green Grocers': [
        { cat: 'Fruits', icon: '🍎', items: [['Apple 1kg', 120], ['Banana bunch', 60], ['Orange 1kg', 100], ['Grapes 1kg', 150]] },
        { cat: 'Vegetables', icon: '🥬', items: [['Tomato 1kg', 50], ['Onion 1kg', 40], ['Potato 1kg', 35], ['Lettuce', 30]] },
      ],
    };

    let productCount = 0;
    for (const [storeName, categories] of Object.entries(productsByStore)) {
      const storeRes = await client.query(`SELECT id FROM stores WHERE name = $1`, [storeName]);
      const storeId = storeRes.rows[0]?.id;
      if (!storeId) continue;

      for (const cat of categories) {
        const catRes = await client.query(
          `INSERT INTO categories (store_id, name, icon) VALUES ($1, $2, $3) RETURNING id`,
          [storeId, cat.cat, cat.icon]
        );
        const catId = catRes.rows[0].id;

        for (const [name, price] of cat.items) {
          await client.query(
            `INSERT INTO products (store_id, category_id, name, category, price, emoji, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'Active')`,
            [storeId, catId, name, cat.cat, price, cat.icon]
          );
          productCount++;
        }
      }
    }
    console.log(`✅ ${productCount} products`);

    // -- Deliveries (last 30 days) --
    const statuses = ['Pending', 'Accepted', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'];
    const riderIds = Array.from({ length: 10 }, (_, i) => i + 1);
    const customerIds = Array.from({ length: 10 }, (_, i) => i + 1);
    let deliveryCount = 0;

    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      const ordersToday = Math.floor(Math.random() * 12) + 3;

      for (let o = 0; o < ordersToday; o++) {
        const hour = Math.floor(Math.random() * 14) + 7;
        const minute = Math.floor(Math.random() * 60);
        const createdAt = new Date(date);
        createdAt.setHours(hour, minute, 0, 0);

        const riderId = riderIds[Math.floor(Math.random() * riderIds.length)];
        const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
        const storeId = storeIds[Math.floor(Math.random() * storeIds.length)];
        const amount = Math.floor(Math.random() * 800) + 100;
        const status = dayOffset < 2
          ? statuses[Math.floor(Math.random() * 5)] // recent orders may be in progress
          : 'Delivered';
        const customerName = customerNames[customerId - 1];
        const riderName = riderData[riderId - 1][0];

        const res = await client.query(
          `INSERT INTO deliveries (order_number, customer_id, customer_name, rider_id, rider_name, store_id, location, amount, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) RETURNING id`,
          [
            `${String(1000 + deliveryCount)}`,
            customerId, customerName, riderId, riderName, storeId,
            `Location ${Math.floor(Math.random() * 20) + 1}`,
            amount, status, createdAt,
          ]
        );

        // Add status history
        await client.query(
          `INSERT INTO delivery_status_history (delivery_id, status, created_at)
           VALUES ($1, $2, $3)`,
          [res.rows[0].id, status, createdAt]
        );

        deliveryCount++;
      }
    }
    console.log(`✅ ${deliveryCount} deliveries`);

    console.log('\n🎉 Seed complete!');
  } catch (err) {
    console.error('💥 Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
