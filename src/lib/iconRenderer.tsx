import {
  Zap, Droplets, Wifi, Car, ShoppingCart, Play, Utensils, Heart,
  Home, Plane, User, Phone, Fuel, Building2, Tag, Star,
  Coffee, Music, Book, Dumbbell, CreditCard, Package, Wallet,
  ArrowRightLeft, Bike, Bus, Train, MapPin, Globe, Camera,
  Scissors, Wrench, ShoppingBag, Receipt, Banknote, PiggyBank,
  TrendingUp, Pizza, Stethoscope, Briefcase, Landmark, Baby,
  Gamepad2, Headphones, Shirt, Gift, Tv, Monitor, Ticket,
  GraduationCap, TreePine, PawPrint, Cigarette, Wine, Hammer,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Zap, Droplets, Wifi, Car, ShoppingCart, Play, Utensils, Heart,
  Home, Plane, User, Phone, Fuel, Building2, Tag, Star,
  Coffee, Music, Book, Dumbbell, CreditCard, Package, Wallet,
  ArrowRightLeft, Bike, Bus, Train, MapPin, Globe, Camera,
  Scissors, Wrench, ShoppingBag, Receipt, Banknote, PiggyBank,
  TrendingUp, Pizza, Stethoscope, Briefcase, Landmark, Baby,
  Gamepad2, Headphones, Shirt, Gift, Tv, Monitor, Ticket,
  GraduationCap, TreePine, PawPrint, Cigarette, Wine, Hammer,
}

export const ICON_OPTIONS = [
  'Zap', 'Droplets', 'Wifi', 'Car', 'ShoppingCart', 'Play', 'Utensils', 'Heart',
  'Home', 'Plane', 'User', 'Phone', 'Fuel', 'Building2', 'Tag', 'Star',
  'Coffee', 'Music', 'Book', 'Dumbbell', 'CreditCard', 'Package', 'Wallet',
  'ArrowRightLeft', 'Bike', 'Bus', 'Train', 'MapPin', 'Globe', 'Camera',
  'Scissors', 'Wrench', 'ShoppingBag', 'Receipt', 'Banknote', 'PiggyBank',
  'TrendingUp', 'Pizza', 'Stethoscope', 'Briefcase', 'Landmark', 'Baby',
  'Gamepad2', 'Headphones', 'Shirt', 'Gift', 'Tv', 'Monitor', 'Ticket',
  'GraduationCap', 'TreePine', 'PawPrint', 'Cigarette', 'Wine', 'Hammer',
]

export function renderIcon(name: string, className = 'w-4 h-4', color?: string) {
  const Icon = ICON_MAP[name] ?? Tag
  return <Icon className={className} style={color ? { color } : undefined} />
}
