"use client";
import * as React from 'react';

interface Story {
  id: string;
  title: string;
  category: string;
  published_at: string;
  source_url?: string;
  detailed_content?: string;
}

export default function AdminEvents() {
  const [stories, setStories] = React.useState<Story[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');

  React.useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      if (data.events) {
        // Convert events back to story format for display
        setStories(data.events.map((e: any) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          published_at: e.updatedAt,
          source_url: e.sources?.[0]?.url || '',
          detailed_content: e.detail?.en || e.summary?.en || ''
        })));
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = !search || story.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || story.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(stories.map(s => s.category))).filter(Boolean);

  return (
    <main className="mx-auto max-w-screen-lg p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Stories</h1>
        <div className="flex gap-2">
          <button
            onClick={loadStories}
            disabled={loading}
            className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <a href="/admin" className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm">
            Back to Admin
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 border rounded-lg p-4 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search Stories
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-600">
          Showing {filteredStories.length} of {stories.length} stories
        </div>
      </div>

      {/* Stories List */}
      {loading ? (
        <div className="text-center py-12 text-slate-600">Loading stories...</div>
      ) : filteredStories.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-slate-50">
          <div className="text-slate-600 mb-2">No stories found</div>
          <div className="text-xs text-slate-500">
            {search || categoryFilter ? 'Try adjusting your filters' : 'No stories in database'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStories.map((story) => (
            <div key={story.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {story.category && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {story.category}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      {new Date(story.published_at).toLocaleDateString()} {new Date(story.published_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 className="font-medium text-slate-900 mb-2 line-clamp-2">
                    {story.title}
                  </h3>
                  {story.detailed_content && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                      {story.detailed_content.substring(0, 200)}...
                    </p>
                  )}
                  {story.source_url && (
                    <a
                      href={story.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View Source →
                    </a>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <a
                    href={`/event/${story.id}`}
                    className="px-3 py-1 text-xs border rounded hover:bg-slate-100"
                  >
                    View
                  </a>
                  <div className="text-xs text-slate-500">
                    ID: {story.id.substring(0, 8)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination info */}
      {filteredStories.length > 0 && (
        <div className="mt-6 text-center text-xs text-slate-600">
          Displaying {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
        </div>
      )}
    </main>
  );
}
