
export interface Shift {
  id: number;
  event_id: number;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_spots: number;
  is_active: boolean;
  is_full: boolean;
  people_counter: number;
  status?: string | null;
}

export interface EventImage {
  id: number;
  event_id: number;
  image_url: string;
  is_cover: boolean;
}

export interface EmailTemplate {
  id: number;
  subject_eng?: string | null;
  body_eng?: string | null;
  subject_el?: string | null;
  body_el?: string | null;
  subject?: string | null;
  body?: string | null;
}

export interface Product {
  id: string;
  event_id?: number;
  category_id?: number | string | null;
  title: string;
  description: string;
  price: number;
  image_url?: string | null;
}

export interface ProductCategory {
  id: number | string;
  event_id?: number;
  created_at?: string;
  name: string;
  products?: Product[];
}

export interface WeekploreEvent {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  price: number;
  event_date: string;
  booking_deadline: string;
  location_name: string;
  location_address: string;
  cover_image_url: string;
  is_sold_out: boolean;
  is_hidden: boolean;
  status?: string | null;
  shifts?: Shift[];
  images?: EventImage[];
  products?: Product[];
  product_categories?: ProductCategory[];
  category?: 'Outdoor' | 'Creative' | 'Social'; // Adding back for UI filtering if needed, though not in schema
}

export interface Review {
  id: string;
  created_at: string;
  name: string;
  email: string;
  start: number;
  review: string;
  status: 'pending' | 'invisible' | 'visible';
}

export interface Person {
  id: string;
  created_at: string;
  name: string;
  description: string;
  photo_link: string | null;
}

export interface PrivateEvent {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_visible?: boolean | null;
}

export interface PrivateEventInquiryFormData {
  first_name: string;
  last_name: string;
  email: string;
  email_language?: 'el' | 'en';
  phone: string;
  number_of_people: number;
  date_approx: string; // YYYY-MM-DD
  setting: string;
  has_activity: boolean;
  activity?: string;
  food?: string;
  decoration_budget: number;
  message: string;
  area: string;
  is_custom: boolean;
  private_event_template_id?: string | null;
}

export interface BookingFormData {
  fullName: string;
  phone: string;
  email: string;
  email_language?: 'el' | 'en';
  shiftId: number;
  numberOfPeople: number;
  products?: { product_id: string; quantity: number }[];
}
