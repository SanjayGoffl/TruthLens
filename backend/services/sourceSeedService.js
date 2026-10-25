const Source = require('../models/Source');

// Expanded idempotent seeding of trusted publishers including India, Tamil Nadu, and World news.
const SEED_SOURCES = [
  // --- Trusted (>= 80) ---
  { domain: 'reuters.com', name: 'Reuters', reliabilityScore: 90, classification: 'Trusted' },
  { domain: 'apnews.com', name: 'Associated Press', reliabilityScore: 88, classification: 'Trusted' },
  { domain: 'bbc.co.uk', name: 'BBC News', reliabilityScore: 86, classification: 'Trusted' },
  { domain: 'thehindu.com', name: 'The Hindu', reliabilityScore: 88, classification: 'Trusted' },
  { domain: 'indianexpress.com', name: 'The Indian Express', reliabilityScore: 85, classification: 'Trusted' },
  { domain: 'ft.com', name: 'Financial Times', reliabilityScore: 84, classification: 'Trusted' },
  { domain: 'aljazeera.com', name: 'Al Jazeera', reliabilityScore: 84, classification: 'Trusted' },
  { domain: 'dw.com', name: 'Deutsche Welle', reliabilityScore: 86, classification: 'Trusted' },
  { domain: 'france24.com', name: 'France 24', reliabilityScore: 85, classification: 'Trusted' },
  { domain: 'japantimes.co.jp', name: 'The Japan Times', reliabilityScore: 85, classification: 'Trusted' },
  { domain: 'straitstimes.com', name: 'The Straits Times', reliabilityScore: 84, classification: 'Trusted' },

  // --- Generally Reliable (>= 65) ---
  { domain: 'nytimes.com', name: 'The New York Times', reliabilityScore: 78, classification: 'Generally Reliable' },
  { domain: 'washingtonpost.com', name: 'The Washington Post', reliabilityScore: 76, classification: 'Generally Reliable' },
  { domain: 'hindustantimes.com', name: 'Hindustan Times', reliabilityScore: 74, classification: 'Generally Reliable' },
  { domain: 'wsj.com', name: 'The Wall Street Journal', reliabilityScore: 74, classification: 'Generally Reliable' },
  { domain: 'economist.com', name: 'The Economist', reliabilityScore: 74, classification: 'Generally Reliable' },
  { domain: 'theguardian.com', name: 'The Guardian', reliabilityScore: 72, classification: 'Generally Reliable' },
  { domain: 'npr.org', name: 'NPR', reliabilityScore: 72, classification: 'Generally Reliable' },
  { domain: 'ndtv.com', name: 'NDTV', reliabilityScore: 75, classification: 'Generally Reliable' },
  { domain: 'timesofindia.indiatimes.com', name: 'Times of India', reliabilityScore: 72, classification: 'Generally Reliable' },
  { domain: 'indiatoday.in', name: 'India Today', reliabilityScore: 70, classification: 'Generally Reliable' },
  { domain: 'cbsnews.com', name: 'CBS News', reliabilityScore: 70, classification: 'Generally Reliable' },
  { domain: 'nbcnews.com', name: 'NBC News', reliabilityScore: 70, classification: 'Generally Reliable' },
  { domain: 'time.com', name: 'TIME', reliabilityScore: 68, classification: 'Generally Reliable' },
  { domain: 'dinamalar.com', name: 'Dinamalar', reliabilityScore: 68, classification: 'Generally Reliable' },
  { domain: 'dinathanthi.com', name: 'Daily Thanthi', reliabilityScore: 68, classification: 'Generally Reliable' },
  { domain: 'vikatan.com', name: 'Ananda Vikatan', reliabilityScore: 66, classification: 'Generally Reliable' },

  // --- Mixed / Caution (>= 45) ---
  { domain: 'foxnews.com', name: 'Fox News', reliabilityScore: 48, classification: 'Mixed' },
  { domain: 'cnn.com', name: 'CNN', reliabilityScore: 58, classification: 'Mixed' },
  { domain: 'dailymail.co.uk', name: 'Daily Mail', reliabilityScore: 35, classification: 'Mixed' },
  { domain: 'breitbart.com', name: 'Breitbart', reliabilityScore: 32, classification: 'Mixed' }
];

async function seedSourcesIfMissing() {
  let seeded = 0;
  for (const s of SEED_SOURCES) {
    const existing = await Source.findOne({ domain: s.domain }).lean();
    if (existing) {
      // update reliability score if needed
      await Source.updateOne({ domain: s.domain }, { $set: { reliabilityScore: s.reliabilityScore, classification: s.classification } });
      continue;
    }
    await Source.create({
      name: s.name,
      domain: s.domain,
      reliabilityScore: s.reliabilityScore,
      classification: s.classification,
      notes: 'Expanded seed source (India, Tamil Nadu, World News) for enhanced verification.',
      status: 'active',
      category: 'News',
      country: ''
    });
    seeded += 1;
  }
  return { seeded, total: SEED_SOURCES.length };
}

module.exports = { seedSourcesIfMissing, SEED_SOURCES };
