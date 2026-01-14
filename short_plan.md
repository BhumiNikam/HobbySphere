# 📹 Reels/Short Videos Feature - Complete Implementation Plan

## 🎯 Feature Overview
TikTok/Instagram Reels-style vertical video feed with auto-play, likes, comments, and share functionality.

---

## 📋 Phase 1: Backend Setup (Day 1)

### 1.1 Create Reel Model
**File:** `backend/models/Reel.js`

```javascript
const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: {
    type: String,
    maxlength: 500
  },
  video: {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    thumbnail: String,
    duration: Number // in seconds
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  hashtags: [{
    type: String,
    lowercase: true
  }],
  music: {
    name: String,
    artist: String
  }
}, { timestamps: true });

reelSchema.index({ author: 1, createdAt: -1 });
reelSchema.index({ hashtags: 1 });
reelSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Reel', reelSchema);
```

### 1.2 Create Reel Controller
**File:** `backend/controllers/reelController.js`

**Functions:**
- `createReel` - Upload video to Cloudinary, extract thumbnail
- `getReels` - Infinite scroll feed (paginated)
- `getReelById` - Get single reel
- `getUserReels` - Get reels by specific user
- `likeReel` - Like/unlike reel
- `incrementView` - Track video views
- `deleteReel` - Delete video from Cloudinary + DB

### 1.3 Create Reel Routes
**File:** `backend/routes/reelRoutes.js`

```javascript
POST   /api/reels              - Create reel (video upload)
GET    /api/reels              - Get reels feed (paginated)
GET    /api/reels/:reelId      - Get single reel
GET    /api/reels/user/:userId - Get user's reels
POST   /api/reels/:reelId/like - Like/unlike reel
POST   /api/reels/:reelId/view - Increment view count
DELETE /api/reels/:reelId      - Delete reel
```

### 1.4 Update Cloudinary Config
**Cloudinary supports video uploads** with these settings:
```javascript
{
  resource_type: 'video',
  folder: 'hobbysphere/reels',
  transformation: [
    { width: 1080, height: 1920, crop: 'limit' }, // 9:16 aspect ratio
    { quality: 'auto' },
    { fetch_format: 'auto' }
  ],
  eager: [
    { width: 540, height: 960, crop: 'fill', format: 'jpg' } // Generate thumbnail
  ]
}
```

---

## 📋 Phase 2: Frontend Components (Day 2-3)

### 2.1 Reel Upload Modal
**File:** `frontend/src/components/ReelUploadModal.jsx`

**Features:**
- Video file picker (max 60 seconds)
- Video preview before upload
- Caption input with hashtag support
- Upload progress bar
- Validation (max 50MB, MP4/MOV/AVI)

### 2.2 Reel Player Component
**File:** `frontend/src/components/ReelPlayer.jsx`

**Features:**
- Vertical video player (9:16 ratio)
- Auto-play when in view
- Pause on tap
- Mute/unmute button
- Progress indicator
- Loop video

### 2.3 Reels Feed Component
**File:** `frontend/src/components/ReelsFeed.jsx`

**Features:**
- Vertical scroll (one reel per viewport)
- Snap scrolling (like TikTok)
- Infinite scroll (load more)
- Like/comment buttons overlaid
- Author info at bottom
- Share button
- Keyboard navigation (arrow keys)

### 2.4 Reel Actions Bar
**File:** `frontend/src/components/ReelActions.jsx`

**Features:**
- Like button (animated heart)
- Comment button (opens modal)
- Share button
- View count
- Author profile link

---

## 📋 Phase 3: Backend Implementation (Day 4)

### 3.1 Video Upload Logic

**Key Points:**
- Use `multer` to handle video upload (already installed)
- Upload to Cloudinary with `resource_type: 'video'`
- Cloudinary auto-generates thumbnail
- Limit video length to 60 seconds (optional)
- Extract video duration from metadata

**Example:**
```javascript
exports.createReel = async (req, res) => {
  try {
    const { caption } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Video file required' });
    }
    
    // Upload video to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'hobbysphere/reels',
          eager: [
            { width: 540, height: 960, crop: 'fill', format: 'jpg' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });
    
    // Extract hashtags
    const hashtags = caption?.match(/#\w+/g) || [];
    
    const reel = await Reel.create({
      author: req.user._id,
      caption: caption || '',
      video: {
        url: result.secure_url,
        publicId: result.public_id,
        thumbnail: result.eager[0].secure_url,
        duration: result.duration
      },
      hashtags: hashtags.map(tag => tag.toLowerCase())
    });
    
    await reel.populate('author', 'username fullName profileImage');
    
    res.status(201).json(reel);
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};
```

### 3.2 Feed Algorithm

**Simple approach:**
- Show reels from followed users first
- Then show popular reels (most likes/views)
- Then show recent reels from everyone

