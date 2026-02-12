import {
  Folder, Shield, CreditCard, Heart, Home, Car, Plane, GraduationCap,
  Briefcase, Phone, Wifi, Zap, Wrench, ShoppingBag, Gift, Music,
  Camera, Book, Dumbbell, Pill, Dog, Baby, Landmark, Receipt,
  Key, Globe, Star, Clock, FileText, Users,
} from 'lucide-react';
import type { ComponentType } from 'react';

export const COLLECTION_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  folder: Folder,
  shield: Shield,
  'credit-card': CreditCard,
  heart: Heart,
  home: Home,
  car: Car,
  plane: Plane,
  'graduation-cap': GraduationCap,
  briefcase: Briefcase,
  phone: Phone,
  wifi: Wifi,
  zap: Zap,
  wrench: Wrench,
  'shopping-bag': ShoppingBag,
  gift: Gift,
  music: Music,
  camera: Camera,
  book: Book,
  dumbbell: Dumbbell,
  pill: Pill,
  dog: Dog,
  baby: Baby,
  landmark: Landmark,
  receipt: Receipt,
  key: Key,
  globe: Globe,
  star: Star,
  clock: Clock,
  'file-text': FileText,
  users: Users,
};

export function getCollectionIcon(iconName: string): ComponentType<{ size?: number; className?: string }> {
  return COLLECTION_ICONS[iconName] ?? Folder;
}
