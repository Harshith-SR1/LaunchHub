"use client";
import React, { useEffect, useState } from 'react';

type Session = {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt: string;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/v1/auth/sessions', { credentials: 'include' });
    if (res.ok) {
      setSessions(await res.json());
    } else {
      setSessions([]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function revoke(id: string) {
    if (!confirm('Revoke this session?')) return;
    await fetch(`/api/v1/auth/sessions/${id}`, { method: 'DELETE', credentials: 'include' });
    await load();
  }

  if (loading) return <div>Loading sessions...</div>;
  if (!sessions) return <div>No sessions available.</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Active Sessions</h2>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th>Created</th>
            <th>IP</th>
            <th>User Agent</th>
            <th>Expires</th>
            <th>Revoked</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="odd:bg-gray-50">
              <td>{new Date(s.createdAt).toLocaleString()}</td>
              <td>{s.ipAddress ?? '—'}</td>
              <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.userAgent ?? '—'}</td>
              <td>{new Date(s.expiresAt).toLocaleString()}</td>
              <td>{s.revokedAt ? new Date(s.revokedAt).toLocaleString() : 'No'}</td>
              <td>
                <button onClick={() => revoke(s.id)} className="px-2 py-1 bg-red-500 text-white rounded">Revoke</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
