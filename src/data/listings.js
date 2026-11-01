// Database of Singapore rental listings with procedural generation for scale.

const REGIONS = ['Central', 'East', 'West', 'North', 'North-East'];

const DISTRICTS = {
  'Central': [
    { name: 'Tanjong Pagar', mrt: 'Tanjong Pagar MRT', avgHdbRoom: 1200, avgCondoRoom: 2300 },
    { name: 'Queenstown', mrt: 'Queenstown MRT', avgHdbRoom: 950, avgCondoRoom: 1800 },
    { name: 'Bukit Merah', mrt: 'Redhill MRT', avgHdbRoom: 950, avgCondoRoom: 1750 },
    { name: 'Lavender', mrt: 'Lavender MRT', avgHdbRoom: 1000, avgCondoRoom: 1900 },
    { name: 'Novena', mrt: 'Novena MRT', avgHdbRoom: 1100, avgCondoRoom: 2000 }
  ],
  'East': [
    { name: 'Tampines', mrt: 'Tampines MRT', avgHdbRoom: 800, avgCondoRoom: 1450 },
    { name: 'Bedok', mrt: 'Bedok MRT', avgHdbRoom: 850, avgCondoRoom: 1500 },
    { name: 'Pasir Ris', mrt: 'Pasir Ris MRT', avgHdbRoom: 800, avgCondoRoom: 1400 },
    { name: 'Geylang', mrt: 'Aljunied MRT', avgHdbRoom: 850, avgCondoRoom: 1600 }
  ],
  'West': [
    { name: 'Clementi', mrt: 'Clementi MRT', avgHdbRoom: 900, avgCondoRoom: 1650 },
    { name: 'Jurong East', mrt: 'Jurong East MRT', avgHdbRoom: 850, avgCondoRoom: 1550 },
    { name: 'Bukit Batok', mrt: 'Bukit Batok MRT', avgHdbRoom: 780, avgCondoRoom: 1400 }
  ],
  'North': [
    { name: 'Woodlands', mrt: 'Woodlands MRT', avgHdbRoom: 750, avgCondoRoom: 1300 },
    { name: 'Yishun', mrt: 'Yishun MRT', avgHdbRoom: 750, avgCondoRoom: 1300 },
    { name: 'Sembawang', mrt: 'Sembawang MRT', avgHdbRoom: 730, avgCondoRoom: 1250 }
  ],
  'North-East': [
    { name: 'Punggol', mrt: 'Punggol MRT', avgHdbRoom: 800, avgCondoRoom: 1400 },
    { name: 'Sengkang', mrt: 'Sengkang MRT', avgHdbRoom: 780, avgCondoRoom: 1350 },
    { name: 'Serangoon', mrt: 'Serangoon MRT', avgHdbRoom: 900, avgCondoRoom: 1600 }
  ]
};

const HOUSING_TYPES = [
  { type: 'HDB Room', multiplier: 1.0 },
  { type: 'Co-living Room', multiplier: 1.4 },
  { type: 'Condo Room', multiplier: 1.8 },
  { type: 'HDB Flat (Whole)', multiplier: 3.2 },
  { type: 'Condo Flat (Whole)', multiplier: 4.8 }
];

const AMENITIES_POOL = [
  'Gym',
  'Swimming Pool',
  'Supermarket',
  'Hawker Center',
  'Mall',
  'Quiet Area',
  'Cooking Allowed',
  'Visitor Friendly',
  'High-Speed Wi-Fi',
  'Air Conditioning'
];

const DESCRIPTIONS = {
  'HDB Room': [
    "Cozy common room with a wardrobe, study desk, and high-speed Wi-Fi. Ideal for students or fresh graduates.",
    "Well-ventilated common room in a friendly household. High floor, unblocked view. Close to local eateries.",
    "Fully furnished master room with attached bath. Clean and ready to move in. Light cooking allowed."
  ],
  'Co-living Room': [
    "Premium co-living space with styled interiors, utilities inclusive, and weekly cleaning. Highly social community.",
    "Modern co-living suite featuring study nook and ensuite bath. Shared gourmet kitchen and spacious living lounge.",
    "Chic and compact co-living pocket room. Perfect balance of privacy and community. Digital smart lock entry."
  ],
  'Condo Room': [
    "Spacious common room in a luxury condominium. Full facilities access including infinity pool and sky gym.",
    "Cosy pool-view room. Shared bathroom with one housemate. Shuttle bus service to MRT available.",
    "Master bedroom in a modern condo. Private balcony overlooking the neighborhood. Very quiet environment."
  ],
  'HDB Flat (Whole)': [
    "Spacious 3-room HDB flat. Master bedroom, common bedroom, and renovated kitchen. Extremely near wet market and food center.",
    "Fully furnished 4-room HDB flat. Cozy living area, perfect for a group of friends or young working couples.",
    "Newly renovated 2-room HDB flat. Compact, private, and within walking distance to key transport hubs."
  ],
  'Condo Flat (Whole)': [
    "Stunning 1-bedroom studio condo unit. Fully furnished with high-end appliances. Minutes from the financial district.",
    "Luxury 2-bedroom condominium flat. High ceiling, floor-to-ceiling windows, full condo access (gym, BBQ, tennis court).",
    "Modern SOHO loft apartment. Dedicated study/work space. Panoramic city views and top-notch security."
  ]
};

