import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'gr' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, any>) => string;
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

        // Common
        'common.soldOut': 'Εξαντλήθηκε',
        'common.deadline': 'Προθεσμία',
        'common.availableShifts': 'Διαθέσιμες Ώρες',
        'common.invalidDate': 'Μη έγκυρη ημερομηνία',
        'common.bookNow': 'Κάνε Κράτηση',
        'common.success': 'Ευχαριστούμε {name}! Η κράτησή σας για το {title} επιβεβαιώθηκε.',
        'common.error': 'Υπήρξε ένα σφάλμα κατά την επεξεργασία της κράτησής σας. Παρακαλώ δοκιμάστε ξανά.',
        'common.available': 'Διαθέσιμο',
        'common.free': 'Δωρεάν',

        // Footer
        'footer.tagline': 'Δημιουργούμε εμπειρίες, ένα Σαββατοκύριακο τη φορά.',
        'footer.admin': 'Διαχείριση',

        // Events
        'events.title': 'Upcoming Events',
        'events.desc': 'Ψάχνεις πώς να διασκεδάσεις αυτή την εβδομάδα;\nΣτη weekplore διοργανώνουμε events και δραστηριότητες που κάνουν τις μέρες σου πιο ζωντανές, χαρούμενες, δημιουργικές - όπως τους αξίζει!',

        // Private Events
        'private.title': 'Private Events',
        'private.desc1': 'Θέλεις να διοργανώσεις ένα ιδιωτικό event; Δημιούργησε το δικό σου ή εμπνεύσου από κάποια από τις ιδέες μας.',
        'private.desc2': 'Η ομάδα μας θα εξετάσει προσεκτικά όλα τα στοιχεία που θα μας δώσεις και θα επανέλθει με προτάσεις ειδικά για εσένα, τις οποίες θα σου παρουσιάσουμε μέσω κλήσης.',
        'private.desc3': 'Στόχος μας είναι να σχεδιάσουμε μαζί τη μέρα σου ακριβώς όπως τη φαντάστηκες – με κάθε λεπτομέρεια να αποτυπώνει την προσωπική σου αισθητική και όσα έχεις ονειρευτεί.',

        // About
        'about.subtitle': 'Πίσω από τις κάμερες',
        'about.titlePart1': 'Ποιοι',
        'about.titlePart2': 'Είμαστε',
        'about.p1': 'Η ζωή δεν είναι μόνο υποχρεώσεις.',
        'about.p2': 'Είναι όλες εκείνες οι στιγμές στο ενδιάμεσο.',
        'about.p3': 'Σκέψου για λίγο μια στιγμή με την παρέα σου. Κάποιος λέει κάτι αστείο και ξαφνικά όλοι ξεσπάτε σε γέλια που αντηχούν γύρω, τόσο δυνατά που νιώθεις το στομάχι σου να σφίγγεται από την ευτυχία.',
        'about.p4': 'Για λίγο, υπάρχει μόνο το τώρα. Το γέλιο σας, η αίσθηση της ελευθερίας και της σύνδεσης μεταξύ σας. Κι όταν κοιτάζεις γύρω, καταλαβαίνεις ότι αυτές οι στιγμές είναι οι μικρές χαρές της ζωής που μένουν για πάντα μέσα σου.',
        'about.p5': 'Κι όμως, μέσα στο τρέξιμο της καθημερινότητας, αυτές οι στιγμές συχνά χάνονται.',
        'about.p6': 'Μερικές φορές είμαστε πολύ κουρασμένοι για να οργανώσουμε κάτι όμορφο. Άλλες φορές θέλουμε να δοκιμάσουμε μια εμπειρία, αλλά δεν βρίσκουμε την παρέα που θα έρθει μαζί μας.',
        'about.p7': 'Και κάπως έτσι, αφήνουμε τις μικρές χαρές της ζωής να περνούν.',
        'about.p8': 'Για αυτό είμαστε εμείς εδώ, για να σου θυμίζουμε ότι κάθε εβδομάδα μπορεί να γίνει πιο ζωντανή, πιο δημιουργική, πιο χαρούμενη. Κάθε δραστηριότητα μπορεί να φέρει γέλιο, χαρά και εκείνη την αίσθηση που ξυπνάει μέσα σου την παιδική αθωότητα και τη ζωντάνια.',
        'about.p9': 'Κάθε event που διοργανώνουμε είναι μια ευκαιρία να γελάσεις με την ψυχή σου, να γνωρίσεις κόσμο, να δοκιμάσεις κάτι νέο και να ζήσεις μια στιγμή που θα μείνει στη μνήμη σου!',
        'about.p10': 'Γιατί τελικά, η ζωή είναι όλες εκείνες οι στιγμές που επιλέγουμε να ζήσουμε, όσο κι αν ο κόσμος γύρω μας τρέχει.',

        // Event Detail
        'detail.notFound': 'Η εκδήλωση δεν βρέθηκε',
        'detail.backToCollection': 'Επιστροφή στη Συλλογή',
        'detail.bookingDeadline': 'Προθεσμία Κράτησης',
        'detail.deadlineDesc': 'Οι κρατήσεις πρέπει να ολοκληρωθούν μέχρι αυτή την ημερομηνία για να διασφαλιστεί η διαθεσιμότητα.',
        'detail.meetingPoint': 'Σημείο Συνάντησης',
        'detail.meetingDesc': 'Λεπτομερείς οδηγίες θα σταλούν μετά την επιβεβαίωση.',
        'detail.pricePerPerson': 'Τιμή ανά άτομο',
        'detail.securePayment': 'Ασφαλής πληρωμή • Άμεση επιβεβαίωση',

        // Booking Modal
        'booking.title': 'Κράτηση',
        'booking.step1': '1. Επιλέξτε Ώρα',
        'booking.step2': '2. Προσωπικά στοιχεία',
        'booking.step3': '3. Επιλογές για κάθε άτομο',
        'booking.fullName': 'Ονοματεπώνυμο',
        'booking.phone': 'Αριθμός Τηλεφώνου',
        'booking.email': 'Διεύθυνση Email',
        'booking.numOfPeople': 'Αριθμός Επισκεπτών',
        'booking.howMany': 'Πόσα άτομα;',
        'booking.guest': 'Επισκέπτης',
        'booking.selection': 'επιλογή',
        'booking.summary': 'Σύνοψη Επιλογής',
        'booking.total': 'Συνολικό Ποσό',
        'booking.processing': 'Επεξεργασία...',
        'booking.confirm': 'Επιβεβαίωση Κράτησης',
        'booking.plural.guest': 'Επισκέπτης',
        'booking.plural.guests': 'Επισκέπτες',

        // Private Event Form
        'inquiry.title': 'Εκδήλωση Ενδιαφέροντος',
        'inquiry.subtitle': 'Παρακαλώ δώστε μερικές λεπτομέρειες',
        'inquiry.yourDetails': 'Τα Στοιχεία σας',
        'inquiry.firstName': 'Όνομα',
        'inquiry.lastName': 'Επώνυμο',
        'inquiry.email': 'Διεύθυνση Email',
        'inquiry.phone': 'Αριθμός Τηλεφώνου',
        'inquiry.eventDetails': 'Λεπτομέρειες Εκδήλωσης',
        'inquiry.approxDate': 'Προσεγγιστική Ημερομηνία',
        'inquiry.numOfGuests': 'Αριθμός Καλεσμένων',
        'inquiry.area': 'Περιοχή / Τοποθεσία',
        'inquiry.setting': 'Χώρος',
        'inquiry.selectSetting': 'Επιλέξτε Χώρο...',
        'inquiry.outdoor': 'Εξωτερικός',
        'inquiry.indoor': 'Εσωτερικός',
        'inquiry.both': 'Και τα δύο',
        'inquiry.budget': 'Budget Διακόσμησης',
        'inquiry.includeActivity': 'Συμπερίληψη δραστηριότητας',
        'inquiry.activityDesc': 'Περιγράψτε τη δραστηριότητα...',
        'inquiry.foodOptions': 'Επιλογές Φαγητού / Ποτού',
        'inquiry.selectOption': 'Επιλέξτε...',
        'inquiry.brunch': 'Brunch',
        'inquiry.food': 'Φαγητό',
        'inquiry.drink': 'Ποτό',
        'inquiry.nothing': 'Τίποτα',
        'inquiry.message': 'Μήνυμα',
        'inquiry.messagePlaceholder': 'Πείτε μας περισσότερα για την εκδήλωσή σας...',
        'inquiry.contactSoon': 'Θα επικοινωνήσουμε μαζί σας πολύ σύντομα με την τιμή',
        'inquiry.submit': 'Υποβολή Ενδιαφέροντος',

        // Private Events View
        'private.createYourOwn': 'Δημιουργήστε το δικό σας',
        'private.createYourOwnDesc': 'Πείτε μας τι θέλετε να οργανώσετε και θα διαμορφώσουμε μια ιδιωτική εμπειρία γύρω από την ομάδα σας, το χρόνο και τη διάθεσή σας.',
        'private.loadError': 'Δεν ήταν δυνατή η φόρτωση των ιδιωτικών εκδηλώσεων αυτή τη στιγμή.',
        'private.success': 'Ευχαριστούμε για το ενδιαφέρον σας! Θα επικοινωνήσουμε μαζί σας πολύ σύντομα με την τιμή.',
        'private.inquire': 'Εκδήλωση Ενδιαφέροντος',
        'private.privateLabel': 'Ιδιωτικό',
        'private.customLabel': 'Bespoke',
        'private.placeholderDesc': 'Λεπτομέρειες για την ιδιωτική εκδήλωση θα προστεθούν εδώ από τον διαχειριστή.',
        'private.existingLabel': 'ΕΤΟΙΜΕΣ ΕΚΔΗΛΩΣΕΙΣ',
        'private.existingDesc': 'Εξερευνήστε το πακέτο των ήδη σχεδιασμένων εκδηλώσεών μας που μπορείτε να κλείσετε άμεσα για την ομάδα σας.',
        'private.seeExisting': 'ΔΕΙΤΕ ΤΙΣ ΕΚΔΗΛΩΣΕΙΣ',
        'private.or': 'ή',
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

        // Common
        'common.soldOut': 'Sold Out',
        'common.deadline': 'Deadline',
        'common.availableShifts': 'Available Shifts',
        'common.invalidDate': 'Invalid date',
        'common.bookNow': 'Book Now',
        'common.success': 'Thank you {name}! Your booking for {title} has been confirmed.',
        'common.error': 'There was an error processing your booking. Please try again.',
        'common.available': 'Available',
        'common.free': 'Free',

        // Footer
        'footer.tagline': 'Creating experiences, one weekend at a time.',
        'footer.admin': 'Admin',

        // Events
        'events.title': 'Upcoming Events',
        'events.desc': 'Looking for ways to have fun this week?\nAt weekplore, we organize events and activities that make your days more vibrant, joyful, and creative - just as they deserve!',

        // Private Events
        'private.title': 'Private Events',
        'private.desc1': 'Do you want to organize a private event? Create your own or get inspired by some of our ideas.',
        'private.desc2': 'Our team will carefully review all the information you provide and return with suggestions specifically for you, which we will present to you via a call.',
        'private.desc3': 'Our goal is to design your day together exactly as you imagined it – with every detail reflecting your personal aesthetic and what you have dreamed of.',

        // About
        'about.subtitle': 'Behind the scenes',
        'about.titlePart1': 'Who',
        'about.titlePart2': 'We Are',
        'about.p1': 'Life is not just obligations.',
        'about.p2': 'It is all those moments in between.',
        'about.p3': 'Think for a moment about a time with your group. Someone says something funny and suddenly you all burst into laughter that echoes around, so loud that you feel your stomach tighten with happiness.',
        'about.p4': 'For a while, there is only now. Your laughter, the sense of freedom and connection between you. And when you look around, you understand that these moments are the small joys of life that stay inside you forever.',
        'about.p5': 'And yet, in the rush of everyday life, these moments are often lost.',
        'about.p6': 'Sometimes we are too tired to organize something beautiful. Other times we want to try an experience, but we can\'t find the group to come with us.',
        'about.p7': 'And just like that, we let the small joys of life pass by.',
        'about.p8': 'That\'s why we are here, to remind you that every week can become more vibrant, more creative, more joyful. Every activity can bring laughter, joy, and that feeling that wakes up your childhood innocence and vitality.',
        'about.p9': 'Every event we organize is an opportunity to laugh with your soul, to meet people, to try something new, and to live a moment that will stay in your memory!',
        'about.p10': 'After all, life is all those moments we choose to live, no matter how fast the world around us is running.',

        // Event Detail
        'detail.notFound': 'Event not found',
        'detail.backToCollection': 'Back to Collection',
        'detail.bookingDeadline': 'Booking Deadline',
        'detail.deadlineDesc': 'Bookings must be completed by this date to ensure availability.',
        'detail.meetingPoint': 'Meeting Point',
        'detail.meetingDesc': 'Detailed instructions will be sent after confirmation.',
        'detail.pricePerPerson': 'Price per person',
        'detail.securePayment': 'Secure payment • Instant confirmation',

        // Booking Modal
        'booking.title': 'Booking',
        'booking.step1': '1. Select Time',
        'booking.step2': '2. Personal Info',
        'booking.step3': '3. Options per person',
        'booking.fullName': 'Full Name',
        'booking.phone': 'Phone Number',
        'booking.email': 'Email Address',
        'booking.numOfPeople': 'Number of Guests',
        'booking.howMany': 'How many people?',
        'booking.guest': 'Guest',
        'booking.selection': 'selection',
        'booking.summary': 'Selection Summary',
        'booking.total': 'Total Amount',
        'booking.processing': 'Processing...',
        'booking.confirm': 'Confirm Booking',
        'booking.plural.guest': 'Guest',
        'booking.plural.guests': 'Guests',

        // Private Event Form
        'inquiry.title': 'Inquiry',
        'inquiry.subtitle': 'Please provide some details',
        'inquiry.yourDetails': 'Your Details',
        'inquiry.firstName': 'First Name',
        'inquiry.lastName': 'Last Name',
        'inquiry.email': 'Email Address',
        'inquiry.phone': 'Phone Number',
        'inquiry.eventDetails': 'Event Details',
        'inquiry.approxDate': 'Approximate Date',
        'inquiry.numOfGuests': 'Number of guests',
        'inquiry.area': 'Area / Location',
        'inquiry.setting': 'Setting',
        'inquiry.selectSetting': 'Select Setting...',
        'inquiry.outdoor': 'Outdoor',
        'inquiry.indoor': 'Indoor',
        'inquiry.both': 'Both',
        'inquiry.budget': 'Decoration Budget',
        'inquiry.includeActivity': 'Include activity',
        'inquiry.activityDesc': 'Describe the activity...',
        'inquiry.foodOptions': 'Food / Drink Options',
        'inquiry.selectOption': 'Select Option...',
        'inquiry.brunch': 'Brunch',
        'inquiry.food': 'Food',
        'inquiry.drink': 'Drink',
        'inquiry.nothing': 'Nothing',
        'inquiry.message': 'Message',
        'inquiry.messagePlaceholder': 'Tell us more about your event...',
        'inquiry.contactSoon': 'We will contact you very soon with the price',
        'inquiry.submit': 'Submit Inquiry',

        // Private Events View
        'private.createYourOwn': 'Create your own',
        'private.createYourOwnDesc': 'Tell us what you want to organize and we will shape a private experience around your group, timing, and vibe.',
        'private.loadError': 'Could not load private events right now.',
        'private.success': 'Thank you for your inquiry! We will contact you very soon with the price.',
        'private.inquire': 'Inquire',
        'private.privateLabel': 'Private',
        'private.customLabel': 'Custom',
        'private.placeholderDesc': 'Custom private event details will be added here by the admin.',
        'private.existingLabel': 'SET UP EVENTS',
        'private.existingDesc': 'Explore our range of pre-designed events that you can book instantly for your group.',
        'private.seeExisting': 'SEE EVENTS',
        'private.or': 'or',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const removeGreekAccents = (text: string): string => {
    const accentsMap: Record<string, string> = {
        'Ά': 'Α', 'Έ': 'Ε', 'Ή': 'Η', 'Ί': 'Ι', 'Ό': 'Ο', 'Ύ': 'Υ', 'Ώ': 'Ω',
        'ά': 'α', 'έ': 'ε', 'ή': 'η', 'ί': 'ι', 'ό': 'ο', 'ύ': 'υ', 'ώ': 'ω',
        'ΐ': 'ι', 'ΰ': 'υ',
        'Ϊ': 'Ι', 'Ϋ': 'Υ', 'ϊ': 'ι', 'ϋ': 'υ'
    };
    return text.split('').map(char => accentsMap[char] || char).join('');
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('gr');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Check if user has explicitly set a preference
        const savedLang = localStorage.getItem('site_language') as Language;
        let activeLang: Language = 'gr';
        
        if (savedLang) {
            activeLang = savedLang;
        } else {
            // Auto-detect based on browser language
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('en')) {
                activeLang = 'en';
            }
        }
        
        setLanguageState(activeLang);
        document.documentElement.lang = activeLang === 'gr' ? 'el' : 'en';
        setIsInitialized(true);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('site_language', lang);
        document.documentElement.lang = lang === 'gr' ? 'el' : 'en';
    };

    const t = (key: string, params?: Record<string, any>): string => {
        let text = translations[language][key] || key;
        
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, v);
            });
        }

        // Apply accent removal for Greek if params.ui (UI elements like buttons/headers) 
        // or just rely on browser lang="el" + text-transform: uppercase.
        // However, some fonts or components might need manual stripping.
        if (language === 'gr' && params?.stripAccents) {
            text = removeGreekAccents(text);
        }

        return text;
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
