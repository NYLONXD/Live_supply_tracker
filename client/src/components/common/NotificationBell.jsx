// client/src/components/common/NotificationBell.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, Package, Truck, UserCheck, UserX, MessageSquare,
  CheckCircle2, AlertCircle, X, Check, Loader2
} from 'lucide-react';
import { notificationAPI } from '../../services/api';
import socketService from '../../services/socket.service';
import toast from 'react-hot-toast';

// ── Icon + colour per notification type ───────────────────────────────────────
const TYPE_CONFIG = {
  shipment_created:        { Icon: Package,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
  shipment_assigned:       { Icon: Truck,         color: 'text-purple-600', bg: 'bg-purple-50' },
  shipment_status_updated: { Icon: Package,       color: 'text-emerald-600',bg: 'bg-emerald-50'},
  driver_promoted:         { Icon: UserCheck,     color: 'text-green-600',  bg: 'bg-green-50'  },
  driver_demoted:          { Icon: UserX,         color: 'text-red-600',    bg: 'bg-red-50'    },
  support_ticket_created:  { Icon: MessageSquare, color: 'text-amber-600',  bg: 'bg-amber-50'  },
  support_ticket_replied:  { Icon: MessageSquare, color: 'text-blue-600',   bg: 'bg-blue-50'   },
  support_ticket_resolved: { Icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50'  },
  support_ticket_closed:   { Icon: CheckCircle2,  color: 'text-zinc-600',   bg: 'bg-zinc-50'   },
  system:                  { Icon: AlertCircle,   color: 'text-zinc-600',   bg: 'bg-zinc-50'   },
};

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60)   return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function NotificationBell() {
  const navigate  = useNavigate();
  const panelRef  = useRef(null);
  const bellRef   = useRef(null);

  const [open,       setOpen]       = useState(false);
  const [notifs,     setNotifs]     = useState([]);
  const [unread,     setUnread]     = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // ── Fetch unread count (lightweight poll) ──────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const { data } = await notificationAPI.getUnreadCount();
      setUnread(data.count);
    } catch { /* silent */ }
  }, []);

  // ── Fetch full list (only when panel opens) ────────────────────────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll({ limit: 15 });
      setNotifs(data.notifications);
      setUnread(data.unreadCount);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000); // poll every 30s
    return () => clearInterval(id);
  }, [fetchCount]);

  // ── Real-time push via socket ──────────────────────────────────────────
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handler = (notif) => {
      setUnread(n => n + 1);
      setNotifs(prev => [notif, ...prev].slice(0, 15));
      toast(notif.title, { icon: '🔔', duration: 4000 });
    };

    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, []);

  // ── Close on outside click ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current  && !bellRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    if (!open) fetchNotifs();
    setOpen(o => !o);
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifs(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnread(n => Math.max(0, n - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationAPI.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { toast.error('Failed to mark all read'); }
    finally { setMarkingAll(false); }
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) handleMarkRead(notif._id);
    const url = notif.data?.actionUrl;
    if (url) { setOpen(false); navigate(url); }
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className="relative p-2 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-sm transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-black text-white text-[10px] font-bold rounded-full">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[380px] bg-white border border-zinc-200 shadow-2xl shadow-zinc-200/60 rounded-sm overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-zinc-500" />
              <span className="text-sm font-bold text-black">Notifications</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 bg-black text-white text-[10px] font-bold rounded-sm">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-black transition-colors disabled:opacity-50"
                >
                  {markingAll
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Check size={11} />
                  }
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-black transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-50">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-zinc-400" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="text-center py-14">
                <Bell size={28} className="text-zinc-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-zinc-400">All caught up!</p>
                <p className="text-xs text-zinc-400 mt-1">No notifications yet.</p>
              </div>
            ) : (
              notifs.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                const Icon = cfg.Icon;
                return (
                  <button
                    key={notif._id}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-zinc-50 ${
                      !notif.isRead ? 'bg-zinc-50/70' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`shrink-0 w-8 h-8 rounded-sm flex items-center justify-center ${cfg.bg}`}>
                      <Icon size={15} className={cfg.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold text-black leading-snug ${!notif.isRead ? 'font-bold' : ''}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-black mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-snug line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-100 px-4 py-2.5">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-bold text-zinc-500 hover:text-black transition-colors uppercase tracking-wider"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}