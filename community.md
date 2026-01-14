HobbySphere - Hobby Community Platform Implementation Plan
📖 Project Overview
Current State: Generic social media app with posts, messages, reels, stories, and basic social features.
Target State: Hobby-focused community platform where users discover, join, and participate in communities based on their interests and hobbies.

🎯 Core Concept
Users create and join Hobby Communities (e.g., Photography, Gaming, Cooking, Painting, Music). All content (posts, reels) is shared within these communities, enabling users to connect with like-minded people who share their passions.

🗂️ Database Architecture Changes
New Models Required
1. Community Model

Community name (e.g., "Photography Enthusiasts")
Description
Category/hobby type
Cover image
Creator (user who created it)
Moderators (array of users)
Members list (array of users)
Member count
Privacy (public/private)
Rules/guidelines
Created date
Tags/hashtags

2. Community Membership Model (Optional - for tracking join dates, roles)

User ID
Community ID
Role (member/moderator/admin)
Join date
Status (active/banned)

Models to Modify
1. Post Model - Add community reference

Add field: community (reference to Community)
Keep existing fields: author, content, images, likes, comments, hashtags
Change: Posts now belong to a specific community

2. Reel Model - Add community reference

Add field: community (reference to Community)
Keep existing fields: author, video, caption, likes, views
Change: Reels now belong to a specific community

3. User Model - Add hobby interests

Add field: communities (array of joined community IDs)
Add field: interests (array of hobby tags for recommendations)
Keep existing fields: username, email, profile info, followers, following

Models to Remove

❌ Story Model - Not relevant for hobby communities


🔌 Backend API Endpoints Required
Community Management APIs
Community CRUD

POST /api/communities - Create new community
GET /api/communities - Get all public communities (with pagination, search, filters)
GET /api/communities/:id - Get single community details
PUT /api/communities/:id - Update community (creator/moderator only)
DELETE /api/communities/:id - Delete community (creator only)
GET /api/communities/user/:userId - Get communities user is part of
GET /api/communities/trending - Get trending communities
GET /api/communities/search?q=keyword - Search communities

Membership APIs

POST /api/communities/:id/join - Join a community
POST /api/communities/:id/leave - Leave a community
GET /api/communities/:id/members - Get community members list
POST /api/communities/:id/ban/:userId - Ban user (moderator only)
POST /api/communities/:id/promote/:userId - Promote to moderator (admin only)

Community Content APIs

GET /api/communities/:id/posts - Get all posts in a community
GET /api/communities/:id/reels - Get all reels in a community
GET /api/communities/:id/activity - Get recent activity feed

Modified Existing APIs
Post APIs (Update)

POST /api/posts - Now requires communityId field
GET /api/posts/feed - Change to show posts from joined communities only
Keep: like, comment, delete endpoints

Reel APIs (Update)

POST /api/reels - Now requires communityId field
GET /api/reels/feed - Change to show reels from joined communities only
Keep: like, view, delete endpoints

APIs to Remove

❌ All Story-related endpoints (/api/stories)


🎨 Frontend Pages & Components
New Pages Required
1. Communities Discovery Page (/communities)

Grid/list view of all public communities
Search bar with filters (category, member count, trending)
"Create Community" button
Each community card shows:

Cover image
Name
Member count
Brief description
"Join" button
Category tag



2. Single Community Page (/communities/:id)

Community header section:

Cover image
Name, description
Member count
Join/Leave button
"Create Post" / "Create Reel" buttons (if member)
Community rules/guidelines


Tabs for:

Posts feed (default)
Reels
Members list
About/Rules


Moderator actions (if user is moderator)

3. Create Community Page (/communities/create)

Form with fields:

Community name (required)
Description (required)
Category/hobby type (dropdown)
Cover image upload
Privacy setting (public/private)
Community rules (textarea)


Submit button

4. My Communities Page (/my-communities)

List of communities user has joined
Quick access to each community
Option to leave communities
Create new community button

Pages to Modify
1. Feed Page (/feed) - Change behavior

Option A: Show posts from ALL joined communities mixed together
Option B: Remove this page and redirect to Communities Discovery
Option C: Keep but add filter dropdown to view by community

2. Profile Page (/profile/:username) - Add community section

Add "Communities" tab showing:

Communities user has joined
Communities user has created



3. Reels Page (/reels) - Filter by community

Add dropdown/filter to show:

All reels (from joined communities)
Reels from specific community



Pages to Remove

❌ Stories-related components and UI

New Components Required
1. CommunityCard Component

Displays community preview
Shows cover image, name, member count, join button
Used in discovery page and search results

2. CommunityHeader Component

Shows community banner, info, join/leave button
Used on single community page

3. CreatePostModal Component (Modify existing)

Add dropdown to select community
Validate user is member of selected community

4. CreateReelModal Component (Modify existing)

Add dropdown to select community
Validate user is member of selected community

5. MembersList Component

Shows community members with avatars
Shows member roles (admin/moderator/member)
Moderator actions (ban/promote) if applicable

6. CommunityRules Component

Displays community guidelines
Used on community page

Components to Remove

❌ StoriesFeed.jsx
❌ Any story creation/viewing components


🔄 User Flow Changes
Before (Current)

User logs in → Sees global feed with all posts
User creates post → Goes to everyone's feed
User browses stories → Views stories from followed users
User uploads reel → Visible to all users

After (New)

User logs in → Sees communities discovery page OR feed from joined communities
User browses and joins communities based on interests
User creates post/reel → Must select a community
User views content → Only sees posts/reels from joined communities
User discovers new communities → Joins to see content


