
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, PartyPopper, CalendarCheck2, ArrowRight } from 'lucide-react';

const PrivateEvents: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* Hero Section */}
      <section className="px-6 md:px-12 mb-20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <span className="text-brand-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Exclusive Experiences</span>
              <h1 className="text-5xl md:text-7xl font-bold serif-font leading-[1.1] mb-8">
                Private & Corporate Events
              </h1>
              <p className="text-brand-text/60 text-lg leading-relaxed mb-10 max-w-xl">
                Elevate your next gathering with a custom-tailored experience. From team-building workshops to private celebrations, we create unforgettable moments designed specifically for your group.
              </p>
              <button className="px-10 py-5 bg-brand-text text-brand-bg rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold transition-all flex items-center gap-3">
                Inquire Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl">
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
      <section className="px-6 md:px-12 py-24 bg-brand-bg/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold serif-font mb-4">What We Offer</h2>
            <p className="text-brand-text/40 uppercase tracking-widest text-[10px] font-bold">Tailored to your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Building2 className="w-8 h-8" />,
                title: "Corporate Team Building",
                desc: "Strengthen bonds and spark creativity with our unique group activities designed for professional teams."
              },
              {
                icon: <PartyPopper className="w-8 h-8" />,
                title: "Private Celebrations",
                desc: "Birthdays, anniversaries, or just a special get-together. We handle the details while you enjoy the moment."
              },
              {
                icon: <CalendarCheck2 className="w-8 h-8" />,
                title: "Custom Workshops",
                desc: "Have a specific theme in mind? We can customize any of our existing experiences or create something entirely new."
              }
            ].map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-10 rounded-[40px] border border-brand-border shadow-sm hover:shadow-xl transition-all group"
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
      <section className="px-6 md:px-12 py-32">
        <div className="max-w-3xl mx-auto text-center">
          <Users className="w-12 h-12 text-brand-gold mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold serif-font mb-8">Ready to plan your event?</h2>
          <p className="text-brand-text/60 text-lg mb-12">
            Contact our events team today to discuss your requirements and receive a personalized proposal.
          </p>
          <a 
            href="mailto:events@weekplore.com" 
            className="inline-block px-12 py-6 bg-brand-gold text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-brand-text transition-all shadow-xl"
          >
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
};

export default PrivateEvents;
