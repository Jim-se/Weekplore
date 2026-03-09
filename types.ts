
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
}

export interface EventImage {
  id: number;
  event_id: number;
  image_url: string;
  is_cover: boolean;
}

export interface EmailTemplate {
  id: number;
  subject: string;
  body: string;
}

export interface Product {
  id: string;
  event_id: number;
  title: string;
  description: string;
  price: number;
  image_url?: string | null;
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
  shifts?: Shift[];
  images?: EventImage[];
  products?: Product[];
  category?: 'Outdoor' | 'Creative' | 'Social'; // Adding back for UI filtering if needed, though not in schema
}

export interface Review {
  id: string;
  created_at: string;
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
}

export interface BookingFormData {
  fullName: string;
  phone: string;
  email: string;
  shiftId: number;
  numberOfPeople: number;
  products?: { product_id: string; quantity: number }[];
}
