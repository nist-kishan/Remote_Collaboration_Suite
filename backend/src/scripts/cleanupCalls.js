import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Call from '../models/call.model.js';

dotenv.config();

const cleanupStuckCalls = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all ringing or ongoing calls
    const stuckCalls = await Call.find({
      status: { $in: ['ringing', 'ongoing'] }
    });

    console.log(`📞 Found ${stuckCalls.length} stuck calls`);

    for (const call of stuckCalls) {
      console.log(`🧹 Cleaning up call ${call._id} (status: ${call.status})`);
      
      if (call.status === 'ringing') {
        call.status = 'missed';
      } else {
        call.status = 'ended';
      }
      
      call.endedAt = new Date();
      await call.save();
    }

    console.log('✅ Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanupStuckCalls();
