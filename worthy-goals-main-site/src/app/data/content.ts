/* ============================================================
   Worthy Goals — site content
   All page copy lives here as typed constants. Components stay
   presentational; edit text in one place.
   ============================================================ */

export interface Brand {
  name: string;
  tagline: string;
  contactEmail: string;
  landingUrl: string;
  legal: string;
}

export const BRAND: Brand = {
  name: 'Worthy Goals',
  tagline: 'You are unworthy of this title — earn it.',
  contactEmail: 'hello@worthygoals.app',
  landingUrl: 'https://worthygoals.app',
  legal: 'Built for people capable of more.',
};

/* Mentor brand colours, shared across every section that names them. */
export const MENTOR_COLOR = {
  marcus: '#2A2622',
  lyra: '#7A5C8A',
  drill: '#C04124',
} as const;

/* ---------- HERO ---------- */
export interface MentorMessage {
  initial: string;
  name: string;
  role: string;
  color: string;
  body: string;
  time: string;
  /** optional horizontal offset (px) for the staggered stack look */
  offset?: number;
}

export interface TrustAvatar {
  initials: string;
  color: string;
}

export const HERO = {
  eyebrow: 'Early access · 2026',
  headingLines: ['You are unworthy', 'of this title — '],
  headingEm: 'earn it.',
  sub: 'Worthy Goals pairs every goal with an AI mentor who holds you to it — checking in, pushing, comforting, or escalating in their own voice. Accountability that actually knows you.',
  trustText: 'Join 2,000+ people building a worthier year.',
  trustAvatars: <TrustAvatar[]>[
    { initials: 'JL', color: '#6B5B4A' },
    { initials: 'SR', color: '#C04124' },
    { initials: 'MO', color: '#3F4A3A' },
    { initials: '+', color: '#2A2622' },
  ],
  messages: <MentorMessage[]>[
    {
      initial: 'M', name: 'Marcus', role: 'The Strategist', color: MENTOR_COLOR.marcus,
      body: '"Knew you had it. Same time tomorrow — we don\'t celebrate, we continue."',
      time: 'delivered 6:42 AM', offset: 0,
    },
    {
      initial: 'L', name: 'Lyra', role: 'The Believer', color: MENTOR_COLOR.lyra,
      body: '"Noticed you\'ve been quiet. No judgment. I\'m here when you\'re ready to begin again."',
      time: 'delivered yesterday', offset: 18,
    },
    {
      initial: 'D', name: 'The Drill', role: 'The Hardass', color: MENTOR_COLOR.drill,
      body: '"Comfort is the enemy. You said 6am. It\'s 6am. Get up."',
      time: 'delivered 6:00 AM', offset: 4,
    },
  ],
};

/* ---------- PROBLEM ---------- */
export interface ProblemItem {
  n: string;
  bold: string;
  rest: string;
}

export const PROBLEM = {
  eyebrow: 'Why goals die',
  heading: "Most goal apps are a checkbox that doesn't care whether you show up.",
  items: <ProblemItem[]>[
    { n: '01', bold: 'Emotionally flat.', rest: " A streak counter can't tell the difference between a hard week and a quit." },
    { n: '02', bold: 'One generic tone fits nobody.', rest: ' The voice that fires up your friend makes you flinch — and apps speak in only one.' },
    { n: '03', bold: 'Failure is treated as a data point.', rest: ' You miss once, the red mark appears, and the shame does the rest.' },
    { n: '04', bold: 'No theory of motivation.', rest: " They track behavior without ever asking why you'd want to change it." },
  ],
};

/* ---------- HOW IT WORKS ---------- */
export interface Step {
  num: string;
  title: string;
  body: string;
}

export const HOW = {
  eyebrow: 'How it works',
  headingLines: ['Assign your goals to someone', "who won't let you ghost."],
  steps: <Step[]>[
    { num: '01', title: 'Set a goal worth chasing', body: 'Name what you actually want — not a metric, a meaning. We help you make it specific enough to be held to.' },
    { num: '02', title: 'Assign it to a mentor', body: 'Choose from a roster of characters — a strategist, a believer, a hardass — like handing a project to the right person.' },
    { num: '03', title: 'Get held to it, in their voice', body: "They check in, push, and respond to how you're really doing — daily, in character, never as a generic ping." },
  ],
};

