/**
 * Curated high-quality, authentic demo photography for Bangalore flats and houses.
 * Optimized with CDN parameters for fast loading and uniform aspect ratios.
 */

export interface PropertyImageInfo {
  url: string;
  alt: string;
  category: 'flat' | 'house' | 'studio' | 'loft' | 'penthouse';
}

// Deterministic mapping by property ID or title key
const propertyImageCatalog: Record<string, PropertyImageInfo> = {
  // Demo Properties
  'indiranagar-2bhk': {
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
    alt: 'Sunlit modern 2BHK living room with balcony',
    category: 'flat',
  },
  'koramangala-loft': {
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
    alt: 'Stylish urban loft with workstations and hardwood floor',
    category: 'loft',
  },
  'jayanagar-2bhk': {
    url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
    alt: 'Bright east-facing 2BHK apartment with modular kitchen',
    category: 'flat',
  },
  'hsr-studio': {
    url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1000&q=80',
    alt: 'Modern cozy studio apartment with dedicated work desk',
    category: 'studio',
  },

  // Database Seeded Properties (matched by title keywords or normalized id)
  'modern-2bhk-in-heart-of-indiranagar': {
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
    alt: 'Modern 2BHK flat near 100ft Road Indiranagar',
    category: 'flat',
  },
  'luxury-3bhk-gated-community-apartment': {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    alt: 'Luxury 3BHK gated community interior with chandeliers',
    category: 'flat',
  },
  'cozy-1bhk-studio-near-hsr-layout-sector-1': {
    url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1000&q=80',
    alt: 'Compact 1BHK studio with high-speed fiber setup',
    category: 'studio',
  },
  'spacious-2bhk-high-rise-near-tech-parks': {
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
    alt: 'High-rise 2BHK flat with panoramic balcony views',
    category: 'flat',
  },
  'charming-2bhk-garden-apartment': {
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
    alt: 'Charming 2BHK garden apartment surrounded by greenery',
    category: 'flat',
  },
  'premium-2bhk-with-lake-view': {
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
    alt: 'Lake-view balcony apartment in Whitefield',
    category: 'flat',
  },
  'budget-friendly-1bhk-for-techies': {
    url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1000&q=80',
    alt: 'Budget-friendly 1BHK apartment near Outer Ring Road',
    category: 'flat',
  },
  'executive-3bhk-penthouse-with-private-terrace': {
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
    alt: 'Executive penthouse with private rooftop terrace',
    category: 'penthouse',
  },
  'modern-2bhk-gated-flat-near-electronic-city-phase-1': {
    url: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1000&q=80',
    alt: 'Modern 2BHK flat in Electronic City gated township',
    category: 'flat',
  },
  'sunny-2bhk-apartment-near-metro': {
    url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
    alt: 'Sunny 2BHK apartment in Jayanagar near metro',
    category: 'flat',
  },
  'stylish-2bhk-loft-with-workstations': {
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
    alt: 'Contemporary loft with ergonomic workstation setup',
    category: 'loft',
  },
  'peaceful-3bhk-independent-house-upper-floor': {
    url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80',
    alt: 'Independent house second floor with private balcony in Domlur',
    category: 'house',
  },
  'compact-1bhk-in-premium-standalone-building': {
    url: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1000&q=80',
    alt: 'Compact 1BHK in modern standalone building',
    category: 'flat',
  },
  'spacious-3bhk-in-prestige-enclave': {
    url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80',
    alt: 'Spacious 3BHK living room in Prestige Enclave Sarjapur',
    category: 'flat',
  },
  'minimalist-2bhk-flat-with-pool-access': {
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80',
    alt: 'Minimalist 2BHK apartment with community pool access',
    category: 'flat',
  },
  'cosy-studio-apartment-for-single-occupant': {
    url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80',
    alt: 'Cozy studio apartment in Koramangala',
    category: 'studio',
  },
};

// Fallback pool for any unmapped or dynamically created properties
const fallbackPool: Record<string, PropertyImageInfo[]> = {
  studio: [
    {
      url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1000&q=80',
      alt: 'Compact studio flat',
      category: 'studio',
    },
    {
      url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80',
      alt: 'Cozy modern studio apartment',
      category: 'studio',
    },
  ],
  loft: [
    {
      url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
      alt: 'Urban designer loft apartment',
      category: 'loft',
    },
  ],
  penthouse: [
    {
      url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
      alt: 'Luxury penthouse terrace suite',
      category: 'penthouse',
    },
  ],
  house: [
    {
      url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80',
      alt: 'Independent house floor with terrace',
      category: 'house',
    },
  ],
  flat: [
    {
      url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
      alt: 'Modern 2BHK apartment living room',
      category: 'flat',
    },
    {
      url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
      alt: 'Bright contemporary flat interior',
      category: 'flat',
    },
    {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
      alt: 'Luxury apartment living space',
      category: 'flat',
    },
    {
      url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
      alt: 'High-rise apartment balcony view',
      category: 'flat',
    },
  ],
};

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Returns a high-res, demo-appropriate photo for any flat or house.
 */
export function getPropertyImage(property: {
  id?: string;
  title?: string;
  bedrooms?: number;
  description?: string;
  image?: string;
}): PropertyImageInfo {
  // If property already has an image field, honor it
  if (property.image && property.image.startsWith('http')) {
    return {
      url: property.image,
      alt: property.title || 'Property photo',
      category: 'flat',
    };
  }

  // 1. Direct ID match
  if (property.id && propertyImageCatalog[property.id]) {
    return propertyImageCatalog[property.id];
  }

  // 2. Normalized Title match
  if (property.title) {
    const titleKey = normalizeKey(property.title);
    if (propertyImageCatalog[titleKey]) {
      return propertyImageCatalog[titleKey];
    }

    // Partial key matching against known catalog
    for (const [key, imageInfo] of Object.entries(propertyImageCatalog)) {
      if (titleKey.includes(key) || key.includes(titleKey)) {
        return imageInfo;
      }
    }

    // Semantic keyword classification
    const lower = property.title.toLowerCase();
    if (lower.includes('penthouse')) return fallbackPool.penthouse[0];
    if (lower.includes('loft')) return fallbackPool.loft[0];
    if (lower.includes('studio')) return fallbackPool.studio[0];
    if (lower.includes('house') || lower.includes('villa')) return fallbackPool.house[0];
  }

  // 3. Fallback based on bedroom count or hash
  const flats = fallbackPool.flat;
  const hash = Math.abs(
    (property.id || property.title || 'flat').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  );
  return flats[hash % flats.length];
}
