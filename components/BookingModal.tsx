
import React, { useState } from 'react';
import { WeekploreEvent, Shift, BookingFormData } from '../types';

interface BookingModalProps {
  event: WeekploreEvent;
  onClose: () => void;
  onSubmit: (data: BookingFormData) => Promise<void> | void;
}

const BookingModal: React.FC<BookingModalProps> = ({ event, onClose, onSubmit }) => {
  const availableShifts = event.shifts?.filter(s => !s.is_full && s.booked_spots < s.capacity) || [];

  const [formData, setFormData] = useState<BookingFormData>({
    fullName: '',
    phone: '',
    email: '',
    shiftId: availableShifts[0]?.id || 0,
    numberOfPeople: 1,
    products: event.products && event.products.length > 0
      ? [{ product_id: event.products[0].id, quantity: 1 }]
      : []
  });

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  React.useEffect(() => {
    setFormData(prev => {
      if (event.products && event.products.length > 0) {
        return {
          ...prev,
          products: [{ product_id: event.products[0].id, quantity: prev.numberOfPeople }]
        };
      }
      return { ...prev, products: [] };
    });
  }, [formData.numberOfPeople, event.products]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-brand-text/60 p-2 backdrop-blur-md sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-brand-border bg-brand-bg p-1.5 shadow-2xl sm:max-h-[90vh] sm:w-[95%] sm:rounded-[32px]">
        <div className="relative flex-1 overflow-y-auto rounded-t-[22px] bg-white scroll-smooth no-scrollbar sm:rounded-[26px]">
          {/* Header - Sticky with gradient */}
          <div className="pointer-events-none sticky top-0 z-20 flex items-start justify-between bg-gradient-to-b from-white via-white/95 to-transparent px-4 pb-12 pt-5 sm:px-6 sm:pb-16 md:px-10">
            <div className="pr-4 pointer-events-auto">
              <span className="text-[9px] uppercase tracking-[0.4em] text-brand-gold font-bold mb-1.5 block">Κράτηση</span>
              <h2 className="text-xl font-bold leading-tight text-brand-text serif-font sm:text-2xl">{event.title}</h2>
              <p className="text-[11px] text-brand-text/50 mt-1 uppercase tracking-wider font-medium">
                {(() => {
                  const d = new Date(event.event_date);
                  return isNaN(d.getTime()) ? 'Μη έγκυρη ημερομηνία' : d.toLocaleDateString('el-GR', { day: 'numeric', month: 'long' });
                })()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="pointer-events-auto flex-shrink-0 rounded-full border border-brand-border bg-white p-2.5 shadow-sm transition-colors hover:bg-brand-bg"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-4 pb-8 pt-0 sm:px-6 sm:pb-10 md:px-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold">1. Επιλέξτε Ώρα</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {event.shifts?.map((shift) => {
                    const isFull = shift.is_full || shift.booked_spots >= shift.capacity;
                    const timeStr = (() => {
                      const start = new Date(shift.start_time);
                      const end = new Date(shift.end_time);
                      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Μη έγκυρη ώρα';
                      return `${start.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}`;
                    })();
                    return (
                      <label
                        key={shift.id}
                        className={`flex min-h-11 items-center justify-between rounded-2xl border p-4 transition-all duration-300 ${isFull
                          ? 'opacity-30 cursor-not-allowed bg-gray-50 border-gray-100'
                          : formData.shiftId === shift.id
                            ? 'border-brand-gold bg-brand-gold/5 ring-1 ring-brand-gold shadow-md'
                            : 'border-brand-border hover:border-brand-gold/40 hover:bg-brand-bg/10'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.shiftId === shift.id ? 'border-brand-gold bg-brand-gold' : 'border-brand-border'}`}>
                            {formData.shiftId === shift.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <input
                            type="radio"
                            name="shift"
                            value={shift.id}
                            disabled={isFull}
                            checked={formData.shiftId === shift.id}
                            onChange={() => setFormData(prev => ({ ...prev, shiftId: shift.id }))}
                            className="hidden"
                          />
                          <span className="font-bold text-xs uppercase tracking-[0.2em]">{timeStr}</span>
                        </div>
                        {isFull && <span className="text-[9px] uppercase text-brand-text/30 font-bold">Εξαντλήθηκε</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <label className="block text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold">2. Προσωπικά στοιχεία</label>
                <div className="space-y-6">
                  <div className="relative group">
                    <input
                      required
                      type="text"
                      className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font"
                      placeholder="Ονοματεπώνυμο"
                      value={formData.fullName}
                      onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="relative group">
                      <input
                        required
                        type="tel"
                        className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font"
                        placeholder="Αριθμός Τηλεφώνου"
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                    </div>
                    <div className="relative group">
                      <input
                        required
                        type="email"
                        className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font"
                        placeholder="Διεύθυνση Email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.3em] text-brand-text/40 font-bold mb-1">Αριθμός Επισκεπτών</span>
                        <span className="text-xs font-bold text-brand-text uppercase tracking-widest opacity-60">Πόσα άτομα;</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, numberOfPeople: Math.max(1, prev.numberOfPeople - 1) }))}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-lg font-medium transition-all hover:bg-brand-text hover:text-white"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-2xl font-bold text-brand-text serif-font">{formData.numberOfPeople}</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, numberOfPeople: Math.min(8, prev.numberOfPeople + 1) }))}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-lg font-medium transition-all hover:bg-brand-text hover:text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {event.products && event.products.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="block text-[9px] uppercase tracking-[0.3em] text-brand-text/40 font-bold">3. Επιλέξτε Προϊόντα</label>
                    <span className="text-[9px] font-bold text-brand-gold uppercase tracking-widest">
                      Σύνολο: {formData.products?.reduce((acc, p) => acc + p.quantity, 0) || 0} / {formData.numberOfPeople}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {event.products.map((product, index) => {
                      const selectedProduct = formData.products?.find(p => p.product_id === product.id);
                      const currentQty = selectedProduct?.quantity || 0;
                      const isFirstProduct = index === 0;

                      return (
                        <div key={product.id} className="p-4 rounded-2xl border border-brand-border bg-brand-bg/10">
                          <div className="flex gap-3 mb-3">
                            {product.image_url && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-brand-border">
                                <img
                                  src={product.image_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-text truncate">{product.title}</h4>
                                <span className="text-[10px] font-bold text-brand-text flex-shrink-0">
                                  {isFirstProduct ? <span className="text-brand-gold uppercase tracking-widest text-[8px]">Περιλαμβάνεται</span> : `€${product.price}`}
                                </span>
                              </div>
                              <p className="text-[9px] text-brand-text/40 leading-tight mt-0.5 line-clamp-2">{product.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                const products = [...(formData.products || [])];
                                const idx = products.findIndex(p => p.product_id === product.id);
                                if (idx > -1) {
                                  if (products[idx].quantity > 0) {
                                    products[idx].quantity -= 1;
                                    setFormData(prev => ({ ...prev, products }));
                                  }
                                }
                              }}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border transition-colors hover:bg-white"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold serif-font w-4 text-center">{currentQty}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const products = [...(formData.products || [])];
                                const idx = products.findIndex(p => p.product_id === product.id);
                                const totalQty = products.reduce((acc, p) => acc + p.quantity, 0);

                                if (totalQty < formData.numberOfPeople) {
                                  if (idx > -1) {
                                    products[idx].quantity += 1;
                                  } else {
                                    products.push({ product_id: product.id, quantity: 1 });
                                  }
                                  setFormData(prev => ({ ...prev, products }));
                                }
                              }}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border transition-colors hover:bg-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {formData.products && formData.products.reduce((acc, p) => acc + p.quantity, 0) !== formData.numberOfPeople && (
                    <p className="text-[9px] text-brand-terracotta font-bold uppercase tracking-widest text-center">
                      Παρακαλώ επιλέξτε ακριβώς {formData.numberOfPeople} προϊόντα
                    </p>
                  )}
                </div>
              )}

              {/* Summary Section */}
              <div className="space-y-4 border-t border-brand-border pt-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-brand-text/40 font-bold">Σύνοψη Επιλογής</span>
                  <span className="text-[11px] font-bold text-brand-text uppercase tracking-widest">
                    {formData.numberOfPeople} {formData.numberOfPeople === 1 ? 'Επισκέπτης' : 'Επισκέπτες'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-text">Συνολικό Ποσό</span>
                  <span className="text-2xl font-bold serif-font text-brand-gold">
                    €{
                      (formData.numberOfPeople * event.price) +
                      (formData.products?.reduce((acc, p) => {
                        const product = event.products?.find(prod => prod.id === p.product_id);
                        const isFirstProduct = event.products?.[0]?.id === product?.id;
                        return acc + (p.quantity * (isFirstProduct ? 0 : (product?.price || 0)));
                      }, 0) || 0)
                    }
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.shiftId || (event.products && event.products.length > 0 && (formData.products?.reduce((acc, p) => acc + p.quantity, 0) || 0) !== formData.numberOfPeople)}
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-text py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-bg shadow-lg transition-all duration-500 hover:bg-brand-gold disabled:opacity-50 sm:py-5 sm:text-xs sm:tracking-[0.3em]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
                    Επεξεργασία...
                  </>
                ) : (
                  'Επιβεβαίωση Κράτησης'
                )}
              </button>
            </form>
          </div>
        </div>
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  );
};

export default BookingModal;
