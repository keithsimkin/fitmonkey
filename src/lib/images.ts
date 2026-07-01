import type { BodyPart } from '../types/exercise';

// Card imagery is fetched from the Unsplash CDN and cached on first view by the
// service worker. Every entry pairs the photo with a brand colour that doubles
// as the offline / load-error fallback (see PhotoCard), so the UI never looks
// broken without a network. Centralised here so the source is easy to swap.

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=70`;

export interface Art {
  image: string;
  color: string;
}

const COLORS = {
  coral: '#FF6F61',
  lilac: '#9F86E8',
  peach: '#EFB066',
  mint: '#1FD0B0',
  ink: '#2A2A31',
  sky: '#4F9FE6',
};

export const BODY_PART_ART: Record<BodyPart, Art> = {
  Chest: { image: U('photo-1571731956672-f2b94d7dd0cb'), color: COLORS.peach },
  Back: { image: U('photo-1581009146145-b5ef050c2e1e'), color: COLORS.lilac },
  Shoulders: { image: U('photo-1532384748853-8f54a8f476e2'), color: COLORS.sky },
  'Upper Arms': { image: U('photo-1581009137042-c552e485697a'), color: COLORS.coral },
  'Lower Arms': { image: U('photo-1517344884509-a0c97ec11bcc'), color: COLORS.mint },
  'Upper Legs': { image: U('photo-1434608519344-49d77a699e1d'), color: COLORS.ink },
  'Lower Legs': { image: U('photo-1434608519344-49d77a699e1d'), color: COLORS.sky },
  Waist: { image: U('photo-1571019613454-1cb2f99b2d8b'), color: COLORS.coral },
  Cardio: { image: U('photo-1538805060514-97d9cc17730c'), color: COLORS.mint },
  Neck: { image: U('photo-1544367567-0f2fcb009e0b'), color: COLORS.lilac },
};

export interface Collection {
  key: string;
  title: string;
  bodyParts: BodyPart[];
  art: Art;
}

/** Curated browse collections for the Discover screen. */
export const COLLECTIONS: Collection[] = [
  {
    key: 'chest-abs',
    title: 'Chest & Abdominal',
    bodyParts: ['Chest', 'Waist'],
    art: { image: U('photo-1571731956672-f2b94d7dd0cb'), color: COLORS.peach },
  },
  {
    key: 'back-shoulders',
    title: 'Back & Shoulders',
    bodyParts: ['Back', 'Shoulders'],
    art: { image: U('photo-1581009146145-b5ef050c2e1e'), color: COLORS.lilac },
  },
  {
    key: 'arms',
    title: 'Arm Builder',
    bodyParts: ['Upper Arms', 'Lower Arms'],
    art: { image: U('photo-1581009137042-c552e485697a'), color: COLORS.coral },
  },
  {
    key: 'legs',
    title: 'Leg Day',
    bodyParts: ['Upper Legs', 'Lower Legs'],
    art: { image: U('photo-1434608519344-49d77a699e1d'), color: COLORS.ink },
  },
];

export interface Popular {
  key: string;
  title: string;
  subtitle: string;
  bodyParts: BodyPart[];
  homeOnly?: boolean;
  art: Art;
}

/** Featured "popular" cards for the Discover hero carousel. */
export const POPULAR: Popular[] = [
  {
    key: 'home-workout',
    title: 'Home Workout',
    subtitle: 'No equipment',
    bodyParts: ['Chest', 'Waist', 'Upper Legs'],
    homeOnly: true,
    art: { image: U('photo-1518611012118-696072aa579a'), color: COLORS.coral },
  },
  {
    key: 'upper-power',
    title: 'Upper Power',
    subtitle: 'Push & pull',
    bodyParts: ['Chest', 'Back', 'Shoulders'],
    art: { image: U('photo-1532384748853-8f54a8f476e2'), color: COLORS.ink },
  },
  {
    key: 'core-burn',
    title: 'Core Burn',
    subtitle: 'Abs & waist',
    bodyParts: ['Waist'],
    art: { image: U('photo-1571019613454-1cb2f99b2d8b'), color: COLORS.mint },
  },
];
