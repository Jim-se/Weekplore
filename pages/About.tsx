
import React from 'react';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 min-h-screen">
      <header className="text-center mb-20">
        <span className="text-xs uppercase tracking-[0.4em] mb-4 opacity-60 block">Behind the scenes</span>
        <h1 className="text-6xl md:text-8xl font-bold serif-font mb-8">Ποιοι <span className="italic">Είμαστε</span></h1>
      </header>

      <div className="space-y-16 text-lg leading-relaxed opacity-80">
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div>
           {/* <h2 className="text-3xl serif-font mb-4 italic text-brand-text">Born in the Peloponnese</h2> */}
            <div className="space-y-4">
             {/* <p className="font-bold">Ποιοι είμαστε</p> */}
              <p>
                
...φέρε στο νου σου μια στιγμή με την παρέα σου.
Έχετε μαζευτεί όλοι μαζί, παίζετε επιτραπέζια και γελάτε με την ψυχή σας.
Για λίγο, όλα τα προβλήματα της εβδομάδας εξαφανίζονται και η απλότητα της στιγμής μετατρέπεται σε μια από τις πιο πολύτιμες αναμνήσεις. 
Από τέτοιες στιγμές αξίζει να γεμίζουν τα Σαββατοκύριακά μας.
Κι όμως, πόσες φορές έχεις μείνει χωρίς ιδέες ή χωρίς παρέα για το σκ;
Πόσες φορές ένιωσες ότι η καθημερινότητα σε κουράζει τόσο, που κάθε Σαββατοκύριακο περνάει χωρίς να το απολαμβάνεις πραγματικά;
Γι’ αυτό υπάρχει η Weekplore.
Εδώ μπορείς να βρεις δραστηριότητες και events που κάνουν κάθε Σαββατοκύριακο ξεχωριστό!
</p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden aspect-square border border-brand-border">
            <img 
              src="https://images.unsplash.com/photo-1516244102917-740b3c20058b?auto=format&fit=crop&q=80&w=600" 
              alt="Greek Scenery"
              className="w-full h-full object-cover grayscale sepia-[.2]"
            />
          </div>
        </section>

        <section className="bg-brand-text text-brand-bg p-12 rounded-3xl">
          <h2 className="text-4xl serif-font mb-6 italic">The Weekplore Philosophy</h2>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className="font-bold">01.</span>
              <span><strong>Respect the season:</strong> We only host events that make sense for the current weather and environment.</span>
            </li>
            <li className="flex gap-4">
              <span className="font-bold">02.</span>
              <span><strong>Support the locals:</strong> Every picnic basket and every workshop is powered by local producers.</span>
            </li>
            <li className="flex gap-4">
              <span className="font-bold">03.</span>
              <span><strong>Keep it small:</strong> We prefer 10 people having a profound experience over 100 having a generic one.</span>
            </li>
          </ul>
        </section>

        <section className="text-center pt-10">
          <h2 className="text-3xl serif-font mb-6 italic">Want to collaborate?</h2>
          <p className="mb-8">We are always looking for local artisans, farmers, and instructors to join the Weekplore network.</p>
          <a href="mailto:hello@weekplore.gr" className="text-2xl font-bold underline decoration-brand-accent decoration-2 underline-offset-8">
            hello@weekplore.gr
          </a>
        </section>
      </div>
    </div>
  );
};

export default About;
