import React, { useEffect, useState } from 'react';
import { BookingFormData, WeekploreEvent } from '../types';
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

const BookingModalV2: React.FC<BookingModalProps> = ({ event, onClose, onSubmit }) => {
  const { language, t } = useLanguage();
  const bookableShifts = event.shifts?.filter(
    (shift) => shift.is_active !== false && shift.status !== 'canceled' && shift.status !== 'archived'
  ) || [];
  const availableShifts = bookableShifts.filter((shift) => !shift.is_full && shift.booked_spots < shift.capacity);
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
    products: [],
  });
  const [personSelections, setPersonSelections] = useState<Record<string, string>[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setPersonSelections((prev) =>
      Array.from({ length: formData.numberOfPeople }, (_, guestIndex) => {
        const existingSelections = prev[guestIndex] || {};
        const nextSelections: Record<string, string> = {};

        categories.forEach((category) => {
          const categoryKey = getCategoryKey(category.id);
          const existingProductId = existingSelections[categoryKey];
          const isStillValid = category.products?.some((product) => product.id === existingProductId);
          const fallbackProduct = getDefaultProductForCategory(category);

          if (isStillValid && existingProductId) {
            nextSelections[categoryKey] = existingProductId;
          } else if (fallbackProduct?.id) {
            nextSelections[categoryKey] = fallbackProduct.id;
          }
        });

        return nextSelections;
      })
    );
  }, [formData.numberOfPeople, event.product_categories]);

  useEffect(() => {
    const counts: Record<string, number> = {};

    personSelections.forEach((selectionMap) => {
      Object.values(selectionMap).forEach((productId) => {
        if (productId) {
          counts[productId] = (counts[productId] || 0) + 1;
        }
      });
    });

    const products = Object.entries(counts).map(([product_id, quantity]) => ({
      product_id,
      quantity,
    }));

    setFormData((prev) => ({ ...prev, products }));
  }, [personSelections]);

  const hasCompleteProductSelections = selectableProductCategories.length === 0 || (
    personSelections.length === formData.numberOfPeople &&
    personSelections.every((selectionMap) =>
      selectableProductCategories.every((category) => {
        const selectedProductId = selectionMap[getCategoryKey(category.id)];
        return category.products?.some((product) => product.id === selectedProductId);
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
          <div className="pointer-events-none sticky top-0 z-20 flex items-start justify-between bg-gradient-to-b from-white via-white/95 to-transparent px-4 pb-12 pt-5 sm:px-6 sm:pb-16 md:px-10">
            <div className="pointer-events-auto pr-4">
              <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.4em] text-brand-gold">
                {t('booking.title', { stripAccents: true })}
              </span>
              <h2 className="serif-font text-xl font-bold leading-tight text-brand-text sm:text-2xl">{event.title}</h2>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-brand-text/50">
                {(() => {
                  const date = new Date(event.event_date);
                  return isNaN(date.getTime()) ? t('common.invalidDate') : date.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
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
                <label className="block text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gold">
                  {t('booking.step1', { stripAccents: true })}
                </label>
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
                        className={`flex min-h-11 items-center justify-between rounded-2xl border p-4 transition-all duration-300 ${
                          isFull
                            ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-30'
                            : formData.shiftId === shift.id
                              ? 'border-brand-gold bg-brand-gold/5 ring-1 ring-brand-gold shadow-md'
                              : 'border-brand-border hover:border-brand-gold/40 hover:bg-brand-bg/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${formData.shiftId === shift.id ? 'border-brand-gold bg-brand-gold' : 'border-brand-border'}`}>
                            {formData.shiftId === shift.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                          <input
                            type="radio"
                            name="shift"
                            value={shift.id}
                            disabled={isFull}
                            checked={formData.shiftId === shift.id}
                            onChange={() => setFormData((prev) => ({ ...prev, shiftId: shift.id }))}
                            className="hidden"
                          />
                          <span className="text-xs font-bold uppercase tracking-[0.2em]">{timeStr}</span>
                        </div>
                        {isFull && (
                          <span className="text-[9px] font-bold uppercase text-brand-text/30">
                            {t('common.soldOut', { stripAccents: true })}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <label className="block text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gold">
                  {t('booking.step2', { stripAccents: true })}
                </label>
                <div className="space-y-6">
                  <div className="group relative">
                    <input
                      required
                      type="text"
                      className="serif-font w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg"
                      placeholder={t('booking.fullName')}
                      value={formData.fullName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    />
                    <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-gold transition-all group-focus-within:w-full" />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="group relative">
                      <input
                        required
                        type="tel"
                        className="serif-font w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg"
                        placeholder={t('booking.phone')}
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-gold transition-all group-focus-within:w-full" />
                    </div>
                    <div className="group relative">
                      <input
                        required
                        type="email"
                        className="serif-font w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg"
                        placeholder={t('booking.email')}
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      />
                      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-gold transition-all group-focus-within:w-full" />
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text/40">
                          {t('booking.numOfPeople')}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-text opacity-60">
                          {t('booking.howMany')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, numberOfPeople: Math.max(1, prev.numberOfPeople - 1) }))}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-lg font-medium transition-all hover:bg-brand-text hover:text-white"
                        >
                          -
                        </button>
                        <span className="serif-font w-10 text-center text-2xl font-bold text-brand-text">{formData.numberOfPeople}</span>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, numberOfPeople: Math.min(8, prev.numberOfPeople + 1) }))}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-lg font-medium transition-all hover:bg-brand-text hover:text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectableProductCategories.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-end justify-between">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gold">
                      {t('booking.step3', { stripAccents: true })}
                    </label>
                  </div>
                  <div className={`transition-all ${
                    formData.numberOfPeople > 1
                      ? 'rounded-[32px] border border-brand-border bg-brand-bg/5 p-6 sm:p-8'
                      : 'space-y-4'
                  }`}>
                    {personSelections.map((selectionMap, guestIndex) => (
                      <div
                        key={guestIndex}
                        className={`flex flex-col gap-5 transition-all ${
                          formData.numberOfPeople > 1 && guestIndex > 0 ? 'mt-6 border-t border-brand-border/10 pt-6' : ''
                        }`}
                      >
                        {formData.numberOfPeople > 1 && (
                          <div className="flex items-center justify-between pb-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text/60">
                              {t('booking.guest')} {guestIndex + 1}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-gold opacity-80">
                              {t('booking.selection')}
                            </span>
                          </div>
                        )}

                        <div className="space-y-5">
                          {selectableProductCategories.map((category) => {
                            const categoryKey = getCategoryKey(category.id);
                            const selectedProductId = selectionMap[categoryKey];
                            const hasFreeDefault = category.products?.some((product) => product.price === 0);

                            return (
                              <div key={categoryKey} className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text/60">
                                      {category.name}
                                    </p>
                                    <p className="text-[9px] uppercase tracking-[0.18em] text-brand-text/35">
                                      {hasFreeDefault ? 'Zero-price option preselected' : 'Choose one option'}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {category.products?.map((product) => {
                                    const isSelected = selectedProductId === product.id;
                                    const isFreeProduct = product.price === 0;

                                    return (
                                      <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => {
                                          setPersonSelections((prev) =>
                                            prev.map((guestSelections, currentGuestIndex) =>
                                              currentGuestIndex === guestIndex
                                                ? { ...guestSelections, [categoryKey]: product.id }
                                                : guestSelections
                                            )
                                          );
                                        }}
                                        className={`flex items-center gap-3 rounded-xl border p-2 text-left transition-all ${
                                          isSelected
                                            ? 'border-brand-gold bg-brand-gold/5 ring-1 ring-brand-gold shadow-sm'
                                            : 'border-brand-border hover:border-brand-gold/30 hover:bg-white'
                                        }`}
                                      >
                                        {product.image_url && (
                                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-brand-border/30">
                                            <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between gap-1">
                                            <p className="truncate text-[9px] font-bold uppercase tracking-tight">{product.title}</p>
                                            <span className="flex-shrink-0 text-[8px] font-bold text-brand-text/60">
                                              {isFreeProduct ? t('common.free') : `EUR ${product.price}`}
                                            </span>
                                          </div>
                                          <p className="truncate text-[8px] text-brand-text/40 opacity-60">{product.description}</p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 border-t border-brand-border pt-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-brand-text/40">{t('booking.summary')}</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-text">
                    {formData.numberOfPeople} {formData.numberOfPeople === 1 ? t('booking.plural.guest') : t('booking.plural.guests')}
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-text">{t('booking.total')}</span>
                  <span className="serif-font text-2xl font-bold text-brand-gold">
                    EUR {
                      (formData.numberOfPeople * event.price) +
                      (formData.products?.reduce((acc, productSelection) => {
                        const product = flatProducts.find((candidate) => candidate.id === productSelection.product_id);
                        return acc + (productSelection.quantity * (product?.price || 0));
                      }, 0) || 0)
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.shiftId || !hasCompleteProductSelections}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-text py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-bg shadow-lg transition-all duration-500 hover:bg-brand-gold disabled:opacity-50 sm:py-5 sm:text-xs sm:tracking-[0.3em]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-bg/30 border-t-brand-bg" />
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

export default BookingModalV2;
