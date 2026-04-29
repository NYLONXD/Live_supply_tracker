// client/src/pages/Support/SupportTickets.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Package, CreditCard, Flag, Wrench, Clock,
  CheckCircle2, AlertCircle, ArrowLeft, Send, Loader2,
  User, ChevronRight, Star, RefreshCw, Tag, Zap
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { supportAPI } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

// ── Config helpers ────────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  order_delivery:  { Icon: Package,       label: 'Order & Delivery',  color: 'text-neon-blue',   bg: 'bg-neon-blue/10 border border-neon-blue/20',   glow: 'shadow-[0_0_10px_rgba(0,240,255,0.2)]' },
  payment_refund:  { Icon: CreditCard,    label: 'Payment & Refund',  color: 'text-neon-green',  bg: 'bg-neon-green/10 border border-neon-green/20', glow: 'shadow-[0_0_10px_rgba(0,255,102,0.2)]' },
  report_behavior: { Icon: Flag,          label: 'Report Behavior',   color: 'text-destructive', bg: 'bg-destructive/10 border border-destructive/20', glow: 'shadow-[0_0_10px_rgba(220,38,38,0.2)]' },
  technical_issue: { Icon: Wrench,        label: 'Technical Issue',   color: 'text-amber-400',   bg: 'bg-amber-400/10 border border-amber-400/20',   glow: 'shadow-[0_0_10px_rgba(251,191,36,0.2)]' },
};

