
import React, { useState, useEffect } from 'react';
import { WeekploreEvent, BookingFormData } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import {
  flattenProductCategories,
  getCategoryKey,
  getDefaultProductForCategory,
  getSelectableProductCategories,
} from '../lib/productUtils';

interface BookingModalProps {
  event: WeekploreEvent;
  onClose: () => void;
  onSubmit: (data: BookingFormData) => Promise<void> | void;
}

const BookingModal: React.FC<BookingModalProps> = ({ event, onClose, onSubmit }) => {
  const { language, t } = useLanguage();
  const bookableShifts = event.shifts?.filter(
    s => s.is_active !== false && s.status !== 'canceled' && s.status !== 'archived'
  ) || [];
  const availableShifts = bookableShifts.filter(s => !s.is_full && s.booked_spots < s.capacity);
  
  const locale = language === 'gr' ? 'el-GR' : 'en-US';
  const selectableProductCategories = getSelectableProductCategories(event.product_categories || []);
  const flatProducts = event.products || flattenProductCategories(event.product_categories || []);
  const paymentDeadlineSource = event.payment_deadline;
  const paymentDeadlineText = (() => {
    if (!paymentDeadlineSource) {
      return language === 'gr'
        ? 'Θα λάβετε τις λεπτομέρειες πληρωμής μέσω email.'
        : 'You will receive payment details by email.';
    }

    const deadline = new Date(paymentDeadlineSource);
    if (isNaN(deadline.getTime())) {
      return language === 'gr'
        ? 'Θα λάβετε τις λεπτομέρειες πληρωμής μέσω email.'
        : 'You will receive payment details by email.';
    }

    const formattedDeadline = deadline.toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return language === 'gr'
      ? `Θα λάβετε τις λεπτομέρειες πληρωμής μέσω email. Η προθεσμία πληρωμής είναι ${formattedDeadline}.`
      : `You will receive payment details by email. Payment deadline: ${formattedDeadline}.`;
  })();

  const [formData, setFormData] = useState<BookingFormData>({
    fullName: '',
    phone: '',
    email: '',
    shiftId: availableShifts[0]?.id || bookableShifts[0]?.id || 0,
    numberOfPeople: 1,
    products: []
  });

  const [personSelections, setPersonSelections] = useState<Record<string, string>[]>([]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const categories = getSelectableProductCategories(event.product_categories || []);

    if (categories.length === 0) {
      setPersonSelections([]);
      return;
    }

    setPersonSelections(prev => {
      return Array.from({ length: formData.numberOfPeople }, (_, guestIndex) => {
        const existingSelections = prev[guestIndex] || {};
        const nextSelections: Record<string, string> = {};

        categories.forEach(category => {
          const categoryKey = getCategoryKey(category.id);
          const existingProductId = existingSelections[categoryKey];
          const isStillValid = category.products?.some(product => product.id === existingProductId);
          const fallbackProduct = getDefaultProductForCategory(category);

          if (isStillValid && existingProductId) {
            nextSelections[categoryKey] = existingProductId;
          } else if (fallbackProduct?.id) {
            nextSelections[categoryKey] = fallbackProduct.id;
          }
        });

        return nextSelections;
      });
    });
  }, [formData.numberOfPeople, event.product_categories]);

  useEffect(() => {
    const counts: Record<string, number> = {};
    personSelections.forEach(selectionMap => {
      Object.values(selectionMap).forEach(productId => {
        if (productId) counts[productId] = (counts[productId] || 0) + 1;
      });
    });
    
    const products = Object.entries(counts).map(([product_id, quantity]) => ({
      product_id,
      quantity
    }));
    
    setFormData(prev => ({ ...prev, products }));
  }, [personSelections]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasCompleteProductSelections = selectableProductCategories.length === 0 || (
    personSelections.length === formData.numberOfPeople &&
    personSelections.every(selectionMap =>
      selectableProductCategories.every(category => {
        const selectedProductId = selectionMap[getCategoryKey(category.id)];
        return category.products?.some(product => product.id === selectedProductId);
      })
    )
  );

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
          {/* Header */}
          <div className="pointer-events-none sticky top-0 z-20 flex items-start justify-between bg-gradient-to-b from-white via-white/95 to-transparent px-4 pb-12 pt-5 sm:px-6 sm:pb-16 md:px-10">
            <div className="pr-4 pointer-events-auto">
              <span className="text-[9px] uppercase tracking-[0.4em] text-brand-gold font-bold mb-1.5 block">{t('booking.title', { stripAccents: true })}</span>
              <h2 className="text-xl font-bold leading-tight text-brand-text serif-font sm:text-2xl">{event.title}</h2>
              <p className="text-[11px] text-brand-text/50 mt-1 uppercase tracking-wider font-medium">
                {(() => {
                  const d = new Date(event.event_date);
                  return isNaN(d.getTime()) ? t('common.invalidDate') : d.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
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
              {/* Step 1: Time */}
              <div className="space-y-4">
                <label className="block text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold">{t('booking.step1', { stripAccents: true })}</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bookableShifts.map((shift) => {
                    const isFull = shift.is_full || shift.booked_spots >= shift.capacity;
                    const timeStr = (() => {
                      const start = new Date(shift.start_time);
                      const end = new Date(shift.end_time);
                      if (isNaN(start.getTime()) || isNaN(end.getTime())) return t('common.invalidDate');
                      return `${start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
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
                        {isFull && <span className="text-[9px] uppercase text-brand-text/30 font-bold">{t('common.soldOut', { stripAccents: true })}</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Personal Info & Guests */}
              <div className="space-y-6">
                <label className="block text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold">{t('booking.step2', { stripAccents: true })}</label>
                <div className="space-y-6">
                  <div className="relative group">
                    <input
                      required
                      type="text"
                      className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font"
                      placeholder={t('booking.fullName')}
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
                        placeholder={t('booking.phone')}
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
                        placeholder={t('booking.email')}
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.3em] text-brand-text/40 font-bold mb-1">{t('booking.numOfPeople')}</span>
                        <span className="text-xs font-bold text-brand-text uppercase tracking-widest opacity-60">{t('booking.howMany')}</span>
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

              {/* Step 3: Individual Product Selection */}
              {selectableProductCategories.length > 0 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <label className="block text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold">{t('booking.step3', { stripAccents: true })}</label>
                  </div>
                  <div className={`transition-all ${
                    formData.numberOfPeople > 1 
                      ? 'rounded-[32px] border border-brand-border bg-brand-bg/5 p-6 sm:p-8' 
                      : 'space-y-4'
                  }`}>
                    {personSelections.map((selectionMap, pIdx) => (
                      <div key={pIdx} className={`flex flex-col gap-4 transition-all ${
                        formData.numberOfPeople > 1 && pIdx > 0 ? 'pt-6 mt-6 border-t border-brand-border/10' : ''
                      }`}>
                        {formData.numberOfPeople > 1 && (
                          <div className="flex items-center justify-between pb-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text/60">{t('booking.guest')} {pIdx + 1}</span>
                            <span className="text-[9px] font-bold text-brand-gold uppercase tracking-[0.2em] italic opacity-80">{t('booking.selection')}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {event.products?.map(product => {
                            const isSelected = selectedId === product.id;
                            const isFreeProduct = product.price === 0;
                            return (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => {
                                  const newSels = [...personSelections];
                                  newSels[pIdx] = product.id;
                                  setPersonSelections(newSels);
                                }}
                                className={`flex items-center gap-3 rounded-xl border p-2 text-left transition-all ${
                                  isSelected ? 'border-brand-gold bg-brand-gold/5 ring-1 ring-brand-gold shadow-sm' : 'border-brand-border hover:bg-white hover:border-brand-gold/30'
                                }`}
                              >
                                {product.image_url && (
                                  <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden border border-brand-border/30">
                                    <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center gap-1">
                                    <p className="text-[9px] font-bold uppercase tracking-tight truncate">{product.title}</p>
                                    <span className="text-[8px] font-bold text-brand-text/60 flex-shrink-0">
                                      {isFreeProduct ? t('common.free') : `€${product.price}`}
                                    </span>
                                  </div>
                                  <p className="text-[8px] text-brand-text/40 truncate opacity-60">{product.description}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Section */}
              <div className="space-y-4 border-t border-brand-border pt-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-brand-text/40 font-bold">{t('booking.summary')}</span>
                  <span className="text-[11px] font-bold text-brand-text uppercase tracking-widest">
                    {formData.numberOfPeople} {formData.numberOfPeople === 1 ? t('booking.plural.guest') : t('booking.plural.guests')}
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-text">{t('booking.total')}</span>
                  <span className="text-2xl font-bold serif-font text-brand-gold">
                    €{
                      (formData.numberOfPeople * event.price) +
                      (formData.products?.reduce((acc, p) => {
                        const product = event.products?.find(prod => prod.id === p.product_id);
                        return acc + (p.quantity * (product?.price || 0));
                      }, 0) || 0)
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.shiftId || (event.products && event.products.length > 0 && (formData.products?.reduce((acc, p) => acc + p.quantity, 0) || 0) !== formData.numberOfPeople)}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-text py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-bg shadow-lg transition-all duration-500 hover:bg-brand-gold disabled:opacity-50 sm:py-5 sm:text-xs sm:tracking-[0.3em]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
                      {t('booking.processing')}
                    </>
                  ) : (
                    t('booking.confirm')
                  )}
                </button>
                <div className="mx-auto max-w-xl px-3 pt-1 text-center">
                  <div className="mx-auto mb-2 h-px w-16 bg-gradient-to-r from-transparent via-brand-gold/45 to-transparent" />
                  <p className="text-[11.5px] leading-relaxed text-brand-text/58 sm:text-[12px]">
                    {paymentDeadlineText}
                  </p>
                </div>
              </div>
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
