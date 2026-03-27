
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { eventService } from '../services/eventService';
import { WeekploreEvent, Shift, PrivateEvent } from '../types';
import {
  Plus,
  LayoutDashboard,
  LogOut,
  Archive,
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
import ProductCategoryManager, { ProductDraft } from '../components/ProductCategoryManager';

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

const shouldDefaultToSendArchiveEmails = (eventDate: string | null | undefined) => {
  if (!eventDate) return true;
  const d = new Date(eventDate);
  if (isNaN(d.getTime())) return true;
  return d.getTime() >= Date.now();
};

const isArchivedStatus = (status: string | null | undefined) =>
  status === 'archived' || status === 'canceled' || status === 'cancelled';

const isCanceledBookingStatus = (status: string | null | undefined) =>
  status === 'canceled' || status === 'cancelled';

const getActiveParticipantBookings = (bookings: any[] = []) =>
  bookings.filter((booking) => !isCanceledBookingStatus(booking?.status));

const getCanceledParticipantBookings = (bookings: any[] = []) =>
  bookings.filter((booking) => isCanceledBookingStatus(booking?.status));

const getActiveShifts = (shifts: any[] = []) =>
  shifts.filter((shift) => !isArchivedStatus(shift?.status));

const getShiftBookingCount = (shift: any) =>
  getActiveParticipantBookings(shift?.bookings || []).reduce(
    (sum: number, booking: any) => sum + (booking.number_of_people || 0),
    0
  );

const getEditableEventImages = (event: any) => {
  if (Array.isArray(event?.images) && event.images.length > 0) {
    return event.images;
  }

  if (event?.cover_image_url) {
    return [{
      id: `cover-${event.id}`,
      image_url: event.cover_image_url,
      is_cover: true,
      is_fallback: true
    }];
  }

  return [];
};

const getBookingProductSelections = (booking: any) => {
  if (!Array.isArray(booking?.booking_products)) {
    return [];
  }

  return booking.booking_products
    .map((selection: any) => {
      const quantity = Number(selection?.quantity);
      const productRecord = Array.isArray(selection?.products) ? selection.products[0] : selection?.products;
      const title = typeof productRecord?.title === 'string' && productRecord.title.trim().length > 0
        ? productRecord.title.trim()
        : 'Product removed';

      if (!Number.isFinite(quantity) || quantity < 1) {
        return null;
      }

      return {
        key: `${selection?.product_id ?? title}-${quantity}`,
        label: `${quantity} x ${title}`
      };
    })
    .filter(Boolean) as { key: string; label: string }[];
};

const getShiftProductTotals = (bookings: any[] = []) => {
  const totals = new Map<string, { key: string; title: string; quantity: number }>();

  bookings.forEach((booking) => {
    if (!Array.isArray(booking?.booking_products)) {
      return;
    }

    booking.booking_products.forEach((selection: any) => {
      const quantity = Number(selection?.quantity);
      const productRecord = Array.isArray(selection?.products) ? selection.products[0] : selection?.products;
      const title = typeof productRecord?.title === 'string' && productRecord.title.trim().length > 0
        ? productRecord.title.trim()
        : 'Product removed';

      if (!Number.isFinite(quantity) || quantity < 1) {
        return;
      }

      const key = String(selection?.product_id ?? title);
      const existing = totals.get(key);

      if (existing) {
        existing.quantity += quantity;
        return;
      }

      totals.set(key, { key, title, quantity });
    });
  });

  return Array.from(totals.values()).sort((left, right) => left.title.localeCompare(right.title));
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
        className="fixed inset-x-0 top-4 z-[2000] flex justify-center px-4 sm:top-6"
      >
        <div className={`flex w-full max-w-md items-center gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md ${message.type === 'success'
          ? 'border-emerald-100 bg-emerald-50/90 text-emerald-700'
          : 'border-brand-terracotta/20 bg-brand-terracotta text-white'
          }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="min-w-0 flex-1 text-sm font-bold">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto flex-shrink-0 opacity-50 hover:opacity-100">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const createEmptyProductDraft = (): ProductDraft => ({
  category_id: '',
  title: '',
  description: '',
  price: 0,
  image_url: '',
});

const createTempCategoryId = () => `temp-category-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createTempProductId = () => `temp-product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const Admin: React.FC<AdminProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'private_events' | 'email_templates' | 'reviews' | 'people' | 'archive'>('dashboard');
  const [events, setEvents] = useState<any[]>([]);
  const [privateEvents, setPrivateEvents] = useState<PrivateEvent[]>([]);
  const [privateEventInquiries, setPrivateEventInquiries] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [newPrivateEvent, setNewPrivateEvent] = useState({ name: '', description: '', image_url: '', is_visible: true });
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: '', description: '', photo_link: '' });
  const [editingPerson, setEditingPerson] = useState<any | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [viewingArchivedEvent, setViewingArchivedEvent] = useState<any | null>(null);
  const [highlightedArchivedShiftId, setHighlightedArchivedShiftId] = useState<number | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<any | null>(null);
  const [sendArchiveEmails, setSendArchiveEmails] = useState(true);
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
  const [newProduct, setNewProduct] = useState<ProductDraft>(createEmptyProductDraft());
  const [newProductCategoryName, setNewProductCategoryName] = useState('');

  const [newEvent, setNewEvent] = useState({
    title: '',
    slug: '',
    short_description: '',
    full_description: '',
    price: 0,
    event_date: new Date().toISOString().slice(0, 10) + 'T10:00',
    booking_deadline: new Date().toISOString().slice(0, 10) + 'T18:00',
    payment_deadline: new Date().toISOString().slice(0, 10) + 'T18:00',
    location_name: '',
    location_address: '',
    shifts: [] as any[],
    product_categories: [] as any[],
    products: [] as any[]
  });
  const [tempShift, setTempShift] = useState({ start_time: '', end_time: '', capacity: 999, people_counter: 0 });
  const [tempProductCategoryName, setTempProductCategoryName] = useState('');
  const [tempProduct, setTempProduct] = useState<ProductDraft>(createEmptyProductDraft());
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
    const isModalOpen = editingEvent || viewingArchivedEvent || deletingEvent || deletingShift || deletingProduct || deletingPerson || viewingParticipantsShift || isAddingPerson;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [editingEvent, viewingArchivedEvent, deletingEvent, deletingShift, deletingProduct, deletingPerson, viewingParticipantsShift, isAddingPerson]);

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
      return data;
    } catch (error) {
      console.error('Error fetching admin events:', error);
      return [];
    }
  };

  const refreshEditingEvent = async (eventId: number) => {
    const updatedEvents = await fetchEvents();
    const refreshedEvent = updatedEvents.find((event: any) => event.id === eventId);
    if (refreshedEvent) {
      setEditingEvent(refreshedEvent);
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

  const fetchPrivateEvents = async () => {
    try {
      const data = await eventService.getAdminPrivateEvents();
      setPrivateEvents(data);
      const inquiriesData = await eventService.getAdminPrivateEventInquiries();
      setPrivateEventInquiries(inquiriesData);
    } catch (error) {
      console.error('Error fetching private events or inquiries:', error);
    }
  };

  useEffect(() => {
    if (user) {
      if (activeTab === 'dashboard') fetchEvents();
      if (activeTab === 'private_events') fetchPrivateEvents();
      if (activeTab === 'reviews') fetchReviews();
      if (activeTab === 'people') fetchPeople();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (viewingArchivedEvent) {
      const refreshedArchivedEvent = events.find((event) => event.id === viewingArchivedEvent.id);
      if (refreshedArchivedEvent) {
        setViewingArchivedEvent(refreshedArchivedEvent);
        if (highlightedArchivedShiftId && !refreshedArchivedEvent.shifts?.some((shift: any) => shift.id === highlightedArchivedShiftId)) {
          setHighlightedArchivedShiftId(null);
        }
      }
    }

    if (viewingParticipantsShift) {
      for (const event of events) {
        const matchingShift = event.shifts?.find((shift: any) => shift.id === viewingParticipantsShift.id);
        if (matchingShift) {
          setViewingParticipantsShift({ ...matchingShift, eventTitle: event.title });
          break;
        }
      }
    }
  }, [events]);

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

  const handlePrivateEventImageUpload = async (file: File, privateEventId?: string) => {
    try {
      setUploading(true);
      const imageUrl = await eventService.uploadPrivateEventImage(file);

      if (privateEventId) {
        await eventService.updatePrivateEvent(privateEventId, { image_url: imageUrl });
        setMessage({ type: 'success', text: 'Private event image uploaded!' });
        fetchPrivateEvents();
        return;
      }

      setNewPrivateEvent((prev) => ({ ...prev, image_url: imageUrl }));
      setMessage({ type: 'success', text: 'Private event image uploaded!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePrivateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrivateEvent.name.trim()) {
      setMessage({ type: 'error', text: 'Private event name is required.' });
      return;
    }

    try {
      await eventService.createPrivateEvent({
        name: newPrivateEvent.name.trim(),
        description: newPrivateEvent.description.trim() || null,
        image_url: newPrivateEvent.image_url.trim() || null,
        is_visible: newPrivateEvent.is_visible
      });
      setMessage({ type: 'success', text: 'Private event created!' });
      setNewPrivateEvent({ name: '', description: '', image_url: '', is_visible: true });
      fetchPrivateEvents();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleUpdatePrivateEvent = async (privateEventId: string, data: Partial<Pick<PrivateEvent, 'name' | 'description' | 'image_url' | 'is_visible'>>) => {
    try {
      await eventService.updatePrivateEvent(privateEventId, data);
      setMessage({
        type: 'success',
        text: data.is_visible === undefined
          ? 'Private event updated!'
          : `Private event ${data.is_visible ? 'shown on site' : 'hidden from site'}!`
      });
      fetchPrivateEvents();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeletePrivateEvent = async (privateEventId: string) => {
    try {
      const result = await eventService.deletePrivateEvent(privateEventId);
      const detachedInquiryCount = Number(result?.detachedInquiryCount) || 0;
      const detachedInquiryLabel = detachedInquiryCount === 1 ? 'inquiry' : 'inquiries';
      setMessage({
        type: 'success',
        text: detachedInquiryCount > 0
          ? `Private event removed. ${detachedInquiryCount} linked ${detachedInquiryLabel} kept in history.`
          : 'Private event removed!'
      });
      fetchPrivateEvents();
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
    if (!newEvent.title || !newEvent.slug || !newEvent.price || !newEvent.event_date || !newEvent.booking_deadline || !newEvent.payment_deadline || selectedFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please fill all required fields and add at least one image.' });
      return;
    }
    if (newEvent.shifts.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one shift before creating the event.' });
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
          payment_deadline: newEvent.payment_deadline,
          location_name: newEvent.location_name,
          location_address: newEvent.location_address
        },
        imageUrls,
        newEvent.shifts,
        newEvent.product_categories
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
        payment_deadline: new Date().toISOString().slice(0, 10) + 'T18:00',
        location_name: '',
        location_address: '',
        shifts: [],
        product_categories: [],
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

  const handleDeleteEvent = async (eventId: number, sendCancellationEmails: boolean) => {
    try {
      await eventService.archiveEvent(eventId, { sendCancellationEmails });
      setMessage({
        type: 'success',
        text: sendCancellationEmails
          ? 'Event archived and cancellation emails were sent.'
          : 'Event archived without sending cancellation emails.'
      });
      setDeletingEvent(null);
      setSendArchiveEmails(true);
      fetchEvents();
    } catch (error: any) {
      console.error('Archive error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to archive event' });
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
            setViewingParticipantsShift({ ...s, eventTitle: e.title });
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
            setViewingParticipantsShift({ ...s, eventTitle: e.title });
            break;
          }
        }
      }

      setSelectedBookings([]);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleMarkAsCanceled = async () => {
    if (selectedBookings.length === 0) return;
    try {
      await eventService.updateBookingReservationStatus(selectedBookings, 'canceled');
      setMessage({ type: 'success', text: `Marked ${selectedBookings.length} bookings as canceled.` });

      const updatedEvents = await eventService.getAdminEvents();
      setEvents(updatedEvents);

      if (viewingParticipantsShift) {
        for (const e of updatedEvents) {
          const s = e.shifts.find((sh: any) => sh.id === viewingParticipantsShift.id);
          if (s) {
            setViewingParticipantsShift({ ...s, eventTitle: e.title });
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

  const handleAddCategoryToNewEvent = () => {
    const normalizedName = tempProductCategoryName.trim();
    if (!normalizedName) {
      setMessage({ type: 'error', text: 'Category name is required.' });
      return;
    }

    setNewEvent(prev => ({
      ...prev,
      product_categories: [
        ...prev.product_categories,
        {
          id: createTempCategoryId(),
          name: normalizedName,
          products: []
        }
      ]
    }));
    setTempProductCategoryName('');
  };

  const handleDeleteCategoryFromNewEvent = (categoryId: string | number) => {
    setNewEvent(prev => ({
      ...prev,
      product_categories: prev.product_categories.filter((category: any) => String(category.id) !== String(categoryId))
    }));

    if (tempProduct.category_id === String(categoryId)) {
      setTempProduct(createEmptyProductDraft());
    }
  };

  const handleEventImageUpload = async (file: File, makeCover: boolean = false) => {
    if (!editingEvent) return;

    try {
      setUploading(true);
      const imageUrl = await eventService.uploadImage(file);
      await eventService.addEventImage(editingEvent.id, imageUrl, makeCover);
      setMessage({ type: 'success', text: makeCover ? 'Cover image updated!' : 'Event image added!' });
      await refreshEditingEvent(editingEvent.id);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Upload failed: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSetEventCoverImage = async (imageUrl: string) => {
    if (!editingEvent) return;

    try {
      await eventService.setEventCoverImage(editingEvent.id, imageUrl);
      setMessage({ type: 'success', text: 'Cover image updated!' });
      await refreshEditingEvent(editingEvent.id);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteEventImage = async (imageId: number) => {
    if (!editingEvent) return;

    if (!window.confirm('Remove this image from the event gallery?')) {
      return;
    }

    try {
      await eventService.deleteEventImage(imageId);
      setMessage({ type: 'success', text: 'Event image removed!' });
      await refreshEditingEvent(editingEvent.id);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleAddProductToNewEvent = () => {
    const normalizedTitle = tempProduct.title.trim();
    if (!tempProduct.category_id || !normalizedTitle) {
      setMessage({ type: 'error', text: 'Choose a category and product title first.' });
      return;
    }

    setNewEvent(prev => ({
      ...prev,
      product_categories: prev.product_categories.map((category: any) => (
        String(category.id) === tempProduct.category_id
          ? {
              ...category,
              products: [
                ...(category.products || []),
                {
                  id: createTempProductId(),
                  title: normalizedTitle,
                  description: tempProduct.description.trim(),
                  price: tempProduct.price,
                  image_url: tempProduct.image_url || null,
                  category_id: tempProduct.category_id,
                }
              ]
            }
          : category
      ))
    }));
    setTempProduct(createEmptyProductDraft());
  };

  const handleDeleteProductFromNewEvent = (categoryId: string | number, productId: string) => {
    setNewEvent(prev => ({
      ...prev,
      product_categories: prev.product_categories.map((category: any) => (
        String(category.id) === String(categoryId)
          ? {
              ...category,
              products: (category.products || []).filter((product: any) => String(product.id) !== String(productId))
            }
          : category
      ))
    }));
  };

  const handleAddProductCategory = async () => {
    if (!editingEvent) return;

    const normalizedName = newProductCategoryName.trim();
    if (!normalizedName) {
      setMessage({ type: 'error', text: 'Category name is required.' });
      return;
    }

    try {
      await eventService.addProductCategory(editingEvent.id, { name: normalizedName });
      setNewProductCategoryName('');
      setMessage({ type: 'success', text: 'Category added!' });
      fetchEvents();
      const updated = await eventService.getEventBySlug(editingEvent.slug);
      setEditingEvent(updated);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteProductCategory = async (categoryId: string | number, categoryName: string) => {
    if (!window.confirm(`Delete category "${categoryName}" and all products inside it?`)) {
      return;
    }

    try {
      await eventService.deleteProductCategory(categoryId);
      setMessage({ type: 'success', text: 'Category deleted!' });
      fetchEvents();
      if (editingEvent) {
        const updated = await eventService.getEventBySlug(editingEvent.slug);
        setEditingEvent(updated);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleAddProduct = async () => {
    if (!editingEvent) return;
    if (!newProduct.category_id || !newProduct.title.trim()) {
      setMessage({ type: 'error', text: 'Choose a category and product title first.' });
      return;
    }

    try {
      await eventService.addProduct(newProduct.category_id, {
        ...newProduct,
        title: newProduct.title.trim(),
        description: newProduct.description.trim(),
      });
      setNewProduct(createEmptyProductDraft());
      setMessage({ type: 'success', text: 'Product added!' });
      fetchEvents();
      const updated = await eventService.getEventBySlug(editingEvent.slug);
      setEditingEvent(updated);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleTempProductImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const url = await eventService.uploadProductImage(file);
      setTempProduct(prev => ({ ...prev, image_url: url }));
      setMessage({ type: 'success', text: 'Product image uploaded!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
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
    if (!window.confirm('Delete this product?')) {
      return;
    }
    try {
      await eventService.deleteProduct(productId);
      setMessage({ type: 'success', text: 'Product deleted!' });
      setDeletingProduct(null);
      fetchEvents();
      if (editingEvent) {
        const updated = await eventService.getEventBySlug(editingEvent.slug);
        setEditingEvent(updated);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteShift = async (shiftId: number) => {
    try {
      await eventService.archiveShift(shiftId);
      setMessage({ type: 'success', text: 'Shift archived!' });
      setDeletingShift(null);
      fetchEvents();
      if (editingEvent) {
        const updated = await eventService.getEventBySlug(editingEvent.slug);
        setEditingEvent(updated);
      }
    } catch (error: any) {
      console.error('Error archiving shift:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const openArchivedEvent = (event: any, shiftId?: number) => {
    setViewingArchivedEvent(event);
    setHighlightedArchivedShiftId(shiftId ?? null);
  };

  const openParticipantsShift = (shift: any, eventTitle?: string) => {
    setViewingParticipantsShift({ ...shift, eventTitle: eventTitle ?? shift.eventTitle });
    setSelectedBookings([]);
  };

  const activeEvents = events.filter((event) => !isArchivedStatus(event.status));
  const archivedEvents = events.filter((event) => isArchivedStatus(event.status));
  const archivedShifts = events.flatMap((event) =>
    (event.shifts || [])
      .filter((shift: any) => isArchivedStatus(shift.status))
      .map((shift: any) => ({ ...shift, eventTitle: event.title, eventId: event.id }))
  );
  const viewingParticipantBookings = viewingParticipantsShift?.bookings || [];
  const activeParticipantBookings = getActiveParticipantBookings(viewingParticipantBookings);
  const canceledParticipantBookings = getCanceledParticipantBookings(viewingParticipantBookings);
  const viewingParticipantsProductTotals = getShiftProductTotals(activeParticipantBookings);

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
              <PlusCircle className="w-5 h-5" />
              <span className="text-sm">Create Event</span>
            </button>
            <button
              onClick={() => setActiveTab('private_events')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'private_events' ? 'bg-brand-bg text-brand-gold font-bold shadow-sm' : 'text-brand-text/60 hover:bg-brand-bg'}`}
            >
              <Star className="w-5 h-5" />
              <span className="text-sm">Private Events</span>
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
            <button
              onClick={() => setActiveTab('archive')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'archive' ? 'bg-brand-bg text-brand-gold font-bold shadow-sm' : 'text-brand-text/60 hover:bg-brand-bg'}`}
            >
              <ShieldAlert className="w-5 h-5" />
              <span className="text-sm">Archive</span>
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
          {activeTab === 'archive' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Archived Events */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Archived Events</h2>
                    <p className="text-sm text-slate-500">Events that have been archived</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {archivedEvents.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-slate-400 font-medium">No archived events</p>
                    </div>
                  ) : (
                    archivedEvents.map(event => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => openArchivedEvent(event)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-slate-900">{event.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Original Date: {formatSafeDate(event.event_date)}
                            </p>
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                            Archived
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          <span>{event.shifts?.filter((shift: any) => isArchivedStatus(shift.status)).length || 0} archived shifts</span>
                          <span className="text-brand-gold">View Details</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Archived Shifts */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Archived Shifts</h2>
                    <p className="text-sm text-slate-500">Individual shifts that were archived</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {archivedShifts.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-slate-400 font-medium">No archived shifts</p>
                    </div>
                  ) : (
                    archivedShifts.map(shift => (
                      <div key={shift.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <h3 className="font-bold text-slate-900">{shift.eventTitle}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatSafeDate(shift.start_time)} @ {formatSafeTime(shift.start_time)}
                        </p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {getShiftBookingCount(shift)} booked
                        </p>
                        <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                          Archived
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const parentEvent = events.find((event) => event.id === shift.eventId);
                              if (parentEvent) {
                                openArchivedEvent(parentEvent, shift.id);
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-brand-text/5 text-brand-text text-[9px] uppercase font-bold tracking-widest rounded-lg hover:bg-brand-text hover:text-white transition-all"
                          >
                            View Event
                          </button>
                          <button
                            type="button"
                            onClick={() => openParticipantsShift(shift, shift.eventTitle)}
                            className="flex-1 px-4 py-2 bg-brand-gold/10 text-brand-gold text-[9px] uppercase font-bold tracking-widest rounded-lg hover:bg-brand-gold hover:text-white transition-all"
                          >
                            Participants
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' ? (
            <div className="space-y-10">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold serif-font">Event Dashboard</h1>
                  <p className="text-brand-text/40 text-xs uppercase tracking-widest font-bold mt-2">Manage your collection</p>
                </div>
                <button
                  onClick={() => setActiveTab('add')}
                  className="flex items-center gap-2 rounded-2xl bg-brand-text px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-bg transition-all hover:bg-brand-gold shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add New Event
                </button>
              </header>

              <div className="grid gap-6">
                {activeEvents.map((event) => (
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
                            setSendArchiveEmails(shouldDefaultToSendArchiveEmails(event.event_date));
                          }}
                          className="flex items-center gap-2 px-4 py-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-500 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest"
                          title="Archive Event"
                        >
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                      </div>
                    </div>

                    {/* Shift Stats */}
                    <div className="mt-8 pt-8 border-t border-brand-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {getActiveShifts(event.shifts).map((shift: any) => {
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
                              <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold ml-1">Limit Counter</span>
                              <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold ml-2">({shift.people_counter || 0} trigger)</span>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => {
                                  openParticipantsShift(shift, event.title);
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
                        value={newEvent.price || ''}
                        onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                        onFocus={(e) => e.target.select()}
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Payment Deadline *</label>
                        <input
                          type="date"
                          value={newEvent.payment_deadline.split('T')[0]}
                          onChange={(e) => {
                            const time = newEvent.payment_deadline.split('T')[1] || '18:00';
                            setNewEvent({ ...newEvent, payment_deadline: `${e.target.value}T${time}` });
                          }}
                          className="w-full px-6 py-4 rounded-2xl border border-brand-border focus:border-brand-gold outline-none transition-all"
                          required
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Time (24h) *</label>
                        <input
                          type="time"
                          value={newEvent.payment_deadline.split('T')[1]?.slice(0, 5) || '18:00'}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const date = newEvent.payment_deadline.split('T')[0] || new Date().toISOString().split('T')[0];
                            setNewEvent({ ...newEvent, payment_deadline: `${date}T${e.target.value}` });
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
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-brand-text/40">
                    At least one shift is required before you can create the event.
                  </p>
                  <div className="space-y-4">
                    {newEvent.shifts.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-brand-bg/30 rounded-xl border border-brand-border">
                        <div className="text-[10px] font-bold">
                          {formatSafeTime(s.start_time)} - {formatSafeTime(s.end_time)}
                          <span className="ml-4 opacity-40">Limit Counter: {s.people_counter}</span>
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
                          <label className="block text-[9px] uppercase font-bold mb-1 opacity-40">Limit Counter</label>
                          <input
                            type="number"
                            min="0"
                            value={tempShift.people_counter || ''}
                            onChange={(e) => setTempShift({ ...tempShift, people_counter: e.target.value === '' ? 0 : Number(e.target.value) })}
                            onFocus={(e) => e.target.select()}
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

                <ProductCategoryManager
                  heading="Product Categories"
                  categories={newEvent.product_categories}
                  emptyMessage="No product categories yet. Add one if this event needs category-based options."
                  categoryDraftName={tempProductCategoryName}
                  onCategoryDraftChange={setTempProductCategoryName}
                  onAddCategory={handleAddCategoryToNewEvent}
                  productDraft={tempProduct}
                  onProductDraftChange={(changes) => setTempProduct(prev => ({ ...prev, ...changes }))}
                  onAddProduct={handleAddProductToNewEvent}
                  onProductImageUpload={handleTempProductImageUpload}
                  onDeleteCategory={(category) => handleDeleteCategoryFromNewEvent(category.id)}
                  onDeleteProduct={(product, category) => handleDeleteProductFromNewEvent(category.id, String(product.id))}
                  addCategoryLabel="Add Category"
                  addProductLabel="Add Product To Category"
                />

                {false && (
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
                          value={tempProduct.price || ''}
                          onChange={(e) => setTempProduct({ ...tempProduct, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                          onFocus={(e) => e.target.select()}
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
                              const newProducts = [...newEvent.products, tempProduct].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
                              setNewEvent({ ...newEvent, products: newProducts });
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
                )}

                <button
                  type="submit"
                  className="w-full py-6 bg-brand-text text-brand-bg rounded-2xl font-bold uppercase tracking-[0.3em] text-xs hover:bg-brand-gold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newEvent.title || !newEvent.slug || newEvent.price <= 0 || newEvent.shifts.length === 0 || uploading}
                >
                  {uploading ? 'Uploading Images...' : 'Finalize & Create Event'}
                </button>
              </form>
            </div>
          ) : activeTab === 'private_events' ? (
            <div className="space-y-10">
              <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-4xl font-bold serif-font">Private Events</h1>
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-text/40">Add, edit, and remove private-event entries</p>
                </div>
              </header>

              <form onSubmit={handleCreatePrivateEvent} className="space-y-6 rounded-[32px] border border-brand-border bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row">
                  <div className="lg:w-56">
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-brand-border bg-brand-bg/30">
                      {newPrivateEvent.image_url ? (
                        <img src={newPrivateEvent.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-brand-text/40">
                          <ImageIcon className="mb-3 h-8 w-8" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Image</span>
                        </div>
                      )}
                      <label className="absolute inset-0 cursor-pointer bg-brand-text/0 transition-all hover:bg-brand-text/10">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePrivateEventImageUpload(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-brand-text/40">Name</label>
                      <input
                        type="text"
                        value={newPrivateEvent.name}
                        onChange={(e) => setNewPrivateEvent({ ...newPrivateEvent, name: e.target.value })}
                        className="w-full rounded-2xl border border-brand-border px-6 py-4 outline-none transition-all focus:border-brand-gold"
                        placeholder="Create your own workshop"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-brand-text/40">Description</label>
                      <textarea
                        value={newPrivateEvent.description}
                        onChange={(e) => setNewPrivateEvent({ ...newPrivateEvent, description: e.target.value })}
                        className="min-h-[120px] w-full rounded-2xl border border-brand-border px-6 py-4 outline-none transition-all focus:border-brand-gold"
                        placeholder="Short description for the private events page"
                      />
                    </div>
                    <label className="md:col-span-2 flex items-center justify-between rounded-2xl border border-brand-border bg-brand-bg/20 px-5 py-4">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-text/40">Visible on Site</span>
                        <span className="mt-1 block text-xs text-brand-text/60">Hidden private events stay in admin but disappear from the public private events page.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={newPrivateEvent.is_visible}
                        onChange={(e) => setNewPrivateEvent({ ...newPrivateEvent, is_visible: e.target.checked })}
                        className="h-5 w-5 rounded border-brand-border text-brand-gold focus:ring-brand-gold"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex items-center gap-2 rounded-2xl bg-brand-text px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-bg transition-all hover:bg-brand-gold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Add Private Event'}
                  </button>
                </div>
              </form>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {privateEvents.map((privateEvent) => (
                  <motion.div
                    layout
                    key={privateEvent.id}
                    className="space-y-4 rounded-3xl border border-brand-border bg-white p-5 sm:p-6 shadow-sm"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-brand-bg/30">
                      {privateEvent.image_url ? (
                        <img src={privateEvent.image_url} alt={privateEvent.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-brand-text/30">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                      <label className="absolute inset-0 cursor-pointer bg-brand-text/0 transition-all hover:bg-brand-text/10">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePrivateEventImageUpload(file, privateEvent.id);
                          }}
                        />
                      </label>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${privateEvent.is_visible !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {privateEvent.is_visible !== false ? 'Visible' : 'Hidden'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdatePrivateEvent(privateEvent.id, { is_visible: privateEvent.is_visible === false })}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${privateEvent.is_visible !== false ? 'bg-brand-bg text-brand-text/70 hover:bg-brand-text hover:text-white' : 'bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-white'}`}
                        >
                          {privateEvent.is_visible !== false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {privateEvent.is_visible !== false ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-brand-text/40">Name</label>
                      <input
                        type="text"
                        defaultValue={privateEvent.name}
                        onBlur={(e) => handleUpdatePrivateEvent(privateEvent.id, { name: e.target.value })}
                        className="w-full rounded-xl border border-brand-border px-4 py-3 outline-none transition-all focus:border-brand-gold text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-brand-text/40">Description</label>
                      <textarea
                        defaultValue={privateEvent.description || ''}
                        onBlur={(e) => handleUpdatePrivateEvent(privateEvent.id, { description: e.target.value || null })}
                        className="min-h-[100px] w-full rounded-xl border border-brand-border px-4 py-3 outline-none transition-all focus:border-brand-gold text-sm text-brand-text/80"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeletePrivateEvent(privateEvent.id)}
                        className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Inquiries Section */}
              <div className="pt-10 mt-10 border-t border-brand-border">
                <header className="mb-8">
                  <h2 className="text-3xl font-bold serif-font">Inquiries</h2>
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-text/40">All received private event requests</p>
                </header>

                <div className="bg-white rounded-[32px] border border-brand-border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-bg/20 border-b border-brand-border">
                          <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Date</th>
                          <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Client</th>
                          <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Event Details</th>
                          <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Preferences</th>
                          <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-text/40 w-1/3">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {privateEventInquiries.map((inq) => (
                          <tr key={inq.id} className="hover:bg-brand-bg/5 transition-colors align-top">
                            <td className="px-6 py-5">
                              <div className="text-sm font-bold">{new Date(inq.created_at).toLocaleDateString()}</div>
                              <div className="text-[10px] text-brand-text/40 uppercase tracking-widest">{new Date(inq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="text-sm font-bold">{inq.first_name} {inq.last_name}</div>
                              <a href={`mailto:${inq.email}`} className="text-xs text-brand-gold hover:underline">{inq.email}</a>
                              <div className="text-xs text-brand-text/60 mt-1 font-mono">{inq.phone}</div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="inline-block px-2 py-0.5 mb-2 rounded bg-brand-bg border border-brand-border text-[9px] font-bold uppercase tracking-widest text-brand-gold">
                                {inq.is_custom ? 'Custom Event' : (inq.private_event_templates?.name || 'Admin Event')}
                              </div>
                              <div className="text-sm">
                                <span className="text-brand-text/60">Guests:</span> <span className="font-bold">{inq.number_of_people}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-brand-text/60">Approx Date:</span> <span className="font-bold">{inq.date_approx ? formatSafeDate(inq.date_approx) : 'Flexible'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 space-y-1">
                              {inq.setting && <div className="text-xs"><span className="text-brand-text/60">Setting:</span> {inq.setting}</div>}
                              {inq.area && <div className="text-xs"><span className="text-brand-text/60">Area:</span> {inq.area}</div>}
                              {inq.decoration_budget > 0 && <div className="text-xs"><span className="text-brand-text/60">Deco budget:</span> €{inq.decoration_budget}</div>}
                              {inq.is_custom && <div className="text-xs"><span className="text-brand-text/60">Activity Included:</span> {inq.has_activity ? 'Yes' : 'No'}</div>}
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-xs text-brand-text/80 whitespace-pre-wrap">{inq.message || '-'}</p>
                            </td>
                          </tr>
                        ))}
                        {privateEventInquiries.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-sm text-brand-text/40">
                              No inquiries found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
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
                                <p className="text-sm font-bold">{review.name}</p>
                                <p className="text-xs text-brand-text/60">{review.email}</p>
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
          ) : activeTab === 'email_templates' ? (
            <EmailTemplates setMessage={setMessage} />
          ) : null}
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
                <section className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-gold">Event Images</h3>
                      <p className="mt-2 text-xs text-brand-text/50">Upload new images, choose the cover photo, or remove old gallery images.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-text px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-bg transition-all hover:bg-brand-gold">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleEventImageUpload(file, true);
                            e.target.value = '';
                          }}
                        />
                        <ImageIcon className="h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Replace Cover'}
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-brand-border px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-text transition-all hover:border-brand-gold hover:text-brand-gold">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleEventImageUpload(file, false);
                            e.target.value = '';
                          }}
                        />
                        <PlusCircle className="h-4 w-4" />
                        Add Image
                      </label>
                    </div>
                  </div>

                  {getEditableEventImages(editingEvent).length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {getEditableEventImages(editingEvent).map((image: any) => (
                        <div key={String(image.id)} className="overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-sm">
                          <div className="relative aspect-[4/3] bg-brand-bg/20">
                            <img
                              src={image.image_url}
                              alt={editingEvent.title}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {image.is_cover && (
                              <span className="absolute left-3 top-3 rounded-full bg-brand-gold px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white shadow-lg">
                                Cover
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3 p-4">
                            <button
                              type="button"
                              disabled={Boolean(image.is_cover)}
                              onClick={() => handleSetEventCoverImage(image.image_url)}
                              className="inline-flex items-center gap-2 rounded-xl bg-brand-bg px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-text transition-all hover:bg-brand-text hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ImageIcon className="h-4 w-4" />
                              Set Cover
                            </button>
                            {!image.is_fallback && typeof image.id === 'number' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteEventImage(image.id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[28px] border-2 border-dashed border-brand-border p-10 text-center text-brand-text/40">
                      No images uploaded yet.
                    </div>
                  )}
                </section>

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
                          onFocus={(e) => e.target.select()}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Payment Deadline</label>
                          <input
                            type="date"
                            defaultValue={getDatePart(editingEvent.payment_deadline || editingEvent.booking_deadline)}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const time = getTimePart(editingEvent.payment_deadline || editingEvent.booking_deadline, '18:00');
                              handleUpdateEvent(editingEvent.id, { payment_deadline: `${e.target.value}T${time}` });
                            }}
                            className="w-full px-6 py-4 rounded-2xl border border-brand-border outline-none focus:border-brand-gold"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Time (24h)</label>
                          <input
                            type="time"
                            value={getTimePart(editingEvent.payment_deadline || editingEvent.booking_deadline, '18:00')}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const date = getDatePart(editingEvent.payment_deadline || editingEvent.booking_deadline) || new Date().toISOString().split('T')[0];
                              setEditingEvent({ ...editingEvent, payment_deadline: `${date}T${e.target.value}` });
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
                <ProductCategoryManager
                  heading="Product Categories"
                  categories={editingEvent.product_categories || []}
                  emptyMessage="No product categories attached to this event yet."
                  categoryDraftName={newProductCategoryName}
                  onCategoryDraftChange={setNewProductCategoryName}
                  onAddCategory={handleAddProductCategory}
                  productDraft={newProduct}
                  onProductDraftChange={(changes) => setNewProduct(prev => ({ ...prev, ...changes }))}
                  onAddProduct={handleAddProduct}
                  onProductImageUpload={handleProductImageUpload}
                  onDeleteCategory={(category) => handleDeleteProductCategory(category.id, category.name)}
                  onDeleteProduct={(product) => handleDeleteProduct(String(product.id))}
                  addCategoryLabel="Add Category"
                  addProductLabel="Add Product To Category"
                />
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
                    {getActiveShifts(editingEvent.shifts).map((shift: any) => {
                      const totalPeople = getShiftBookingCount(shift);

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
                                  onFocus={(e) => e.target.select()}
                                  className="w-16 px-2 py-1 text-xs font-bold bg-white border border-brand-border rounded-lg outline-none focus:border-brand-gold"
                                />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-brand-text/40">Limit Counter (trigger)</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => {
                                openParticipantsShift(shift, editingEvent.title);
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
                                setDeletingShift(shift);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-500 hover:text-white transition-all text-[9px] uppercase font-bold tracking-widest"
                              title="Archive Shift"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              Archive
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
                      className="p-8 border-2 border-dashed border-brand-gold bg-brand-gold/5 rounded-[32px] space-y-6"
                    >
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Start Time</label>
                          <input
                            type="datetime-local"
                            required
                            value={newShift.start_time}
                            onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">End Time</label>
                          <input
                            type="datetime-local"
                            required
                            value={newShift.end_time}
                            onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Limit Counter (trigger)</label>
                          <input
                            type="number"
                            required
                            value={newShift.people_counter || ''}
                            onChange={(e) => setNewShift({ ...newShift, people_counter: e.target.value === '' ? 0 : Number(e.target.value) })}
                            onFocus={(e) => e.target.select()}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
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
                {false && (
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

                  <div className="grid md:grid-cols-2 gap-4">
                    {(editingEvent.products || []).map((product: any) => (
                      <div key={product.id} className="p-6 bg-brand-bg/30 rounded-2xl border border-brand-border flex items-start justify-between">
                        <div className="flex gap-4">
                          {product.image_url && (
                            <img src={product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          )}
                          <div>
                            <h4 className="text-sm font-bold">{product.title}</h4>
                            <p className="text-[10px] text-brand-text/40 font-bold uppercase mt-1">€{product.price}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {isAddingProduct && (
                    <motion.form
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleAddProduct}
                      className="p-8 border-2 border-dashed border-brand-gold bg-brand_gold/5 rounded-[32px] space-y-6"
                    >
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Product Title</label>
                          <input
                            type="text"
                            required
                            value={newProduct.title}
                            onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
                            placeholder="e.g., Souvenir Photo"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40 mb-2">Price (€)</label>
                          <input
                            type="number"
                            required
                            value={newProduct.price || ''}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                            onFocus={(e) => e.target.select()}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border outline-none"
                          />
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
                      <div className="flex gap-3">
                        <button type="submit" className="flex-1 py-4 bg-brand-gold text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Confirm Product</button>
                        <button type="button" onClick={() => setIsAddingProduct(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                      </div>
                    </motion.form>
                  )}
                </section>
                )}
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

      {/* Archived Event Detail Modal */}
      <AnimatePresence>
        {viewingArchivedEvent && (
          <div
            className="fixed inset-0 z-[105] flex items-center justify-center p-6 bg-brand-text/60 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setViewingArchivedEvent(null);
                setHighlightedArchivedShiftId(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-brand-border flex justify-between items-center bg-brand-bg/20">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600">
                    <Archive className="w-3.5 h-3.5" />
                    Archived Event
                  </div>
                  <h2 className="mt-4 text-3xl font-bold serif-font">{viewingArchivedEvent.title}</h2>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-text/40 mt-2">
                    {formatSafeDate(viewingArchivedEvent.event_date)} • {viewingArchivedEvent.location_name || 'No location set'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewingArchivedEvent(null);
                    setHighlightedArchivedShiftId(null);
                  }}
                  className="p-3 hover:bg-brand-bg rounded-full transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10">
                <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="overflow-hidden rounded-[32px] border border-brand-border bg-brand-bg/20 min-h-[260px]">
                    {viewingArchivedEvent.cover_image_url ? (
                      <img
                        src={viewingArchivedEvent.cover_image_url}
                        alt={viewingArchivedEvent.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full min-h-[260px] flex items-center justify-center text-brand-text/25">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-brand-border bg-brand-bg/20 p-5">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Price</p>
                      <p className="mt-2 text-2xl font-bold serif-font">€{viewingArchivedEvent.price}</p>
                    </div>
                    <div className="rounded-2xl border border-brand-border bg-brand-bg/20 p-5">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Booking Deadline</p>
                      <p className="mt-2 text-sm font-bold">
                        {formatSafeDate(viewingArchivedEvent.booking_deadline)} {formatSafeTime(viewingArchivedEvent.booking_deadline)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-brand-border bg-brand-bg/20 p-5">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Payment Deadline</p>
                      <p className="mt-2 text-sm font-bold">
                        {formatSafeDate(viewingArchivedEvent.payment_deadline || viewingArchivedEvent.booking_deadline)} {formatSafeTime(viewingArchivedEvent.payment_deadline || viewingArchivedEvent.booking_deadline)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-brand-border bg-brand-bg/20 p-5 sm:col-span-2">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Location</p>
                      <p className="mt-2 text-sm font-bold">{viewingArchivedEvent.location_name || 'Not set'}</p>
                      <p className="mt-1 text-sm text-brand-text/60">{viewingArchivedEvent.location_address || 'No address available'}</p>
                    </div>
                    <div className="rounded-2xl border border-brand-border bg-brand-bg/20 p-5">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Visibility</p>
                      <p className="mt-2 text-sm font-bold">{viewingArchivedEvent.is_hidden ? 'Hidden' : 'Visible'}</p>
                    </div>
                    <div className="rounded-2xl border border-brand-border bg-brand-bg/20 p-5">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Sold Out Flag</p>
                      <p className="mt-2 text-sm font-bold">{viewingArchivedEvent.is_sold_out ? 'On' : 'Off'}</p>
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[28px] border border-brand-border p-6">
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-gold">Short Description</h3>
                    <p className="mt-4 text-sm leading-relaxed text-brand-text/80">{viewingArchivedEvent.short_description || 'No short description available.'}</p>
                  </div>
                  <div className="rounded-[28px] border border-brand-border p-6">
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-gold">Full Description</h3>
                    <p className="mt-4 text-sm leading-relaxed text-brand-text/80 whitespace-pre-wrap">{viewingArchivedEvent.full_description || 'No full description available.'}</p>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-gold">Shifts</h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-brand-text/40">
                      {(viewingArchivedEvent.shifts || []).length} total shifts
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {(viewingArchivedEvent.shifts || []).length === 0 ? (
                      <div className="rounded-[28px] border-2 border-dashed border-brand-border p-10 text-center text-brand-text/40">
                        No shifts for this event.
                      </div>
                    ) : (
                      (viewingArchivedEvent.shifts || []).map((shift: any) => (
                        <div
                          key={shift.id}
                          className={`rounded-[28px] border p-6 transition-all ${highlightedArchivedShiftId === shift.id
                            ? 'border-brand-gold bg-brand-gold/5 shadow-sm'
                            : 'border-brand-border bg-brand-bg/20'
                            }`}
                        >
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-sm font-bold">
                                  {formatSafeDate(shift.start_time)} @ {formatSafeTime(shift.start_time)}
                                </span>
                                <span className={`text-[9px] uppercase font-bold px-3 py-1 rounded-full ${isArchivedStatus(shift.status)
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                  {isArchivedStatus(shift.status) ? 'Archived' : (shift.status || 'Active')}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-[10px] uppercase font-bold tracking-widest text-brand-text/50">
                                <span>{getShiftBookingCount(shift)} booked</span>
                                <span>Capacity {shift.capacity ?? 'N/A'}</span>
                                <span>{shift.is_full ? 'Full' : 'Open'}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => setHighlightedArchivedShiftId(shift.id)}
                                className="px-4 py-3 bg-brand-text/5 text-brand-text text-[9px] uppercase font-bold tracking-widest rounded-xl hover:bg-brand-text hover:text-white transition-all"
                              >
                                Focus Shift
                              </button>
                              <button
                                type="button"
                                onClick={() => openParticipantsShift(shift, viewingArchivedEvent.title)}
                                className="px-4 py-3 bg-brand-gold/10 text-brand-gold text-[9px] uppercase font-bold tracking-widest rounded-xl hover:bg-brand-gold hover:text-white transition-all"
                              >
                                See Participants
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <ProductCategoryManager
                  heading="Product Categories"
                  categories={viewingArchivedEvent.product_categories || []}
                  emptyMessage="No product categories attached to this event."
                  readOnly
                />

                {false && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-gold">Products</h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-brand-text/40">
                      {(viewingArchivedEvent.products || []).length} total products
                    </p>
                  </div>

                  {(viewingArchivedEvent.products || []).length === 0 ? (
                    <div className="rounded-[28px] border-2 border-dashed border-brand-border p-10 text-center text-brand-text/40">
                      No products attached to this event.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {(viewingArchivedEvent.products || []).map((product: any) => (
                        <div key={product.id} className="rounded-[24px] border border-brand-border bg-brand-bg/20 p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-bold">{product.title}</h4>
                              <p className="mt-2 text-sm text-brand-text/70">{product.description || 'No description'}</p>
                            </div>
                            <div className="text-sm font-bold text-brand-gold">€{product.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                )}
              </div>

              <div className="p-8 border-t border-brand-border bg-brand-bg/10 flex justify-end">
                <button
                  onClick={() => {
                    setViewingArchivedEvent(null);
                    setHighlightedArchivedShiftId(null);
                  }}
                  className="px-10 py-4 bg-brand-text text-brand-bg rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold transition-all"
                >
                  Close
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
                  {viewingParticipantsShift.eventTitle && (
                    <p className="text-sm font-bold text-brand-text/70 mt-2">{viewingParticipantsShift.eventTitle}</p>
                  )}
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-text/40 mt-1">
                    {new Date(viewingParticipantsShift.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <button onClick={() => setViewingParticipantsShift(null)} className="p-3 hover:bg-brand-bg rounded-full transition-all">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10">
                {activeParticipantBookings.length > 0 || canceledParticipantBookings.length > 0 ? (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-xs font-bold text-brand-text/40 uppercase tracking-widest">
                        {selectedBookings.length} Selected
                      </div>
                      <div className="flex flex-wrap gap-3 justify-end">
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
                        <button
                          onClick={handleMarkAsCanceled}
                          disabled={selectedBookings.length === 0}
                          className="px-6 py-3 bg-red-600 text-white text-[10px] uppercase font-bold tracking-widest rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Mark as Canceled
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-bold">Active Reservations</h3>
                          <p className="mt-1 text-xs text-brand-text/50">These guests still count toward the shift capacity.</p>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40">
                          {activeParticipantBookings.reduce((sum, booking) => sum + (booking.number_of_people || 0), 0)} Guests
                        </div>
                      </div>

                      {activeParticipantBookings.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-brand-border">
                                <th className="p-4 text-left">
                                  <input
                                    type="checkbox"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedBookings(activeParticipantBookings.map((b: any) => b.id));
                                      } else {
                                        setSelectedBookings([]);
                                      }
                                    }}
                                    checked={selectedBookings.length === activeParticipantBookings.length && activeParticipantBookings.length > 0}
                                    className="w-4 h-4 rounded border-brand-border text-brand-gold focus:ring-brand-gold"
                                  />
                                </th>
                                <th className="p-4 text-left text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Name</th>
                                <th className="p-4 text-left text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Contact</th>
                                <th className="p-4 text-center text-[10px] uppercase font-bold tracking-widest text-brand-text/40">People</th>
                                <th className="p-4 text-left text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Products</th>
                                <th className="p-4 text-center text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeParticipantBookings.map((booking: any) => {
                                const productSelections = getBookingProductSelections(booking);

                                return (
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
                                    <td className="p-4 min-w-[220px]">
                                      {productSelections.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {productSelections.map((selection) => (
                                            <span
                                              key={selection.key}
                                              className="inline-flex items-center rounded-full bg-brand-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold"
                                            >
                                              {selection.label}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-brand-text/40">No products</span>
                                      )}
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
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-brand-border bg-brand-bg/10 p-6 text-sm text-brand-text/40">
                          No active reservations in this shift right now.
                        </div>
                      )}
                    </div>

                    <div className="rounded-[24px] border border-brand-border bg-brand-bg/20 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-bold">Product Totals</h3>
                          <p className="mt-1 text-xs text-brand-text/50">Use this summary to see what needs to be ordered for this shift. Canceled reservations are excluded.</p>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40">
                          {viewingParticipantsProductTotals.reduce((sum, item) => sum + item.quantity, 0)} Total Items
                        </div>
                      </div>

                      {viewingParticipantsProductTotals.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {viewingParticipantsProductTotals.map((item) => (
                            <span
                              key={item.key}
                              className="inline-flex items-center rounded-full bg-brand-text px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-bg"
                            >
                              {item.quantity} x {item.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-brand-text/40">No active product selections yet for this shift.</p>
                      )}
                    </div>

                    {canceledParticipantBookings.length > 0 && (
                      <div className="space-y-4 border-t border-brand-border/60 pt-6">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-red-600">Canceled Reservations</h3>
                            <p className="mt-1 text-xs text-brand-text/50">These bookings are kept for history and shown separately from active guests.</p>
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40">
                            {canceledParticipantBookings.length} Bookings
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-brand-border">
                                <th className="p-4 text-left text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Name</th>
                                <th className="p-4 text-left text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Contact</th>
                                <th className="p-4 text-center text-[10px] uppercase font-bold tracking-widest text-brand-text/40">People</th>
                                <th className="p-4 text-left text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Products</th>
                                <th className="p-4 text-center text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {canceledParticipantBookings.map((booking: any) => {
                                const productSelections = getBookingProductSelections(booking);

                                return (
                                  <tr key={booking.id} className="border-b border-brand-border/50 bg-red-50/40">
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
                                      <span className="inline-flex items-center justify-center w-8 h-8 bg-white rounded-full text-xs font-bold border border-red-100">
                                        {booking.number_of_people}
                                      </span>
                                    </td>
                                    <td className="p-4 min-w-[220px]">
                                      {productSelections.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {productSelections.map((selection) => (
                                            <span
                                              key={selection.key}
                                              className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600 border border-red-100"
                                            >
                                              {selection.label}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-brand-text/40">No products</span>
                                      )}
                                    </td>
                                    <td className="p-4 text-center">
                                      <div className="flex flex-col items-center gap-2">
                                        <span className="text-[9px] uppercase font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">
                                          Canceled
                                        </span>
                                        <span className={`text-[9px] uppercase font-bold px-3 py-1 rounded-full ${booking.payment_status === 'paid'
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                          }`}>
                                          {booking.payment_status || 'Pending'}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
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

      {/* Archive Event Modal */}
      <AnimatePresence>
        {deletingEvent && (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-brand-text/60 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setDeletingEvent(null);
                setSendArchiveEmails(true);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Archive className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold serif-font mb-4">Archive Event?</h2>
              <p className="text-brand-text/60 text-sm mb-8">
                Archive <span className="font-bold text-brand-text">"{deletingEvent.title}"</span> and move it to the Archive tab?
                This keeps the existing data but removes the event and its shifts from active listings.
              </p>
              <label className="mb-8 flex items-start gap-3 rounded-2xl border border-brand-border bg-brand-bg/20 px-5 py-4 text-left">
                <input
                  type="checkbox"
                  checked={sendArchiveEmails}
                  onChange={(e) => setSendArchiveEmails(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-brand-border text-brand-gold focus:ring-brand-gold"
                />
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-brand-text/50">Cancellation Emails</span>
                  <span className="mt-2 block text-sm text-brand-text/70">
                    Send a cancellation email to booked guests when this event is archived.
                  </span>
                  <span className="mt-1 block text-xs text-brand-text/50">
                    Turn this off for events that already happened successfully and are only being moved to the archive.
                  </span>
                </span>
              </label>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDeleteEvent(deletingEvent.id, sendArchiveEmails)}
                  className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-amber-600 transition-all shadow-lg"
                >
                  Yes, Archive Event
                </button>
                <button
                  onClick={() => {
                    setDeletingEvent(null);
                    setSendArchiveEmails(true);
                  }}
                  className="w-full py-4 bg-brand-bg text-brand-text/60 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-text hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Archive Shift Modal */}
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
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Archive className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold serif-font mb-4">Archive Shift?</h2>
              <p className="text-brand-text/60 text-sm mb-8">
                Archive this shift and move it to the Archive tab?
                <span className="font-bold text-brand-text block mt-2">Existing bookings stay saved, but this shift will stop appearing in active booking flows.</span>
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDeleteShift(deletingShift.id)}
                  className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-amber-600 transition-all shadow-lg"
                >
                  Yes, Archive Shift
                </button>
                <button
                  onClick={() => setDeletingShift(null)}
                  className="w-full py-4 bg-brand-bg text-brand-text/60 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-text hover:text-white transition-all"
                >
                  Cancel
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
