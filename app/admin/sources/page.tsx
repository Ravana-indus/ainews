"use client";
import * as React from 'react';
import EditSourceModal from '../../../components/EditSourceModal';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';

type Source = { id: string; name: string; domain: string; language: string; reliability: number | null; logo_url: string | null; rss_url: string | null; enabled: boolean };

export default function AdminSources() {
  const [sources, setSources] = React.useState<Source[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adminToken, setAdminToken] = React.useState('');
  const [remember, setRemember] = React.useState(true);

  // Modal states
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingSource, setEditingSource] = React.useState<Source | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deletingSource, setDeletingSource] = React.useState<Source | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string>('');

  React.useEffect(() => {
    try {
      const fromLS = localStorage.getItem('admin_token') || '';
      if (fromLS) setAdminToken(fromLS);
      if (!fromLS) {
        const m = document.cookie.match(/(?:^|; )admin_token=([^;]+)/);
        if (m) setAdminToken(decodeURIComponent(m[1]));
      }
    } catch {}
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/sources');
    const data = await res.json();
    setSources(data.sources || []);
    setLoading(false);
  }

  React.useEffect(() => { load(); }, []);

  async function toggleEnabled(s: Source) {
    await fetch('/api/admin/sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || '' },
      body: JSON.stringify({ id: s.id, enabled: !s.enabled })
    });
    load();
  }

  async function deleteSource(source: Source) {
    setActionLoading(true);
    setActionError('');

    try {
      const res = await fetch(`/api/admin/sources?id=${source.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken || '' }
      });

      if (res.ok) {
        setDeleteModalOpen(false);
        setDeletingSource(null);
        load();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to delete source');
      }
    } catch (err) {
      setActionError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  function openEditModal(source?: Source) {
    setEditingSource(source || null);
    setEditModalOpen(true);
    setActionError('');
  }

  function openDeleteModal(source: Source) {
    setDeletingSource(source);
    setDeleteModalOpen(true);
    setActionError('');
  }

  function handleSaveSource() {
    load();
    setEditModalOpen(false);
    setEditingSource(null);
  }
  return (
    <main className="mx-auto max-w-screen-md p-4">
      <h1 className="text-lg font-semibold mb-3">Admin • Sources</h1>

      {/* Admin Authentication */}
      <div className="border rounded-xl p-3 mb-4 text-sm">
        <div className="font-medium mb-2">Admin Authentication</div>
        <div className="grid sm:grid-cols-2 gap-2">
          <input
            className="border rounded-lg p-2 text-sm"
            placeholder="Admin Token"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
          />
          <label className="inline-flex items-center text-sm">
            <input
              type="checkbox"
              className="mr-2"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember in browser
          </label>
        </div>
        <div className="text-xs text-slate-600 mt-1">Set the token issued via environment variable ADMIN_TOKEN to authorize write actions.</div>
      </div>

      {/* Action Error Display */}
      {actionError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Add Source Button */}
      <div className="mb-4">
        <button
          onClick={() => openEditModal()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          ➕ Add New Source
        </button>
      </div>

      {/* Sources List */}
      {loading ? (
        <div className="text-sm text-center py-8">Loading sources…</div>
      ) : sources.length === 0 ? (
        <div className="text-sm text-center py-8 text-slate-500">
          No sources configured yet. Click "Add New Source" to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((s) => (
            <div key={s.id} className="border rounded-xl p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {s.logo_url && (
                      <img
                        src={s.logo_url}
                        alt={s.name}
                        className="w-6 h-6 rounded object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.domain}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Lang: {s.language.toUpperCase()} • Reliability: {Math.round(((s.reliability || 0) as number) * 100)}%
                    {s.rss_url && ' • RSS'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  <span className={`px-2 py-1 rounded text-xs ${
                    s.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.enabled ? 'Active' : 'Disabled'}
                  </span>

                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleEnabled(s)}
                      className="px-2 py-1 border rounded-lg text-xs hover:bg-slate-50"
                      title={s.enabled ? 'Disable source' : 'Enable source'}
                    >
                      {s.enabled ? '🔇' : '🔊'}
                    </button>

                    <button
                      onClick={() => openEditModal(s)}
                      className="px-2 py-1 border rounded-lg text-xs hover:bg-slate-50"
                      title="Edit source"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => openDeleteModal(s)}
                      className="px-2 py-1 border rounded-lg text-xs hover:bg-red-50 text-red-600"
                      title="Delete source"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Source Modal */}
      <EditSourceModal
        source={editingSource}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveSource}
        adminToken={adminToken}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => deletingSource && deleteSource(deletingSource)}
        title="Delete Source"
        message={`Are you sure you want to delete "${deletingSource?.name}"? This action cannot be undone.`}
        loading={actionLoading}
      />
    </main>
  );
}
