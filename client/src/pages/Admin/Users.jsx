// client/src/pages/Admin/Users.jsx
import { useEffect, useState } from 'react';
import { Search, Ban, Check, Link2, Copy, Trash2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { adminAPI, inviteAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Users() {
  const [users,          setUsers]          = useState([]);
  const [invites,        setInvites]        = useState([]);
  const [filteredUsers,  setFilteredUsers]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchTerm,     setSearchTerm]     = useState('');

  // Invite creation state
  const [inviteEmail,    setInviteEmail]    = useState('');
  const [inviteRole,     setInviteRole]     = useState('driver');
  const [creating,       setCreating]       = useState(false);
  const [newInviteUrl,   setNewInviteUrl]   = useState('');

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, users]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, invitesRes] = await Promise.all([
        adminAPI.getAllUsers(),
        inviteAPI.getAll(),
      ]);
      setUsers(usersRes.data);
      setInvites(invitesRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ── Create invite ───────────────────────────────────────────────────────────
  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setCreating(true);
    setNewInviteUrl('');
    try {
      const { data } = await inviteAPI.create({
        email: inviteEmail.trim() || undefined,
        role:  inviteRole,
      });
      setNewInviteUrl(data.inviteUrl);
      setInviteEmail('');
      // Refresh invites list
      const res = await inviteAPI.getAll();
      setInvites(res.data);
      toast.success('Invite link created!');
    } catch {
      toast.error('Failed to create invite');
    } finally {
      setCreating(false);
    }
  };

  // ── Copy link ───────────────────────────────────────────────────────────────
  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  // ── Revoke invite ───────────────────────────────────────────────────────────
  const handleRevoke = async (token) => {
    if (!confirm('Revoke this invite? It will no longer work.')) return;
    try {
      await inviteAPI.revoke(token);
      setInvites((prev) => prev.filter((i) => i.token !== token));
      toast.success('Invite revoked');
    } catch {
      toast.error('Failed to revoke invite');
    }
  };

  // ── Toggle user status ──────────────────────────────────────────────────────
  const handleToggleStatus = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      toast.success('User status updated');
      fetchAll();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Users">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Pending invites = not used and not expired
  const pendingInvites = invites.filter(
    (i) => !i.usedAt && new Date(i.expiresAt) > new Date()
  );

  return (
    <DashboardLayout title="Users & Invites">

      {/* ── Invite Section ──────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold tracking-tight mb-1">Invite someone to your team</h2>
        <p className="text-sm text-brand-zinc-500 mb-4">
          Send them the link — they'll register and be locked to your org automatically.
        </p>

        <form onSubmit={handleCreateInvite} className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1">
            <Input
              label="Email (optional — pre-fills the form)"
              type="email"
              placeholder="driver@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div className="w-full md:w-40">
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-zinc-500 mb-1.5">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-brand-zinc-200 text-black rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="driver">Driver</option>
              <option value="user">User</option>
            </select>
          </div>
          <Button type="submit" loading={creating} icon={Link2} className="whitespace-nowrap">
            Generate Link
          </Button>
        </form>

        {/* Newly created link */}
        {newInviteUrl && (
          <div className="mt-4 p-4 bg-brand-zinc-50 border border-brand-zinc-200 rounded-sm flex items-center justify-between gap-4">
            <p className="text-xs font-mono text-brand-zinc-600 truncate flex-1">
              {newInviteUrl}
            </p>
            <Button
              size="sm"
              variant="outline"
              icon={Copy}
              onClick={() => copyLink(newInviteUrl)}
            >
              Copy
            </Button>
          </div>
        )}
      </Card>

      {/* ── Pending Invites ─────────────────────────────────────────────────── */}
      {pendingInvites.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-base font-bold tracking-tight mb-4">
            Pending Invites ({pendingInvites.length})
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.token}
                className="flex items-center justify-between gap-4 p-3 border border-brand-zinc-100 rounded-sm bg-brand-zinc-50"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-black capitalize">
                    {invite.role}
                    {invite.email && (
                      <span className="text-brand-zinc-400 font-normal ml-2">
                        → {invite.email}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-brand-zinc-400 mt-0.5">
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    {' · '}Created by {invite.invitedBy?.displayName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Copy}
                    onClick={() =>
                      copyLink(`${window.location.origin}/join/${invite.token}`)
                    }
                  >
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => handleRevoke(invite.token)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Users Table ─────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold tracking-tight">
            Team Members ({filteredUsers.length})
          </h2>
          <button
            onClick={fetchAll}
            className="p-2 text-brand-zinc-400 hover:text-black transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="mb-4">
          <Input
            icon={Search}
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-brand-zinc-400 text-sm">
            No team members yet. Invite someone above to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-zinc-200 bg-brand-zinc-50">
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-brand-zinc-500">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-brand-zinc-500">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-brand-zinc-500">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-brand-zinc-500">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-brand-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-zinc-100">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-brand-zinc-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-black">{user.displayName}</td>
                    <td className="py-3 px-4 text-brand-zinc-500">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm bg-brand-zinc-100 text-brand-zinc-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.isActive ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <Check size={14} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                          <Ban size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant={user.isActive ? 'danger' : 'secondary'}
                        onClick={() => handleToggleStatus(user._id)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}