// Seed helper for deterministic procedural generation
function randomSeeded(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateListings() {
  const listings = [];
  let seed = 12345;

  // Let's create exactly 120 listings
  for (let i = 0; i < 120; i++) {
    // 1. Determine region
    const regionIndex = Math.floor(randomSeeded(seed++) * REGIONS.length);
    const region = REGIONS[regionIndex];

    // 2. Determine district within region
    const districts = DISTRICTS[region];
    const districtIndex = Math.floor(randomSeeded(seed++) * districts.length);
    const district = districts[districtIndex];

    // 3. Determine housing type
    const typeIndex = Math.floor(randomSeeded(seed++) * HOUSING_TYPES.length);
    const { type, multiplier } = HOUSING_TYPES[typeIndex];

    // 4. Calculate rent base price based on region/district and housing type
    let basePrice = type.includes('Room') ? district.avgHdbRoom : district.avgHdbRoom * 1.5;
    if (type.includes('Condo')) {
      basePrice = type.includes('Room') ? district.avgCondoRoom : district.avgCondoRoom * 2.2;
    }
    
    // Co-living rooms command a premium over HDB rooms but are usually cheaper than condo rooms
    if (type === 'Co-living Room') {
      basePrice = Math.round((district.avgHdbRoom + district.avgCondoRoom) / 2 * 1.15);
    }

    // Apply random fluctuation of +/- 12% for realistic listings variance
    const fluctuation = 0.88 + randomSeeded(seed++) * 0.24;
    let rent = Math.round(basePrice * multiplier * fluctuation / 50) * 50; // Round to nearest $50

    // Clamp values to realistic bounds
    if (type === 'HDB Room') rent = Math.max(700, Math.min(1450, rent));
    if (type === 'Co-living Room') rent = Math.max(1100, Math.min(2600, rent));
    if (type === 'Condo Room') rent = Math.max(1300, Math.min(3000, rent));
    if (type === 'HDB Flat (Whole)') rent = Math.max(2200, Math.min(4800, rent));
    if (type === 'Condo Flat (Whole)') rent = Math.max(2800, Math.min(6500, rent));

    // 5. Proximity to MRT (randomized but realistic based on district)
    const walkToMrtMins = Math.floor(randomSeeded(seed++) * 18) + 2; // 2 to 20 mins
    const nearMrt = walkToMrtMins <= 8;

    // 6. Select randomized subset of 3 to 6 amenities
    const amenities = [];
    const numAmenities = Math.floor(randomSeeded(seed++) * 4) + 3; // 3 to 6
    const poolCopy = [...AMENITIES_POOL];
    
    // Specific housing types get specific amenities guaranteed
    if (type.includes('Condo')) {
      amenities.push('Gym', 'Swimming Pool');
    }
    if (type === 'Co-living Room') {
      amenities.push('High-Speed Wi-Fi', 'Air Conditioning');
    }

    while (amenities.length < numAmenities && poolCopy.length > 0) {
      const aIdx = Math.floor(randomSeeded(seed++) * poolCopy.length);
      const amenity = poolCopy.splice(aIdx, 1)[0];
      if (!amenities.includes(amenity)) {
        amenities.push(amenity);
      }
    }

    // 7. Select description
    const descPool = DESCRIPTIONS[type];
    const descIndex = Math.floor(randomSeeded(seed++) * descPool.length);
    const baseDesc = descPool[descIndex];
    
    // Add specific text features
    const walkText = nearMrt ? `Just a quick ${walkToMrtMins}-minute walk to ${district.mrt}.` : `Located about ${walkToMrtMins} minutes transit away from ${district.mrt}.`;
    const fullDescription = `${baseDesc} ${walkText} Situated in the vibrant district of ${district.name} (${region} Region).`;

    // 8. Generate listing object
    listings.push({
      id: `SG-RENT-${1000 + i}`,
      title: `${type} @ ${district.name}`,
      type,
      region,
      district: district.name,
      mrt: district.mrt,
      walkToMrtMins,
      nearMrt,
      rent,
      amenities,
      description: fullDescription,
      imagePlaceholder: `${type.toLowerCase().replace(' ', '_')}_placeholder`
    });
  }

  return listings;
}
