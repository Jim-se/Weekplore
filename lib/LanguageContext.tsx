import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'gr' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    gr: {
        // Navbar
        'nav.home': 'Αρχική',
        'nav.events': 'Εκδηλώσεις',
        'nav.privateEvents': 'Ιδιωτικές Εκδηλώσεις',
        'nav.about': 'Ποιοι Είμαστε',
        'nav.book': 'Κάνε Κράτηση',

        // Home - Hero
        'home.authentic': 'Αυθεντικές Εμπειρίες',
        'home.heroTitle1': 'Η εβδομάδα σου,',
        'home.heroTitle2': 'η απόφαση σου.',
        'home.heroDesc': 'Έχεις ξεμείνει ποτέ από ιδέες για βόλτα ;\nΈχεις βρεθεί να θέλεις να κάνεις κάτι όμορφο αλλά να μην έχεις παρέα ;\nΣτη weekplore κάθε εβδομάδα διοργανώνουμε events και δραστηριότητες που κάνουν τις μέρες σου πιο ζωντανές , χαρούμενες , δημιουργικές - όπως τους αξίζει !',
        'home.viewEvents': 'Δες τις Εκδηλώσεις',
        'home.ourStory': 'Η Ιστορία μας',

        // Home - Ticker
        'home.ticker.outdoor': 'Υπαίθριες Δραστηριότητες',
        'home.ticker.crafts': 'Εργαστήρια Χειροτεχνίας',
        'home.ticker.gastronomy': 'Γαστρονομικές Διαδρομές',

        // Home - Services
        'home.services.title': 'Οι υπηρεσίες μας',
        'home.services.item1': 'Event ανοιχτά σε όλους - Δες το πρόγραμμα μας !',
        'home.services.item2': 'Ιδιωτικά event',
        'home.services.item3': 'Γενέθλια',
        'home.services.item4': 'Graduation day',
        'home.services.item5': 'Επετείους',
        'home.services.item6': 'Προτάσεις γάμου',
        'home.services.item7': 'Gender reveal',

        // Home - Reviews
        'home.reviews.subtitle': 'Ιστορίες Επισκεπτών',
        'home.reviews.title': 'Τι λένε για εμάς',

        // Home - People
        'home.people.subtitle': 'Η Ομάδα',
        'home.people.title': 'Οι Άνθρωποί μας',
        'home.people.desc': 'Οι καρδιές πίσω από τις εμπειρίες',

        // Home - Leave a Review
        'home.feedback.subtitle': 'Σχόλια',
        'home.feedback.title': 'Γράψτε μια Κριτική',
        'home.feedback.desc': 'Η εμπειρία σας έχει σημασία για εμάς',
        'home.feedback.thanks': 'Ευχαριστούμε!',
        'home.feedback.success': 'Η κριτική σας υποβλήθηκε επιτυχώς.',
        'home.feedback.submitAnother': 'Υποβολή άλλης κριτικής',
        'home.feedback.name': 'Όνομα',
        'home.feedback.namePlaceholder': 'Το όνομά σας',
        'home.feedback.email': 'Διεύθυνση Email',
        'home.feedback.rating': 'Βαθμολογία',
        'home.feedback.experience': 'Η Εμπειρία σας',
        'home.feedback.experiencePlaceholder': 'Πείτε μας για το Σαββατοκύριακό σας...',
        'home.feedback.submit': 'Υποβολή Κριτικής',
        'home.feedback.submitting': 'Υποβολή...',
    },
    en: {
        // Navbar
        'nav.home': 'Home',
        'nav.events': 'Events',
        'nav.privateEvents': 'Private Events',
        'nav.about': 'About Us',
        'nav.book': 'Book Now',

        // Home - Hero
        'home.authentic': 'Authentic Experiences',
        'home.heroTitle1': 'Your week,',
        'home.heroTitle2': 'your decision.',
        'home.heroDesc': 'Unique recreational experiences designed for those seeking calm, connection, and small escapes from everyday life.',
        'home.viewEvents': 'View Events',
        'home.ourStory': 'Our Story',

        // Home - Ticker
        'home.ticker.outdoor': 'Outdoor Activities',
        'home.ticker.crafts': 'Craft Workshops',
        'home.ticker.gastronomy': 'Gastronomy Tours',

        // Home - Services
        'home.services.title': 'Our Services',
        'home.services.item1': 'Open events - See our schedule!',
        'home.services.item2': 'Private events',
        'home.services.item3': 'Birthdays',
        'home.services.item4': 'Graduation day',
        'home.services.item5': 'Anniversaries',
        'home.services.item6': 'Marriage proposals',
        'home.services.item7': 'Gender reveal',

        // Home - Reviews
        'home.reviews.subtitle': 'Guest Stories',
        'home.reviews.title': 'What they say about us',

        // Home - People
        'home.people.subtitle': 'The Team',
        'home.people.title': 'Our People',
        'home.people.desc': 'The hearts behind the experiences',

        // Home - Leave a Review
        'home.feedback.subtitle': 'Feedback',
        'home.feedback.title': 'Leave a Review',
        'home.feedback.desc': 'Your experience matters to us',
        'home.feedback.thanks': 'Thank you!',
        'home.feedback.success': 'Your review was submitted successfully.',
        'home.feedback.submitAnother': 'Submit another review',
        'home.feedback.name': 'Name',
        'home.feedback.namePlaceholder': 'Your name',
        'home.feedback.email': 'Email Address',
        'home.feedback.rating': 'Rating',
        'home.feedback.experience': 'Your Experience',
        'home.feedback.experiencePlaceholder': 'Tell us about your weekend...',
        'home.feedback.submit': 'Submit Review',
        'home.feedback.submitting': 'Submitting...',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('gr');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Check if user has explicitly set a preference
        const savedLang = localStorage.getItem('site_language') as Language;
        if (savedLang) {
            setLanguageState(savedLang);
        } else {
            // Auto-detect based on browser language
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('en')) {
                setLanguageState('en');
            }
            // Defaults to 'gr' otherwise
        }
        setIsInitialized(true);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('site_language', lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    // Prevent flash of wrong language text
    if (!isInitialized) return null;

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
