export interface BlogPost {
  slug: string
  title: string
  category: string
  excerpt: string
  content: string[]
  author: string
  date: string
  readTime: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'when-to-see-a-doctor-for-fever',
    title: 'When Should You Actually See a Doctor for a Fever?',
    category: 'Symptom Guide',
    excerpt:
      'Not every fever needs an ER visit, but some do. Here is how to tell the difference in under a minute.',
    author: 'Dr. Ananya Rao',
    date: '2026-08-12',
    readTime: '4 min read',
    content: [
      'A fever is your body\'s natural response to infection, and most low-grade fevers resolve on their own within a few days with rest and fluids.',
      'You should seek medical attention if the fever is above 103°F (39.4°C), lasts more than three days, or is accompanied by a stiff neck, confusion, difficulty breathing, or a rash.',
      'For infants under three months, any fever warrants an immediate call to a doctor.',
      'Symptora\'s Health Check walks through these red flags automatically and tells you whether to self-monitor, book a routine appointment, or start a telemedicine consult right away.',
    ],
  },
  {
    slug: 'managing-elderly-parents-health-remotely',
    title: 'Managing Your Elderly Parents\' Health When You Live Far Away',
    category: 'Family Care',
    excerpt:
      'Family profiles make it possible to track symptoms, book appointments, and get alerts for a parent who cannot easily do it themselves.',
    author: 'Priya Menon',
    date: '2026-07-28',
    readTime: '6 min read',
    content: [
      'Millions of adults manage a parent\'s healthcare from another city, often piecing together updates over phone calls.',
      'A shared family profile lets you log symptoms on their behalf, see risk reports as they come in, and get notified immediately if a check comes back high risk.',
      'It also keeps a single history of prescriptions and past consultations, so nothing gets lost between different doctors or hospital visits.',
    ],
  },
  {
    slug: 'understanding-your-risk-score',
    title: 'Understanding Your Symptora Risk Score',
    category: 'Product',
    excerpt:
      'What Low, Medium, and High risk actually mean, and what happens next in each case.',
    author: 'Symptora Clinical Team',
    date: '2026-07-10',
    readTime: '3 min read',
    content: [
      'Every Health Check runs your reported symptoms and vitals through a triage model trained alongside clinicians.',
      'Low risk usually means self-care is appropriate, with guidance on what to watch for.',
      'Medium risk suggests booking a routine appointment within the next day or two.',
      'High risk automatically opens a telemedicine request with an available doctor so you are not left waiting.',
    ],
  },
  {
    slug: 'reducing-unnecessary-er-visits',
    title: '5 Ways to Avoid an Unnecessary ER Visit',
    category: 'Wellness',
    excerpt:
      'Emergency rooms are for emergencies. Here is how to know when urgent care or a video consult is the better call.',
    author: 'Dr. Karan Shah',
    date: '2026-06-22',
    readTime: '5 min read',
    content: [
      'ERs are built for life-threatening emergencies, and unnecessary visits mean longer waits for people who truly need them.',
      'A quick symptom check can rule out red-flag conditions and point you toward urgent care, a telemedicine visit, or home care instead.',
      'Keeping a running health history also helps any doctor you see quickly understand your baseline and recent changes.',
    ],
  },
]

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}
