// client/src/pages/Support/SupportTickets.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Package, CreditCard, Flag, Wrench, Clock,
  CheckCircle2, AlertCircle, ArrowLeft, Send, Loader2,
  User, ChevronRight, Star, RefreshCw, Tag
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { supportAPI } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

// ── Config helpers ────────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  order_delivery:  { Icon: Package,       label: 'Order & Delivery',  color: 'text-blue-600',   bg: 'bg-blue-50'   },
  payment_refund:  { Icon: CreditCard,    label: 'Payment & Refund',  color: 'text-emerald-600', bg: 'bg-emerald-50'},
  report_behavior: { Icon: Flag,          label: 'Report Behavior',   color: 'text-red-600',    bg: 'bg-red-50'    },
  technical_issue: { Icon: Wrench,        label: 'Technical Issue',   color: 'text-amber-600',  bg: 'bg-amber-50'  },
};

const STATUS_CONFIG = {
  open:        { label: 'Open',        color: 'bg-yellow-50 text-yellow-700 border-yellow-200'  },
  in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200'        },
  resolved:    { label: 'Resolved',    color: 'bg-green-50 text-green-700 border-green-200'     },
  closed:      { label: 'Closed',      color: 'bg-zinc-100 text-zinc-600 border-zinc-200'       },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'text-zinc-500' },
  medium: { label: 'Medium', color: 'text-blue-600' },
  high:   { label: 'High',   color: 'text-amber-600' },
  urgent: { label: 'Urgent', color: 'text-red-600'  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function timeAgo(date) {
  const d = new Date(date);
  const diff = Date.now() - d;
  if (diff < 60_000)     return 'just now';
  if (diff < 3_600_000)  return `${Math.floor(diff/60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff/3_600_000)}h ago`;
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}

// ════════════════════════════════════════════════════════════════════════════════
// Ticket LIST page
// ════════════════════════════════════════════════════════════════════════════════
export function SupportTicketList() {
  const { user } = useAuthStore();
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [status,   setStatus]   = useState('');
  const [category, setCategory] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status)   params.status   = status;
      if (category) params.category = category;
      const { data } = await supportAPI.getAll(params);
      setTickets(data.tickets);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  }, [status, category]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const isAdmin = user?.role === 'admin';

  return (
    <DashboardLayout title={isAdmin ? 'Support Tickets' : 'My Support Tickets'}>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-zinc-200 rounded-sm text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-4 py-2.5 bg-white border border-zinc-200 rounded-sm text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">All Categories</option>
          <option value="order_delivery">Order & Delivery</option>
          <option value="payment_refund">Payment & Refund</option>
          <option value="report_behavior">Report Behavior</option>
          <option value="technical_issue">Technical Issue</option>
        </select>

        <button onClick={fetchTickets} className="p-2.5 border border-zinc-200 bg-white rounded-sm hover:bg-zinc-50 transition-colors">
          <RefreshCw size={16} className="text-zinc-500" />
        </button>

        <div className="flex-1" />

        <Link to="/support">
          <Button icon={MessageSquare}>New Ticket</Button>
        </Link>
      </div>

      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-zinc-400" />
          </div>
        </Card>
      ) : tickets.length === 0 ? (
        <Card>
          <div className="text-center py-20">
            <MessageSquare size={32} className="text-zinc-300 mx-auto mb-4" />
            <h3 className="font-bold text-black mb-2">No tickets found</h3>
            <p className="text-zinc-500 text-sm mb-6">You haven't submitted any support requests yet.</p>
            <Link to="/support">
              <Button>Open a Ticket</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card noPadding>
          <div className="divide-y divide-zinc-100">
            {tickets.map(ticket => {
              const cat = CATEGORY_CONFIG[ticket.category];
              const Icon = cat?.Icon || MessageSquare;
              const pri = PRIORITY_CONFIG[ticket.priority];

              return (
                <Link
                  key={ticket._id}
                  to={`/support/tickets/${ticket._id}`}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors group"
                >
                  <div className={`shrink-0 w-10 h-10 rounded-sm flex items-center justify-center ${cat?.bg}`}>
                    <Icon size={18} className={cat?.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-black truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="font-mono text-[10px] text-zinc-400">{ticket.ticketNumber}</span>
                          <span className="text-zinc-300">·</span>
                          <span className="text-xs text-zinc-500">{cat?.label}</span>
                          {isAdmin && (
                            <>
                              <span className="text-zinc-300">·</span>
                              <span className="text-xs text-zinc-500">{ticket.createdBy?.displayName}</span>
                            </>
                          )}
                          {ticket.trackingNumber && (
                            <>
                              <span className="text-zinc-300">·</span>
                              <span className="font-mono text-[10px] text-purple-600">{ticket.trackingNumber}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge status={ticket.status} />
                        <span className={`text-[10px] font-bold uppercase ${pri?.color}`}>
                          {pri?.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-zinc-400">{timeAgo(ticket.updatedAt || ticket.createdAt)}</span>
                    <ChevronRight size={14} className="text-zinc-300 group-hover:text-black transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Ticket DETAIL page — message thread
// ════════════════════════════════════════════════════════════════════════════════
export function SupportTicketDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuthStore();

  const [ticket,    setTicket]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [reply,     setReply]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [rating,    setRating]    = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  const isAdmin = user?.role === 'admin';

  const fetchTicket = useCallback(async () => {
    try {
      const { data } = await supportAPI.getTicket(id);
      setTicket(data);
      if (data.satisfactionRating) setRating(data.satisfactionRating);
    } catch { toast.error('Failed to load ticket'); navigate(-1); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data } = await supportAPI.reply(id, reply.trim());
      setTicket(data);
      setReply('');
    } catch { toast.error('Failed to send reply'); }
    finally { setSending(false); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await supportAPI.updateStatus(id, newStatus);
      setTicket(t => ({ ...t, status: newStatus }));
      toast.success(`Ticket marked as ${newStatus}`);
    } catch { toast.error('Failed to update status'); }
  };

  const handleRate = async (stars) => {
    try {
      await supportAPI.rateTicket(id, stars);
      setRating(stars);
      toast.success('Thank you for your feedback!');
    } catch { toast.error('Failed to submit rating'); }
  };

  if (loading) {
    return (
      <DashboardLayout title="Support Ticket">
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-zinc-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) return null;

  const cat  = CATEGORY_CONFIG[ticket.category];
  const Icon = cat?.Icon || MessageSquare;
  const isResolved = ['resolved', 'closed'].includes(ticket.status);
  const isOwner    = ticket.createdBy?._id === user?._id || ticket.createdBy === user?._id;

  return (
    <DashboardLayout title="Ticket Detail">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-100 rounded-sm transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className={`w-9 h-9 rounded-sm flex items-center justify-center ${cat?.bg}`}>
            <Icon size={16} className={cat?.color} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-black tracking-tight truncate">{ticket.subject}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="font-mono text-[10px] text-zinc-400">{ticket.ticketNumber}</span>
              <span className="text-zinc-300">·</span>
              <span className="text-xs text-zinc-500">{cat?.label}</span>
            </div>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        {/* Meta card */}
        <Card>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <MetaItem label="Priority" value={ticket.priority} valueClass={PRIORITY_CONFIG[ticket.priority]?.color} capitalize />
            <MetaItem label="Created"  value={new Date(ticket.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})} />
            <MetaItem label="Opened by" value={ticket.createdBy?.displayName || 'You'} />
            {ticket.trackingNumber && (
              <MetaItem label="Shipment" value={ticket.trackingNumber} mono />
            )}
          </div>

          {/* Linked shipment preview */}
          {ticket.shipmentId && (
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-3 p-3 bg-zinc-50 rounded-sm">
              <Package size={16} className="text-zinc-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-black">{ticket.shipmentId.trackingNumber}</p>
                <p className="text-xs text-zinc-500">{ticket.shipmentId.from?.split(',')[0]} → {ticket.shipmentId.to?.split(',')[0]}</p>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${STATUS_CONFIG[ticket.shipmentId.status]?.color || ''}`}>
                {ticket.shipmentId.status?.replace('_',' ')}
              </span>
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && !isResolved && (
            <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider self-center mr-1">Change Status:</span>
              {['in_progress', 'resolved', 'closed'].map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={ticket.status === s}
                  className="px-3 py-1.5 text-xs font-bold border rounded-sm capitalize transition-colors disabled:opacity-40 hover:bg-black hover:text-white hover:border-black border-zinc-200 text-zinc-600"
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Message thread */}
        <div className="space-y-3">
          {ticket.messages?.map((msg, i) => {
            const isMe      = msg.sender?._id === user?._id || msg.sender === user?._id;
            const isAdminMsg= msg.senderRole === 'admin';

            return (
              <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {/* Sender label */}
                  <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-bold ${
                      isAdminMsg ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {msg.sender?.displayName?.charAt(0) || 'U'}
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-400">
                      {isMe ? 'You' : (msg.sender?.displayName || 'Support Agent')}
                      {isAdminMsg && !isMe ? ' · Support' : ''}
                    </span>
                    <span className="text-[10px] text-zinc-400">{timeAgo(msg.createdAt)}</span>
                  </div>

                  {/* Bubble */}
                  <div className={`px-4 py-3 rounded-sm text-sm leading-relaxed ${
                    isMe
                      ? 'bg-black text-white'
                      : isAdminMsg
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white border border-zinc-200 text-black'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply form */}
        {!isResolved ? (
          <Card>
            <form onSubmit={handleReply} className="flex gap-3 items-end">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={3}
                placeholder={isAdmin ? 'Reply to this ticket…' : 'Add more details or respond…'}
                className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-sm text-sm text-black placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(e); }}
              />
              <Button type="submit" loading={sending} icon={Send} disabled={!reply.trim()}>
                Send
              </Button>
            </form>
            <p className="text-[10px] text-zinc-400 mt-2">Ctrl+Enter to send quickly</p>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              <span>This ticket has been <strong className="text-black">{ticket.status}</strong>. No further replies can be added.</span>
            </div>

            {/* Star rating — shown to ticket owner after resolution */}
            {isOwner && !isAdmin && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Rate your support experience
                </p>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRate(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={24}
                        className={`transition-colors ${
                          star <= (hoveredStar || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-300'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-xs font-medium text-zinc-500">
                      {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetaItem({ label, value, capitalize, valueClass, mono }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold text-black ${capitalize ? 'capitalize' : ''} ${valueClass || ''} ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}