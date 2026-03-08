
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Send, CheckCircle2 } from 'lucide-react';
import { eventService } from '../services/eventService';

interface HomeProps {
  onNavigate: (page: string) => void;
}

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1544551763-47a0159f963f?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=1000"
];

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [currentHero, setCurrentHero] = useState(0);
  const [reviewForm, setReviewForm] = useState({ email: '', start: 5, review: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsData, peopleData] = await Promise.all([
          eventService.getVisibleReviews(),
          eventService.getPeople()
        ]);
        setVisibleReviews(reviewsData);
        setPeople(peopleData);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    fetchData();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await eventService.createReview(reviewForm);
      setSubmitted(true);
      setReviewForm({ email: '', start: 5, review: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden px-6 pt-12 pb-24">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 z-10">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="w-12 h-[1px] bg-brand-gold"></span>
                <span className="text-[10px] uppercase tracking-[0.5em] text-brand-gold font-bold">Kalamata, Greece</span>
              </div>
              <h1 className="text-7xl md:text-[120px] font-bold serif-font leading-[0.85] mb-8 text-brand-text tracking-tighter">
                Explore your <br />
                <span className="italic text-brand-terracotta">Weekends.</span>
              </h1>
              <p className="max-w-lg text-xl opacity-80 mb-10 leading-relaxed font-light">
                Elevated recreational experiences in the heart of Messinia. We curate moments of tranquility and adventure for the modern explorer.
              </p>
              <div className="flex flex-wrap gap-6">
                <button
                  onClick={() => onNavigate('events')}
                  className="group relative px-12 py-5 bg-brand-text text-brand-bg overflow-hidden transition-all duration-500 hover:shadow-2xl rounded-full"
                >
                  <div className="absolute inset-0 bg-brand-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <span className="relative z-10 uppercase text-xs font-bold tracking-[0.3em]">Discover Events</span>
                </button>
                <button
                  onClick={() => onNavigate('about')}
                  className="px-12 py-5 border border-brand-text/20 hover:border-brand-text uppercase text-xs font-bold tracking-[0.3em] transition-all rounded-full"
                >
                  Our Story
                </button>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative z-10 aspect-[3/4] rounded-[60px] overflow-hidden shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentHero}
                  src={HERO_IMAGES[currentHero]}
                  alt="Weekplore Experience"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Carousel Controls */}
              <div className="absolute bottom-10 left-10 flex gap-3 z-20">
                {HERO_IMAGES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentHero(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${currentHero === idx ? 'w-10 bg-white' : 'w-2 bg-white/40'
                      }`}
                  />
                ))}
              </div>
            </div>

            <div className="absolute -bottom-10 -left-10 z-20 aspect-square w-48 rounded-3xl overflow-hidden shadow-xl -rotate-6 hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=600"
                alt="Wine"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Background Decorative Spark */}
            <div className="absolute -top-20 -right-20 w-80 h-80 text-brand-gold/10 pointer-events-none -z-10">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Row / Ticker */}
      <section className="bg-brand-text py-12 text-brand-bg/60 overflow-hidden border-y border-brand-border/10">
        <div className="flex whitespace-nowrap animate-marquee gap-12 text-xs uppercase tracking-[0.6em] font-bold">
          {[1, 2, 3, 4].map(i => (
            <React.Fragment key={i}>
              <span className="flex items-center gap-4 text-brand-bg">
                <svg className="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" /></svg>
                Outdoor Pursuits
              </span>
              <span>•</span>
              <span className="flex items-center gap-4 text-brand-bg">
                <svg className="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" /></svg>
                Artisan Workshops
              </span>
              <span>•</span>
              <span className="flex items-center gap-4 text-brand-bg">
                <svg className="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" /></svg>
                Culinary Journeys
              </span>
              <span>•</span>
            </React.Fragment>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: inline-flex;
            animation: marquee 30s linear infinite;
            width: max-content;
          }
          .animate-marquee-slow {
            display: inline-flex;
            animation: marquee 60s linear infinite;
            width: max-content;
          }
          .animate-marquee-slow:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* Reviews Section */}
      {visibleReviews.length > 0 && (
        <section className="py-24 bg-brand-bg/30 border-b border-brand-border/50 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
            <span className="text-brand-gold font-bold text-[10px] uppercase tracking-[0.4em] mb-2 block">Guest Stories</span>
            <h2 className="text-4xl font-bold serif-font">What they say about us</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-8 px-6 pb-8">
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1.5rem)] max-w-[400px] bg-white p-10 rounded-[40px] border border-brand-border shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-3.5 h-3.5 ${starIdx < review.start ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'}`}
                    />
                  ))}
                </div>
                <p className="text-base text-brand-text/70 italic leading-relaxed mb-8">
                  "{review.review}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-brand-gold text-xs font-bold border border-brand-border">
                    {review.email[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40 block">
                      {review.email.split('@')[0]}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-brand-gold font-bold">Verified Guest</span>
                  </div>
                </div>
              </div>
            ))}
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
        </section>
      )}

      {/* Our People Section */}
      {people.length > 0 && (
        <section className="py-32 px-6 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-brand-gold font-bold text-[10px] uppercase tracking-[0.4em] mb-4 block">The Team</span>
              <h2 className="text-5xl font-bold serif-font mb-4">Our People</h2>
              <p className="text-brand-text/40 text-sm uppercase tracking-widest font-bold">The hearts behind the experiences</p>
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              {people.map((person, i) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] max-w-[300px]"
                >
                  <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden mb-8 shadow-lg group-hover:shadow-2xl transition-all duration-500">
                    <img
                      src={person.photo_link || 'https://picsum.photos/seed/person/400/500'}
                      alt={person.name}
                      className="w-full h-full object-cover transition-all duration-700 scale-100 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-text/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                      <p className="text-white text-xs leading-relaxed font-light">
                        {person.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold serif-font mb-1">{person.name}</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-gold">
                      {person.description.split('.')[0]}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Philosophy Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-square bg-brand-terracotta/10 rounded-3xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[4/5] bg-brand-gold/10 rounded-3xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1544551763-47a0159f963f?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="pt-12 space-y-4">
                <div className="aspect-[3/4] bg-brand-sage/10 rounded-3xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1516244102917-740b3c20058b?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square bg-brand-text/5 rounded-3xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-10">
            <span className="text-brand-gold font-bold text-xs uppercase tracking-[0.4em]">Our Ethos</span>
            <h2 className="text-6xl md:text-7xl serif-font italic leading-tight text-brand-text">The Art of <br /> Greek Leisure.</h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="text-2xl font-bold serif-font text-brand-gold opacity-30">01</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Curated Authenticity</h3>
                  <p className="opacity-70 font-light leading-relaxed">We skip the tourist traps. Our events take you into private estates, secret beaches, and mountain trails known only to locals.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-2xl font-bold serif-font text-brand-gold opacity-30">02</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Sustainable Pace</h3>
                  <p className="opacity-70 font-light leading-relaxed">No rushing. No schedules. We focus on the flow of the experience, ensuring you leave more energized than when you arrived.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-2xl font-bold serif-font text-brand-gold opacity-30">03</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Communal Spirit</h3>
                  <p className="opacity-70 font-light leading-relaxed">Shared meals and group activities designed to foster genuine connection among like-minded weekend explorers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Review Section */}
      <section className="py-32 px-6 bg-brand-bg/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-brand-gold font-bold text-[10px] uppercase tracking-[0.4em] mb-4 block">Feedback</span>
            <h2 className="text-5xl font-bold serif-font mb-4">Leave a Review</h2>
            <p className="text-brand-text/40 text-sm uppercase tracking-widest font-bold">Your experience matters to us</p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[40px] border border-brand-border shadow-xl">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold serif-font mb-2">Thank You!</h3>
                <p className="text-brand-text/60">Your review has been submitted and is pending moderation.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-8 text-brand-gold font-bold uppercase tracking-widest text-[10px] hover:underline"
                >
                  Submit another review
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Email Address</label>
                    <input
                      required
                      type="email"
                      value={reviewForm.email}
                      onChange={e => setReviewForm({ ...reviewForm, email: e.target.value })}
                      className="w-full px-0 py-3 bg-transparent border-b border-brand-border outline-none focus:border-brand-gold transition-colors text-lg serif-font"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Rating</label>
                    <div className="flex gap-2 py-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, start: star })}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${star <= reviewForm.start ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Your Experience</label>
                  <textarea
                    required
                    value={reviewForm.review}
                    onChange={e => setReviewForm({ ...reviewForm, review: e.target.value })}
                    className="w-full px-0 py-3 bg-transparent border-b border-brand-border outline-none focus:border-brand-gold transition-colors text-lg serif-font min-h-[120px] resize-none"
                    placeholder="Tell us about your weekend..."
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-12 py-5 bg-brand-text text-brand-bg rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : (
                      <>
                        Submit Review <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
