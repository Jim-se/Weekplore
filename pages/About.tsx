import React from 'react';
import { useLanguage } from '../lib/LanguageContext';

const About: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="about-page mx-auto min-h-screen max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <header className="mb-12 text-center sm:mb-20">
        <h1 className="text-6xl md:text-8xl font-bold serif-font mb-8">{t('about.titlePart1')} <span className="italic">{t('about.titlePart2')}</span></h1>
      </header>

      <div className="space-y-12 text-base leading-relaxed opacity-80 sm:space-y-16 sm:text-lg">
        <section>
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
