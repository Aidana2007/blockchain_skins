const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Skin = require('../backend/models/Skin');
const initialSkins = [
  {
    name: 'Dragon Lore AWP',
    description: 'Legendary sniper rifle skin with dragon artwork',
    priceSTM: 5000,
    tokenId: 1,
    imageUrl: '/images/skins/dragon-lore.png',
    rarity: 'Legendary',
    category: 'Weapon'
  },
  {
    name: 'Fade Butterfly Knife',
    description: 'Colorful gradient knife with smooth animation',
    priceSTM: 3500,
    tokenId: 2,
    imageUrl: '/images/skins/fade-knife.png',
    rarity: 'Epic',
    category: 'Weapon'
  },
  {
    name: 'Asiimov M4A4',
    description: 'Futuristic assault rifle with orange and white design',
    priceSTM: 2000,
    tokenId: 3,
    imageUrl: '/images/skins/asiimov-m4.png',
    rarity: 'Epic',
    category: 'Weapon'
  },
  {
    name: 'Hyper Beast AK-47',
    description: 'Colorful beast-themed rifle skin',
    priceSTM: 2500,
    tokenId: 4,
    imageUrl: '/images/skins/hyperbeast-ak.png',
    rarity: 'Epic',
    category: 'Weapon'
  },
  {
    name: 'Neo-Noir Desert Eagle',
    description: 'Dark comic book style pistol',
    priceSTM: 1500,
    tokenId: 5,
    imageUrl: '/images/skins/neonoir-deagle.png',
    rarity: 'Rare',
    category: 'Weapon'
  },
  {
    name: 'Redline AK-47',
    description: 'Classic red stripe design',
    priceSTM: 1000,
    tokenId: 6,
    imageUrl: '/images/skins/redline-ak.png',
    rarity: 'Rare',
    category: 'Weapon'
  },
  {
    name: 'Vulcan AK-47',
    description: 'Blue and orange sci-fi themed rifle',
    priceSTM: 1800,
    tokenId: 7,
    imageUrl: '/images/skins/vulcan-ak.png',
    rarity: 'Epic',
    category: 'Weapon'
  },
  {
    name: 'Fire Serpent AK-47',
    description: 'Red dragon design with golden accents',
    priceSTM: 4000,
    tokenId: 8,
    imageUrl: '/images/skins/fire-serpent.png',
    rarity: 'Legendary',
    category: 'Weapon'
  },
];
async function seedSkins() {
  try {
    console.log('🌱 Starting database seed...\n');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockchain_marketplace');
    console.log('✅ Connected to MongoDB\n');
    await Skin.deleteMany({});
    console.log('🗑️  Cleared existing skins\n');
    console.log('📦 Inserting skins...\n');
    const createdSkins = await Skin.insertMany(initialSkins);
    console.log('✅ Successfully seeded database!\n');
    console.log('📊 Summary:');
    console.log(`   Total skins: ${createdSkins.length}`);
    console.log(`   Legendary: ${createdSkins.filter(s => s.rarity === 'Legendary').length}`);
    console.log(`   Epic: ${createdSkins.filter(s => s.rarity === 'Epic').length}`);
    console.log(`   Rare: ${createdSkins.filter(s => s.rarity === 'Rare').length}`);
    console.log(`   Common: ${createdSkins.filter(s => s.rarity === 'Common').length}`);
    console.log('');
    console.log('📋 Created skins:');
    createdSkins.forEach((skin, index) => {
      console.log(`   ${index + 1}. ${skin.name} (${skin.rarity}) - ${skin.priceSTM} STM`);
      console.log(`      ID: ${skin._id}`);
    });
    console.log('\n✨ Seed completed successfully!\n');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}
seedSkins();