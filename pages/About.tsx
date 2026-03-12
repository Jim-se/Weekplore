
import React from 'react';

const About: React.FC = () => {
  return (
    <div className="about-page mx-auto min-h-screen max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <header className="mb-12 text-center sm:mb-20">
        <span className="text-xs uppercase tracking-[0.4em] mb-4 opacity-60 block">Πίσω από τις κάμερες</span>
        <h1 className="text-6xl md:text-8xl font-bold serif-font mb-8">Ποιοι <span className="italic">Είμαστε</span></h1>
      </header>

      <div className="space-y-12 text-base leading-relaxed opacity-80 sm:space-y-16 sm:text-lg">
        <section className="grid gap-8 md:grid-cols-2 md:gap-12 md:items-center">
          <div>
            {/* <h2 className="text-3xl serif-font mb-4 italic text-brand-text">Born in the Peloponnese</h2> */}
            <div className="space-y-4">
              <p>
                Η ζωή δεν είναι μόνο υποχρεώσεις.<br />
                Είναι όλες εκείνες οι στιγμές στο ενδιάμεσο.<br /><br />
                Σκέψου για λίγο μια στιγμή με την παρέα σου. Κάποιος λέει κάτι αστείο και ξαφνικά όλοι ξεσπάτε σε γέλια που αντηχούν γύρω, τόσο δυνατά που νιώθεις το στομάχι σου να σφίγγεται από την ευτυχία.<br />
                Για λίγο, υπάρχει μόνο το τώρα. Το γέλιο σας, η αίσθηση της ελευθερίας και της σύνδεσης μεταξύ σας. Κι όταν κοιτάζεις γύρω, καταλαβαίνεις ότι αυτές οι στιγμές είναι οι μικρές χαρές της ζωής που μένουν για πάντα μέσα σου.<br /><br />
                Κι όμως, μέσα στο τρέξιμο της καθημερινότητας, αυτές οι στιγμές συχνά χάνονται.<br />
                Μερικές φορές είμαστε πολύ κουρασμένοι για να οργανώσουμε κάτι όμορφο. Άλλες φορές θέλουμε να δοκιμάσουμε μια εμπειρία, αλλά δεν βρίσκουμε την παρέα που θα έρθει μαζί μας.<br />
                Και κάπως έτσι, αφήνουμε τις μικρές χαρές της ζωής να περνούν.<br /><br />
                Για αυτό είμαστε εμείς εδώ, για να σου θυμίζουμε ότι κάθε εβδομάδα μπορεί να γίνει πιο ζωντανή, πιο δημιουργική, πιο χαρούμενη. Κάθε δραστηριότητα μπορεί να φέρει γέλιο, χαρά και εκείνη την αίσθηση που ξυπνάει μέσα σου την παιδική αθωότητα και τη ζωντάνια.<br /><br />
                Κάθε event που διοργανώνουμε είναι μια ευκαιρία να γελάσεις με την ψυχή σου, να γνωρίσεις κόσμο, να δοκιμάσεις κάτι νέο και να ζήσεις μια στιγμή που θα μείνει στη μνήμη σου!<br /><br />
                Γιατί τελικά, η ζωή είναι όλες εκείνες οι στιγμές που επιλέγουμε να ζήσουμε, όσο κι αν ο κόσμος γύρω μας τρέχει.
              </p>
            </div>
          </div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-brand-border">
            <img
              src="https://images.unsplash.com/photo-1516244102917-740b3c20058b?auto=format&fit=crop&q=80&w=600"
              alt="Greek Scenery"
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        <section className="rounded-3xl bg-brand-text p-6 text-brand-bg sm:p-12">
          <h2 className="text-4xl serif-font mb-6 italic">Η Φιλοσοφία της Weekplore</h2>
          <ul className="space-y-4">
            <li className="flex gap-3 sm:gap-4">
              <span className="font-bold">01.</span>
              <span><strong>Σεβασμός στην εποχή:</strong> Φιλοξενούμε μόνο εκδηλώσεις που ταιριάζουν με τον τρέχοντα καιρό και το περιβάλλον.</span>
            </li>
            <li className="flex gap-3 sm:gap-4">
              <span className="font-bold">02.</span>
              <span><strong>Στήριξη στους ντόπιους:</strong> Κάθε καλάθι πικνίκ και κάθε εργαστήριο υποστηρίζεται από τοπικούς παραγωγούς.</span>
            </li>
            <li className="flex gap-3 sm:gap-4">
              <span className="font-bold">03.</span>
              <span><strong>Μείνετε σε μικρές ομάδες:</strong> Προτιμάμε 10 άτομα να έχουν μια βαθιά εμπειρία παρά 100 να έχουν μια συνηθισμένη.</span>
            </li>
          </ul>
        </section>

        <section className="pt-6 text-center sm:pt-10">
          <h2 className="text-3xl serif-font mb-6 italic">Θέλετε να συνεργαστούμε;</h2>
          <p className="mb-8">Αναζητούμε πάντα τοπικούς τεχνίτες, αγρότες και εκπαιδευτές για να γίνουν μέλη του δικτύου της Weekplore.</p>
          <a href="mailto:hello@weekplore.gr" className="text-2xl font-bold underline decoration-brand-accent decoration-2 underline-offset-8">
            hello@weekplore.gr
          </a>
        </section>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .about-page h1 {
            font-size: 2.75rem;
            line-height: 0.95;
          }

          .about-page h2 {
            font-size: 1.9rem;
            line-height: 1.05;
          }
        }
      `}</style>
    </div>
  );
};

export default About;
