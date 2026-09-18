import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.chatMessage.deleteMany();
  await prisma.compatibilityResult.deleteMany();
  await prisma.roommateProfile.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.savedProperty.deleteMany();
  await prisma.costBreakdown.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  // Create primary demo user
  const demoUser = await prisma.user.create({
    data: {
      id: 'demo-user-1',
      name: 'Alex Johnson',
      budget: 35000,
      preferences: JSON.stringify({
        location: 'Indiranagar',
        bedrooms: 2,
        furnishing: 'Semi-Furnished',
        amenities: ['Gym', 'Power Backup', 'Parking', 'Security', 'Wifi'],
        commutePoint: 'Koramangala Tech Park',
      }),
    },
  });

  console.log(`Created demo user: ${demoUser.name} (${demoUser.id})`);

  // Seed 16 realistic properties
  const propertyData = [
    {
      title: 'Modern 2BHK in Heart of Indiranagar',
      location: 'Indiranagar, Bangalore',
      rent: 32000,
      deposit: 150000,
      brokerage: 16000,
      furnishing: 'Semi-Furnished',
      bedrooms: 2,
      amenities: ['Power Backup', 'Security', 'Parking', 'Balcony', 'Wifi'],
      description: 'Spacious 2BHK apartment within walking distance to 100ft Road. Well ventilated with modular kitchen, wardrobes, and covered car parking.',
      maintenance: 3000,
      electricity: 1500,
      water: 500,
      internet: 1000,
      transport: 2000,
      otherRecurring: 500,
    },
    {
      title: 'Luxury 3BHK Gated Community Apartment',
      location: 'Koramangala 4th Block, Bangalore',
      rent: 48000,
      deposit: 250000,
      brokerage: 24000,
      furnishing: 'Furnished',
      bedrooms: 3,
      amenities: ['Gym', 'Swimming Pool', 'Power Backup', 'Security', 'Clubhouse', 'Parking', 'Elevator'],
      description: 'Fully furnished premium 3BHK in a high-end gated complex. Features king beds, smart TVs, ACs in all rooms, and modular kitchen with dishwasher.',
      maintenance: 5000,
      electricity: 2500,
      water: 800,
      internet: 1200,
      transport: 1500,
      otherRecurring: 1000,
    },
    {
      title: 'Cozy 1BHK Studio near HSR Layout Sector 1',
      location: 'HSR Layout, Bangalore',
      rent: 22000,
      deposit: 80000,
      brokerage: 11000,
      furnishing: 'Furnished',
      bedrooms: 1,
      amenities: ['Wifi', 'Power Backup', 'Security', 'Balcony'],
      description: 'Compact and modern 1BHK perfect for young professionals. Includes queen bed, work desk, high-speed fiber internet, and kitchenette.',
      maintenance: 1500,
      electricity: 1000,
      water: 400,
      internet: 800,
      transport: 1200,
      otherRecurring: 300,
    },
    {
      title: 'Spacious 2BHK High-rise near Tech Parks',
      location: 'Bellandur, Bangalore',
      rent: 36000,
      deposit: 180000,
      brokerage: 18000,
      furnishing: 'Semi-Furnished',
      bedrooms: 2,
      amenities: ['Gym', 'Power Backup', 'Security', 'Parking', 'Elevator', 'Clubhouse'],
      description: 'Strategically located near major IT parks along ORR. Features open view balcony, piped gas connection, and 24/7 security guard post.',
      maintenance: 3500,
      electricity: 1800,
      water: 600,
      internet: 1000,
      transport: 2500,
      otherRecurring: 500,
    },
    {
      title: 'Charming 2BHK Garden Apartment',
      location: 'JP Nagar 2nd Phase, Bangalore',
      rent: 28000,
      deposit: 120000,
      brokerage: 14000,
      furnishing: 'Unfurnished',
      bedrooms: 2,
      amenities: ['Parking', 'Security', 'Balcony', 'Garden Area'],
      description: 'Quiet residential neighborhood with mature green trees. Close to metro station, supermarkets, and parks. Includes reserved bike/car parking.',
      maintenance: 2000,
      electricity: 1200,
      water: 500,
      internet: 900,
      transport: 1800,
      otherRecurring: 400,
    },
    {
      title: 'Premium 2BHK with Lake View',
      location: 'Whitefield, Bangalore',
      rent: 34000,
      deposit: 170000,
      brokerage: 17000,
      furnishing: 'Semi-Furnished',
      bedrooms: 2,
      amenities: ['Gym', 'Swimming Pool', 'Power Backup', 'Security', 'Parking', 'Tennis Court'],
      description: 'Stunning lake view apartment in a premier Whitefield society. Short commute to ITPL and major MNC campuses.',
      maintenance: 4000,
      electricity: 2000,
      water: 600,
      internet: 1000,
      transport: 3000,
      otherRecurring: 600,
    },
    {
      title: 'Budget-Friendly 1BHK for Techies',
      location: 'Marathahalli, Bangalore',
      rent: 18500,
      deposit: 60000,
      brokerage: 9250,
      furnishing: 'Semi-Furnished',
      bedrooms: 1,
      amenities: ['Power Backup', 'Security', 'Wifi'],
      description: 'Affordable 1BHK near Outer Ring Road bus stops. Ideal for solo renters wanting quick access to both Whitefield and Bellandur tech hubs.',
      maintenance: 1200,
      electricity: 900,
      water: 400,
      internet: 800,
      transport: 1500,
      otherRecurring: 300,
    },
    {
      title: 'Executive 3BHK Penthouse with Private Terrace',
      location: 'Indiranagar 100ft Road, Bangalore',
      rent: 65000,
      deposit: 350000,
      brokerage: 32500,
      furnishing: 'Furnished',
      bedrooms: 3,
      amenities: ['Gym', 'Power Backup', 'Security', 'Parking', 'Elevator', 'Private Terrace', 'Wifi'],
      description: 'Top floor penthouse with panoramic city views, plush modular kitchen, wooden flooring, and massive private rooftop terrace for hosting.',
      maintenance: 6000,
      electricity: 3500,
      water: 1000,
      internet: 1500,
      transport: 2000,
      otherRecurring: 1200,
    },
    {
      title: 'Modern 2BHK Gated Flat near Electronic City Phase 1',
      location: 'Electronic City, Bangalore',
      rent: 24000,
      deposit: 100000,
      brokerage: 12000,
      furnishing: 'Furnished',
      bedrooms: 2,
      amenities: ['Gym', 'Swimming Pool', 'Power Backup', 'Security', 'Parking'],
      description: 'Fully setup 2BHK inside a well-maintained society with clubhouse, badminton court, and shuttle services to major tech parks.',
      maintenance: 2500,
      electricity: 1400,
      water: 500,
      internet: 900,
      transport: 2200,
      otherRecurring: 400,
    },
    {
      title: 'Sunny 2BHK Apartment near Metro',
      location: 'Jayanagar 4th Block, Bangalore',
      rent: 30000,
      deposit: 150000,
      brokerage: 15000,
      furnishing: 'Semi-Furnished',
      bedrooms: 2,
      amenities: ['Security', 'Parking', 'Balcony', 'Power Backup'],
      description: 'Bright east-facing 2BHK located 5 mins walk from Jayanagar Metro Station and shopping complex. Excellent neighborhood feel.',
      maintenance: 2200,
      electricity: 1300,
      water: 500,
      internet: 1000,
      transport: 1000,
      otherRecurring: 400,
    },
    {
      title: 'Stylish 2BHK Loft with Workstations',
      location: 'Koramangala 1st Block, Bangalore',
      rent: 38000,
      deposit: 190000,
      brokerage: 19000,
      furnishing: 'Furnished',
      bedrooms: 2,
      amenities: ['Wifi', 'Power Backup', 'Security', 'Parking', 'Gym', 'Workstation setup'],
      description: 'Designed specifically for remote software engineers. Includes dual monitor arm desks, ergonomic Herman Miller style chairs, and 500Mbps fiber.',
      maintenance: 3200,
      electricity: 2200,
      water: 600,
      internet: 1500,
      transport: 1200,
      otherRecurring: 500,
    },
    {
      title: 'Peaceful 3BHK Independent House Upper Floor',
      location: 'Domlur Layout, Bangalore',
      rent: 42000,
      deposit: 200000,
      brokerage: 21000,
      furnishing: 'Semi-Furnished',
      bedrooms: 3,
      amenities: ['Parking', 'Power Backup', 'Security', 'Balcony'],
      description: 'Independent house second floor with independent entrance, large open balconies, solar water heating, and calm tree-lined lane.',
      maintenance: 1500,
      electricity: 1800,
      water: 600,
      internet: 1000,
      transport: 1500,
      otherRecurring: 500,
    },
    {
      title: 'Compact 1BHK in Premium Standalone Building',
      location: 'HSR Layout Sector 3, Bangalore',
      rent: 25000,
      deposit: 100000,
      brokerage: 12500,
      furnishing: 'Furnished',
      bedrooms: 1,
      amenities: ['Power Backup', 'Security', 'Elevator', 'Wifi', 'Parking'],
      description: 'Brand new construction in Sector 3. High quality bath fittings, modular kitchen with hob and chimney, and lift access.',
      maintenance: 1800,
      electricity: 1100,
      water: 400,
      internet: 900,
      transport: 1000,
      otherRecurring: 300,
    },
    {
      title: 'Spacious 3BHK in Prestige Enclave',
      location: 'Sarjapur Road, Bangalore',
      rent: 45000,
      deposit: 220000,
      brokerage: 22500,
      furnishing: 'Semi-Furnished',
      bedrooms: 3,
      amenities: ['Gym', 'Swimming Pool', 'Power Backup', 'Security', 'Clubhouse', 'Parking', 'Supermarket'],
      description: 'Resort-style living on Sarjapur Road. Onsite supermarket, pharmacy, cafe, and sports facilities inside the premises.',
      maintenance: 4500,
      electricity: 2400,
      water: 700,
      internet: 1100,
      transport: 2800,
      otherRecurring: 700,
    },
    {
      title: 'Minimalist 2BHK Flat with Pool Access',
      location: 'BTM Layout 2nd Stage, Bangalore',
      rent: 29000,
      deposit: 130000,
      brokerage: 14500,
      furnishing: 'Furnished',
      bedrooms: 2,
      amenities: ['Swimming Pool', 'Gym', 'Power Backup', 'Security', 'Parking'],
      description: 'Clean Scandinavian aesthetic flat close to BTM lake and Silk Board junction. Great connectivity to Electronic City and Koramangala.',
      maintenance: 2800,
      electricity: 1600,
      water: 500,
      internet: 1000,
      transport: 1800,
      otherRecurring: 400,
    },
    {
      title: 'Cosy Studio Apartment for Single Occupant',
      location: 'Koramangala 5th Block, Bangalore',
      rent: 21000,
      deposit: 75000,
      brokerage: 10500,
      furnishing: 'Furnished',
      bedrooms: 1,
      amenities: ['Wifi', 'Power Backup', 'Security'],
      description: 'Studio unit in prime foodie district. Fully setup with micro-kitchen, fridge, microwave, TV, and queen storage bed.',
      maintenance: 1200,
      electricity: 1000,
      water: 400,
      internet: 800,
      transport: 1000,
      otherRecurring: 300,
    },
  ];

  const createdProperties = [];
  for (const p of propertyData) {
    const estimatedMonthlyCost = p.rent + p.maintenance + p.electricity + p.water + p.internet + p.transport + p.otherRecurring;
    const initialMoveInCost = p.deposit + p.brokerage + p.rent;

    const property = await prisma.property.create({
      data: {
        title: p.title,
        location: p.location,
        rent: p.rent,
        deposit: p.deposit,
        brokerage: p.brokerage,
        furnishing: p.furnishing,
        bedrooms: p.bedrooms,
        amenities: JSON.stringify(p.amenities),
        description: p.description,
        costBreakdown: {
          create: {
            maintenance: p.maintenance,
            electricity: p.electricity,
            water: p.water,
            internet: p.internet,
            transport: p.transport,
            otherRecurring: p.otherRecurring,
            estimatedMonthlyCost,
            initialMoveInCost,
          },
        },
      },
      include: {
        costBreakdown: true,
      },
    });
    createdProperties.push(property);
  }

  console.log(`Seeded ${createdProperties.length} properties with cost breakdowns.`);

  // Save/shortlist initial properties for demo user
  if (createdProperties.length >= 4) {
    await prisma.savedProperty.create({
      data: {
        userId: demoUser.id,
        propertyId: createdProperties[0].id,
        isShortlisted: true,
      },
    });

    await prisma.savedProperty.create({
      data: {
        userId: demoUser.id,
        propertyId: createdProperties[1].id,
        isShortlisted: true,
      },
    });

    await prisma.savedProperty.create({
      data: {
        userId: demoUser.id,
        propertyId: createdProperties[3].id,
        isShortlisted: false,
      },
    });

    await prisma.savedProperty.create({
      data: {
        userId: demoUser.id,
        propertyId: createdProperties[5].id,
        isShortlisted: false,
      },
    });

    console.log('Seeded saved & shortlisted properties for demo user.');
  }

  // Seed 2 RoommateProfiles for compatibility feature initial data
  const profileA = await prisma.roommateProfile.create({
    data: {
      userId: demoUser.id,
      name: 'Alex (User)',
      budget: 35000,
      sleepSchedule: 'Night Owl (12 AM - 8 AM)',
      workSchedule: 'Hybrid (3 days office)',
      cleanliness: 'Very Neat',
      noiseTolerance: 'Medium',
      guests: 'Occasional weekends',
      smoking: 'Non-smoker',
      foodPreferences: 'Vegetarian',
      pets: 'Cat friendly',
      socialPreferences: 'Social / friendly',
    },
  });

  const profileB = await prisma.roommateProfile.create({
    data: {
      userId: demoUser.id,
      name: 'Rohan Sharma (Potential Roommate)',
      budget: 30000,
      sleepSchedule: 'Night Owl (1 AM - 9 AM)',
      workSchedule: 'Remote / WFH',
      cleanliness: 'Moderate',
      noiseTolerance: 'High',
      guests: 'Occasional weekends',
      smoking: 'Non-smoker',
      foodPreferences: 'Non-veg friendly',
      pets: 'Cat owner',
      socialPreferences: 'Social / friendly',
    },
  });

  console.log(`Seeded roommate profiles: ${profileA.name} and ${profileB.name}`);

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