/* ---------- MENTORS ---------- */
export interface MentorCardData {
  initial: string;
  name: string;
  archetype: string;
  color: string;
  philosophy: string;
  quoteLabel: string;
  quote: string;
}

export const MENTORS = {
  eyebrow: 'Meet your roster',
  headingLines: ['Three voices. Pick who', 'you need on the hard days.'],
  cards: <MentorCardData[]>[
    {
      initial: 'M', name: 'Marcus', archetype: 'The Strategist', color: MENTOR_COLOR.marcus,
      philosophy: 'Calm, principled, playing the long game. He never panics, and he never lets you off.',
      quoteLabel: 'After a win', quote: '"Knew you had it. Same time tomorrow."',
    },
    {
      initial: 'L', name: 'Lyra', archetype: 'The Believer', color: MENTOR_COLOR.lyra,
      philosophy: "Gentle, perceptive, warm. She notices what you don't say, and she never trades in shame.",
      quoteLabel: 'After silence', quote: '"Noticed you\'ve been quiet. No judgment. When you\'re ready."',
    },
    {
      initial: 'D', name: 'The Drill', archetype: 'The Hardass', color: MENTOR_COLOR.drill,
      philosophy: "Relentless and intense. He's not here to make you comfortable — he's here to make you move.",
      quoteLabel: 'When you stall', quote: '"Comfort is the enemy. Get up."',
    },
  ],
};

/* ---------- FAILURE, REFRAMED ---------- */
export interface MissResponse {
  tag: string;
  tagClass: 'tag-warm' | 'tag-nudge' | 'tag-real';
  who: string;
  body: string;
}

export const FAILURE = {
  eyebrow: 'The part nobody else builds',
  headingBefore: 'When you miss, you get a ',
  headingEm: 'moment',
  headingAfter: ' — not a red mark.',
  lead: 'A broken streak tells you nothing and makes you feel like everything. Your mentor reacts in character instead: meeting you with empathy, a nudge, or a hard truth — whatever the moment actually needs.',
  pull: "Failure becomes a conversation, which is the only thing that's ever changed anyone.",
  responses: <MissResponse[]>[
    { tag: 'Empathy', tagClass: 'tag-warm', who: 'Lyra', body: '"Some weeks just take more out of you than they give. You showed up here — that counts. Tomorrow, we start small."' },
    { tag: 'A nudge', tagClass: 'tag-nudge', who: 'Marcus', body: '"One miss is an event. Two is a pattern. Let\'s keep it an event — what\'s the smallest version you can do tonight?"' },
    { tag: 'Real talk', tagClass: 'tag-real', who: 'The Drill', body: '"You didn\'t fail today. You negotiated with yourself and lost. Different problem. Fix that."' },
  ],
};

/* ---------- BENEFITS ---------- */
export interface Benefit {
  icon: 'roster' | 'message' | 'board' | 'psych';
  title: string;
  body: string;
}

export const BENEFITS = {
  eyebrow: 'At launch, you get',
  headingLines: ['Everything a streak counter', 'was never able to give you.'],
  items: <Benefit[]>[
    { icon: 'roster', title: 'Your mentor roster', body: 'Build a team of characters and assign each goal to the voice most likely to get you there.' },
    { icon: 'message', title: 'Daily check-ins, in their voice', body: "Real messages that respond to how you're actually doing — never a generic notification." },
    { icon: 'board', title: 'A motivational board of your wins', body: "A living record of what you've actually pulled off — the proof you reach for when you doubt yourself." },
    { icon: 'psych', title: 'Goals that adapt to your psychology', body: 'The system learns what moves you — more push, more warmth, more space — and adjusts as you go.' },
  ],
};

/* ---------- CTA BAND ---------- */
export const CTA = {
  eyebrow: 'Founding members',
  headingLines: ['Be there before the', 'first check-in goes out.'],
  lead: 'Early access is invite-only and rolling out in waves. Join now to claim your place — and lock in founding-member pricing.',
  buttonLabel: 'Join the waitlist',
};

/* ---------- FAQ ---------- */
export interface FaqItem {
  q: string;
  /** answer as HTML fragments so links can be embedded */
  a: string;
}

