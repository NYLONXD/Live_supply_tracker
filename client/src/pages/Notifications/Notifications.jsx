// client/src/pages/Notifications/Notifications.jsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Package, Truck, UserCheck, UserX, MessageSquare,
  CheckCircle2, AlertCircle, Check, Trash2, Loader2, Filter
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { notificationAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  shipment_created:        { Icon: Package,       color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Shipment'   },
  shipment_assigned:       { Icon: Truck,         color: 'text-purple-600', bg: 'bg-purple-50', label: 'Assignment' },
  shipment_status_updated: { Icon: Package,       color: 'text-emerald-600',bg: 'bg-emerald-50',label: 'Status'     },
  driver_promoted:         { Icon: UserCheck,     color: 'text-green-600',  bg: 'bg-green-50',  label: 'Role'       },
  driver_demoted:          { Icon: UserX,         color: 'text-red-600',    bg: 'bg-red-50',    label: 'Role'       },
  support_ticket_created:  { Icon: MessageSquare, color: 'text-amber-600',  bg: 'bg-amber-50',  label: 'Support'    },
  support_ticket_replied:  { Icon: MessageSquare, color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Support'    },
  support_ticket_resolved: { Icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50',  label: 'Support'    },
  support_ticket_closed:   { Icon: CheckCircle2,  color: 'text-zinc-600',   bg: 'bg-zinc-50',   label: 'Support'    },
  system:                  { Icon: AlertCircle,   color: 'text-zinc-600',   bg: 'bg-zinc-50',   label: 'System'     },
};

function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 60_000)    return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const FILTERS = [
  { label: 'All',     value: '' },
  { label: 'Unread',  value: 'unread' },
  { label: 'Shipments', value: 'shipment' },
  { label: 'Support', value: 'support' },
  { label: 'Role',    value: 'role' },
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
      toast.success('All marked as read');
    } catch { toast.error('Failed'); }
  };

  const handleClearRead = async () => {
    setClearing(true);
    try {
      await notificationAPI.clearRead();
      fetchNotifs(1);
      toast.success('Read notifications cleared');
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
    let key = d >= today ? 'Today' : d >= yesterday ? 'Yesterday' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <DashboardLayout title="Notifications">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-sm flex items-center justify-center">
            <Bell size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-black tracking-tight">All Notifications</h2>
            <p className="text-xs text-zinc-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" icon={Check} onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={handleClearRead}
            loading={clearing}
          >
            Clear read
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-black text-white'
                : 'bg-white border border-zinc-200 text-zinc-500 hover:text-black hover:border-zinc-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-zinc-400" />
          </div>
        </Card>
      ) : notifs.length === 0 ? (
        <Card>
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-zinc-100 rounded-sm flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">Nothing here</h3>
            <p className="text-zinc-500 text-sm">
              {filter ? 'No notifications match this filter.' : 'You have no notifications yet.'}
            </p>
            {filter && (
              <button
                onClick={() => setFilter('')}
                className="mt-4 text-sm font-semibold text-black underline underline-offset-2"
              >
                Clear filter
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              {/* Date label */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              <Card noPadding>
                <div className="divide-y divide-zinc-50">
                  {items.map(notif => {
                    const cfg  = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                    const Icon = cfg.Icon;
                    return (
                      <button
                        key={notif._id}
                        onClick={() => handleClick(notif)}
                        className={`w-full text-left px-5 py-4 flex items-start gap-4 transition-colors hover:bg-zinc-50/70 ${
                          !notif.isRead ? 'bg-zinc-50/40' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div className={`shrink-0 w-10 h-10 rounded-sm flex items-center justify-center ${cfg.bg}`}>
                          <Icon size={18} className={cfg.color} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className={`text-sm leading-snug text-black ${!notif.isRead ? 'font-bold' : 'font-semibold'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                                {notif.message}
                              </p>
                              {notif.data?.trackingNumber && (
                                <span className="inline-block mt-1.5 px-2 py-0.5 bg-zinc-100 text-zinc-600 font-mono text-[10px] rounded-sm">
                                  {notif.data.trackingNumber}
                                </span>
                              )}
                            </div>

                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                              <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                                {formatDate(notif.createdAt)}
                              </span>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-black" />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchNotifs(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-zinc-500 font-medium">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchNotifs(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}