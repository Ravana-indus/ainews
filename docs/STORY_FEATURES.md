# Story Management Features

## Overview
This document describes the advanced story management features implemented in the AI News platform, including sorting, duplicate detection, and category organization.

## Features Implemented

### 1. Smart Duplicate Detection

#### How It Works
Stories are checked for duplicates using two methods:

**URL-Based Detection:**
- Normalizes URLs by removing `www.`, trailing slashes, and converting to lowercase
- Compares the first source URL from each story
- Exact URL matches are considered duplicates

**Title Similarity Detection:**
- Uses Jaccard similarity algorithm to compare story titles
- Normalizes titles by removing special characters and converting to lowercase
- Calculates word overlap between titles
- Default threshold: 80% similarity (configurable)
- Formula: `similarity = intersection(words) / union(words)`

**Example:**
```javascript
// These would be detected as duplicates (>80% similarity):
"New Climate Policy Announced by Government"
"Government Announces New Climate Policy"

// These would NOT be duplicates (<80% similarity):
"Climate Change Report Released"
"New Policy on Healthcare"
```

#### Statistics
The system tracks:
- Total stories in database
- Unique stories (after duplicate removal)
- Number of duplicates removed
- Displayed in admin dashboard

### 2. Multiple Sorting Options

#### Available Sort Modes

**1. Latest Updated (Default)**
- Sorts by `updated_at` timestamp (most recent first)
- Falls back to `published_at` if `updated_at` is not available
- Best for seeing the most recently modified stories
- URL: `/?sort=updated`

**2. Recently Published**
- Sorts by `published_at` timestamp only
- Shows stories in order of original publication
- Useful for chronological timeline
- URL: `/?sort=published`

**3. By Category**
- Groups stories by category
- Within each category, sorts by most recent update
- Displays category headers with story counts
- URL: `/?sort=category`

### 3. Category Organization

#### Features
- Dynamic category list fetched from database
- Shows story count for each category
- Categories sorted by story count (most popular first)
- Up to 10 categories displayed in filter bar
- Click to filter by specific category

#### Category View
When using "By Category" sort:
```
Technology (15 stories)
├─ Story 1 (most recent)
├─ Story 2
└─ Story 3

Politics (12 stories)
├─ Story 1
└─ Story 2

Economy (8 stories)
└─ Story 1
```

### 4. Duplicate Toggle

Users can choose to:
- **Hide duplicates** (default): Shows only unique stories
- **Show duplicates**: Displays all stories including duplicates
- Toggle via checkbox in Display Options panel

## API Functions

### `fetchEvents(lang, options)`
Main function to fetch and filter stories.

**Options:**
```typescript
{
  category?: string;           // Filter by specific category
  limit?: number;              // Limit number of results
  sortBy?: 'updated' | 'published' | 'category';  // Sort method
  removeDuplicates?: boolean;  // Enable/disable duplicate removal (default: true)
}
```

**Examples:**
```javascript
// Get latest 10 stories, remove duplicates
fetchEvents('en', { limit: 10, sortBy: 'updated' })

// Get all Technology stories, keep duplicates
fetchEvents('en', { category: 'Technology', removeDuplicates: false })

// Get stories grouped by category
fetchEvents('en', { sortBy: 'category' })
```

### `fetchEventsByCategory(lang)`
Returns stories grouped by category in an object:
```javascript
{
  "Technology": [story1, story2, ...],
  "Politics": [story3, story4, ...],
  "Economy": [story5, story6, ...]
}
```

### `fetchCategories()`
Returns array of categories with counts:
```javascript
[
  { name: "Technology", count: 15 },
  { name: "Politics", count: 12 },
  { name: "Economy", count: 8 }
]
```

## Utility Functions

### Title Similarity Functions

**`normalizeTitle(title)`**
- Converts to lowercase
- Removes special characters
- Collapses multiple spaces
- Returns clean string for comparison

**`calculateTitleSimilarity(title1, title2)`**
- Returns value 0.0 to 1.0
- 0.0 = completely different
- 1.0 = identical
- Uses Jaccard similarity algorithm

**`areDuplicateStories(story1, story2, threshold)`**
- Checks both URL and title similarity
- Default threshold: 0.8 (80%)
- Returns `true` if stories are duplicates

## User Interface

### Display Options Panel
Located at the top of the homepage:

