/**
 * Script para insertar códigos promocionales de prueba en MongoDB
 * 
 * Uso:
 * 1. Asegurar que MongoDB está corriendo
 * 2. Configurar MONGODB_URI en .env
 * 3. Ejecutar: node scripts/seedDatabase.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import PromotionalCode from '../models/PromotionalCode.js';

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plop-sorteos';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    // Clear existing codes
    await PromotionalCode.deleteMany({});
    console.log('Cleared existing promotional codes');

    // Sample promotional codes
    const samples = [
      {
        code: '6X85Y72D',
        prize: {
          type: 'TV',
          description: 'Samsung 55 pulgadas 4K',
        },
        maxUses: 1,
        usedCount: 0,
        expirationDate: new Date('2025-12-31').toISOString(),
        isActive: true,
        product: 'MAX-FL MEDIANO',
      },
      {
        code: 'VIAJE2024',
        prize: {
          type: 'VIAJE',
          description: 'Viaje a Cancún 5 días para 2 personas',
        },
        maxUses: 2,
        usedCount: 0,
        expirationDate: new Date('2025-06-30').toISOString(),
        isActive: true,
        product: 'MAX-FL GRANDE',
      },
      {
        code: 'SONIDO999',
        prize: {
          type: 'EQUIPOS_SONIDO',
          description: 'Sistema de sonido Sony Surround 7.1',
        },
        maxUses: 3,
        usedCount: 0,
        expirationDate: new Date('2025-12-31').toISOString(),
        isActive: true,
        product: 'MAX-FL MEDIANO',
      },
      {
        code: 'PLAYSTATION5',
        prize: {
          type: 'CONSOLA',
          description: 'PlayStation 5 con 2 controles',
        },
        maxUses: 1,
        usedCount: 0,
        expirationDate: new Date('2025-12-31').toISOString(),
        isActive: true,
        product: 'MAX-FL GRANDE',
      },
      {
        code: 'IPHONE15PRO',
        prize: {
          type: 'TELEFONO',
          description: 'iPhone 15 Pro 512GB Color Space Black',
        },
        maxUses: 1,
        usedCount: 0,
        expirationDate: new Date('2025-12-31').toISOString(),
        isActive: true,
        product: 'MAX-FL PREMIUM',
      },
      {
        code: 'LAPTOP2024',
        prize: {
          type: 'LAPTOP',
          description: 'MacBook Pro 16 pulgadas M3 Max',
        },
        maxUses: 1,
        usedCount: 0,
        expirationDate: new Date('2025-12-31').toISOString(),
        isActive: true,
        product: 'MAX-FL PREMIUM',
      },
      {
        code: 'EXPIRED2024',
        prize: {
          type: 'DESCUENTO',
          description: 'Este código ya expiró',
        },
        maxUses: 5,
        usedCount: 0,
        expirationDate: new Date('2023-12-31').toISOString(),
        isActive: true,
        product: 'MAX-FL PEQUEÑO',
      },
      {
        code: 'MAXUSED2024',
        prize: {
          type: 'TV',
          description: 'LG OLED 65 pulgadas',
        },
        maxUses: 2,
        usedCount: 2,
        expirationDate: new Date('2025-12-31').toISOString(),
        isActive: true,
        product: 'MAX-FL MEDIANO',
      },
    ];

    const created = await PromotionalCode.insertMany(samples);
    console.log(`✓ ${created.length} promotional codes inserted successfully`);

    samples.forEach((code, index) => {
      console.log(`  ${index + 1}. ${code.code} - ${code.prize.type} - Expires: ${code.expirationDate}`);
    });
  } catch (error) {
    console.error('✗ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnection();
    process.exit(0);
  }
};

connectDatabase().then(() => seedDatabase());
