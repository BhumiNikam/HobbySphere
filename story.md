# 📱 Instagram Stories Feature - Complete Implementation Plan

## 🎯 Feature Overview
24-hour ephemeral content with Instagram-style viewer, progress bars, and tap navigation.

---

## 📋 Phase 1: Backend Setup (Day 1)

### 1.1 Create Story Model
**File:** `backend/models/Story.js`

```javascript
const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'text'],
    default: 'image'
  },
  image: {
    url: String,
    publicId: String
  },
  text: {
    content: String,
    backgroundColor: {
      type: String,
      default: '#667eea'
    },
    textColor: {
      type: String,
      default: '#ffffff'
    }
  },
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, { timestamps: true });

// Auto-delete expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);
```

### 1.2 Create Story Controller
**File:** `backend/controllers/storyController.js`

**Functions:**
- `createStory` - Upload image/text story (expires in 24h)
- `getStories` - Get stories from users you follow (grouped by author)
- `getMyStories` - Get your own active stories
- `viewStory` - Mark story as viewed
- `getStoryViewers` - Get list of who viewed your story
- `deleteStory` - Delete your own story

### 1.3 Create Story Routes
**File:** `backend/routes/storyRoutes.js`

```javascript
POST   /api/stories              - Create story
GET    /api/stories/feed         - Get stories from following
GET    /api/stories/my-stories   - Get your stories
POST   /api/stories/:storyId/view - Mark as viewed
GET    /api/stories/:storyId/viewers - Get viewers
DELETE /api/stories/:storyId     - Delete story
```

### 1.4 Add to server.js
```javascript
app.use('/api/stories', require('./routes/storyRoutes'));
```

**Estimated Time:** 3-4 hours

---

## 📋 Phase 2: Frontend Components (Day 2-3)

### 2.1 Story Ring Component
**File:** `frontend/src/components/StoryRing.jsx`

**Features:**
- Circular avatar with gradient ring
- "Your Story" vs "Username"
- Seen/unseen indicator (gray ring if already viewed)
- Click to open viewer

### 2.2 Story Viewer Component
**File:** `frontend/src/components/StoryViewer.jsx`

**Features:**
- Fullscreen modal
- Progress bars at top (one per story)
- Auto-advance timer (5 seconds)
- Tap left/right to navigate
- Tap and hold to pause
- Swipe down to close
- Show viewer count
- Delete button (own stories only)

### 2.3 Story Creator Modal
**File:** `frontend/src/components/StoryCreator.jsx`

**Features:**
- Image upload
- Text story with color picker
- Preview before posting
- Loading state

### 2.4 Stories Feed Bar
**File:** `frontend/src/components/StoriesFeed.jsx`

**Features:**
- Horizontal scrollable list
- Your story + followed users' stories
- "Add Story" button
- Group multiple stories per user

**Estimated Time:** 8-10 hours

---

## 📋 Phase 3: Backend Implementation (Day 4)

### 3.1 Story Controller Code

**Key Logic:**

**Creating Story:**
```javascript
// Set expiry to 24 hours from now
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

// Upload to Cloudinary if image
if (image) {
  const result = await cloudinary.uploader.upload(image, {
    folder: 'hobbysphere/stories'
  });
}
```

**Getting Stories Feed:**
```javascript
// Get following list
const user = await User.findById(req.user._id);
const following = user.following;

// Get active stories from following + self
const stories = await Story.find({
  author: { $in: [...following, req.user._id] },
  expiresAt: { $gt: new Date() }
})
.populate('author', 'username fullName profileImage')
.sort({ createdAt: -1 });

// Group by author
const grouped = {};
stories.forEach(story => {
  const authorId = story.author._id.toString();
  if (!grouped[authorId]) {
    grouped[authorId] = {
      author: story.author,
      stories: [],
      hasUnviewed: false
    };
  }
  
  const hasViewed = story.viewers.some(v => 
    v.user.toString() === req.user._id.toString()
  );
  
  if (!hasViewed) grouped[authorId].hasUnviewed = true;
  grouped[authorId].stories.push(story);
});
```

**View Story:**
```javascript
// Check if already viewed
const hasViewed = story.viewers.some(v => 
  v.user.toString() === req.user._id.toString()
);

if (!hasViewed) {
  story.viewers.push({ user: req.user._id });
  await story.save();
}
```

**Estimated Time:** 4-5 hours

---

## 📋 Phase 4: Frontend Implementation (Day 5-6)

### 4.1 Story Viewer Implementation

