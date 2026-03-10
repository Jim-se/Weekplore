
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, CheckCircle2 } from 'lucide-react';
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
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', start: 5, review: '' });
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
      setReviewForm({ name: '', email: '', start: 5, review: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="home-hero relative flex min-h-[100svh] items-center overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-12 lg:pt-16">
        <div className="mx-auto grid w-full max-w-[1380px] gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
          <div className="home-hero-copy z-10 lg:col-span-7">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="mb-5 inline-flex items-center gap-2 sm:mb-6">
                <span className="h-[1px] w-8 bg-brand-gold sm:w-12"></span>
                <span className="text-[10px] uppercase tracking-[0.5em] text-brand-gold font-bold">Αυθεντικές Εμπειρίες</span>
              </div>
              <h1 className="home-hero-title mb-6 text-5xl font-bold leading-[0.92] tracking-[-0.04em] text-brand-text serif-font sm:mb-8 sm:text-6xl md:text-[78px] lg:text-[88px] xl:text-[96px]">
                Ανακάλυψε τα <br />
                <span className="italic text-brand-terracotta">Σαββατοκύριακά σου.</span>
              </h1>
              <p className="mb-8 max-w-xl text-base font-light leading-relaxed opacity-80 sm:mb-10 sm:text-lg md:max-w-lg md:text-xl">
                Μοναδικές εμπειρίες αναψυχής σχεδιασμένες για όσους αναζητούν ηρεμία, σύνδεση και μικρές αποδράσεις από την καθημερινότητα.
              </p>
              <div className="home-hero-actions flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-6">
                <button
                  onClick={() => onNavigate('events')}
                  className="group relative w-full overflow-hidden rounded-full bg-brand-text px-8 py-4 text-brand-bg transition-all duration-500 hover:shadow-2xl sm:w-auto sm:px-12 sm:py-5"
                >
                  <div className="absolute inset-0 bg-brand-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <span className="relative z-10 uppercase text-xs font-bold tracking-[0.3em]">Δες τις Εκδηλώσεις</span>
                </button>
                <button
                  onClick={() => onNavigate('about')}
                  className="w-full rounded-full border border-brand-text/20 px-8 py-4 text-xs font-bold uppercase tracking-[0.3em] transition-all hover:border-brand-text sm:w-auto sm:px-12 sm:py-5"
                >
                  Η Ιστορία μας
                </button>
              </div>
            </motion.div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-[32rem] xl:max-w-[36rem]">
            <div className="relative z-10 aspect-[3/4] overflow-hidden rounded-[32px] shadow-2xl sm:rounded-[48px] md:rounded-[60px]">
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
              <div className="absolute bottom-5 left-5 z-20 flex gap-2 sm:bottom-8 sm:left-8 sm:gap-3 md:bottom-10 md:left-10">
                {HERO_IMAGES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentHero(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${currentHero === idx ? 'w-8 bg-white sm:w-10' : 'w-2 bg-white/40'
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
            <div className="pointer-events-none absolute -right-8 -top-10 -z-10 h-40 w-40 text-brand-gold/10 sm:-right-12 sm:-top-14 sm:h-56 sm:w-56 md:-right-20 md:-top-20 md:h-80 md:w-80">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Row / Ticker */}
      <section className="overflow-hidden border-y border-brand-border/10 bg-brand-text py-8 text-brand-bg/60 sm:py-12">
        <div className="animate-marquee flex gap-8 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.35em] sm:gap-12 sm:text-xs sm:tracking-[0.6em]">
          {[1, 2, 3, 4].map(i => (
            <React.Fragment key={i}>
              <span className="flex items-center gap-4 text-brand-bg">
                <svg className="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" /></svg>
                Υπαίθριες Δραστηριότητες
              </span>
              <span>•</span>
              <span className="flex items-center gap-4 text-brand-bg">
                <svg className="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" /></svg>
                Εργαστήρια Χειροτεχνίας
              </span>
              <span>•</span>
              <span className="flex items-center gap-4 text-brand-bg">
                <svg className="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" /></svg>
                Γαστρονομικές Διαδρομές
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
        <section className="home-reviews relative overflow-hidden border-b border-brand-border/50 bg-brand-bg/30 py-16 sm:py-24">
          <div className="mx-auto mb-10 max-w-7xl px-4 text-center sm:mb-12 sm:px-6">
            <span className="text-brand-gold font-bold text-[10px] uppercase tracking-[0.4em] mb-2 block">Ιστορίες Επισκεπτών</span>
            <h2 className="text-4xl font-bold serif-font">Τι λένε για εμάς</h2>
          </div>

          <div className="home-reviews-grid mx-auto max-w-7xl px-4 pb-6 sm:px-6 sm:pb-8">
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                className="home-review-card w-full rounded-[28px] border border-brand-border bg-white p-6 text-center shadow-sm transition-all duration-500 hover:shadow-xl sm:rounded-[40px] sm:p-10"
              >
                <div className="mb-6 flex justify-center gap-1">
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
                <div className="flex items-center justify-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-brand-gold text-xs font-bold border border-brand-border">
                    {review.name ? review.name[0].toUpperCase() : review.email[0].toUpperCase()}
                  </div>
                  <div className="text-left flex items-center h-full">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40 block">
                      {review.name || review.email.split('@')[0]}
                    </span>
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
        <section className="home-people overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center sm:mb-20">
              <span className="text-brand-gold font-bold text-[10px] uppercase tracking-[0.4em] mb-4 block">Η Ομάδα</span>
              <h2 className="text-5xl font-bold serif-font mb-4">Οι Άνθρωποί μας</h2>
              <p className="text-brand-text/40 text-sm uppercase tracking-widest font-bold">Οι καρδιές πίσω από τις εμπειρίες</p>
            </div>

            <div className="home-people-grid">
              {people.map((person, i) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="home-person-card group"
                >
                  <div className="relative mb-6 aspect-[4/5] overflow-hidden rounded-[28px] shadow-lg transition-all duration-500 group-hover:shadow-2xl sm:mb-8 sm:rounded-[40px]">
                    <img
                      src={person.photo_link || 'https://picsum.photos/seed/person/400/500'}
                      alt={person.name}
                      className="w-full h-full object-cover transition-all duration-700 scale-100 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-brand-text/80 via-transparent to-transparent p-5 opacity-100 transition-opacity duration-500 sm:p-8 sm:opacity-0 sm:group-hover:opacity-100">
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
      {/*  <section className="home-philosophy mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-24">
          <div className="order-2 lg:order-1 relative">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
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

          <div className="order-1 space-y-8 lg:order-2 lg:space-y-10">
            <span className="text-brand-gold font-bold text-xs uppercase tracking-[0.4em]">Το Ήθος μας</span>
            <h2 className="text-6xl md:text-7xl serif-font italic leading-tight text-brand-text">Η Τέχνη της <br /> Ελληνικής Φιλοξενίας.</h2>
            <div className="space-y-8">
              <div className="flex gap-4 sm:gap-6">
                <div className="text-2xl font-bold serif-font text-brand-gold opacity-30">01</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Αυθεντική Επιμέλεια</h3>
                  <p className="opacity-70 font-light leading-relaxed">Αποφεύγουμε τις τουριστικές παγίδες. Οι εκδηλώσεις μας σας μεταφέρουν σε ιδιωτικά κτήματα, μυστικές παραλίες και ορεινά μονοπάτια που γνωρίζουν μόνο οι ντόπιοι.</p>
                </div>
              </div>
              <div className="flex gap-4 sm:gap-6">
                <div className="text-2xl font-bold serif-font text-brand-gold opacity-30">02</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Βιώσιμος Ρυθμός</h3>
                  <p className="opacity-70 font-light leading-relaxed">Χωρίς βιασύνη. Χωρίς προγράμματα. Εστιάζουμε στη ροή της εμπειρίας, διασφαλίζοντας ότι θα φύγετε πιο γεμάτοι ενέργεια από ό,τι ήρθατε.</p>
                </div>
              </div>
              <div className="flex gap-4 sm:gap-6">
                <div className="text-2xl font-bold serif-font text-brand-gold opacity-30">03</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Πνεύμα Κοινότητας</h3>
                  <p className="opacity-70 font-light leading-relaxed">Κοινά γεύματα και ομαδικές δραστηριότητες σχεδιασμένες να καλλιεργούν γνήσια σύνδεση μεταξύ των εξερευνητών του Σαββατοκύριακου.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>*/}

      {/* Review Section */}
      <section className="home-feedback bg-brand-bg/20 px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center sm:mb-16">
            <span className="text-brand-gold font-bold text-[10px] uppercase tracking-[0.4em] mb-4 block">Σχόλια</span>
            <h2 className="text-5xl font-bold serif-font mb-4">Γράψτε μια Κριτική</h2>
            <p className="text-brand-text/40 text-sm uppercase tracking-widest font-bold">Η εμπειρία σας έχει σημασία για εμάς</p>
          </div>

          <div className="rounded-[28px] border border-brand-border bg-white p-6 shadow-xl sm:rounded-[40px] sm:p-8 md:p-12">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold serif-font mb-2">Ευχαριστούμε!</h3>
                <p className="text-brand-text/60">Η κριτική σας υποβλήθηκε επιτυχώς.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-8 text-brand-gold font-bold uppercase tracking-widest text-[10px] hover:underline"
                >
                  Υποβολή άλλης κριτικής
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Όνομα</label>
                    <input
                      required
                      type="text"
                      value={reviewForm.name}
                      onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                      className="w-full px-0 py-3 bg-transparent border-b border-brand-border outline-none focus:border-brand-gold transition-colors text-lg serif-font"
                      placeholder="Το όνομά σας"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Διεύθυνση Email</label>
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
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Βαθμολογία</label>
                    <div className="flex flex-wrap gap-2 py-2">
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
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-brand-text/40">Η Εμπειρία σας</label>
                  <textarea
                    required
                    value={reviewForm.review}
                    onChange={e => setReviewForm({ ...reviewForm, review: e.target.value })}
                    className="w-full px-0 py-3 bg-transparent border-b border-brand-border outline-none focus:border-brand-gold transition-colors text-lg serif-font min-h-[120px] resize-none"
                    placeholder="Πείτε μας για το Σαββατοκύριακό σας..."
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-12 py-5 bg-brand-text text-brand-bg rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Υποβολή...' : (
                      <>
                        Υποβολή Κριτικής <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .home-hero-copy {
          max-width: 46rem;
        }

        .home-hero-title {
          max-width: 7.7em;
          text-wrap: balance;
        }

        .home-reviews-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
        }

        .home-review-card {
          flex: 1 1 320px;
          max-width: 24rem;
        }

        .home-people-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1.5rem;
        }

        .home-person-card {
          width: 100%;
          max-width: 320px;
        }

        @media (min-width: 640px) {
          .home-reviews-grid {
            gap: 2rem;
          }

          .home-person-card {
            max-width: 340px;
          }
        }

        @media (min-width: 1024px) {
          .home-hero-copy {
            max-width: 44rem;
          }

          .home-hero-title {
            max-width: 7.4em;
          }
        }

        @media (min-width: 1280px) {
          .home-person-card {
            width: calc(25% - 1.5rem);
            min-width: 260px;
            max-width: 320px;
          }
        }

        @media (max-width: 640px) {
          .home-reviews h2,
          .home-people h2,
          .home-feedback h2 {
            font-size: 2rem;
            line-height: 1.05;
          }

          .home-philosophy h2 {
            font-size: 2.75rem;
            line-height: 1;
          }

          .home-philosophy h3 {
            font-size: 1.05rem;
          }

          .home-philosophy p,
          .home-feedback textarea,
          .home-feedback input {
            font-size: 1rem;
          }

          .home-people .group p {
            line-height: 1.5;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
