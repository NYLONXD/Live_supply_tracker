// client/src/pages/Admin/Users.jsx
import { useEffect, useState } from 'react';
import { Search, Ban, Check, Link2, Copy, Trash2, RefreshCw, Users as UsersIcon, ShieldAlert, Zap } from 'lucide-react';
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
      <DashboardLayout title="Access Control">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-white/20 border-t-neon-blue rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
        </div>
      </DashboardLayout>
    );
  }

  // Pending invites = not used and not expired
  const pendingInvites = invites.filter(
    (i) => !i.usedAt && new Date(i.expiresAt) > new Date()
  );

  return (
    <DashboardLayout title="Access Control">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-modern-fade">
        
        {/* Left Column: Invites */}
        <div className="lg:col-span-1 space-y-6">
          {/* Invite Generator */}
          <div className="glass-dark border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-blue/10 rounded-full blur-[40px] pointer-events-none" />
            
            <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-2 flex items-center gap-2">
              <Zap size={16} className="text-neon-blue" /> Issue Credentials
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Generate encrypted access tokens for new operators or clients.
            </p>

            <form onSubmit={handleCreateInvite} className="flex flex-col gap-4 relative z-10">
              <Input
                label="Target Email (Optional)"
                type="email"
                placeholder="operative@domain.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-black/50 border-white/10 focus-visible:ring-neon-blue text-white"
              />
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Clearance Level
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-neon-blue appearance-none transition-colors"
                >
                  <option value="driver">Operator (Driver)</option>
                  <option value="user">Client (User)</option>
                </select>
              </div>
              
              <Button type="submit" loading={creating} variant="neon" icon={Link2} className="w-full mt-2">
                Generate Access Link
              </Button>
            </form>

            {/* Newly created link */}
            {newInviteUrl && (
              <div className="mt-6 p-4 bg-neon-green/5 border border-neon-green/20 rounded-lg flex flex-col gap-3 relative z-10 shadow-[0_0_15px_rgba(0,255,102,0.1)]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neon-green">Token Generated</p>
                <p className="text-xs font-mono text-white truncate break-all">
                  {newInviteUrl}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Copy}
                  onClick={() => copyLink(newInviteUrl)}
                  className="w-full border-neon-green/30 hover:bg-neon-green/10 text-neon-green"
                >
                  Copy to Clipboard
                </Button>
              </div>
            )}
          </div>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="glass-dark border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center justify-between">
                <span>Pending Tokens</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px]">{pendingInvites.length}</span>
              </h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.token}
                    className="flex flex-col gap-3 p-3 border border-white/5 rounded-lg bg-black/30 hover:bg-black/50 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white capitalize flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${invite.role === 'driver' ? 'bg-neon-blue' : 'bg-neon-purple'}`} />
                          {invite.role}
                        </p>
                        {invite.email ? (
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">{invite.email}</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-1 italic">Open Link</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground/70">
                        Exp: {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-white"
                          onClick={() => copyLink(`${window.location.origin}/join/${invite.token}`)}
                          title="Copy Link"
                        >
                          <Copy size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRevoke(invite.token)}
                          title="Revoke Token"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: User Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                  <UsersIcon size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white">Network Operatives</h2>
                  <p className="text-xs text-muted-foreground">{filteredUsers.length} Active Nodes</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Input
                    icon={Search}
                    placeholder="Search personnel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/50 border-white/10 focus-visible:ring-neon-blue text-white h-10"
                  />
                </div>
                <button
                  onClick={fetchAll}
                  className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                  title="Refresh Roster"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <ShieldAlert size={40} className="text-muted-foreground opacity-50 mb-4" />
                  <p className="text-sm font-bold text-white uppercase tracking-widest">No Personnel Found</p>
                  <p className="text-xs text-muted-foreground mt-2">The roster is empty or no matches exist.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID / Operative</th>
                      <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Comms</th>
                      <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Clearance</th>
                      <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="text-right py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-black/20">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-white/[0.04] transition-colors group">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[10px] font-mono text-neon-blue border border-white/5">
                              {user.displayName.charAt(0).toUpperCase()}
                            </div>
                            {user.displayName}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-muted-foreground">{user.email}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border ${
                            user.role === 'admin' ? 'bg-neon-pink/10 text-neon-pink border-neon-pink/20 shadow-[0_0_8px_rgba(255,0,102,0.2)]' :
                            user.role === 'driver' ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/20' :
                            'bg-white/10 text-white border-white/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {user.isActive ? (
                            <span className="flex items-center gap-1.5 text-neon-green text-[10px] font-bold uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_8px_rgba(0,255,102,0.8)]" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-destructive text-[10px] font-bold uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(220,38,38,0.8)]" /> Suspended
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            size="sm"
                            variant={user.isActive ? 'outline' : 'neon'}
                            className={`text-xs px-3 py-1 h-auto ${user.isActive ? 'border-white/20 text-muted-foreground hover:text-white hover:bg-white/10 hover:border-white/40' : ''}`}
                            onClick={() => handleToggleStatus(user._id)}
                            disabled={user.role === 'admin'} // Prevent toggling admins to avoid lockout
                          >
                            {user.isActive ? 'Suspend' : 'Reinstate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </DashboardLayout>
  );
}