**Key Features:**

**Progress Bars:**
```javascript
const [currentIndex, setCurrentIndex] = useState(0);
const [progress, setProgress] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setProgress(prev => {
      if (prev >= 100) {
        // Move to next story
        if (currentIndex < stories.length - 1) {
          setCurrentIndex(currentIndex + 1);
          return 0;
        } else {
          // Move to next user or close
          onClose();
        }
      }
      return prev + 2; // 2% every 100ms = 5 seconds
    });
  }, 100);
  
  return () => clearInterval(timer);
}, [currentIndex]);
```

**Touch/Click Navigation:**
```javascript
const handleClick = (e) => {
  const clickX = e.clientX;
  const screenWidth = window.innerWidth;
  
  if (clickX < screenWidth / 2) {
    // Left side - previous
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  } else {
    // Right side - next
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  }
};
```

**Pause on Hold:**
```javascript
const [isPaused, setIsPaused] = useState(false);

const handleTouchStart = () => setIsPaused(true);
const handleTouchEnd = () => setIsPaused(false);
```

### 4.2 Story Ring Styling

**Gradient Ring for Unseen:**
```css
.story-ring-unseen {
  background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
  padding: 3px;
  border-radius: 50%;
}

.story-ring-seen {
  background: #e5e7eb;
  padding: 3px;
  border-radius: 50%;
}
```

**Estimated Time:** 10-12 hours

---

## 📋 Phase 5: Integration & Polish (Day 7)

### 5.1 Add to Feed Page
```javascript
// At top of Feed.jsx
<StoriesFeed />
<PostForm />
{/* Posts... */}
```

### 5.2 Add Real-time Updates (Optional)
- Socket.io event when someone posts story
- Update stories feed without refresh

### 5.3 Testing Checklist
- ✅ Create image story
- ✅ Create text story
- ✅ View own stories
- ✅ View others' stories
- ✅ Progress bars work
- ✅ Tap navigation works
- ✅ Auto-advance works
- ✅ Pause on hold works
- ✅ Delete story works
- ✅ View viewers list
- ✅ Stories expire after 24h
- ✅ Gradient ring for unseen
- ✅ Gray ring for seen
- ✅ Mobile responsive

### 5.4 Polish
- Loading skeletons
- Error handling
- Empty states
- Smooth animations

**Estimated Time:** 4-5 hours

---

## 📦 File Structure Summary

```
backend/
├── models/
│   └── Story.js                    ✨ NEW
├── controllers/
│   └── storyController.js          ✨ NEW
└── routes/
    └── storyRoutes.js              ✨ NEW

frontend/
├── components/
│   ├── StoryRing.jsx               ✨ NEW
│   ├── StoryViewer.jsx             ✨ NEW
│   ├── StoryCreator.jsx            ✨ NEW
│   └── StoriesFeed.jsx             ✨ NEW
└── pages/
    └── Feed.jsx                    📝 UPDATE
```

---

## ⏱️ Timeline Breakdown

| Day | Task | Hours | Status |
|-----|------|-------|--------|
| **Day 1** | Backend setup (Model, Controller, Routes) | 4h | ⏳ |
| **Day 2** | Story Ring + Creator components | 5h | ⏳ |
| **Day 3** | Story Viewer component | 5h | ⏳ |
| **Day 4** | Backend implementation | 5h | ⏳ |
| **Day 5** | Frontend viewer logic | 6h | ⏳ |
| **Day 6** | Stories feed integration | 4h | ⏳ |
| **Day 7** | Testing + Polish | 4h | ⏳ |
| **Total** |  | **33 hours** | **~5-7 days** |

---

## 🎯 Priority Features (Must Have)

1. ✅ Image stories with 24h expiry
2. ✅ Story viewer with progress bars
3. ✅ Tap navigation (left/right)
4. ✅ Auto-advance timer
5. ✅ Gradient ring for unseen stories
6. ✅ View count
7. ✅ Delete own stories

## 🌟 Nice-to-Have Features (If Time Permits)

1. Text stories with colored backgrounds
2. Pause on hold
3. Swipe gestures
4. Viewer list with timestamps
5. Story replies (DM sender)
6. Real-time socket updates

---
    
## 🚀 Start Command

**Ready to begin?** Say:
- **"Start Day 1"** → I'll give you Story Model code
- **"Show me Story Controller"** → Skip to backend logic
- **"Show me Story Viewer"** → Skip to frontend viewer

**Let me know when you're ready to start! 🎬**