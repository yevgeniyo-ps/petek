import { X } from 'lucide-react';
import {
  Flame, Star, Heart, Lightbulb, Target, Rocket,
  CheckCircle, AlertTriangle, MapPin, FileText, Calendar, Key,
  Briefcase, GraduationCap, Home, ShoppingCart, DollarSign, Music,
  Sprout, Coffee, Dumbbell, Plane, BookOpen, Laptop,
  Palette, Wrench, BarChart3, PartyPopper, Globe, Zap,
  Camera, Bell, Shield, Users, Clock, Bookmark,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  star: Star,
  heart: Heart,
  lightbulb: Lightbulb,
  target: Target,
  rocket: Rocket,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  'map-pin': MapPin,
  'file-text': FileText,
  calendar: Calendar,
  key: Key,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  home: Home,
  'shopping-cart': ShoppingCart,
  'dollar-sign': DollarSign,
  music: Music,
  sprout: Sprout,
  coffee: Coffee,
  dumbbell: Dumbbell,
  plane: Plane,
  'book-open': BookOpen,
  laptop: Laptop,
  palette: Palette,
  wrench: Wrench,
  'bar-chart': BarChart3,
  'party-popper': PartyPopper,
  globe: Globe,
  zap: Zap,
  camera: Camera,
  bell: Bell,
  shield: Shield,
  users: Users,
  clock: Clock,
  bookmark: Bookmark,
};

const ICON_NAMES = Object.keys(ICON_MAP);

interface IconPickerProps {
  current: string | null;
  onChange: (icon: string | null) => void;
}

export default function IconPicker({ current, onChange }: IconPickerProps) {
  return (
    <div className="p-3 max-w-[260px]">
      <div className="flex flex-wrap gap-1">
        {current && (
          <button
            onClick={() => onChange(null)}
            title="Remove icon"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b6882] hover:bg-white/[0.08] hover:text-[#b0adc0] transition-colors"
          >
            <X size={14} />
          </button>
        )}
        {ICON_NAMES.map((name) => {
          const Icon = ICON_MAP[name]!;
          return (
            <button
              key={name}
              onClick={() => onChange(name)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a7890] hover:text-white hover:bg-white/[0.08] transition-colors"
              style={{
                boxShadow: current === name ? '0 0 0 2px #ec4899' : 'none',
                borderRadius: '8px',
              }}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
