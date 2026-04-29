// client/src/pages/Notifications/Notifications.jsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Package, Truck, UserCheck, UserX, MessageSquare,
  CheckCircle2, AlertCircle, Check, Trash2, Loader2, Filter, Zap
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { notificationAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  shipment_created:        { Icon: Package,       color: 'text-neon-blue',   bg: 'bg-neon-blue/10 border border-neon-blue/20',   label: 'Shipment', glow: 'shadow-[0_0_10px_rgba(0,240,255,0.2)]' },
  shipment_assigned:       { Icon: Truck,         color: 'text-neon-purple', bg: 'bg-neon-purple/10 border border-neon-purple/20', label: 'Assignment', glow: 'shadow-[0_0_10px_rgba(180,0,255,0.2)]' },
  shipment_status_updated: { Icon: Package,       color: 'text-neon-green',  bg: 'bg-neon-green/10 border border-neon-green/20', label: 'Status', glow: 'shadow-[0_0_10px_rgba(0,255,102,0.2)]'     },
  driver_promoted:         { Icon: UserCheck,     color: 'text-neon-green',  bg: 'bg-neon-green/10 border border-neon-green/20', label: 'Role', glow: 'shadow-[0_0_10px_rgba(0,255,102,0.2)]'       },
  driver_demoted:          { Icon: UserX,         color: 'text-destructive', bg: 'bg-destructive/10 border border-destructive/20',label: 'Role', glow: 'shadow-[0_0_10px_rgba(220,38,38,0.2)]'       },
  support_ticket_created:  { Icon: MessageSquare, color: 'text-amber-400',   bg: 'bg-amber-400/10 border border-amber-400/20',   label: 'Support', glow: 'shadow-[0_0_10px_rgba(251,191,36,0.2)]'    },
  support_ticket_replied:  { Icon: MessageSquare, color: 'text-neon-blue',   bg: 'bg-neon-blue/10 border border-neon-blue/20',   label: 'Support', glow: 'shadow-[0_0_10px_rgba(0,240,255,0.2)]'    },
  support_ticket_resolved: { Icon: CheckCircle2,  color: 'text-neon-green',  bg: 'bg-neon-green/10 border border-neon-green/20', label: 'Support', glow: 'shadow-[0_0_10px_rgba(0,255,102,0.2)]'    },
  support_ticket_closed:   { Icon: CheckCircle2,  color: 'text-muted-foreground',bg: 'bg-white/5 border border-white/10',          label: 'Support', glow: ''    },
  system:                  { Icon: AlertCircle,   color: 'text-neon-pink',   bg: 'bg-neon-pink/10 border border-neon-pink/20',   label: 'System', glow: 'shadow-[0_0_10px_rgba(255,0,102,0.2)]'     },
};

