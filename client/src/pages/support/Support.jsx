// client/src/pages/Support/Support.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Package, CreditCard, Flag, Wrench, ChevronRight, Search,
  Send, Loader2, X, CheckCircle2, AlertCircle, MessageSquare,
  ArrowLeft, Clock, Tag, Truck
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { supportAPI } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

// ── Category definitions ───────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key:         'order_delivery',
    icon:        Package,
    label:       'Order & Delivery',
    description: 'Issues with shipment tracking, missing items, wrong address, or delivery delays.',
    color:       'text-blue-600',
    bg:          'bg-blue-50',
    border:      'hover:border-blue-300',
    prompts:     ['My shipment is delayed', 'Wrong delivery address', 'Item not received', 'Shipment stuck in transit'],
  },
  {
    key:         'payment_refund',
    icon:        CreditCard,
    label:       'Payment & Refund',
    description: 'Billing queries, refund requests, incorrect charges, or payment failures.',
    color:       'text-emerald-600',
    bg:          'bg-emerald-50',
    border:      'hover:border-emerald-300',
    prompts:     ['Request a refund', 'Incorrect billing', 'Payment failed', 'Change payment method'],
  },
  {
    key:         'report_behavior',
    icon:        Flag,
    label:       'Report Behavior',
    description: 'Report driver misconduct, unsafe practices, or inappropriate conduct.',
    color:       'text-red-600',
    bg:          'bg-red-50',
    border:      'hover:border-red-300',
    prompts:     ['Report rude driver', 'Unsafe driving', 'Damaged package', 'Unprofessional conduct'],
  },
  {
    key:         'technical_issue',
    icon:        Wrench,
    label:       'Technical Issue',
    description: 'App bugs, login problems, map not loading, or any platform-related issues.',
    color:       'text-amber-600',
    bg:          'bg-amber-50',
    border:      'hover:border-amber-300',
    prompts:     ['App crashes', 'Cannot log in', 'Map not showing', 'Tracking not updating'],
  },
];

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low',    color: 'text-zinc-500' },
  { value: 'medium', label: 'Medium', color: 'text-blue-600' },
  { value: 'high',   label: 'High',   color: 'text-amber-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
];

