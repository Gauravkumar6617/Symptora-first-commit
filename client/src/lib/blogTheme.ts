import {
  BookOpen,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

interface CategoryTheme {
  icon: LucideIcon
  gradient: string
}

const themes: Record<string, CategoryTheme> = {
  'Symptom Guide': {
    icon: HeartPulse,
    gradient: 'from-primary-400 to-primary-700',
  },
  'Family Care': {
    icon: Sparkles,
    gradient: 'from-secondary to-primary-600',
  },
  Product: {
    icon: ShieldCheck,
    gradient: 'from-primary-500 to-primary-800',
  },
  Wellness: {
    icon: BookOpen,
    gradient: 'from-primary-300 to-secondary',
  },
}

const fallback: CategoryTheme = {
  icon: BookOpen,
  gradient: 'from-primary-400 to-primary-700',
}

export function getCategoryTheme(category: string): CategoryTheme {
  return themes[category] ?? fallback
}