🎯 Key Features Breakdown
Phase 1: Core Community Infrastructure (Priority)

Create Community model and database schema
Build Community CRUD APIs
Add community reference to Post and Reel models
Create Communities Discovery page
Create Single Community page
Implement Join/Leave functionality

Phase 2: Content Integration

Modify Post creation to require community selection
Modify Reel creation to require community selection
Update Feed page to show only posts from joined communities
Update Reels page to filter by community
Add community filter/selector in UI

Phase 3: Community Management

Create "My Communities" page
Add moderator roles and permissions
Implement ban/promote member functionality
Add community rules and guidelines feature
Community settings page for admins

Phase 4: Discovery & Recommendations

Trending communities algorithm
Community search with filters
Recommend communities based on user interests
Category-based browsing
"Similar Communities" suggestions

Phase 5: Cleanup

Remove Story model from database
Remove Story APIs from backend
Remove Story components from frontend
Update navigation to remove story references
Clean up unused code


🗺️ Navigation Structure Changes
Before
Navbar:
- All Posts
- Following
- Messages
- Profile
- Reels
After
Navbar:
- Communities (Discovery)
- My Communities
- Messages
- Reels
- Profile

OR

Navbar:
- Discover
- My Feed (posts from joined communities)
- Communities
- Reels
- Messages
- Profile

🔐 Permission & Access Control
Public Communities

Anyone can view
Only members can post/comment
Join requires click

Private Communities

Only visible to members
Join requires approval from moderator
Invite-only option

User Roles

Member - Can post, comment, like, share within community
Moderator - Can delete posts, ban users, edit community info
Creator/Admin - Full control, can delete community, promote moderators


📊 Data Relationships
User
  ├─ Created Communities (one-to-many)
  ├─ Joined Communities (many-to-many)
  └─ Posts/Reels (one-to-many)

Community
  ├─ Creator (many-to-one → User)
  ├─ Members (many-to-many → User)
  ├─ Moderators (many-to-many → User)
  ├─ Posts (one-to-many)
  └─ Reels (one-to-many)

Post
  ├─ Author (many-to-one → User)
  ├─ Community (many-to-one → Community)
  └─ Comments/Likes

Reel
  ├─ Author (many-to-one → User)
  ├─ Community (many-to-one → Community)
  └─ Likes/Views

🎨 UI/UX Considerations
Community Discovery

Visual, card-based layout
Search and filter options prominent
Category tags clearly visible
Member count and activity indicators
Preview of recent posts

Community Page

Welcoming banner/header
Clear call-to-action (Join button)
Easy content creation (floating action button or prominent button)
Community rules visible but not intrusive
Members list accessible

Posting Experience

Community selector should be clear but not intrusive
Suggest communities if user hasn't joined any
Show preview of which community post will go to

Feed Experience

Option to filter by community
Show community name/badge on each post
Easy navigation between communities


🚀 Implementation Priority
Must Have (MVP)

✅ Community model and APIs
✅ Join/Leave communities
✅ Communities discovery page
✅ Single community page with posts
✅ Link posts to communities
✅ Update feed to show joined communities only

Should Have (V1.1)

✅ Community search and filters
✅ My Communities page
✅ Link reels to communities
✅ Moderator roles
✅ Community rules/guidelines

Nice to Have (Future)

✅ Trending communities
✅ Community recommendations
✅ Private communities with approval
✅ Community analytics
✅ Events within communities
✅ Community challenges/contests


📝 Testing Checklist
Community Features

 Create community (public/private)
 Join/leave community
 View community members
 Search communities
 Filter communities by category
 Post in community (requires membership)
 Upload reel in community
 View community posts feed
 Ban user (moderator)
 Promote to moderator (admin)
 Delete community (creator)

Content Features

 Create post requires community selection
 Post only visible to community members
 Feed shows only posts from joined communities
 Reels filtered by community
 Like/comment works within communities
 Share post references community

Access Control

 Non-members can't post in community
 Private community content hidden from non-members
 Only moderators can ban users
 Only creator can delete community


🔧 Technical Considerations
Performance

Paginate community lists
Cache popular communities
Index community searches
Optimize member queries

Scalability

Consider separate table for memberships if communities grow large
Implement lazy loading for community feeds
Use caching for trending/popular communities

Data Integrity

Cascade delete posts/reels when community is deleted
Handle user deletion (remove from all communities)
Validate community membership before allowing posts


📌 Migration Strategy (From Current to New)
Option A: Clean Slate

Remove all existing posts
Remove stories
Launch with communities required

Option B: Gradual Migration

Create "General" default community
Move all existing posts to "General"
Encourage users to create/join communities
Eventually deprecate "General"

Option C: Hybrid Approach (Recommended)

Keep existing posts visible in "All Posts" feed
Add communities as new feature
New posts require community
Old posts stay in global feed
Gradually migrate users to community-based posting


🎯 Success Metrics
Community Health

Number of active communities
Average members per community
Posts per community per day
Member engagement rate

User Engagement

Number of communities joined per user
Time spent in communities
Post/comment frequency within communities
Community discovery rate (how many users join new communities)

Platform Growth

New community creation rate
Community diversity (variety of hobby types)
User retention after joining communities
Cross-community participation


📚 Additional Features for Future Consideration

Community Events - Schedule meetups, challenges
Community Resources - Pinned posts, guides, FAQs
Community Badges - Recognition for active members
Sub-communities - Nested communities for specific topics
Community Verification - Official hobby communities
Community Analytics - Insights for moderators
Cross-posting - Share post to multiple communities
Community Tags - Better organization and discovery
Community Polls - Gather community opinions
Community Wiki - Collaborative knowledge base