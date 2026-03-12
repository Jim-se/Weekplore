import React from 'react';
import { useLanguage } from '../lib/LanguageContext';

const About: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="about-page mx-auto min-h-screen max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <header className="mb-12 text-center sm:mb-20">
        <span className="text-xs uppercase tracking-[0.4em] mb-4 opacity-60 block">{t('about.subtitle', { stripAccents: true })}</span>
        <h1 className="text-6xl md:text-8xl font-bold serif-font mb-8">{t('about.titlePart1')} <span className="italic">{t('about.titlePart2')}</span></h1>
      </header>

      <div className="space-y-12 text-base leading-relaxed opacity-80 sm:space-y-16 sm:text-lg">
        <section className="grid gap-8 md:grid-cols-2 md:gap-12 md:items-center">
          <div>
            <div className="space-y-4">
              <p>
                {t('about.p1')}<br />
                {t('about.p2')}<br /><br />
                {t('about.p3')}<br />
                {t('about.p4')}<br /><br />
                {t('about.p5')}<br />
                {t('about.p6')}<br />
                {t('about.p7')}<br /><br />
                {t('about.p8')}<br /><br />
                {t('about.p9')}<br /><br />
                {t('about.p10')}
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
