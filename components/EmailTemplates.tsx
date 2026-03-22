
import React, { useState, useEffect } from 'react';
import { emailService, EmailTemplate, EmailPurpose, EmailLog } from '../services/emailService';
import {
  Plus,
  Trash2,
  Edit3,
  XCircle,
  Mail,
  PlusCircle,
  CheckCircle2,
  ChevronDown,
  List,
  Download,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailTemplatesProps {
  setMessage: (msg: { type: 'success' | 'error', text: string } | null) => void;
}

const EMAIL_PURPOSES = [
  { id: 'interest_received', label: 'Interest Received', description: 'Immediate booking confirmation' },
  { id: 'payment_invitation', label: 'Payment Invitation', description: 'Request for payment' },
  { id: 'confirmed_shift_booking', label: 'Confirmed Shift', description: 'Goal met confirmation' },
  { id: 'shift_cancelled', label: 'Shift Cancelled', description: 'Cancellation notice' },
  { id: 'private_event_inquiry_received', label: 'Private Event Auto-Reply', description: 'Auto-reply to users who submit an inquiry' },
];

const VARIABLE_REFERENCE = [
  { key: '{name}', label: 'Customer Name', example: 'Alexandros' },
  { key: '{event}', label: 'Experience Title', example: 'Sunset Wine Tasting' },
  { key: '{date}', label: 'Date & Time', example: 'Saturday, 15 June 2024 at 18:30' },
  { key: '{location}', label: 'Location', example: 'Gaia Estate, Nemea' },
  { key: '{people}', label: 'Guests', example: '2' },
  { key: '{price}', label: 'Total Price', example: '€150.00' },
  { key: '{booking_reference}', label: 'Booking Reference', example: 'WKP-000123' },
  { key: '{cancel_url}', label: 'Cancellation Link', example: 'Clickable link' },
];

const VariableReference: React.FC = () => (
  <div className="bg-brand-bg/40 p-4 rounded-xl border border-brand-border/40 mb-2">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1.5 h-1.5 rounded-full bg-brand-gold"></div>
      <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-gold">Personalization Tags</h4>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
      {VARIABLE_REFERENCE.map(v => (
        <div key={v.key} className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <code className="text-[11px] font-black text-brand-text bg-white px-1.5 py-0.5 rounded border border-brand-border shadow-sm">{v.key}</code>
          </div>
          <p className="text-[9px] text-brand-text/50 font-medium">
            {v.label}: <span className="text-brand-text/80 italic font-serif">"{v.example}"</span>
          </p>
        </div>
      ))}
    </div>
  </div>
);

const EMPTY_TEMPLATE = {
  subject_eng: '',
  body_eng: '',
  subject_el: '',
  body_el: ''
};

const normalizeTemplate = (template: EmailTemplate): EmailTemplate => ({
  ...template,
  subject_eng: template.subject_eng ?? template.subject ?? '',
  body_eng: template.body_eng ?? template.body ?? '',
  subject_el: template.subject_el ?? '',
  body_el: template.body_el ?? ''
});

const getTemplateDisplayName = (template: EmailTemplate) =>
  template.subject_eng || template.subject_el || template.subject || 'Untitled template';

const EmailTemplates: React.FC<EmailTemplatesProps> = ({ setMessage }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [purposes, setPurposes] = useState<EmailPurpose[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTemplate, setNewTemplate] = useState(EMPTY_TEMPLATE);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [templatesData, purposesData] = await Promise.all([
        emailService.getTemplates(),
        emailService.getPurposes()
      ]);
      setTemplates(templatesData.map(normalizeTemplate));
      setPurposes(purposesData);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error fetching data: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePurposeChange = async (purposeId: string, templateId: string | null) => {
    try {
      await emailService.updatePurpose(purposeId, templateId);
      setMessage({ type: 'success', text: `Purpose updated.` });
      // Refresh purposes
      const updatedPurposes = await emailService.getPurposes();
      setPurposes(updatedPurposes);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to update: ' + error.message });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.subject_eng || !newTemplate.body_eng || !newTemplate.subject_el || !newTemplate.body_el) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }

    try {
      await emailService.createTemplate({
        subject_eng: newTemplate.subject_eng,
        body_eng: newTemplate.body_eng,
        subject_el: newTemplate.subject_el,
        body_el: newTemplate.body_el
      });
      setMessage({ type: 'success', text: 'Template created!' });
      setNewTemplate(EMPTY_TEMPLATE);
      setIsAdding(false);
      fetchInitialData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    try {
      await emailService.updateTemplate(editingTemplate.id, {
        subject_eng: editingTemplate.subject_eng,
        body_eng: editingTemplate.body_eng,
        subject_el: editingTemplate.subject_el,
        body_el: editingTemplate.body_el
      });
      setMessage({ type: 'success', text: 'Template updated!' });
      setEditingTemplate(null);
      fetchInitialData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await emailService.deleteTemplate(id);
      setMessage({ type: 'success', text: 'Deleted.' });
      setDeletingTemplate(null);
      fetchInitialData();
    } catch (error: any) {
      console.error('Delete template error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete' });
    }
  };

  const handleOpenLogs = async () => {
    try {
      setLoading(true);
      const data = await emailService.getLogs();
      setLogs(data);
      setIsLogsModalOpen(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error fetching logs: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLogs = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Booking ID', 'Shift ID', 'Event ID', 'Recipient Email', 'Purpose', 'Status', 'Template ID', 'Error Message', 'Date'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.booking_id,
        log.shift_id,
        log.event_id,
        `"${log.recipient_email}"`,
        `"${log.email_purpose}"`,
        `"${log.status}"`,
        log.template_id,
        `"${log.error_message?.replace(/"/g, '""') || ''}"`,
        `"${new Date(log.created_at).toLocaleString('en-GB')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `email_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const renderPreview = (body: string, language: 'en' | 'el') => {
    const dummyData = language === 'el'
      ? {
        name: 'Αλεξάνδρα',
        event: 'Sunset Wine Tasting',
        date: 'Σάββατο 15 Ιουνίου 2024 στις 18:30',
        location: 'Gaia Estate, Nemea',
        people: '2',
        price: '150.00',
        booking_reference: 'WKP-000123',
        cancel_url: '#'
      }
      : {
        name: 'Alexandros',
        event: 'Sunset Wine Tasting',
        date: 'Saturday, 15 June 2024 at 18:30',
        location: 'Gaia Estate, Nemea',
        people: '2',
        price: '150.00',
        booking_reference: 'WKP-000123',
        cancel_url: '#'
      };

    let html = body;
    // Replace placeholders
    Object.entries(dummyData).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      if (key === 'cancel_url') {
        const link = `<a href="${value}" style="color: #c0392b; font-weight: bold; text-decoration: underline;">Cancel Reservation</a>`;
        html = html.replace(regex, link);
      } else {
        html = html.replace(regex, value);
      }
    });

    // Convert newlines to <br> if not already HTML
    if (!html.includes('<p>') && !html.includes('<div') && !html.includes('<br')) {
      html = html.replace(/\n/g, '<br/>');
    }

    return html;
  };

  const renderPreviewSubject = (subject: string, language: 'en' | 'el') => {
    const replacementName = language === 'el' ? 'Αλεξάνδρα' : 'Alexandros';
    return subject
      .replace(/{name}/g, replacementName)
      .replace(/{event}/g, 'Sunset Wine Tasting')
      .replace(/{date}/g, language === 'el' ? 'Σάββατο 15 Ιουνίου 2024 στις 18:30' : 'Saturday, 15 June 2024 at 18:30')
      .replace(/{location}/g, 'Gaia Estate, Nemea')
      .replace(/{price}/g, '150.00')
      .replace(/{people}/g, '2')
      .replace(/{booking_reference}/g, 'WKP-000123')
      .replace(/{cancel_url}/g, '#');
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold serif-font text-brand-text">Communications</h1>
          <p className="text-brand-text/40 text-[10px] uppercase tracking-widest font-bold mt-1">Automated message triggers and library</p>
        </div>
        <button
          onClick={handleOpenLogs}
          className="flex items-center gap-2 px-4 py-2 bg-brand-bg text-brand-text/60 rounded-xl hover:bg-brand-gold hover:text-white transition-all text-xs font-bold uppercase tracking-widest border border-brand-border"
        >
          <List className="w-4 h-4" />
          View Logs
        </button>
      </header>

      {/* Purpose Assignment Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-[1px] w-6 bg-brand-gold/50"></div>
          <h2 className="text-[9px] uppercase font-bold tracking-[0.3em] text-brand-gold">Automation Setup</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EMAIL_PURPOSES.map((purpose, index) => {
            const assignment = purposes.find(p => p.purpose === purpose.id);
            const assignedTemplateId = assignment?.template_id;

            return (
              <div key={purpose.id} className="bg-white p-5 rounded-2xl border border-brand-border transition-all">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[14px] font-black text-brand-text/20 tabular-nums">{index + 1}</span>
                    <h3 className="text-sm font-bold text-brand-text">{purpose.label}</h3>
                  </div>
                  {assignedTemplateId ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-brand-terracotta" />
                  )}
                </div>

                <p className="text-[12px] text-brand-text/50 mb-4 leading-relaxed">
                  {purpose.description}
                </p>

                <div className="relative">
                  <select
                    value={assignedTemplateId || ''}
                    onChange={(e) => handlePurposeChange(purpose.id, e.target.value || null)}
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none transition-all text-[11px] font-bold cursor-pointer appearance-none pr-8 ${assignedTemplateId
                      ? 'border-brand-border bg-brand-bg/30'
                      : 'border-brand-terracotta bg-brand-terracotta/5'
                      }`}
                  >
                    <option value="">Select template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>[{String(t.id).slice(0, 8)}] {getTemplateDisplayName(t)}</option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${assignedTemplateId ? 'text-brand-text/40' : 'text-brand-terracotta'
                    }`} />
                </div>

                {!assignedTemplateId && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 px-3 py-2 bg-brand-terracotta text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-terracotta/20"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Don't leave empty</span>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Templates List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-6 bg-brand-border"></div>
            <h2 className="text-[9px] uppercase font-bold tracking-[0.3em] text-brand-text/40">Message Library</h2>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-text text-brand-bg rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-brand-gold transition-all"
          >
            <Plus className="w-3 h-3" />
            Add Template
          </button>
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {isAdding && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-white p-8 rounded-2xl border-2 border-brand-gold shadow-xl space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold serif-font">New Template</h3>
                  <button type="button" onClick={() => setIsAdding(false)} className="text-brand-text/40 hover:text-brand-terracotta">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <VariableReference />
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4 rounded-2xl border border-brand-border bg-brand-bg/20 p-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-gold">English</h4>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-brand-text/30">Sent to non-Greek browsers</span>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold tracking-widest text-brand-text/40 mb-1.5">Subject (EN)</label>
                        <input
                          type="text"
                          value={newTemplate.subject_eng}
                          onChange={(e) => setNewTemplate({ ...newTemplate, subject_eng: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-brand-gold outline-none transition-all text-sm"
                          placeholder="e.g. {event} is happening!"
                          required
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <label className="block text-[9px] uppercase font-bold tracking-widest text-brand-text/40">Body (EN) <span className="text-brand-gold normal-case tracking-normal font-bold">(HTML supported)</span></label>
                        </div>
                        <textarea
                          value={newTemplate.body_eng}
                          onChange={(e) => setNewTemplate({ ...newTemplate, body_eng: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-brand-gold outline-none transition-all min-h-[220px] text-xs font-mono"
                          placeholder={`<p>Hi {name},</p>\n<p>Your booking for <strong>{event}</strong> is confirmed for {date}.</p>\n<br/>\n<a href="{cancel_url}" style="display:inline-block;padding:12px 28px;background:#1a1a1a;color:white;border-radius:99px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Cancel My Booking</a>`}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-brand-border bg-brand-bg/20 p-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-gold">Greek</h4>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-brand-text/30">Sent to Greek browsers</span>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold tracking-widest text-brand-text/40 mb-1.5">Subject (EL)</label>
                        <input
                          type="text"
                          value={newTemplate.subject_el}
                          onChange={(e) => setNewTemplate({ ...newTemplate, subject_el: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-brand-gold outline-none transition-all text-sm"
                          placeholder="π.χ. Η κράτησή σας για το {event}"
                          required
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <label className="block text-[9px] uppercase font-bold tracking-widest text-brand-text/40">Body (EL) <span className="text-brand-gold normal-case tracking-normal font-bold">(HTML supported)</span></label>
                        </div>
                        <textarea
                          value={newTemplate.body_el}
                          onChange={(e) => setNewTemplate({ ...newTemplate, body_el: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-brand-gold outline-none transition-all min-h-[220px] text-xs font-mono"
                          placeholder={`<p>Γεια σου {name},</p>\n<p>Η κράτησή σου για το <strong>{event}</strong> καταχωρήθηκε για {date}.</p>`}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-text text-brand-bg rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold transition-all"
                  >
                    Save Template
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {templates.map((template) => {
            const assignedPurpose = EMAIL_PURPOSES.find(p =>
              purposes.find(ap => ap.purpose === p.id && ap.template_id === template.id)
            );

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={template.id}
                className={`bg-white p-6 rounded-2xl border ${assignedPurpose ? 'border-brand-gold/30' : 'border-brand-border'} hover:border-brand-gold/50 transition-all group`}
              >
                {editingTemplate?.id === template.id ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold serif-font">Edit Template</h3>
                      <button type="button" onClick={() => setEditingTemplate(null)} className="text-brand-text/40 hover:text-brand-terracotta">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                    <VariableReference />
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4 rounded-2xl border border-brand-border bg-brand-bg/20 p-5">
                        <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-gold">English</h4>
                        <input
                          type="text"
                          value={editingTemplate.subject_eng || ''}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, subject_eng: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-brand-gold outline-none transition-all text-sm font-bold"
                          required
                        />
                        <textarea
                          value={editingTemplate.body_eng || ''}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, body_eng: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-brand-gold outline-none transition-all min-h-[180px] text-xs font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-4 rounded-2xl border border-brand-border bg-brand-bg/20 p-5">
                        <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-gold">Greek</h4>
                        <input
                          type="text"
                          value={editingTemplate.subject_el || ''}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, subject_el: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-brand-gold outline-none transition-all text-sm font-bold"
                          required
                        />
                        <textarea
                          value={editingTemplate.body_el || ''}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, body_el: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-brand-gold outline-none transition-all min-h-[180px] text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="flex-1 py-3 bg-brand-gold text-white rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-brand-text transition-all">Save Changes</button>
                      <button type="button" onClick={() => setEditingTemplate(null)} className="px-6 py-3 bg-brand-bg text-brand-text/40 rounded-xl font-bold uppercase tracking-widest text-[9px]">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-xl bg-brand-bg/50 flex items-center justify-center flex-shrink-0">
                      <Mail className={`w-5 h-5 ${assignedPurpose ? 'text-brand-gold' : 'text-brand-text/20'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-0.5">
                        <h3 className="text-sm font-bold text-brand-text truncate">{template.subject_eng || 'No English subject'}</h3>
                        {assignedPurpose && (
                          <span className="text-[8px] font-bold uppercase tracking-widest bg-brand-gold/10 text-brand-gold/80 px-2 py-0.5 rounded-full">
                            Active: {assignedPurpose.label}
                          </span>
                        )}
                      </div>
                      <p className="text-brand-text/60 text-[12px] line-clamp-1 mb-1">{template.body_eng || template.body || 'No English body'}</p>
                      <p className="text-brand-text/40 text-[11px] line-clamp-1 mb-2">EL: {template.subject_el || 'No Greek subject'}</p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-brand-border/50 text-brand-text/70 font-mono text-[10px] font-bold">
                          ID: {String(template.id).slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewTemplate(normalizeTemplate(template))}
                        className="p-2.5 text-brand-text/40 hover:text-brand-gold transition-all"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingTemplate(normalizeTemplate(template))}
                        className="p-2.5 text-brand-text/40 hover:text-brand-gold transition-all"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingTemplate(template)}
                        className="p-2.5 text-brand-text/40 hover:text-red-500 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {templates.length === 0 && !isAdding && (
        <div className="bg-white p-12 rounded-2xl border border-brand-border border-dashed text-center">
          <Mail className="w-10 h-10 text-brand-text/10 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-brand-text/40">No templates yet</h3>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-brand-bg text-brand-gold rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold hover:text-white transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Create First Template
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingTemplate && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-brand-text/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center border border-brand-border"
            >
              <h2 className="text-lg font-bold serif-font mb-2">Delete Template?</h2>
              <p className="text-brand-text/60 text-xs mb-6 px-4">
                Permanently remove "{getTemplateDisplayName(deletingTemplate)}"?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deletingTemplate.id)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-red-600 transition-all shadow-md"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeletingTemplate(null)}
                  className="flex-1 py-3 bg-brand-bg text-brand-text/60 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-brand-text hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logs Modal */}
      <AnimatePresence>
        {isLogsModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-brand-text/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-brand-bg w-[95%] max-w-5xl max-h-[90vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl border border-brand-border"
            >
              <div className="bg-white px-8 py-6 flex justify-between items-center border-b border-brand-border sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                    <List className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold serif-font text-brand-text">Email Logs</h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-text/40 mt-1">
                      {logs.length} entries recorded
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleDownloadLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-text/5 text-brand-gold rounded-xl hover:bg-brand-gold hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>
                  <button
                    onClick={() => setIsLogsModalOpen(false)}
                    className="p-2 hover:bg-brand-text/5 rounded-full transition-colors text-brand-text/40 hover:text-brand-text"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-brand-bg/50 p-6 scrollbar-hide">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-brand-text/40 p-10">
                    <Mail className="w-8 h-8 mb-4 opacity-50" />
                    <p className="text-xs uppercase tracking-widest font-bold">No email logs found</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead className="bg-brand-bg/50 text-[9px] uppercase tracking-widest text-brand-text/60 font-black border-b border-brand-border">
                          <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Recipient</th>
                            <th className="px-6 py-4">Purpose</th>
                            <th className="px-6 py-4">IDs (B/S/E/T)</th>
                            <th className="px-6 py-4">Error Message</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-brand-border/50">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-brand-bg/30 transition-colors">
                              <td className="px-6 py-4 font-medium whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString('en-GB', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit', second: '2-digit'
                                })}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] tracking-widest uppercase font-bold ${log.status === 'sent'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-brand-terracotta/10 text-brand-terracotta'
                                  }`}>
                                  {log.status === 'sent' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold">{log.recipient_email}</td>
                              <td className="px-6 py-4 text-brand-text/60">
                                {log.email_purpose?.replace(/_/g, ' ') || 'unknown'}
                              </td>
                              <td className="px-6 py-4 tabular-nums text-brand-text/40 tracking-wider">
                                {log.booking_id}/{log.shift_id}/{log.event_id}/{log.template_id}
                              </td>
                              <td className="px-6 py-4 text-brand-terracotta/80 max-w-xs truncate text-[10px]">
                                {log.error_message || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brand-text/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl border border-brand-border"
            >
              <div className="bg-brand-bg px-8 py-6 flex justify-between items-center border-b border-brand-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold serif-font text-brand-text">Message Preview</h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-text/40 mt-1">Realistic customer view</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-brand-text/5 rounded-full transition-colors text-brand-text/40 hover:text-brand-text"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-[#fcfbf9] scrollbar-hide">
                <div className="max-w-xl mx-auto space-y-8">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/30">English Subject</p>
                    <p className="text-lg font-bold text-brand-text">{renderPreviewSubject(previewTemplate.subject_eng || '', 'en')}</p>
                  </div>

                  <div className="h-[1px] w-full bg-brand-border/50"></div>

                  <div
                    className="prose prose-sm max-w-none text-brand-text serif-font leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderPreview(previewTemplate.body_eng || '', 'en') }}
                  />

                  <div className="h-[1px] w-full bg-brand-border/50"></div>

                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/30">Greek Subject</p>
                    <p className="text-lg font-bold text-brand-text">{renderPreviewSubject(previewTemplate.subject_el || '', 'el')}</p>
                  </div>

                  <div className="h-[1px] w-full bg-brand-border/50"></div>

                  <div
                    className="prose prose-sm max-w-none text-brand-text serif-font leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderPreview(previewTemplate.body_el || '', 'el') }}
                  />
                </div>
              </div>

              <div className="p-8 bg-brand-bg/30 border-t border-brand-border flex justify-center">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-12 py-3 bg-brand-text text-brand-bg rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold transition-all"
                >
                  Back to Library
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailTemplates;
