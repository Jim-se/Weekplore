import React, { useState } from 'react';
import { PrivateEventInquiryFormData } from '../types';

interface PrivateEventInquiryFormProps {
    eventName: string;
    isCustom: boolean;
    templateId?: string | null;
    onClose: () => void;
    onSubmit: (data: PrivateEventInquiryFormData) => Promise<void>;
}

const PrivateEventInquiryForm: React.FC<PrivateEventInquiryFormProps> = ({ eventName, isCustom, templateId, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<PrivateEventInquiryFormData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        number_of_people: 10,
        date_approx: '',
        setting: '',
        has_activity: false,
        activity: '',
        food: '',
        decoration_budget: 0,
        message: '',
        area: '',
        is_custom: isCustom,
        private_event_template_id: templateId || null
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorDetails, setErrorDetails] = useState('');

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setErrorDetails('');
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (err: any) {
            setErrorDetails(err.message || 'Something went wrong.');
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
                            <span className="text-[9px] uppercase tracking-[0.4em] text-brand-gold font-bold mb-1.5 block">Inquiry</span>
                            <h2 className="text-xl font-bold leading-tight text-brand-text serif-font sm:text-2xl">{eventName}</h2>
                            <p className="text-[11px] text-brand-text/50 mt-1 uppercase tracking-wider font-medium">Please provide some details</p>
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

                    <div className="px-4 pb-8 pt-0 sm:px-6 sm:pb-10 md:px-10 mt-[-20px]">
                        {errorDetails && (
                            <div className="mb-6 p-4 rounded-xl bg-brand-terracotta/10 text-brand-terracotta text-sm font-bold">
                                {errorDetails}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-6">
                                <label className="block text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold">Your Details</label>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="relative group">
                                        <input
                                            required
                                            type="text"
                                            name="first_name"
                                            className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font"
                                            placeholder="First Name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                    </div>
                                    <div className="relative group">
                                        <input
                                            required
                                            type="text"
                                            name="last_name"
                                            className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font"
                                            placeholder="Last Name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                    </div>
                                    <div className="relative group">
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font"
                                            placeholder="Email Address"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                    </div>
                                    <div className="relative group">
                                        <input
                                            required
                                            type="tel"
                                            name="phone"
                                            className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font"
                                            placeholder="Phone Number"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="block text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold">Event Details</label>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="relative group">
                                        <label className="text-xs text-brand-text/60">Approximate Date</label>
                                        <input
                                            required
                                            type="date"
                                            name="date_approx"
                                            className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all focus:border-brand-gold sm:text-lg serif-font text-brand-text"
                                            value={formData.date_approx}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                    </div>

                                    <div className="relative group">
                                        <label className="text-xs text-brand-text/60">Number of guests</label>
                                        <input
                                            required
                                            type="number"
                                            name="number_of_people"
                                            min="1"
                                            className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font"
                                            placeholder="E.g., 20"
                                            value={formData.number_of_people}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                    </div>

                                    <div className="relative group">
                                        <label className="text-xs text-brand-text/60">Area / Location</label>
                                        <input
                                            required
                                            type="text"
                                            name="area"
                                            className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font"
                                            placeholder="e.g. Athens Riviera"
                                            value={formData.area}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                    </div>

                                    <div className="relative group">
                                        <label className="text-xs text-brand-text/60">Setting</label>
                                        <select
                                            required
                                            name="setting"
                                            value={formData.setting}
                                            onChange={handleChange}
                                            className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all focus:border-brand-gold sm:text-lg serif-font text-brand-text appearance-none"
                                        >
                                            <option value="">Select Setting...</option>
                                            <option value="Outdoor">Outdoor</option>
                                            <option value="Indoor">Indoor</option>
                                            <option value="Both">Both</option>
                                        </select>
                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                    </div>

                                    <div className="relative group">
                                        <label className="text-xs text-brand-text/60">Decoration Budget</label>
                                        <input
                                            required
                                            type="number"
                                            name="decoration_budget"
                                            min="0"
                                            className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font"
                                            placeholder="€"
                                            value={formData.decoration_budget || ''}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                    </div>

                                    {isCustom && (
                                        <div className="flex flex-col gap-4 pt-4 sm:col-span-2">
                                            <div className="flex items-center">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.has_activity ? 'bg-brand-gold border-brand-gold' : 'border-brand-border bg-transparent'}`}>
                                                        {formData.has_activity && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        name="has_activity"
                                                        checked={formData.has_activity}
                                                        onChange={handleChange}
                                                        className="hidden"
                                                    />
                                                    <span className="text-sm font-bold text-brand-text uppercase tracking-widest">Include activity</span>
                                                </label>
                                            </div>

                                            {formData.has_activity && (
                                                <div className="relative group animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <textarea
                                                        required={formData.has_activity}
                                                        name="activity"
                                                        rows={2}
                                                        className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font resize-none"
                                                        placeholder="Describe the activity..."
                                                        value={formData.activity || ''}
                                                        onChange={handleChange}
                                                    />
                                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="relative group sm:col-span-2 mt-4">
                                        <label className="text-xs text-brand-text/60">Food / Drink Options</label>
                                        <select
                                            required
                                            name="food"
                                            value={formData.food || ''}
                                            onChange={handleChange}
                                            className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all focus:border-brand-gold sm:text-lg serif-font text-brand-text appearance-none"
                                        >
                                            <option value="">Select Option...</option>
                                            <option value="brunch">Brunch</option>
                                            <option value="food">Food</option>
                                            <option value="drink">Drink</option>
                                            <option value="nothing">Nothing</option>
                                        </select>
                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold">Message</label>
                                <div className="relative group">
                                    <textarea
                                        required
                                        name="message"
                                        rows={4}
                                        className="w-full border-b border-brand-border bg-transparent py-3 text-base outline-none transition-all placeholder:text-brand-text/20 focus:border-brand-gold sm:text-lg serif-font resize-none"
                                        placeholder="Tell us more about your event..."
                                        value={formData.message}
                                        onChange={handleChange}
                                    />
                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-gold transition-all group-focus-within:w-full" />
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <p className="text-center text-[10px] text-brand-text/60 italic tracking-wider">
                                    We will contact you very soon with the price
                                </p>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-text py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-bg shadow-lg transition-all duration-500 hover:bg-brand-gold disabled:opacity-50 sm:py-5 sm:text-xs sm:tracking-[0.3em]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Inquiry'
                                    )}
                                </button>
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

export default PrivateEventInquiryForm;
