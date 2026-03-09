
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, PartyPopper, CalendarCheck2, ArrowRight } from 'lucide-react';

const PrivateEvents: React.FC = () => {
  return (
    <div className="private-events-page min-h-screen pb-16 pt-24 sm:pb-20 sm:pt-32">
      {/* Hero Section */}
      <section className="mb-16 px-4 sm:px-6 md:px-12 md:mb-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16"
          >
            <div>
              <span className="text-brand-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Αποκλειστικές Εμπειρίες</span>
              <h1 className="text-5xl md:text-7xl font-bold serif-font leading-[1.1] mb-8">
                Ιδιωτικές & Εταιρικές Εκδηλώσεις
              </h1>
              <p className="text-brand-text/60 text-lg leading-relaxed mb-10 max-w-xl">
                Αναβαθμίστε την επόμενη συγκέντρωσή σας με μια ειδικά διαμορφωμένη εμπειρία. Από εργαστήρια team-building έως ιδιωτικές γιορτές, δημιουργούμε αξέχαστες στιγμές σχεδιασμένες αποκλειστικά για την ομάδα σας.
              </p>
              <button className="flex min-h-11 w-full items-center justify-center gap-3 rounded-full bg-brand-text px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-bg transition-all hover:bg-brand-gold sm:w-auto sm:px-10 sm:py-5">
                Εκδήλωση Ενδιαφέροντος <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] shadow-2xl sm:rounded-[40px]">
              <img
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80"
                alt="Private Event"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="bg-brand-bg/30 px-4 py-16 sm:px-6 sm:py-24 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center sm:mb-20">
            <h2 className="text-4xl font-bold serif-font mb-4">Τι Προσφέρουμε</h2>
            <p className="text-brand-text/40 uppercase tracking-widest text-[10px] font-bold">Προσαρμοσμένο στις ανάγκες σας</p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {[
              {
                icon: <Building2 className="w-8 h-8" />,
                title: "Εταιρικό Team Building",
                desc: "Ενισχύστε τους δεσμούς και πυροδοτήστε τη δημιουργικότητα με τις μοναδικές ομαδικές μας δραστηριότητες σχεδιασμένες για επαγγελματικές ομάδες."
              },
              {
                icon: <PartyPopper className="w-8 h-8" />,
                title: "Ιδιωτικές Γιορτές",
                desc: "Γενέθλια, επέτειοι ή απλά μια ξεχωριστή συνάντηση. Εμείς φροντίζουμε τις λεπτομέρειες ενώ εσείς απολαμβάνετε τη στιγμή."
              },
              {
                icon: <CalendarCheck2 className="w-8 h-8" />,
                title: "Ειδικά Εργαστήρια",
                desc: "Έχετε κάποιο συγκεκριμένο θέμα στο μυαλό σας; Μπορούμε να προσαρμόσουμε οποιαδήποτε από τις υπάρχουσες εμπειρίες μας ή να δημιουργήσουμε κάτι εντελώς νέο."
              }
            ].map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-[28px] border border-brand-border bg-white p-6 shadow-sm transition-all hover:shadow-xl sm:rounded-[40px] sm:p-10"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-gold mb-8 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold serif-font mb-4">{service.title}</h3>
                <p className="text-brand-text/60 text-sm leading-relaxed">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-4 py-20 sm:px-6 sm:py-32 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <Users className="w-12 h-12 text-brand-gold mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold serif-font mb-8">Είστε έτοιμοι να σχεδιάσετε την εκδήλωσή σας;</h2>
          <p className="text-brand-text/60 text-lg mb-12">
            Επικοινωνήστε με την ομάδα εκδηλώσεών μας σήμερα για να συζητήσετε τις απαιτήσεις σας και να λάβετε μια εξατομικευμένη πρόταση.
          </p>
          <a
            href="mailto:events@weekplore.com"
            className="inline-block px-12 py-6 bg-brand-gold text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-brand-text transition-all shadow-xl"
          >
            Επικοινωνήστε Μαζί μας
          </a>
        </div>
      </section>

      <style>{`
        @media (max-width: 640px) {
          .private-events-page h1 {
            font-size: 2.75rem;
            line-height: 1;
          }

          .private-events-page h2 {
            font-size: 2rem;
            line-height: 1.05;
          }
        }
      `}</style>
    </div>
  );
};

export default PrivateEvents;
