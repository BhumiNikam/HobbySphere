// =====================================================
// MIGRATION SCRIPT: Convert old 'images' to 'media'
// Run this once to fix existing posts
// =====================================================

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Post = require('./models/Post');

const migratePostsToMedia = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all posts with 'images' field but no 'media' field
    const postsToMigrate = await Post.find({
      images: { $exists: true, $ne: [] },
      $or: [
        { media: { $exists: false } },
        { media: { $size: 0 } }
      ]
    });

    console.log(`📊 Found ${postsToMigrate.length} posts to migrate`);

    let migratedCount = 0;

    for (const post of postsToMigrate) {
      // Convert images to media format
      const media = post.images.map(img => ({
        url: img.url,
        publicId: img.publicId,
        type: img.type || 'image',
        fileName: `${img.type || 'image'}-${Date.now()}`,
        fileSize: null,
        mimeType: img.type === 'video' ? 'video/mp4' : 'image/jpeg'
      }));

      // Update the post
      await Post.findByIdAndUpdate(post._id, {
        $set: { media: media }
      });

      migratedCount++;
      
      if (migratedCount % 10 === 0) {
        console.log(`✅ Migrated ${migratedCount}/${postsToMigrate.length} posts`);
      }
    }

    console.log(`\n✅ Migration complete! Migrated ${migratedCount} posts`);
    console.log('ℹ️  Old "images" field is kept for backward compatibility');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migratePostsToMedia();