function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 60_000)    return 'Just Now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m Ago`;
  if (diff < 86_400_000)return `${Math.floor(diff / 3_600_000)}h Ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const FILTERS = [
  { label: 'All Signals',     value: '' },
  { label: 'Unread',          value: 'unread' },
  { label: 'Logistics',       value: 'shipment' },
  { label: 'Comms',           value: 'support' },
  { label: 'Clearance',       value: 'role' },
];

export default function Notifications() {
  const navigate = useNavigate();

  const [notifs,      setNotifs]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('');
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [clearing,    setClearing]    = useState(false);

  const fetchNotifs = useCallback(async (page = 1, activeFilter = filter) => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (activeFilter === 'unread') params.unread = 'true';

      const { data } = await notificationAPI.getAll(params);

      // Client-side type filter
      let list = data.notifications;
      if (activeFilter === 'shipment') list = list.filter(n => n.type.startsWith('shipment'));
      if (activeFilter === 'support')  list = list.filter(n => n.type.startsWith('support'));
      if (activeFilter === 'role')     list = list.filter(n => n.type.startsWith('driver'));

      setNotifs(list);
      setPagination(data.pagination);
      setUnreadCount(data.unreadCount);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifs(1, filter);
  }, [filter]); // eslint-disable-line

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All signals marked read');
    } catch { toast.error('Failed'); }
  };

  const handleClearRead = async () => {
    setClearing(true);
    try {
      await notificationAPI.clearRead();
      fetchNotifs(1);
      toast.success('Read signals cleared');
    } catch { toast.error('Failed'); }
    finally { setClearing(false); }
  };

  const handleClick = (notif) => {
    if (!notif.isRead) handleMarkRead(notif._id);
    const url = notif.data?.actionUrl;
    if (url) navigate(url);
  };

  // ── Group by date ──────────────────────────────────────────────────────────
  const grouped = notifs.reduce((acc, n) => {
    const d = new Date(n.createdAt);
    const today    = new Date(); today.setHours(0,0,0,0);
    const yesterday= new Date(today); yesterday.setDate(today.getDate()-1);
    let key = d >= today ? 'Today' : d >= yesterday ? 'Yesterday' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <DashboardLayout title="System Alerts">
      
      {/* Header Info Box */}
      <div className="glass-dark border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl relative overflow-hidden animate-modern-fade">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] relative">
              <Zap size={24} className="text-white" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-neon-pink rounded-full border-2 border-black shadow-[0_0_8px_rgba(255,0,102,0.8)] animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">Incoming Signals</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread signals detected` : "All channels clear"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {unreadCount > 0 && (
              <Button variant="neon" size="sm" icon={Check} onClick={handleMarkAllRead} className="h-9 px-4 text-xs font-bold uppercase tracking-widest">
                Acknowledge All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              onClick={handleClearRead}
              loading={clearing}
              className="h-9 px-4 text-xs font-bold uppercase tracking-widest border-white/20 text-white hover:bg-white/10"
            >
              Purge Read
            </Button>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar animate-modern-fade" style={{ animationDelay: '0.1s' }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg whitespace-nowrap transition-all duration-300 ${
              filter === f.value
                ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'bg-black/50 border border-white/10 text-muted-foreground hover:text-white hover:border-white/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-modern-fade" style={{ animationDelay: '0.2s' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20 glass-dark border border-white/10 rounded-2xl">
            <Loader2 size={32} className="animate-spin text-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.5)] rounded-full" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="glass-dark border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
              <Bell size={32} className="text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2">No Active Signals</h3>
            <p className="text-xs text-muted-foreground">
              {filter ? 'No signals match current spectrum filter.' : 'The communications channel is completely empty.'}
            </p>
            {filter && (
              <button
                onClick={() => setFilter('')}
                className="mt-6 text-[10px] font-bold uppercase tracking-widest text-neon-blue hover:text-white transition-colors"
              >
                Reset Spectrum Filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                {/* Date label */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-blue">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                </div>

                <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="divide-y divide-white/5 bg-black/20">
                    {items.map(notif => {
                      const cfg  = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                      const Icon = cfg.Icon;
                      return (
                        <button
                          key={notif._id}
                          onClick={() => handleClick(notif)}
                          className={`w-full text-left px-6 py-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-all duration-300 relative group ${
                            !notif.isRead ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          {!notif.isRead && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
                          )}
                          
                          {/* Icon */}
                          <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${cfg.bg} ${cfg.glow}`}>
                            <Icon size={20} className={cfg.color} />
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                              <div className="min-w-0">
                                <p className={`text-sm tracking-wide ${!notif.isRead ? 'font-bold text-white' : 'font-semibold text-zinc-300'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                                  {notif.message}
                                </p>
                                {notif.data?.trackingNumber && (
                                  <div className="mt-3">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black border border-white/10 text-neon-blue font-mono text-[10px] uppercase tracking-widest rounded-md shadow-inner">
                                      <Package size={10} /> {notif.data.trackingNumber}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="shrink-0 flex items-center gap-2 sm:flex-col sm:items-end sm:gap-2 mt-2 sm:mt-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                  {formatDate(notif.createdAt)}
                                </span>
                                {!notif.isRead && (
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-neon-blue bg-neon-blue/10 border border-neon-blue/20 px-2 py-0.5 rounded-full">
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchNotifs(pagination.page - 1)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Previous
                </Button>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Page {pagination.page} / {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchNotifs(pagination.page + 1)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}