**Advanced approach (optional):**
- Personalized feed based on liked reels
- Similar hashtags/interests
- Engagement time tracking

---

## 📋 Phase 4: Frontend Implementation (Day 5-6)

### 4.1 Reels Feed Page
**File:** `frontend/src/pages/Reels.jsx`

**Layout:**
```
┌─────────────────────┐
│   [Top Bar]         │
├─────────────────────┤
│                     │
│   VIDEO PLAYER      │ ← Full viewport height
│   (9:16 ratio)      │
│                     │
│   [Author Info]     │ ← Bottom overlay
│   [Caption]         │
│   [Like/Comment]    │ ← Right sidebar
└─────────────────────┘
```

**Key Features:**
```javascript
// Snap scroll behavior
<div className="snap-y snap-mandatory h-screen overflow-y-scroll">
  {reels.map(reel => (
    <div key={reel._id} className="snap-start h-screen">
      <ReelPlayer reel={reel} />
    </div>
  ))}
</div>
```

### 4.2 Video Auto-play Logic

**Use Intersection Observer:**
```javascript
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play();
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.5 }
  );
  
  const videoElement = videoRef.current;
  if (videoElement) {
    observer.observe(videoElement);
  }
  
  return () => observer.disconnect();
}, []);
```

### 4.3 Mobile Gestures

**Touch handlers:**
- Swipe up → Next reel
- Swipe down → Previous reel
- Double tap → Like
- Single tap → Pause/play

---

## 📋 Phase 5: Integration & Polish (Day 7)

### 5.1 Add Reels Tab to Navigation

**Update Navigation:**
```javascript
<nav>
  <Link to="/">Feed</Link>
  <Link to="/reels">Reels</Link>  {/* ← NEW */}
  <Link to="/messages">Messages</Link>
  <Link to="/profile">Profile</Link>
</nav>
```

### 5.2 Add "Create Reel" Button

**Options:**
- Floating action button (FAB) on Reels page
- Add to post creation menu
- Camera icon in navbar

### 5.3 Testing Checklist

- ✅ Upload video (MP4, max 50MB)
- ✅ Video plays automatically
- ✅ Scroll to next reel
- ✅ Like/unlike works
- ✅ Comment button opens modal
- ✅ View count increments
- ✅ Delete reel works
- ✅ Mobile swipe gestures work
- ✅ Video loops seamlessly
- ✅ Mute/unmute works

### 5.4 Performance Optimization

- Lazy load videos (only load current + next/previous)
- Preload next video for smooth scrolling
- Compress videos on upload
- Use Cloudinary's adaptive quality
- Cache thumbnails

---

## 📦 File Structure Summary

```
backend/
├── models/
│   └── Reel.js                     ✨ NEW
├── controllers/
│   └── reelController.js           ✨ NEW
└── routes/
    └── reelRoutes.js               ✨ NEW

frontend/
├── components/
│   ├── ReelPlayer.jsx              ✨ NEW
│   ├── ReelUploadModal.jsx         ✨ NEW
│   ├── ReelActions.jsx             ✨ NEW
│   └── ReelsFeed.jsx               ✨ NEW
├── pages/
│   └── Reels.jsx                   ✨ NEW
└── App.jsx                         📝 UPDATE (add route)
```

---

## ⏱️ Timeline Breakdown

| Day | Task | Hours | Status |
|-----|------|-------|--------|
| **Day 1** | Backend (Model, Controller, Routes) | 5h | ⏳ |
| **Day 2** | Upload Modal + Player Component | 5h | ⏳ |
| **Day 3** | Reels Feed + Actions | 5h | ⏳ |
| **Day 4** | Backend video upload logic | 4h | ⏳ |
| **Day 5** | Frontend feed page + auto-play | 6h | ⏳ |
| **Day 6** | Mobile gestures + polish | 4h | ⏳ |
| **Day 7** | Testing + optimization | 4h | ⏳ |
| **Total** |  | **33 hours** | **~5-7 days** |

---

## 🎯 Priority Features (Must Have)

1. ✅ Video upload (MP4, max 60s)
2. ✅ Vertical scroll feed
3. ✅ Auto-play videos
4. ✅ Like/comment functionality
5. ✅ View count tracking
6. ✅ Delete reels

## 🌟 Nice-to-Have Features (If Time Permits)

1. Video trimming/editing
2. Filters & effects
3. Duet/stitch features
4. Sound library
5. Trending hashtags
6. Reel analytics
7. Download reel option

---

## 🚀 Ready to Start?

**Say:**
- **"Start Day 1"** → I'll give you the Reel Model code
- **"Show me backend"** → Skip to controller logic
- **"Show me frontend"** → Skip to ReelPlayer component
- **"Quick setup"** → Get all code at once

Let me know when you're ready! 🎬