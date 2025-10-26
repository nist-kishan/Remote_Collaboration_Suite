import mongoose from 'mongoose';
import Message from '../models/Message.model.js';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration Script: Fix HTTP Cloudinary URLs to HTTPS
 * 
 * This script updates all Cloudinary URLs in the database from HTTP to HTTPS
 * to fix mixed content warnings on HTTPS sites.
 * 
 * Run with: node src/scripts/fixCloudinaryUrls.js
 */

const fixUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http://res.cloudinary.com/')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

const fixCloudinaryUrls = async () => {
  try {
    console.log('🔧 Starting Cloudinary URL migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let totalFixed = 0;

    // Fix User avatars
    console.log('\n📸 Fixing user avatars...');
    const users = await User.find({ avatar: /^http:\/\/res\.cloudinary\.com\// });
    for (const user of users) {
      user.avatar = fixUrl(user.avatar);
      await user.save();
      totalFixed++;
    }
    console.log(`✅ Fixed ${users.length} user avatars`);

    // Fix Message media URLs
    console.log('\n💬 Fixing message media URLs...');
    const messages = await Message.find({ 'media.url': /^http:\/\/res\.cloudinary\.com\// });
    for (const message of messages) {
      let messageUpdated = false;
      
      if (message.media && Array.isArray(message.media)) {
        message.media = message.media.map(item => {
          if (item.url && item.url.startsWith('http://res.cloudinary.com/')) {
            item.url = fixUrl(item.url);
            if (item.thumbnail) {
              item.thumbnail = fixUrl(item.thumbnail);
            }
            messageUpdated = true;
          }
          return item;
        });
      }
      
      if (messageUpdated) {
        await message.save();
        totalFixed++;
      }
    }
    console.log(`✅ Fixed ${messages.length} messages with media`);

    console.log(`\n🎉 Migration complete! Fixed ${totalFixed} items total.`);
    
    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
fixCloudinaryUrls();