**Sort By:**
- Latest Updated (default)
- Recently Published
- By Category

**Duplicate Control:**
- Checkbox to show/hide duplicates
- Real-time toggle (no page reload needed)

**Category Filter:**
- "All" button showing total count
- Individual category buttons with counts
- Top 10 categories displayed
- Active category highlighted in blue

### Story Display Modes

**List View** (default):
- Single column of stories
- Sorted according to selected method
- Clean, easy to scan

**Grouped View** (when "By Category" is selected):
- Stories organized under category headers
- Category name with story count
- Expandable sections
- Maintains sort within categories

## Performance Considerations

### Database Queries
- Single query fetches all stories with `updated_at` and `published_at`
- Server-side duplicate filtering reduces data transfer
- Category filtering applied in memory (fast)

### Caching
- Page cache: 600 seconds (10 minutes)
- Data revalidation: 0 seconds (always fresh)
- Category list cached separately

### Optimization Tips
1. Use `limit` parameter for large datasets
2. Enable `removeDuplicates` to reduce data size
3. Category filtering happens server-side
4. Consider pagination for 100+ stories

## Configuration

### Adjustable Parameters

**Duplicate Detection Threshold**
Location: `lib/utils.ts`
```typescript
// Default: 0.8 (80% similarity)
areDuplicateStories(story1, story2, 0.8)

// More strict: 0.9 (90% similarity)
areDuplicateStories(story1, story2, 0.9)

// Less strict: 0.7 (70% similarity)
areDuplicateStories(story1, story2, 0.7)
```

**Default Sort Order**
Location: `app/page.tsx`
```typescript
// Change default from 'updated' to 'published' or 'category'
const sortBy = (searchParams?.sort as 'updated' | 'published' | 'category') || 'updated';
```

## Admin Features

### Duplicate Statistics
Admin dashboard shows:
- Total stories in database
- Unique stories (after deduplication)
- Number of duplicates removed
- Percentage of duplicates

### Story Management
Admin can view:
- All stories with duplicate status
- Filter by category
- Search by title
- View individual story details

## Future Enhancements

Potential improvements:
1. **Advanced Similarity**: Use embeddings for semantic similarity
2. **Manual Merge**: Allow admins to manually mark duplicates
3. **Duplicate History**: Track which stories were marked as duplicates
4. **Category Hierarchy**: Support sub-categories
5. **Saved Filters**: Remember user's preferred sort/filter settings
6. **Export**: Download stories by category as CSV/JSON

## Troubleshooting

### Common Issues

**Duplicates not being removed:**
- Check that `removeDuplicates: true` is set
- Verify threshold isn't too strict (try 0.7 instead of 0.8)
- Check console logs for duplicate detection messages

**Category not showing:**
- Ensure stories have `category` field in database
- Category names are case-sensitive
- Check category count in admin dashboard

**Sort not working:**
- Verify `updated_at` field exists in database
- Falls back to `published_at` if `updated_at` is null
- Check URL parameters are correct

## Database Schema

### Required Fields
```sql
stories (
  id: UUID PRIMARY KEY,
  title: TEXT NOT NULL,
  category: TEXT,
  source_url: TEXT,
  detailed_content: TEXT,
  published_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  bias_analysis: JSONB
)
```

### Indexes for Performance
```sql
CREATE INDEX idx_stories_updated_at ON stories(updated_at DESC);
CREATE INDEX idx_stories_published_at ON stories(published_at DESC);
CREATE INDEX idx_stories_category ON stories(category);
```

## Testing

### Test Scenarios

1. **Duplicate Detection**
   - Create two stories with identical URLs → Only one should appear
   - Create two stories with 85% similar titles → Only one should appear
   - Create two stories with 60% similar titles → Both should appear

2. **Sorting**
   - Add story with recent `updated_at` → Should appear first in "Latest Updated"
   - Add story with old `updated_at` but null `published_at` → Should handle gracefully
   - Toggle between sort modes → Stories should re-order correctly

3. **Categories**
   - Filter by existing category → Should show only that category's stories
   - Filter by non-existent category → Should show empty state
   - View "By Category" → Stories should be grouped correctly

## Conclusion

The story management system provides powerful tools for organizing, filtering, and deduplicating content while maintaining excellent performance and user experience. The flexible API allows for easy customization and future enhancements.
