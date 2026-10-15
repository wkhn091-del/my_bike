/** Everything the public pages render. `null` = Yoav has not supplied it yet; the section hides that detail. */

export type SiteImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  lqip: string | null;
};

export type ScheduleItem = { time: string; title: string; detail: string | null };

export type RouteInfo = {
  km: number | null;
  elevationM: number | null;
  terrain: string | null;
  bikes: string | null;
  fitText: string | null;
  paceText: string | null;
  stravaUrl: string | null;
};

export type EventContent = {
  title: string;
  /** YYYY-MM-DD, Israel time. */
  date: string;
  rainDate: string | null;
  region: string;
  meetingPoint: string | null;
  parking: string | null;
  priceAgorot: number;
  capacity: number;
  early: { priceAgorot: number; seats: number } | null;
  friendDiscountAgorot: number | null;
  salesOpen: boolean;
  schedule: ScheduleItem[];
  included: string[];
  route: RouteInfo;
  photosDelivery: string | null;
  safety: string | null;
  heroImage: SiteImage | null;
  yoavImages: SiteImage[];
};

export type SiteSettings = {
  brand: string;
  legalName: string | null;
  vatNumber: string | null;
  address: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  answeringHours: string | null;
  accessibility: { name: string; phone: string; email: string };
  instagramUrl: string | null;
  facebookUrl: string | null;
  stravaUrl: string | null;
  youtubeUrl: string | null;
  instagramFollowers: string | null;
  followersAsOf: string | null;
  coachingText: string | null;
  coachingResponseDays: number | null;
  healthDeclaration: string | null;
  proof: Proof;
};

export type Credential = { title: string; issuer: string | null; year: number | null; url: string | null };

/** Real, checkable proof Yoav enters in Studio. Each part is null until every field it needs is filled. */
export type Proof = {
  google: { rating: number; reviewCount: number; profileUrl: string; checkedAt: string } | null;
  pastEdition: { riders: number; soldOut: boolean; date: string } | null;
  credentials: Credential[];
};

export type Testimonial = { name: string; quote: string; image: SiteImage | null; verified: boolean };

export type FaqItem = { question: string; answer: string };

export type SiteContent = {
  settings: SiteSettings;
  event: EventContent;
  testimonials: Testimonial[];
  faq: FaqItem[];
  gallery: SiteImage[];
};
