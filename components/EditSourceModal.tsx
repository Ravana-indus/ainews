"use client";
import * as React from 'react';

type Source = {
  id: string;
  name: string;
  domain: string;
  language: string;
  reliability: number | null;
  logo_url: string | null;
  rss_url: string | null;
  enabled: boolean;
};

interface EditSourceModalProps {
  source: Source | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (source: Source) => void;
  adminToken: string;
}

export default function EditSourceModal({ source, isOpen, onClose, onSave, adminToken }: EditSourceModalProps) {
  const [form, setForm] = React.useState<Partial<Source>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    if (source) {
      setForm(source);
    } else {
      setForm({ name: '', domain: '', language: 'en', reliability: 0.8, enabled: true });
    }
    setError('');
  }, [source, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.name || !form.domain || !form.language) {
      setError('Name, domain, and language are required');
      setLoading(false);
      return;
    }

    try {
      const isEdit = !!source?.id;
      const url = isEdit ? '/api/admin/sources' : '/api/admin/sources';
      const method = isEdit ? 'PATCH' : 'POST';

      const body = isEdit ? { ...form, id: source.id } : form;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        onSave(data.source || { ...form, id: source?.id || '' });
        onClose();
      } else {
        setError(data.error || 'Failed to save source');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-4">
          {source?.id ? 'Edit Source' : 'Add New Source'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="Source name"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Domain *</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="example.com"
              value={form.domain || ''}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Language *</label>
            <select
              className="w-full border rounded-lg p-2 text-sm"
              value={form.language || 'en'}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              required
            >
              <option value="en">English</option>
              <option value="si">Sinhala</option>
              <option value="ta">Tamil</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">RSS URL</label>
            <input
              type="url"
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="https://example.com/rss.xml"
              value={form.rss_url || ''}
              onChange={(e) => setForm({ ...form, rss_url: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Logo URL</label>
            <input
              type="url"
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="https://example.com/logo.png"
              value={form.logo_url || ''}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={form.enabled ?? true}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              <span className="text-sm font-medium">Enabled</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (source?.id ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}