const STATUS_CONFIG = {
  open:        { label: 'Open',        color: 'bg-amber-400/10 text-amber-400 border-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.2)]'  },
  in_progress: { label: 'In Progress', color: 'bg-neon-blue/10 text-neon-blue border-neon-blue/20 shadow-[0_0_8px_rgba(0,240,255,0.2)] animate-pulse'        },
  resolved:    { label: 'Resolved',    color: 'bg-neon-green/10 text-neon-green border-neon-green/20 shadow-[0_0_8px_rgba(0,255,102,0.2)]'     },
  closed:      { label: 'Closed',      color: 'bg-white/5 text-muted-foreground border-white/10'       },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'text-muted-foreground' },
  medium: { label: 'Medium', color: 'text-neon-blue' },
  high:   { label: 'High',   color: 'text-amber-400' },
  urgent: { label: 'Urgent', color: 'text-destructive shadow-[0_0_8px_rgba(220,38,38,0.5)]'  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function timeAgo(date) {
  const d = new Date(date);
  const diff = Date.now() - d;
  if (diff < 60_000)     return 'Just Now';
  if (diff < 3_600_000)  return `${Math.floor(diff/60_000)}m Ago`;
  if (diff < 86_400_000) return `${Math.floor(diff/3_600_000)}h Ago`;
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
    <DashboardLayout title={isAdmin ? 'Support Center' : 'My Support Tickets'}>

      {/* Filters */}
      <div className="glass-dark border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden animate-modern-fade">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Issue Tracking</h2>
            <p className="text-xs text-muted-foreground">Manage and resolve operational anomalies.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-neon-blue appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-neon-blue appearance-none"
          >
            <option value="">All Categories</option>
            <option value="order_delivery">Order & Delivery</option>
            <option value="payment_refund">Payment & Refund</option>
            <option value="report_behavior">Report Behavior</option>
            <option value="technical_issue">Technical Issue</option>
          </select>

          <button onClick={fetchTickets} className="p-2.5 border border-white/10 bg-black/50 rounded-lg hover:bg-white/10 hover:border-white/30 transition-all text-white">
            <RefreshCw size={16} />
          </button>

          <div className="flex-1" />

          <Link to="/support">
            <Button variant="neon" icon={MessageSquare} className="w-full sm:w-auto text-xs font-bold uppercase tracking-widest px-6 h-10">
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 glass-dark border border-white/10 rounded-2xl">
          <Loader2 size={32} className="animate-spin text-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.5)] rounded-full" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-24 glass-dark border border-white/10 rounded-2xl">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
            <MessageSquare size={32} className="text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2">No Active Tickets</h3>
          <p className="text-xs text-muted-foreground mb-6">No anomalies detected matching your filters.</p>
          <Link to="/support">
            <Button variant="outline" className="text-xs font-bold uppercase tracking-widest border-white/20 hover:border-neon-blue hover:text-neon-blue text-white">
              Initialize Ticket
            </Button>
          </Link>
        </div>
      ) : (
        <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-modern-fade" style={{ animationDelay: '0.1s' }}>
          <div className="divide-y divide-white/5 bg-black/20">
            {tickets.map(ticket => {
              const cat = CATEGORY_CONFIG[ticket.category];
              const Icon = cat?.Icon || MessageSquare;
              const pri = PRIORITY_CONFIG[ticket.priority];

              return (
                <Link
                  key={ticket._id}
                  to={`/support/tickets/${ticket._id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 hover:bg-white/[0.04] transition-colors group relative"
                >
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${cat?.bg} ${cat?.glow}`}>
                    <Icon size={20} className={cat?.color} />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate tracking-wide">{ticket.subject}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="font-mono text-[10px] text-neon-blue uppercase px-1.5 py-0.5 bg-neon-blue/10 rounded-sm border border-neon-blue/20">{ticket.ticketNumber}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cat?.label}</span>
                          {isAdmin && (
                            <>
                              <span className="text-white/20">·</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User: <span className="text-white">{ticket.createdBy?.displayName}</span></span>
                            </>
                          )}
                          {ticket.trackingNumber && (
                            <>
                              <span className="text-white/20">·</span>
                              <span className="font-mono text-[10px] text-neon-purple uppercase px-1.5 py-0.5 bg-neon-purple/10 rounded-sm border border-neon-purple/20 flex items-center gap-1">
                                <Package size={10} /> {ticket.trackingNumber}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={ticket.status} />
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${pri?.color}`}>
                          {pri?.label} Priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 ml-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{timeAgo(ticket.updatedAt || ticket.createdAt)}</span>
                    <ChevronRight size={16} className="text-white/30 group-hover:text-neon-blue transition-colors group-hover:translate-x-1 duration-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
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
      <DashboardLayout title="Ticket Detail">
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.5)] rounded-full" />
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
      <div className="max-w-4xl mx-auto space-y-6 animate-modern-fade">

        {/* Back + Header */}
        <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
            <ArrowLeft size={20} />
          </button>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat?.bg} ${cat?.glow}`}>
            <Icon size={20} className={cat?.color} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-white text-lg tracking-wide truncate">{ticket.subject}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="font-mono text-[10px] text-neon-blue px-1.5 py-0.5 bg-neon-blue/10 border border-neon-blue/20 rounded-sm uppercase">{ticket.ticketNumber}</span>
              <span className="text-white/20">·</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cat?.label}</span>
            </div>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        {/* Meta card */}
        <div className="glass-dark border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 relative z-10">
            <MetaItem label="Priority" value={ticket.priority} valueClass={PRIORITY_CONFIG[ticket.priority]?.color} capitalize />
            <MetaItem label="Created"  value={new Date(ticket.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})} />
            <MetaItem label="Opened by" value={ticket.createdBy?.displayName || 'You'} />
            {ticket.trackingNumber && (
              <MetaItem label="Shipment Hash" value={ticket.trackingNumber} mono valueClass="text-neon-purple" />
            )}
          </div>

          {/* Linked shipment preview */}
          {ticket.shipmentId && (
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                <Package size={20} className="text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono font-bold text-white">{ticket.shipmentId.trackingNumber}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate max-w-[150px]">{ticket.shipmentId.from?.split(',')[0]}</p>
                  <ArrowLeft size={10} className="rotate-180 text-white/30" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-pink" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate max-w-[150px]">{ticket.shipmentId.to?.split(',')[0]}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm border ${STATUS_CONFIG[ticket.shipmentId.status]?.color || 'border-white/20 text-white'}`}>
                {ticket.shipmentId.status?.replace('_',' ')}
              </span>
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && !isResolved && (
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-3 items-center relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Wrench size={12} /> Status Override:
              </span>
              {['in_progress', 'resolved', 'closed'].map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={ticket.status === s}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-md transition-all ${
                    ticket.status === s 
                      ? 'bg-white/10 text-white/50 border-white/5 cursor-not-allowed' 
                      : 'border-white/20 text-white hover:border-neon-blue hover:text-neon-blue hover:bg-neon-blue/10'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message thread */}
        <div className="space-y-4">
          {ticket.messages?.map((msg, i) => {
            const isMe      = msg.sender?._id === user?._id || msg.sender === user?._id;
            const isAdminMsg= msg.senderRole === 'admin';

            return (
              <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                  {/* Sender label */}
                  <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                      isAdminMsg ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]' : 'bg-white/10 text-white border border-white/20'
                    }`}>
                      {msg.sender?.displayName?.charAt(0) || 'U'}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {isMe ? 'You' : (msg.sender?.displayName || 'Support Agent')}
                      {isAdminMsg && !isMe && <span className="text-neon-blue ml-1">· Support</span>}
                    </span>
                    <span className="text-white/20 text-[10px]">•</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{timeAgo(msg.createdAt)}</span>
                  </div>

                  {/* Bubble */}
                  <div className={`px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                    isMe
                      ? 'bg-black border border-white/10 text-white rounded-tr-sm'
                      : isAdminMsg
                        ? 'bg-neon-blue/5 border border-neon-blue/20 text-white rounded-tl-sm shadow-[0_0_15px_rgba(0,240,255,0.05)]'
                        : 'bg-white/5 border border-white/10 text-white rounded-tl-sm'
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
          <div className="glass-dark border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <form onSubmit={handleReply} className="flex flex-col gap-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neon-blue flex items-center gap-2">
                <MessageSquare size={12} /> Transmit Response
              </label>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={3}
                placeholder={isAdmin ? 'Enter official response directive…' : 'Provide operational updates or queries…'}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-blue focus:border-neon-blue resize-none transition-all"
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(e); }}
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Zap size={10} className="text-neon-green" /> Ctrl+Enter to transmit instantly
                </p>
                <Button type="submit" variant="neon" loading={sending} icon={Send} disabled={!reply.trim()} className="px-6">
                  Transmit
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="glass-dark border border-white/10 rounded-2xl p-6 shadow-2xl text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-muted-foreground" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Channel Closed
              </p>
              <p className="text-xs text-white">This ticket has been marked as <strong className="text-neon-blue uppercase">{ticket.status}</strong>. Further transmissions are blocked.</p>
            </div>

            {/* Star rating — shown to ticket owner after resolution */}
            {isOwner && !isAdmin && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neon-blue mb-4">
                  Rate Operational Support Quality
                </p>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRate(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          size={28}
                          className={`transition-all duration-300 ${
                            star <= (hoveredStar || rating)
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                              : 'text-white/20 hover:text-white/40'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                      Evaluation: {['', 'Suboptimal', 'Acceptable', 'Satisfactory', 'Optimal', 'Exemplary'][rating]}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetaItem({ label, value, capitalize, valueClass, mono }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</p>
      <p className={`text-sm font-bold text-white ${capitalize ? 'capitalize' : ''} ${valueClass || ''} ${mono ? 'font-mono text-xs tracking-tight bg-black/50 px-2 py-0.5 rounded border border-white/10 inline-block' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}