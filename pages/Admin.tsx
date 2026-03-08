
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { eventService } from '../services/eventService';
import { WeekploreEvent, Shift } from '../types';
import {
  Plus,
  LayoutDashboard,
  LogOut,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Euro,
  Users,
  Clock,
  Save,
  PlusCircle,
  Mail,
  Phone,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Star,
  MessageSquare,
  ShieldAlert,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmailTemplates from '../components/EmailTemplates';

// Helper functions for safe date handling
const safeToISOString = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

const getDatePart = (dateStr: string | null | undefined) => {
  const iso = safeToISOString(dateStr);
  return iso ? iso.split('T')[0] : '';
};

const getTimePart = (dateStr: string | null | undefined, fallback: string = '10:00') => {
  const iso = safeToISOString(dateStr);
  return iso ? iso.split('T')[1].slice(0, 5) : fallback;
};

const formatSafeDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString();
};

const formatSafeTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invalid Time';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface AdminProps {
  onNavigate: (page: string) => void;
}

const MessageDisplay = ({ message, setMessage }: { message: any, setMessage: (msg: any) => void }) => (
  <AnimatePresence mode="wait">
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-md p-4 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-md ${message.type === 'success'
          ? 'bg-emerald-50/90 text-emerald-700 border border-emerald-100'
          : 'bg-brand-terracotta text-white border border-brand-terracotta/20'
          }`}
      >
        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        <span className="text-sm font-bold">{message.text}</span>
        <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100">
          <XCircle className="w-4 h-4" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

const Admin: React.FC<AdminProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'email_templates' | 'reviews' | 'people'>('dashboard');
  const [events, setEvents] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: '', description: '', photo_link: '' });
  const [editingPerson, setEditingPerson] = useState<any | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<any | null>(null);
  const [deletingShift, setDeletingShift] = useState<any | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<any | null>(null);
  const [viewingParticipantsShift, setViewingParticipantsShift] = useState<any | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [newShift, setNewShift] = useState({
    start_time: new Date().toISOString().slice(0, 10) + 'T09:00',
    end_time: new Date().toISOString().slice(0, 10) + 'T17:00',
    capacity: 999,
    people_counter: 0
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', description: '', price: 0, image_url: '' });

  const [newEvent, setNewEvent] = useState({
    title: '',
    slug: '',
    short_description: '',
    full_description: '',
    price: 0,
    event_date: new Date().toISOString().slice(0, 10) + 'T10:00',
    booking_deadline: new Date().toISOString().slice(0, 10) + 'T18:00',
    location_name: '',
    location_address: '',
    shifts: [] as any[],
    products: [] as any[]
  });
  const [tempShift, setTempShift] = useState({ start_time: '', end_time: '', capacity: 999, people_counter: 0 });
  const [tempProduct, setTempProduct] = useState({ title: '', description: '', price: 0 });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const redirectToHome = () => {
    window.location.hash = 'home';
  };

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (message && message.type === 'success') {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    const isModalOpen = editingEvent || deletingEvent || deletingShift || deletingProduct || deletingPerson || viewingParticipantsShift || isAddingPerson;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [editingEvent, deletingEvent, deletingShift, deletingProduct, deletingPerson, viewingParticipantsShift, isAddingPerson]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      setUser(null);
      setLoading(false);
      return;
    }

    const configuredAdminEmails = import.meta.env.VITE_ADMIN_EMAILS;
    const emailList = configuredAdminEmails
      ? configuredAdminEmails.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean)
      : [];

    if (emailList.length > 0 && !emailList.includes(session.user.email.toLowerCase())) {
      console.warn('User not an admin. Redirecting...');
      setUser(null);
      redirectToHome();
      setLoading(false);
      return;
    }

    setUser(session.user);
    fetchEvents();
    setLoading(false);
  };

  const fetchEvents = async () => {
    try {
      const data = await eventService.getAdminEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching admin events:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await eventService.getReviews();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchPeople = async () => {
    try {
      const data = await eventService.getPeople();
      setPeople(data);
    } catch (error) {
      console.error('Error fetching people:', error);
    }
  };

  useEffect(() => {
    if (user) {
      if (activeTab === 'dashboard') fetchEvents();
      if (activeTab === 'reviews') fetchReviews();
      if (activeTab === 'people') fetchPeople();
    }
  }, [activeTab, user]);

  const handleUpdateReviewStatus = async (reviewId: string, status: 'pending' | 'invisible' | 'visible') => {
    try {
      await eventService.updateReviewStatus(reviewId, status);
      setMessage({ type: 'success', text: 'Review status updated!' });
      fetchReviews();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handlePersonImageUpload = async (file: File, isEditing: boolean = false) => {
    setUploading(true);
    try {
      const url = await eventService.uploadPersonImage(file);
      if (isEditing && editingPerson) {
        setEditingPerson({ ...editingPerson, photo_link: url });
      } else {
        setNewPerson({ ...newPerson, photo_link: url });
      }
      setMessage({ type: 'success', text: 'Image uploaded!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Upload failed: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await eventService.addPerson(newPerson);
      setMessage({ type: 'success', text: 'Person added!' });
      setNewPerson({ name: '', description: '', photo_link: '' });
      setIsAddingPerson(false);
      fetchPeople();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleUpdatePerson = async (personId: string, data: any) => {
    try {
      await eventService.updatePerson(personId, data);
      setMessage({ type: 'success', text: 'Person updated!' });
      fetchPeople();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeletePerson = async (personId: string) => {
    try {
      await eventService.deletePerson(personId);
      setMessage({ type: 'success', text: 'Person deleted!' });
      setDeletingPerson(null);
      fetchPeople();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.slug || !newEvent.price || !newEvent.event_date || !newEvent.booking_deadline || selectedFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please fill all required fields and add at least one image.' });
      return;
    }

    setUploading(true);
    try {
      // 1. Upload images
      const imageUrls = await Promise.all(
        selectedFiles.map(file => eventService.uploadImage(file))
      );

      // 2. Create event
      await eventService.createEvent(
        {
          title: newEvent.title,
          slug: newEvent.slug,
          short_description: newEvent.short_description,
          full_description: newEvent.full_description,
          price: newEvent.price,
          event_date: newEvent.event_date,
          booking_deadline: newEvent.booking_deadline,
          location_name: newEvent.location_name,
          location_address: newEvent.location_address
        },
        imageUrls,
        newEvent.shifts,
        newEvent.products
      );
      setMessage({ type: 'success', text: 'Event created successfully!' });
      setActiveTab('dashboard');
      fetchEvents();
      setNewEvent({
        title: '',
        slug: '',
        short_description: '',
        full_description: '',
        price: 0,
        event_date: new Date().toISOString().slice(0, 10) + 'T10:00',
        booking_deadline: new Date().toISOString().slice(0, 10) + 'T18:00',
        location_name: '',
        location_address: '',
        shifts: [],
        products: []
      });
      setSelectedFiles([]);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateEvent = async (eventId: number, data: any) => {
    try {
      await eventService.updateEvent(eventId, data);
      setMessage({ type: 'success', text: 'Event updated!' });
      fetchEvents();
      if (editingEvent) {
        const updated = await eventService.getEventBySlug(editingEvent.slug);
        setEditingEvent((prev: any) => prev ? updated : null);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await eventService.deleteEvent(eventId);
      setMessage({ type: 'success', text: 'Event and all related data deleted successfully.' });
      setDeletingEvent(null);
      fetchEvents();
    } catch (error: any) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete event' });
    }
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      await eventService.addShift(editingEvent.id, newShift);
      setNewShift({
        start_time: new Date().toISOString().slice(0, 10) + 'T09:00',
        end_time: new Date().toISOString().slice(0, 10) + 'T17:00',
        capacity: 999,
        people_counter: 0
      });
      setMessage({ type: 'success', text: 'Shift added!' });
      setIsAddingShift(false);
      fetchEvents();
      // Refresh editing event to show new shift
      const updated = await eventService.getEventBySlug(editingEvent.slug);
      setEditingEvent(updated);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedBookings.length === 0) return;
    try {
      await eventService.updateBookingStatus(selectedBookings, 'paid');
      setMessage({ type: 'success', text: `Marked ${selectedBookings.length} bookings as paid.` });

      // Refresh events to get updated booking statuses
      const updatedEvents = await eventService.getAdminEvents();
      setEvents(updatedEvents);

      // Update viewingParticipantsShift if open
      if (viewingParticipantsShift) {
        for (const e of updatedEvents) {
          const s = e.shifts.find((sh: any) => sh.id === viewingParticipantsShift.id);
          if (s) {
            setViewingParticipantsShift(s);
            break;
          }
        }
      }

      setSelectedBookings([]);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleMarkAsPending = async () => {
    if (selectedBookings.length === 0) return;
    try {
      await eventService.updateBookingStatus(selectedBookings, 'pending');
      setMessage({ type: 'success', text: `Marked ${selectedBookings.length} bookings as pending.` });

      // Refresh events to get updated booking statuses
      const updatedEvents = await eventService.getAdminEvents();
      setEvents(updatedEvents);

      // Update viewingParticipantsShift if open
      if (viewingParticipantsShift) {
        for (const e of updatedEvents) {
          const s = e.shifts.find((sh: any) => sh.id === viewingParticipantsShift.id);
          if (s) {
            setViewingParticipantsShift(s);
            break;
          }
        }
      }

      setSelectedBookings([]);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const toggleBookingSelection = (id: number) => {
    setSelectedBookings(prev =>
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  const handleToggleShiftFull = async (shiftId: number, currentStatus: boolean) => {
    try {
      await eventService.updateShift(shiftId, { is_full: !currentStatus });
      setMessage({ type: 'success', text: `Shift marked as ${!currentStatus ? 'full' : 'available'}.` });
      fetchEvents();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleUpdateShift = async (shiftId: number, data: any) => {
    try {
      await eventService.updateShift(shiftId, data);
      setMessage({ type: 'success', text: 'Shift updated!' });
      fetchEvents();
      if (editingEvent) {
        const updated = await eventService.getEventBySlug(editingEvent.slug);
        setEditingEvent((prev: any) => prev ? updated : null);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      await eventService.addProduct(editingEvent.id, newProduct);
      setNewProduct({ title: '', description: '', price: 0, image_url: '' });
      setMessage({ type: 'success', text: 'Product added!' });
      setIsAddingProduct(false);
      fetchEvents();
      const updated = await eventService.getEventBySlug(editingEvent.slug);
      setEditingEvent(updated);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleProductImageUpload = async (file: File, productId?: string) => {
    try {
      setUploading(true);
      const url = await eventService.uploadProductImage(file);
      if (productId) {
        await handleUpdateProduct(productId, { image_url: url });
      } else {
        setNewProduct(prev => ({ ...prev, image_url: url }));
      }
      setMessage({ type: 'success', text: 'Product image uploaded!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProduct = async (productId: string, data: any) => {
    try {
      await eventService.updateProduct(productId, data);
      setMessage({ type: 'success', text: 'Product updated!' });
      fetchEvents();
      if (editingEvent) {
        const updated = await eventService.getEventBySlug(editingEvent.slug);
        setEditingEvent(updated);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    console.log('Attempting to delete product:', productId);
    try {
      await eventService.deleteProduct(productId);
      console.log('Product deleted successfully');
      setMessage({ type: 'success', text: 'Product deleted!' });
      setDeletingProduct(null);
      fetchEvents();
      if (editingEvent) {
        const updated = await eventService.getEventBySlug(editingEvent.slug);
        setEditingEvent(updated);
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteShift = async (shiftId: number) => {
    console.log('Attempting to delete shift:', shiftId);
    try {
      await eventService.deleteShift(shiftId);
      console.log('Shift deleted successfully');
      setMessage({ type: 'success', text: 'Shift deleted!' });
      setDeletingShift(null);
      fetchEvents();
      if (editingEvent) {
        const updated = await eventService.getEventBySlug(editingEvent.slug);
        setEditingEvent(updated);
      }
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-gold"></div></div>;

  if (!user) {
    return (
      <>
        <MessageDisplay message={message} setMessage={setMessage} />
        <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-[40px] shadow-2xl border border-brand-border w-full max-w-md"
          >
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold serif-font mb-2">Admin Login</h1>
              <p className="text-brand-text/40 text-xs uppercase tracking-widest font-bold">Weekplore Management</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                  placeholder="admin@weekplore.gr"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              {authError && <p className="text-brand-terracotta text-xs font-bold">{authError}</p>}
              <button
                type="submit"
                className="w-full py-5 bg-brand-text text-brand-bg rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold transition-all shadow-lg"
              >
                Enter Dashboard
              </button>
            </form>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <MessageDisplay message={message} setMessage={setMessage} />
      <div className="min-h-screen bg-brand-bg flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-white border-r border-brand-border p-8 flex flex-col">
          <div className="mb-12">
            <h2 className="text-2xl font-bold serif-font italic">Weekplore.</h2>
            <p className="text-[9px] uppercase tracking-widest font-bold text-brand-text/40">Admin Panel</p>
          </div>

          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-brand-bg text-brand-gold font-bold shadow-sm' : 'text-brand-text/60 hover:bg-brand-bg'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'add' ? 'bg-brand-bg text-brand-gold font-bold shadow-sm' : 'text-brand-text/60 hover:bg-brand-bg'}`}
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">Add Event</span>
            </button>
            <button
              onClick={() => setActiveTab('email_templates')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'email_templates' ? 'bg-brand-bg text-brand-gold font-bold shadow-sm' : 'text-brand-text/60 hover:bg-brand-bg'}`}
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm">Email Templates</span>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'reviews' ? 'bg-brand-bg text-brand-gold font-bold shadow-sm' : 'text-brand-text/60 hover:bg-brand-bg'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">Reviews</span>
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'people' ? 'bg-brand-bg text-brand-gold font-bold shadow-sm' : 'text-brand-text/60 hover:bg-brand-bg'}`}
            >
              <User className="w-5 h-5" />
              <span className="text-sm">People</span>
            </button>
          </nav>

          <div className="mt-auto pt-8 border-t border-brand-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-brand-terracotta hover:bg-brand-terracotta/5 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-bold">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          {activeTab === 'dashboard' ? (
            <div className="space-y-10">
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-bold serif-font">Event Dashboard</h1>
                  <p className="text-brand-text/40 text-xs uppercase tracking-widest font-bold mt-2">Manage your collection</p>
                </div>
              </header>

              <div className="grid gap-6">
                {events.map((event) => (
                  <motion.div
                    layout
                    key={event.id}
                    className="bg-white p-8 rounded-[32px] border border-brand-border shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold serif-font">{event.title}</h3>
                          {event.is_sold_out && <span className="bg-brand-terracotta text-white text-[8px] uppercase font-bold px-2 py-0.5 rounded-full">Sold Out</span>}
                        </div>
                        <div className="flex flex-wrap gap-4 text-[10px] uppercase font-bold tracking-widest text-brand-text/40">
                          <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {formatSafeDate(event.event_date)}</div>
                          <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {event.location_name}</div>
                          <div className="flex items-center gap-1.5"><Euro className="w-3 h-3" /> {event.price}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="p-3 bg-brand-bg text-brand-gold rounded-xl hover:bg-brand-gold hover:text-white transition-all"
                          title="Edit Event"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateEvent(event.id, { is_hidden: !event.is_hidden })}
                          className={`p-3 rounded-xl transition-all ${event.is_hidden ? 'bg-amber-50 text-amber-600' : 'bg-brand-bg text-brand-text/60'}`}
                          title={event.is_hidden ? "Show Event" : "Hide Event"}
                        >
                          {event.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleUpdateEvent(event.id, { is_sold_out: !event.is_sold_out })}
                          className={`px-4 py-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 ${event.is_sold_out ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-terracotta/10 text-brand-terracotta'}`}
                          title={event.is_sold_out ? "Mark as Available" : "Mark as Sold Out"}
                        >
                          {event.is_sold_out ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          SOLD OUT: {event.is_sold_out ? 'ON' : 'OFF'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingEvent(event);
                          }}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Shift Stats */}
                    <div className="mt-8 pt-8 border-t border-brand-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {event.shifts?.map((shift: any) => {
                        // Sum the number_of_people from all bookings for this specific shift
                        const totalPeople = shift.bookings?.reduce((sum: number, b: any) => sum + (b.number_of_people || 0), 0) || 0;

                        return (
                          <div key={shift.id} className="bg-brand-bg/30 p-4 rounded-2xl border border-brand-border/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40">{formatSafeTime(shift.start_time)}</span>
                              <Users className="w-3 h-3 text-brand-gold" />
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold">{totalPeople}</span>
                              <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold ml-1">People</span>
                              <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold ml-2">({shift.people_counter || 0} trigger)</span>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => {
                                  setViewingParticipantsShift(shift);
                                  setSelectedBookings([]);
                                }}
                                className="flex-1 py-2 bg-brand-text/5 hover:bg-brand-gold hover:text-white text-[9px] uppercase font-bold tracking-widest rounded-lg transition-all flex items-center justify-center gap-2"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Participants
                              </button>
                              <button
                                onClick={() => handleToggleShiftFull(shift.id, shift.is_full)}
                                className={`px-3 py-2 rounded-lg text-[9px] uppercase font-bold tracking-widest transition-all ${shift.is_full ? 'bg-brand-terracotta text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}
                              >
                                {shift.is_full ? 'FULL' : 'OPEN'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : activeTab === 'add' ? (
            <div className="max-w-4xl">
              <header className="mb-12">
                <h1 className="text-4xl font-bold serif-font">Create New Event</h1>
                <p className="text-brand-text/40 text-xs uppercase tracking-widest font-bold mt-2">Fill in all details to finalize</p>
              </header>

              <form onSubmit={handleCreateEvent} className="space-y-10 bg-white p-10 rounded-[40px] border border-brand-border shadow-sm">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Event Title *</label>
                      <input
                        type="text"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                        className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                        placeholder="e.g. Sunset Kayaking"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">URL Slug *</label>
                      <input
                        type="text"
                        value={newEvent.slug}
                        onChange={(e) => setNewEvent({ ...newEvent, slug: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                        placeholder="sunset-kayaking"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Price (€) *</label>
                      <input
                        type="number"
                        min="0"
                        value={newEvent.price}
                        onChange={(e) => setNewEvent({ ...newEvent, price: Number(e.target.value) })}
                        className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Event Date *</label>
                        <input
                          type="date"
                          value={newEvent.event_date.split('T')[0]}
                          onChange={(e) => {
                            const time = newEvent.event_date.split('T')[1] || '10:00';
                            setNewEvent({ ...newEvent, event_date: `${e.target.value}T${time}` });
                          }}
                          className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                          required
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Time (24h) *</label>
                        <input
                          type="time"
                          value={newEvent.event_date.split('T')[1]?.slice(0, 5) || '10:00'}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const date = newEvent.event_date.split('T')[0] || new Date().toISOString().split('T')[0];
                            setNewEvent({ ...newEvent, event_date: `${date}T${e.target.value}` });
                          }}
                          className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Booking Deadline *</label>
                        <input
                          type="date"
                          value={newEvent.booking_deadline.split('T')[0]}
                          onChange={(e) => {
                            const time = newEvent.booking_deadline.split('T')[1] || '18:00';
                            setNewEvent({ ...newEvent, booking_deadline: `${e.target.value}T${time}` });
                          }}
                          className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                          required
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Time (24h) *</label>
                        <input
                          type="time"
                          value={newEvent.booking_deadline.split('T')[1]?.slice(0, 5) || '18:00'}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const date = newEvent.booking_deadline.split('T')[0] || new Date().toISOString().split('T')[0];
                            setNewEvent({ ...newEvent, booking_deadline: `${date}T${e.target.value}` });
                          }}
                          className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Location Name</label>
                      <input
                        type="text"
                        value={newEvent.location_name}
                        onChange={(e) => setNewEvent({ ...newEvent, location_name: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                        placeholder="e.g. Navarino Bay"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Short Description</label>
                  <input
                    type="text"
                    value={newEvent.short_description}
                    onChange={(e) => setNewEvent({ ...newEvent, short_description: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                    placeholder="Brief summary for cards"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Full Description</label>
                  <textarea
                    value={newEvent.full_description}
                    onChange={(e) => setNewEvent({ ...newEvent, full_description: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all min-h-[150px]"
                    placeholder="Detailed experience description..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-4">Photos (Upload) - First one is Cover</label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-brand-border border-dashed rounded-2xl cursor-pointer bg-brand-bg/20 hover:bg-brand-bg/40 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-8 h-8 mb-3 text-brand-gold" />
                          <p className="mb-2 text-sm text-brand-text/60 font-bold">Click to upload or drag and drop</p>
                          <p className="text-xs text-brand-text/40 uppercase tracking-widest">PNG, JPG or WEBP (MAX. 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-brand-border">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                            {idx === 0 && (
                              <div className="absolute top-1 left-1 bg-brand-gold text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Cover</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-4">Initial Shifts</label>
                  <div className="space-y-4">
                    {newEvent.shifts.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-brand-bg/30 rounded-xl border border-brand-border">
                        <div className="text-[10px] font-bold">
                          {formatSafeTime(s.start_time)} - {formatSafeTime(s.end_time)}
                          <span className="ml-4 opacity-40">Cap: {s.capacity}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewEvent({ ...newEvent, shifts: newEvent.shifts.filter((_, idx) => idx !== i) })}
                          className="text-brand-terracotta hover:opacity-70"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 border-2 border-dashed border-brand-border rounded-2xl">
                      <div>
                        <label className="block text-[9px] uppercase font-bold mb-1 opacity-40">Start</label>
                        <input
                          type="datetime-local"
                          value={tempShift.start_time}
                          onChange={(e) => setTempShift({ ...tempShift, start_time: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-brand-border text-xs"
                        />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="w-24">
                          <label className="block text-[9px] uppercase font-bold mb-1 opacity-40">People</label>
                          <input
                            type="number"
                            min="0"
                            value={tempShift.people_counter}
                            onChange={(e) => setTempShift({ ...tempShift, people_counter: Number(e.target.value) })}
                            className="w-full px-4 py-2 rounded-lg border border-brand-border text-xs"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[9px] uppercase font-bold mb-1 opacity-40">End</label>
                          <input
                            type="datetime-local"
                            value={tempShift.end_time}
                            onChange={(e) => setTempShift({ ...tempShift, end_time: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-brand-border text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (tempShift.start_time && tempShift.end_time) {
                              setNewEvent({ ...newEvent, shifts: [...newEvent.shifts, tempShift] });
                              setTempShift({ start_time: '', end_time: '', capacity: 999, people_counter: 0 });
                            }
                          }}
                          className="p-2 bg-brand-gold text-white rounded-lg"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-4">Add-on Products</label>
                  <div className="space-y-4">
                    {newEvent.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-brand-bg/30 rounded-xl border border-brand-border">
                        <div className="flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest">{p.title}</div>
                          <div className="text-[10px] text-brand-text/40">{p.description}</div>
                        </div>
                        <div className="text-xs font-bold px-4">€{p.price}</div>
                        <button
                          type="button"
                          onClick={() => setNewEvent({ ...newEvent, products: newEvent.products.filter((_, idx) => idx !== i) })}
                          className="text-brand-terracotta hover:opacity-70"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-2 border-dashed border-brand-border rounded-2xl">
                      <div className="md:col-span-2">
                        <label className="block text-[9px] uppercase font-bold mb-1 opacity-40">Product Title</label>
                        <input
                          type="text"
                          value={tempProduct.title}
                          onChange={(e) => setTempProduct({ ...tempProduct, title: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-brand-border text-xs"
                          placeholder="e.g. T-shirt"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold mb-1 opacity-40">Price (€)</label>
                        <input
                          type="number"
                          min="0"
                          value={tempProduct.price}
                          onChange={(e) => setTempProduct({ ...tempProduct, price: Number(e.target.value) })}
                          className="w-full px-4 py-2 rounded-lg border border-brand-border text-xs"
                        />
                      </div>
                      <div className="md:col-span-3 flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-[9px] uppercase font-bold mb-1 opacity-40">Description</label>
                          <input
                            type="text"
                            value={tempProduct.description}
                            onChange={(e) => setTempProduct({ ...tempProduct, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-brand-border text-xs"
                            placeholder="Brief description..."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (tempProduct.title) {
                              setNewEvent({ ...newEvent, products: [...newEvent.products, tempProduct] });
                              setTempProduct({ title: '', description: '', price: 0 });
                            }
                          }}
                          className="p-2 bg-brand-gold text-white rounded-lg"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-6 bg-brand-text text-brand-bg rounded-2xl font-bold uppercase tracking-[0.3em] text-xs hover:bg-brand-gold transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newEvent.title || !newEvent.slug || newEvent.price <= 0 || uploading}
                >
                  {uploading ? 'Uploading Images...' : 'Finalize & Create Event'}
                </button>
              </form>
            </div>
          ) : activeTab === 'reviews' ? (
            <div className="space-y-10">
              <header>
                <h1 className="text-4xl font-bold serif-font">Reviews Management</h1>
                <p className="text-brand-text/40 text-xs uppercase tracking-widest font-bold mt-2">Moderate user feedback</p>
              </header>

              <div className="bg-white rounded-[32px] border border-brand-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-bg/20 border-b border-brand-border">
                        <th className="px-8 py-6 text-[10px] uppercase font-bold tracking-widest text-brand-text/40">User</th>
                        <th className="px-8 py-6 text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Rating</th>
                        <th className="px-8 py-6 text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Review</th>
                        <th className="px-8 py-6 text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Status</th>
                        <th className="px-8 py-6 text-[10px] uppercase font-bold tracking-widest text-brand-text/40 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {reviews.map((review) => (
                        <tr key={review.id} className="hover:bg-brand-bg/5 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                <Mail className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{review.email}</p>
                                <p className="text-[10px] text-brand-text/40">{new Date(review.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < review.start ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'}`}
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm text-brand-text/70 line-clamp-2 max-w-md">{review.review}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`text-[9px] uppercase font-bold px-3 py-1 rounded-full ${review.status === 'visible' ? 'bg-emerald-50 text-emerald-600' :
                              review.status === 'invisible' ? 'bg-red-50 text-red-600' :
                                'bg-amber-50 text-amber-600'
                              }`}>
                              {review.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleUpdateReviewStatus(review.id, 'visible')}
                                className={`p-2 rounded-lg transition-all ${review.status === 'visible' ? 'bg-emerald-500 text-white' : 'bg-brand-bg text-brand-text/40 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                title="Make Visible"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateReviewStatus(review.id, 'invisible')}
                                className={`p-2 rounded-lg transition-all ${review.status === 'invisible' ? 'bg-red-500 text-white' : 'bg-brand-bg text-brand-text/40 hover:bg-red-50 hover:text-red-600'}`}
                                title="Make Invisible"
                              >
                                <EyeOff className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'people' ? (
            <div className="space-y-10">
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-bold serif-font">People Management</h1>
                  <p className="text-brand-text/40 text-xs uppercase tracking-widest font-bold mt-2">Manage "Our People" section</p>
                </div>
                <button
                  onClick={() => setIsAddingPerson(true)}
                  className="px-8 py-4 bg-brand-text text-brand-bg rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Person
                </button>
              </header>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {people.map((person) => (
                  <motion.div
                    layout
                    key={person.id}
                    className="bg-white p-8 rounded-[40px] border border-brand-border shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="relative w-24 h-24 rounded-3xl overflow-hidden mb-6 mx-auto">
                      <img
                        src={person.photo_link || 'https://picsum.photos/seed/person/200/200'}
                        alt={person.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setEditingPerson(person);
                              handlePersonImageUpload(file, true);
                            }
                          }}
                        />
                        <ImageIcon className="w-6 h-6 text-white" />
                      </label>
                    </div>

                    <div className="text-center space-y-4">
                      <div>
                        <input
                          type="text"
                          defaultValue={person.name}
                          onBlur={(e) => handleUpdatePerson(person.id, { name: e.target.value })}
                          className="w-full text-xl font-bold serif-font text-center bg-transparent border-none outline-none focus:ring-2 focus:ring-brand-gold rounded-lg"
                        />
                      </div>
                      <div>
                        <textarea
                          defaultValue={person.description}
                          onBlur={(e) => handleUpdatePerson(person.id, { description: e.target.value })}
                          className="w-full text-sm text-brand-text/60 text-center bg-transparent border-none outline-none focus:ring-2 focus:ring-brand-gold rounded-lg resize-none min-h-[80px]"
                        />
                      </div>
                      <div className="pt-4 flex justify-center gap-2">
                        <button
                          onClick={() => setDeletingPerson(person)}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          title="Delete Person"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add Person Modal */}
              <AnimatePresence>
                {isAddingPerson && (
                  <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-text/60 backdrop-blur-md"
                    onMouseDown={(e) => {
                      if (e.target === e.currentTarget) setIsAddingPerson(false);
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden"
                    >
                      <div className="p-8 border-b border-brand-border flex justify-between items-center bg-brand-bg/20">
                        <h2 className="text-2xl font-bold serif-font">Add New Person</h2>
                        <button onClick={() => setIsAddingPerson(false)} className="p-2 hover:bg-brand-bg rounded-full">
                          <XCircle className="w-6 h-6" />
                        </button>
                      </div>
                      <form onSubmit={handleAddPerson} className="p-8 space-y-6">
                        <div className="flex justify-center">
                          <div className="relative w-32 h-32 rounded-[32px] border-2 border-dashed border-brand-border flex items-center justify-center overflow-hidden group">
                            {newPerson.photo_link ? (
                              <img src={newPerson.photo_link} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-brand-bg/50 transition-all">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handlePersonImageUpload(file);
                                  }}
                                />
                                <Plus className="w-8 h-8 text-brand-text/20 mb-2" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40">Photo</span>
                              </label>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Full Name</label>
                          <input
                            type="text"
                            required
                            value={newPerson.name}
                            onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Role / Description</label>
                          <textarea
                            required
                            value={newPerson.description}
                            onChange={(e) => setNewPerson({ ...newPerson, description: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none min-h-[100px] resize-none"
                            placeholder="Lead Guide & Experience Designer"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={uploading}
                          className="relative w-full py-5 bg-brand-text text-brand-bg rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold transition-all shadow-lg disabled:opacity-50 overflow-hidden"
                        >
                          {uploading && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 2, ease: "linear" }}
                              className="absolute inset-0 bg-brand-gold/30"
                            />
                          )}
                          <span className="relative z-10">{uploading ? 'Uploading...' : 'Add Person'}</span>
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <EmailTemplates setMessage={setMessage} />
          )}
        </main>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingEvent && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-text/60 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setEditingEvent(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-brand-border flex justify-between items-center bg-brand-bg/20">
                <div>
                  <h2 className="text-3xl font-bold serif-font">Edit: {editingEvent.title}</h2>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-text/40 mt-1">Update details or add shifts</p>
                </div>
                <button onClick={() => setEditingEvent(null)} className="p-3 hover:bg-brand-bg rounded-full transition-all">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12">
                {/* Basic Info Update */}
                <section className="space-y-8">
                  <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-gold">Event Details</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Title</label>
                        <input
                          type="text"
                          defaultValue={editingEvent.title}
                          onBlur={(e) => handleUpdateEvent(editingEvent.id, { title: e.target.value })}
                          className="w-full px-6 py-4 rounded-2xl border border-brand-border outline-none focus:border-brand-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Slug</label>
                        <input
                          type="text"
                          defaultValue={editingEvent.slug}
                          onBlur={(e) => handleUpdateEvent(editingEvent.id, { slug: e.target.value })}
                          className="w-full px-6 py-4 rounded-2xl border border-brand-border outline-none focus:border-brand-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Price (€)</label>
                        <input
                          type="number"
                          defaultValue={editingEvent.price}
                          onBlur={(e) => handleUpdateEvent(editingEvent.id, { price: Number(e.target.value) })}
                          className="w-full px-6 py-4 rounded-2xl border border-brand-border outline-none focus:border-brand-gold"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Event Date</label>
                          <input
                            type="date"
                            defaultValue={getDatePart(editingEvent.event_date)}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const time = getTimePart(editingEvent.event_date, '10:00');
                              handleUpdateEvent(editingEvent.id, { event_date: `${e.target.value}T${time}` });
                            }}
                            className="w-full px-6 py-4 rounded-2xl border border-brand-border outline-none focus:border-brand-gold"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Time (24h)</label>
                          <input
                            type="time"
                            value={getTimePart(editingEvent.event_date, '10:00')}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const date = getDatePart(editingEvent.event_date) || new Date().toISOString().split('T')[0];
                              setEditingEvent({ ...editingEvent, event_date: `${date}T${e.target.value}` });
                            }}
                            className="w-full px-6 py-4 rounded-2xl border border-brand-border outline-none focus:border-brand-gold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Booking Deadline</label>
                          <input
                            type="date"
                            defaultValue={getDatePart(editingEvent.booking_deadline)}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const time = getTimePart(editingEvent.booking_deadline, '18:00');
                              handleUpdateEvent(editingEvent.id, { booking_deadline: `${e.target.value}T${time}` });
                            }}
                            className="w-full px-6 py-4 rounded-2xl border border-brand-border outline-none focus:border-brand-gold"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Time (24h)</label>
                          <input
                            type="time"
                            value={getTimePart(editingEvent.booking_deadline, '18:00')}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const date = getDatePart(editingEvent.booking_deadline) || new Date().toISOString().split('T')[0];
                              setEditingEvent({ ...editingEvent, booking_deadline: `${date}T${e.target.value}` });
                            }}
                            className="w-full px-6 py-4 rounded-2xl border border-brand-border outline-none focus:border-brand-gold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Location Name</label>
                        <input
                          type="text"
                          defaultValue={editingEvent.location_name}
                          onBlur={(e) => handleUpdateEvent(editingEvent.id, { location_name: e.target.value })}
                          className="w-full px-6 py-4 rounded-2xl border border-brand-border outline-none focus:border-brand-gold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Short Description</label>
                      <input
                        type="text"
                        defaultValue={editingEvent.short_description}
                        onBlur={(e) => handleUpdateEvent(editingEvent.id, { short_description: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border border-brand-border outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Full Description</label>
                      <textarea
                        defaultValue={editingEvent.full_description}
                        onBlur={(e) => handleUpdateEvent(editingEvent.id, { full_description: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border border-brand-border outline-none focus:border-brand-gold min-h-[120px]"
                      />
                    </div>
                  </div>
                </section>

                {/* Shift Management */}
                <section className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-gold">Experience Shifts</h3>
                    <button
                      onClick={() => setIsAddingShift(true)}
                      className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-brand-gold hover:opacity-70"
                    >
                      <PlusCircle className="w-4 h-4" /> Add Shift
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {editingEvent.shifts?.map((shift: any) => {
                      const totalPeople = shift.bookings?.reduce((sum: number, b: any) => sum + (b.number_of_people || 0), 0) || 0;

                      return (
                        <div key={shift.id} className="flex items-center justify-between p-6 bg-brand-bg/30 rounded-2xl border border-brand-border">
                          <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-brand-gold" />
                              <span className="text-sm font-bold">
                                {formatSafeTime(shift.start_time)} - {formatSafeTime(shift.end_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Users className="w-4 h-4 text-brand-gold" />
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{totalPeople} / </span>
                                <input
                                  type="number"
                                  min="0"
                                  defaultValue={shift.people_counter || 0}
                                  onBlur={(e) => handleUpdateShift(shift.id, { people_counter: Number(e.target.value) })}
                                  className="w-16 px-2 py-1 text-xs font-bold bg-white border border-brand-border rounded-lg outline-none focus:border-brand-gold"
                                />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-brand-text/40">People (trigger)</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => {
                                setViewingParticipantsShift(shift);
                                setSelectedBookings([]);
                              }}
                              className="px-4 py-2 bg-brand-gold/10 text-brand-gold text-[9px] uppercase font-bold tracking-widest rounded-lg hover:bg-brand-gold hover:text-white transition-all"
                            >
                              See Participants
                            </button>
                            <span className={`text-[9px] uppercase font-bold px-3 py-1 rounded-full ${shift.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                              {shift.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => {
                                console.log('Delete shift clicked, setting deletingShift:', shift);
                                setDeletingShift(shift);
                              }}
                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                              title="Delete Shift"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isAddingShift && (
                    <motion.form
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleAddShift}
                      className="p-8 bg-white border-2 border-dashed border-brand-gold/30 rounded-3xl space-y-6"
                    >
                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Date</label>
                          <input
                            type="date"
                            value={newShift.start_time.split('T')[0]}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const time = newShift.start_time.split('T')[1] || '09:00';
                              setNewShift({ ...newShift, start_time: `${e.target.value}T${time}` });
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Start Time</label>
                          <input
                            type="time"
                            value={newShift.start_time.split('T')[1]?.slice(0, 5) || '09:00'}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const date = newShift.start_time.split('T')[0] || new Date().toISOString().split('T')[0];
                              setNewShift({ ...newShift, start_time: `${date}T${e.target.value}` });
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">End Time</label>
                          <input
                            type="time"
                            value={newShift.end_time.split('T')[1]?.slice(0, 5) || '17:00'}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const date = newShift.start_time.split('T')[0] || new Date().toISOString().split('T')[0];
                              setNewShift({ ...newShift, end_time: `${date}T${e.target.value}` });
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-1 gap-6">
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Capacity (Trigger)</label>
                          <input
                            type="number"
                            min="0"
                            value={newShift.people_counter}
                            onChange={(e) => setNewShift({ ...newShift, people_counter: Number(e.target.value) })}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="flex-1 py-4 bg-brand-gold text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Confirm Shift</button>
                        <button type="button" onClick={() => setIsAddingShift(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                      </div>
                    </motion.form>
                  )}
                </section>

                {/* Product Management */}
                <section className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-gold">Add-on Products</h3>
                    <button
                      onClick={() => setIsAddingProduct(true)}
                      className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-brand-gold hover:opacity-70"
                    >
                      <PlusCircle className="w-4 h-4" /> Add Product
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {editingEvent.products?.map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-6 bg-brand-bg/30 rounded-2xl border border-brand-border">
                        <div className="flex-1 grid md:grid-cols-4 gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="block text-[9px] uppercase font-bold mb-1 opacity-40">Image</label>
                            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white border border-brand-border group">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-brand-text/20">
                                  <Mail className="w-6 h-6" />
                                </div>
                              )}
                              <label className="absolute inset-0 bg-brand-text/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleProductImageUpload(file, product.id);
                                  }}
                                />
                                <span className="text-[8px] text-white font-bold uppercase tracking-widest">Change</span>
                              </label>
                            </div>
                            {product.image_url && (
                              <button
                                onClick={() => handleUpdateProduct(product.id, { image_url: null })}
                                className="text-[8px] text-red-500 font-bold uppercase tracking-widest hover:underline text-left"
                              >
                                Remove Image
                              </button>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[9px] uppercase font-bold mb-1 opacity-40">Title</label>
                            <input
                              type="text"
                              defaultValue={product.title}
                              onBlur={(e) => handleUpdateProduct(product.id, { title: e.target.value })}
                              className="w-full px-4 py-2 text-xs font-bold bg-white border border-brand-border rounded-lg outline-none focus:border-brand-gold"
                            />
                            <label className="block text-[9px] uppercase font-bold mt-2 mb-1 opacity-40">Description</label>
                            <input
                              type="text"
                              defaultValue={product.description}
                              onBlur={(e) => handleUpdateProduct(product.id, { description: e.target.value })}
                              className="w-full px-4 py-2 text-xs bg-white border border-brand-border rounded-lg outline-none focus:border-brand-gold"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase font-bold mb-1 opacity-40">Price (€)</label>
                            <input
                              type="number"
                              min="0"
                              defaultValue={product.price}
                              onBlur={(e) => handleUpdateProduct(product.id, { price: Number(e.target.value) })}
                              className="w-full px-4 py-2 text-xs font-bold bg-white border border-brand-border rounded-lg outline-none focus:border-brand-gold"
                            />
                            <button
                              onClick={() => setDeletingProduct(product)}
                              className="mt-4 w-full py-2 bg-red-50 text-red-500 text-[9px] uppercase font-bold tracking-widest rounded-lg hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" /> Delete Product
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {isAddingProduct && (
                    <motion.form
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleAddProduct}
                      className="p-8 bg-white border-2 border-dashed border-brand-gold/30 rounded-3xl space-y-6"
                    >
                      <div className="grid md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Product Image</label>
                          <div className="relative aspect-square rounded-2xl border-2 border-dashed border-brand-border flex items-center justify-center overflow-hidden group">
                            {newProduct.image_url ? (
                              <>
                                <img
                                  src={newProduct.image_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => setNewProduct({ ...newProduct, image_url: '' })}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-brand-bg/50 transition-all">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleProductImageUpload(file);
                                  }}
                                />
                                <Plus className="w-6 h-6 text-brand-text/20 mb-2" />
                                <span className="text-[8px] font-bold uppercase tracking-widest text-brand-text/40">Upload</span>
                              </label>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-3 space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Product Title</label>
                              <input
                                type="text"
                                value={newProduct.title}
                                onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
                                required
                                placeholder="e.g. T-shirt"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Price (€)</label>
                              <input
                                type="number"
                                min="0"
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                                className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Description</label>
                            <input
                              type="text"
                              value={newProduct.description}
                              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
                              placeholder="Brief description..."
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="flex-1 py-4 bg-brand-gold text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Confirm Product</button>
                        <button type="button" onClick={() => setIsAddingProduct(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                      </div>
                    </motion.form>
                  )}
                </section>
              </div>

              <div className="p-8 border-t border-brand-border bg-brand-bg/10 flex justify-end">
                <button
                  onClick={() => setEditingEvent(null)}
                  className="px-10 py-4 bg-brand-text text-brand-bg rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold transition-all"
                >
                  Done Editing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Participants Modal */}
      <AnimatePresence>
        {viewingParticipantsShift && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-brand-text/60 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setViewingParticipantsShift(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-brand-border flex justify-between items-center bg-brand-bg/20">
                <div>
                  <h2 className="text-3xl font-bold serif-font">Shift Participants</h2>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-text/40 mt-1">
                    {new Date(viewingParticipantsShift.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <button onClick={() => setViewingParticipantsShift(null)} className="p-3 hover:bg-brand-bg rounded-full transition-all">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10">
                {viewingParticipantsShift.bookings?.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-xs font-bold text-brand-text/40 uppercase tracking-widest">
                        {selectedBookings.length} Selected
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleMarkAsPending}
                          disabled={selectedBookings.length === 0}
                          className="px-6 py-3 bg-amber-600 text-white text-[10px] uppercase font-bold tracking-widest rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4" />
                          Mark as Pending
                        </button>
                        <button
                          onClick={handleMarkAsPaid}
                          disabled={selectedBookings.length === 0}
                          className="px-6 py-3 bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-widest rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Mark as Paid
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-brand-border">
                            <th className="p-4 text-left">
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBookings(viewingParticipantsShift.bookings.map((b: any) => b.id));
                                  } else {
                                    setSelectedBookings([]);
                                  }
                                }}
                                checked={selectedBookings.length === viewingParticipantsShift.bookings.length && viewingParticipantsShift.bookings.length > 0}
                                className="w-4 h-4 rounded border-brand-border text-brand-gold focus:ring-brand-gold"
                              />
                            </th>
                            <th className="p-4 text-left text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Name</th>
                            <th className="p-4 text-left text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Contact</th>
                            <th className="p-4 text-center text-[10px] uppercase font-bold tracking-widest text-brand-text/40">People</th>
                            <th className="p-4 text-center text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingParticipantsShift.bookings.map((booking: any) => (
                            <tr key={booking.id} className="border-b border-brand-border/50 hover:bg-brand-bg/10 transition-all">
                              <td className="p-4">
                                <input
                                  type="checkbox"
                                  checked={selectedBookings.includes(booking.id)}
                                  onChange={() => toggleBookingSelection(booking.id)}
                                  className="w-4 h-4 rounded border-brand-border text-brand-gold focus:ring-brand-gold"
                                />
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-sm">{booking.full_name}</div>
                                <div className="text-[10px] text-brand-text/40">{new Date(booking.created_at).toLocaleDateString()}</div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2 text-xs text-brand-text/60">
                                    <Mail className="w-3 h-3" /> {booking.email}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-brand-text/60">
                                    <Phone className="w-3 h-3" /> {booking.phone}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-brand-bg rounded-full text-xs font-bold">
                                  {booking.number_of_people}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`text-[9px] uppercase font-bold px-3 py-1 rounded-full ${booking.payment_status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                                  }`}>
                                  {booking.payment_status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-brand-text/30">
                    <Users className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">No participants yet</p>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-brand-border bg-brand-bg/10 flex justify-end">
                <button
                  onClick={() => setViewingParticipantsShift(null)}
                  className="px-10 py-4 bg-brand-text text-brand-bg rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingEvent && (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-brand-text/60 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDeletingEvent(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold serif-font mb-4">Delete Event?</h2>
              <p className="text-brand-text/60 text-sm mb-8">
                Are you sure you want to delete <span className="font-bold text-brand-text">"{deletingEvent.title}"</span>?
                This action is permanent and will delete all related images, shifts, and bookings.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDeleteEvent(deletingEvent.id)}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-lg"
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setDeletingEvent(null)}
                  className="w-full py-4 bg-brand-bg text-brand-text/60 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-text hover:text-white transition-all"
                >
                  No, Keep It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Shift Modal */}
      <AnimatePresence>
        {deletingShift && (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-brand-text/60 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDeletingShift(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold serif-font mb-4">Delete Shift?</h2>
              <p className="text-brand-text/60 text-sm mb-8">
                Are you sure you want to delete this shift?
                <span className="font-bold text-brand-text block mt-2">This will also delete all bookings for this shift!</span>
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDeleteShift(deletingShift.id)}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-lg"
                >
                  Yes, Delete Shift
                </button>
                <button
                  onClick={() => setDeletingShift(null)}
                  className="w-full py-4 bg-brand-bg text-brand-text/60 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-text hover:text-white transition-all"
                >
                  No, Keep It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Product Modal */}
      <AnimatePresence>
        {deletingProduct && (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-brand-text/60 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDeletingProduct(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold serif-font mb-4">Delete Product?</h2>
              <p className="text-brand-text/60 text-sm mb-8">
                Are you sure you want to delete <span className="font-bold text-brand-text">"{deletingProduct.title}"</span>?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDeleteProduct(deletingProduct.id)}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-lg"
                >
                  Yes, Delete Product
                </button>
                <button
                  onClick={() => setDeletingProduct(null)}
                  className="w-full py-4 bg-brand-bg text-brand-text/60 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-text hover:text-white transition-all"
                >
                  No, Keep It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Person Modal */}
      <AnimatePresence>
        {deletingPerson && (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-brand-text/60 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDeletingPerson(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold serif-font mb-4">Delete Person?</h2>
              <p className="text-brand-text/60 text-sm mb-8">
                Are you sure you want to delete <span className="font-bold text-brand-text">"{deletingPerson.name}"</span>?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDeletePerson(deletingPerson.id)}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-lg"
                >
                  Yes, Delete Person
                </button>
                <button
                  onClick={() => setDeletingPerson(null)}
                  className="w-full py-4 bg-brand-bg text-brand-text/60 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-text hover:text-white transition-all"
                >
                  No, Keep It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Admin;