// ── Shipment Dropdown ─────────────────────────────────────────────────────────
function ShipmentSelector({ value, onChange }) {
  const [search,    setSearch]    = useState('');
  const [shipments, setShipments] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [open,      setOpen]      = useState(false);
  const ref = useRef(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supportAPI.getShipments();
      setShipments(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = shipments.filter(s =>
    !search ||
    s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.from?.toLowerCase().includes(search.toLowerCase()) ||
    s.to?.toLowerCase().includes(search.toLowerCase())
  );

  const selected = shipments.find(s => s._id === value);

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange(null, '');
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
        Related Shipment <span className="text-zinc-400 normal-case tracking-normal font-normal">(optional)</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-zinc-200 rounded-sm text-left focus:outline-none focus:ring-1 focus:ring-black focus:border-black hover:border-zinc-400 transition-colors"
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <Truck size={14} className="text-zinc-500 shrink-0" />
            <span className="font-mono text-sm text-black">{selected.trackingNumber}</span>
            <span className="text-xs text-zinc-400 truncate">
              {selected.from?.split(',')[0]} → {selected.to?.split(',')[0]}
            </span>
          </div>
        ) : (
          <span className="text-zinc-400 text-sm">Search or select a shipment…</span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              onClick={clearSelection}
              className="text-zinc-400 hover:text-black transition-colors cursor-pointer"
            >
              <X size={14} />
            </span>
          )}
          <ChevronRight size={14} className={`text-zinc-400 transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-zinc-200 shadow-xl rounded-sm overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-zinc-100">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tracking number or location…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={16} className="animate-spin text-zinc-400" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-xs text-zinc-400 py-6">No shipments found</p>
            ) : (
              filtered.map(s => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => { onChange(s._id, s.trackingNumber); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors ${
                    value === s._id ? 'bg-zinc-50' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold text-black">{s.trackingNumber}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {s.from?.split(',')[0]} → {s.to?.split(',')[0]}
                    </p>
                  </div>
                  <StatusPill status={s.status} />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const cfg = {
    pending:    'bg-yellow-50 text-yellow-700',
    assigned:   'bg-blue-50 text-blue-700',
    picked_up:  'bg-cyan-50 text-cyan-700',
    in_transit: 'bg-purple-50 text-purple-700',
    delivered:  'bg-green-50 text-green-700',
    cancelled:  'bg-red-50 text-red-700',
  }[status] || 'bg-zinc-50 text-zinc-600';

  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm shrink-0 ${cfg}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

// ── Ticket Form ───────────────────────────────────────────────────────────────
function TicketForm({ category, onSuccess, onBack }) {
  const cat = CATEGORIES.find(c => c.key === category);
  const Icon = cat.icon;

  const [form, setForm] = useState({
    subject:      '',
    description:  '',
    shipmentId:   '',
    trackingNumber: '',
    priority:     'medium',
  });
  const [submitting, setSubmitting] = useState(false);

  const setField = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleQuickPrompt = (prompt) => {
    setForm(p => ({ ...p, subject: prompt }));
  };

  const handleShipmentSelect = (id, trackingNumber) => {
    setForm(p => ({ ...p, shipmentId: id || '', trackingNumber: trackingNumber || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim())     return toast.error('Subject is required');
    if (!form.description.trim()) return toast.error('Please describe your issue');

    setSubmitting(true);
    try {
      const payload = {
        category,
        subject:     form.subject.trim(),
        description: form.description.trim(),
        priority:    form.priority,
      };
      if (form.shipmentId)     payload.shipmentId     = form.shipmentId;
      if (form.trackingNumber) payload.trackingNumber = form.trackingNumber;

      const { data } = await supportAPI.createTicket(payload);
      onSuccess(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Category header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-sm transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${cat.bg}`}>
          <Icon size={18} className={cat.color} />
        </div>
        <div>
          <h2 className="font-bold text-black tracking-tight">{cat.label}</h2>
          <p className="text-xs text-zinc-500">{cat.description}</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quick prompts */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Quick Select
            </label>
            <div className="flex flex-wrap gap-2">
              {cat.prompts.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleQuickPrompt(p)}
                  className={`px-3 py-1.5 text-xs font-medium border rounded-sm transition-colors ${
                    form.subject === p
                      ? 'bg-black text-white border-black'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-black'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <Input
            label="Subject"
            placeholder="Briefly describe your issue…"
            value={form.subject}
            onChange={setField('subject')}
            required
          />

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={setField('description')}
              placeholder="Please provide as much detail as possible — what happened, when, and what you expected…"
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-sm text-black placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none"
              required
            />
          </div>

          {/* Shipment selector */}
          <ShipmentSelector
            value={form.shipmentId}
            onChange={handleShipmentSelect}
          />

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Priority
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, priority: opt.value }))}
                  className={`px-4 py-2 text-xs font-bold rounded-sm border transition-colors ${
                    form.priority === opt.value
                      ? 'bg-black text-white border-black'
                      : `border-zinc-200 ${opt.color} hover:border-zinc-400`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2 border-t border-zinc-100">
            <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="flex-1" icon={Send}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ── Success screen ─────────────────────────────────────────────────────────────
function SuccessScreen({ ticket, onReset }) {
  return (
    <div className="max-w-lg mx-auto text-center py-8">
      <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-sm flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={36} className="text-green-600" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-black mb-2">Ticket Submitted!</h2>
      <p className="text-zinc-500 mb-6">
        Your ticket <span className="font-mono font-semibold text-black">{ticket.ticketNumber}</span> has
        been created. Our team will respond soon.
      </p>
      <div className="border border-zinc-200 rounded-sm p-4 mb-6 text-left space-y-2">
        <Row label="Ticket #"  value={ticket.ticketNumber} mono />
        <Row label="Subject"   value={ticket.subject} />
        <Row label="Category"  value={CATEGORIES.find(c => c.key === ticket.category)?.label} />
        <Row label="Priority"  value={ticket.priority} />
        <Row label="Status"    value="Open" />
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onReset}>
          New Ticket
        </Button>
        <Link to={`/support/tickets/${ticket._id}`} className="flex-1">
          <Button className="w-full">View Ticket</Button>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-zinc-50 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</span>
      <span className={`text-sm font-medium text-black capitalize ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Support() {
  const { user } = useAuthStore();
  const [step,    setStep]    = useState('categories'); // categories | form | success
  const [category,setCategory]= useState(null);
  const [ticket,  setTicket]  = useState(null);

  const handleCategorySelect = (key) => {
    setCategory(key);
    setStep('form');
  };

  const handleSuccess = (t) => {
    setTicket(t);
    setStep('success');
  };

  const handleReset = () => {
    setCategory(null);
    setTicket(null);
    setStep('categories');
  };

  return (
    <DashboardLayout title="Support Center">

      {step === 'categories' && (
        <>
          {/* Hero */}
          <div className="flex items-center gap-4 mb-8 p-6 bg-black rounded-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-48 opacity-5">
              <MessageSquare size={200} className="absolute -right-8 -top-8" />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Help Center</p>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-1">How can we help?</h2>
              <p className="text-zinc-400 text-sm">Choose a category to get started.</p>
            </div>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => handleCategorySelect(cat.key)}
                  className={`group text-left p-6 bg-white border border-zinc-200 rounded-sm transition-all duration-200 ${cat.border} hover:shadow-sm`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center shrink-0 ${cat.bg} group-hover:scale-105 transition-transform`}>
                      <Icon size={22} className={cat.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-black tracking-tight">{cat.label}</h3>
                        <ChevronRight size={16} className="text-zinc-300 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                      <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{cat.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {cat.prompts.slice(0, 2).map(p => (
                          <span key={p} className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-medium rounded-sm">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* My Tickets CTA */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 rounded-sm flex items-center justify-center">
                  <Clock size={18} className="text-zinc-600" />
                </div>
                <div>
                  <p className="font-bold text-sm text-black">Previous Tickets</p>
                  <p className="text-xs text-zinc-500">View your support history and ongoing conversations.</p>
                </div>
              </div>
              <Link to="/support/tickets">
                <Button variant="outline" size="sm">
                  My Tickets →
                </Button>
              </Link>
            </div>
          </Card>
        </>
      )}

      {step === 'form' && (
        <TicketForm
          category={category}
          onBack={() => setStep('categories')}
          onSuccess={handleSuccess}
        />
      )}

      {step === 'success' && (
        <SuccessScreen ticket={ticket} onReset={handleReset} />
      )}
    </DashboardLayout>
  );
}