export const FAQ = {
  eyebrow: 'Questions, answered',
  heading: 'The fair things to ask.',
  items: <FaqItem[]>[
    {
      q: 'Is this just ChatGPT with a face?',
      a: 'No. The model is the engine, not the product. Worthy Goals is built around persistent characters with real points of view, memory of your history, and a theory of how accountability actually works — so a check-in lands like it\'s from someone who knows you, not a chatbot you\'re prompting.',
    },
    {
      q: 'Will it shame me when I slip?',
      a: 'Only if you ask for that energy. Shame is a design choice, and we made the opposite one. Miss a goal and your mentor responds in character — with empathy, a nudge, or a hard truth — never an automated red mark. You choose the voice that helps you, including the gentle ones.',
    },
    {
      q: 'When does it launch?',
      a: "We're rolling out early access in waves through 2026, starting with the waitlist. Join and you'll be among the first invited in — and you'll help shape what ships.",
    },
    {
      q: 'What does it cost?',
      a: 'Pricing lands at launch, but founding members get early-access pricing locked in for good. <a href="#join" class="faq-link">Join the waitlist</a> to claim the rate before it\'s set.',
    },
  ],
};

/* ---------- waitlist form ---------- */
export const CAPTURE = {
  placeholder: 'you@email.com',
  heroButton: 'Request access',
  reassure: 'Early access. No spam. Leave whenever.',
  invalidMsg: 'Please enter a valid email address.',
  errorMsg: 'Something went wrong. Please try again.',
  sendingLabel: 'Sending…',
};

/* ---------- simple content pages (Privacy, Contact) ---------- */
export interface SimplePage {
  eyebrow: string;
  heading: string;
  /** placeholder shown until real copy is drafted */
  note: string;
}

export const PRIVACY: SimplePage = {
  eyebrow: 'Legal',
  heading: 'Privacy',
  note: 'Our privacy policy is being drafted. Check back soon.',
};

export const CONTACT: SimplePage = {
  eyebrow: 'Say hello',
  heading: 'Contact',
  note: "A contact form is on the way. In the meantime, we'd love to hear from you.",
};

/* ---------- THANK-YOU page ---------- */
export interface ThankYouStep {
  n: string;
  title: string;
  /** body may contain a single highlighted span via {lock:...} */
  body: string;
  lock?: string;
  bodyAfter?: string;
}

export interface MentorQuote {
  initial: string;
  color: string;
  who: string;
  quote: string;
}

export const THANK_YOU = {
  sealLabel: 'On the list · early access 2026',
  heading: "You're in.",
  lede: "The work starts when we say go — and you'll be among the first we call up.",
  sub: "You wanted accountability that won't let you ghost. Consider this the first time we held the door. Now keep your inbox close.",
  nextHeading: 'What happens next',
  steps: <ThankYouStep[]>[
    { n: '01', title: "We'll email you the moment early access opens.", body: 'Access rolls out in waves through 2026. One clear email — no drip, no noise. Watch for the invite.' },
    { n: '02', title: 'Your founding-member rate is held.', body: 'Join early and your ', lock: 'early-access pricing', bodyAfter: ' is locked in for good, before pricing is set at launch.' },
    { n: '03', title: "You'll help shape who your mentors become.", body: "Founding members get a say in the roster and the voices. We're building this with you, not at you." },
  ],
  shareEyebrow: 'Bring someone',
  shareHeading: 'Worthy goals are easier with someone watching.',
  shareSay: 'Bring a friend onto the list. Accountability is a team sport — start picking yours.',
  inviteLabel: 'Your invite',
  inviteText: 'I just joined the waitlist for Worthy Goals — a goal app that pairs every goal with an AI mentor who actually holds you to it. Get on the early-access list with me:',
  copyDefault: 'Copy invite link',
  copyDone: 'Copied — go share it',
  copyLive: 'Invite copied to your clipboard.',
  shareXLabel: 'Share on X',
  shareWaLabel: 'WhatsApp',
  teaserEyebrow: "A taste of who's waiting",
  teaserQuotes: <MentorQuote[]>[
    { initial: 'M', color: MENTOR_COLOR.marcus, who: 'Marcus · The Strategist', quote: '"We don\'t chase motivation. We keep appointments. Yours is tomorrow."' },
    { initial: 'L', color: MENTOR_COLOR.lyra, who: 'Lyra · The Believer', quote: '"You don\'t have to feel ready. You just have to let me walk in with you."' },
    { initial: 'D', color: MENTOR_COLOR.drill, who: 'The Drill · The Hardass', quote: '"Comfort is the enemy. The list got you in the door — now earn the title."' },
  ],
};
