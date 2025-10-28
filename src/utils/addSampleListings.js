import { db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const SAMPLE_HOST_ID = "WMdkYEhTTrYUsHw9XpeH3xw1T9s2";

// Unsplash image URLs for variety
const staysPhotos = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800&q=80",
  "https://images.unsplash.com/photo-1465146072230-91cabc968266?w=800&q=80",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260066-6bc35f0a1f2c?w=800&q=80",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80",
];

const experiencesPhotos = [
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
];

const servicesPhotos = [
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
];

// Helper function to generate random date ranges
const generateDateRanges = () => {
  const ranges = [];
  const startDate = new Date(2025, 9, 28); // October 28, 2025

  for (let i = 0; i < 2; i++) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + i * 45);
    const end = new Date(start);
    end.setDate(end.getDate() + 30 + Math.floor(Math.random() * 15));

    ranges.push({
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  }
  return ranges;
};

// Helper function to generate random time slots
const generateTimeSlots = (count = 3) => {
  const slots = [];
  const startDate = new Date(2025, 9, 28);
  const hours = [9, 10, 14, 15, 16];

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor(Math.random() * 60));
    const hour = hours[Math.floor(Math.random() * hours.length)];

    slots.push({
      date: date.toISOString().split("T")[0],
      time: `${String(hour).padStart(2, "0")}:00`,
    });
  }
  return slots;
};

// Helper function to pick random items from array
const pickRandom = (arr, count = 3) => {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(arr[Math.floor(Math.random() * arr.length)]);
  }
  return [...new Set(result)];
};

// Sample data for Stays (20 listings)
const generateStaysListings = () => {
  const staysTitles = [
    "Cozy Downtown Apartment",
    "Luxury Beachfront Villa",
    "Mountain Cabin Retreat",
    "Historic Brownstone",
    "Stylish Loft in Arts District",
    "Charming Victorian Home",
    "Modern City Penthouse",
    "Rustic Farm House",
    "Waterfront Cottage",
    "Desert Oasis Villa",
    "Urban Studio Apartment",
    "Coastal Beach House",
    "Forest Retreat Cabin",
    "Elegant City Condo",
    "Contemporary Smart Home",
    "Secluded Villa with Pool",
    "Trendy Warehouse Loft",
    "Peaceful Countryside Manor",
    "Skyline View Penthouse",
    "Charming Cottage by the Lake",
  ];

  const locations = [
    "New York, NY",
    "Miami, FL",
    "Boulder, CO",
    "Brooklyn, NY",
    "San Francisco, CA",
    "Los Angeles, CA",
    "Austin, TX",
    "Denver, CO",
    "Seattle, WA",
    "Portland, OR",
    "Chicago, IL",
    "Boston, MA",
    "Philadelphia, PA",
    "Nashville, TN",
    "New Orleans, LA",
    "Miami Beach, FL",
    "Aspen, CO",
    "Santa Fe, NM",
    "Charleston, SC",
    "Savannah, GA",
  ];

  const amenities = [
    "WiFi",
    "Kitchen",
    "Air Conditioning",
    "Washer/Dryer",
    "Pool",
    "Hot Tub",
    "Beach Access",
    "Fireplace",
    "Deck",
    "Mountain View",
    "Garden",
    "Parking",
    "TV",
    "Heating",
    "Balcony",
    "Gym",
    "Sauna",
  ];

  const houseRules = [
    "No Smoking",
    "No Parties",
    "No Pets",
    "Quiet Hours After 10 PM",
    "Check-out by 11 AM",
    "Respect Neighbors",
    "No Loud Music",
    "Keep Clean",
  ];

  const listings = [];
  for (let i = 0; i < 20; i++) {
    listings.push({
      type: "stays",
      title: staysTitles[i],
      description: `Beautiful and comfortable ${staysTitles[i].toLowerCase()}. Perfect for your next vacation. Enjoy our ${pickRandom(amenities, 3).join(", ").toLowerCase()} and relax in style.`,
      location: locations[i],
      price: Math.floor(Math.random() * 250) + 80,
      numberOfGuests: Math.floor(Math.random() * 5) + 2,
      bedrooms: Math.floor(Math.random() * 4) + 1,
      bathrooms: Math.floor(Math.random() * 3) + 1,
      beds: Math.floor(Math.random() * 4) + 1,
      amenities: pickRandom(amenities, 4),
      houseRules: pickRandom(houseRules, 3),
      photos: [staysPhotos[i % staysPhotos.length]],
      availableDates: generateDateRanges(),
      bookedDates: [],
      promoCode: null,
      discount: { type: "percentage", value: Math.floor(Math.random() * 15) },
      ratings: Math.floor(Math.random() * 20 + 80) / 10,
      isDraft: false,
      status: "active",
      hostId: SAMPLE_HOST_ID,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }
  return listings;
};

// Sample data for Experiences (20 listings)
const generateExperiencesListings = () => {
  const experiencesTitles = [
    "NYC Food Tour",
    "Surfing Lessons in Hawaii",
    "Wine Tasting in Napa Valley",
    "Hot Air Balloon Ride",
    "Cooking Class with Local Chef",
    "Historical Walking Tour",
    "Yoga Retreat",
    "Rock Climbing Adventure",
    "Safari Adventure",
    "Art Workshop and Gallery Tour",
    "Scuba Diving Expedition",
    "Mountain Hiking Trek",
    "Photography Tour",
    "Cooking Experience",
    "Dance Class",
    "Meditation Retreat",
    "Water Sports Adventure",
    "Cultural Museum Tour",
    "Comedy Show Night",
    "Jazz Concert Experience",
  ];

  const categories = [
    "Adventure",
    "Culture",
    "Food",
    "Wellness",
    "Arts",
    "Sports",
    "Nature",
    "Music",
  ];

  const languages = ["English", "Spanish", "French", "German", "Italian"];

  const activities = [
    "Hiking",
    "Swimming",
    "Photography",
    "Cooking",
    "Dancing",
    "Meditation",
    "Painting",
    "Reading",
    "Touring",
    "Tasting",
    "Climbing",
    "Diving",
  ];

  const included = [
    "Drinks",
    "Snacks",
    "Equipment",
    "Guide",
    "Transportation",
    "Insurance",
  ];

  const toBring = [
    "Comfortable Shoes",
    "Sunscreen",
    "Water Bottle",
    "Camera",
    "Swimwear",
    "Hat",
    "Light Jacket",
  ];

  const listings = [];
  for (let i = 0; i < 20; i++) {
    listings.push({
      type: "experiences",
      title: experiencesTitles[i],
      description: `Join us for an unforgettable ${experiencesTitles[i].toLowerCase()}. Our expert guides will ensure you have the best experience ever. Learn new skills and create lasting memories.`,
      location: ["Paris, France", "Tokyo, Japan", "Barcelona, Spain", "Rome, Italy", "Amsterdam, Netherlands"][i % 5],
      price: Math.floor(Math.random() * 300) + 50,
      duration: Math.floor(Math.random() * 6) + 1,
      maxGuests: Math.floor(Math.random() * 20) + 4,
      category: categories[i % categories.length],
      language: languages[i % languages.length],
      ageMin: Math.floor(Math.random() * 10),
      availableTimes: generateTimeSlots(4),
      availableDates: generateDateRanges(),
      activities: pickRandom(activities, 3),
      thingsToKnow: [
        "Bring comfortable shoes",
        "Arrive 15 minutes early",
        "Weather dependent",
      ],
      included: pickRandom(included, 3),
      toBring: pickRandom(toBring, 3),
      photos: [experiencesPhotos[i % experiencesPhotos.length]],
      discount: { type: "percentage", value: Math.floor(Math.random() * 15) },
      promoCode: null,
      rating: Math.floor(Math.random() * 20 + 80) / 10,
      isDraft: false,
      status: "active",
      hostId: SAMPLE_HOST_ID,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return listings;
};

// Sample data for Services (20 listings)
const generateServicesListings = () => {
  const servicesTitles = [
    "Professional House Cleaning",
    "Plumbing Services",
    "Personal Training",
    "Electrical Services",
    "Pet Care and Dog Walking",
    "Photography Services",
    "Tutoring and Academic Help",
    "Hair and Beauty Services",
    "HVAC and Air Conditioning",
    "Virtual Assistant Services",
    "Massage Therapy",
    "Web Design Services",
    "Graphic Design",
    "Home Renovation",
    "Landscaping Services",
    "Pest Control",
    "Car Detailing",
    "Event Planning",
    "Bookkeeping Services",
    "Consulting Services",
  ];

  const serviceTypes = [
    "Deep Cleaning",
    "Regular Cleaning",
    "Repair",
    "Installation",
    "Maintenance",
    "Coaching",
    "Training",
    "Consultation",
    "Design",
    "Development",
  ];

  const highlights = [
    "Certified Professional",
    "5+ Years Experience",
    "Affordable Prices",
    "Quick Response",
    "High Quality",
    "Eco-Friendly",
    "Insured",
    "Licensed",
  ];

  const certifications = [
    "Professional License",
    "Insurance Coverage",
    "Background Check",
    "Certification",
    "Training Course",
  ];

  const terms = [
    "Free Consultation",
    "Flexible Scheduling",
    "Money Back Guarantee",
    "Professional Service",
  ];

  const listings = [];
  for (let i = 0; i < 20; i++) {
    listings.push({
      type: "services",
      title: servicesTitles[i],
      description: `Professional ${servicesTitles[i].toLowerCase()} with years of experience. We provide high-quality service with customer satisfaction guaranteed. Contact us for more information.`,
      location: ["New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ"][i % 5],
      price: Math.floor(Math.random() * 100) + 30,
      duration: Math.floor(Math.random() * 6) + 1,
      category: "Home Services",
      responseTime: ["within 1 hour", "within 2 hours", "within 4 hours"][Math.floor(Math.random() * 3)],
      serviceTypes: pickRandom(serviceTypes, 3),
      highlights: pickRandom(highlights, 3),
      serviceAreas: ["Downtown", "Suburbs", "Surrounding Areas"],
      certifications: pickRandom(certifications, 2),
      terms: pickRandom(terms, 2),
      experienceYears: Math.floor(Math.random() * 15) + 2,
      completedJobs: Math.floor(Math.random() * 500) + 50,
      photos: [servicesPhotos[i % servicesPhotos.length]],
      availableDates: generateDateRanges(),
      discount: { type: "percentage", value: Math.floor(Math.random() * 15) },
      promoCode: null,
      isVerified: Math.random() > 0.3,
      isDraft: false,
      status: "active",
      hostId: SAMPLE_HOST_ID,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }
  return listings;
};

export async function addSampleListings() {
  try {
    console.log("🚀 Starting to add sample listings...");
    let successCount = 0;
    let errorCount = 0;

    // Generate all listings
    const allListings = [
      ...generateStaysListings(),
      ...generateExperiencesListings(),
      ...generateServicesListings(),
    ];

    console.log(`📦 Adding ${allListings.length} sample listings to Firestore...`);

    // Add each listing
    for (const listing of allListings) {
      try {
        const listingsCollection = collection(db, "listings");
        const docRef = await addDoc(listingsCollection, listing);
        console.log(`✅ Added ${listing.type} listing: ${listing.title}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error adding ${listing.type} listing:`, error);
        errorCount++;
      }
    }

    console.log(
      `✅ Successfully added ${successCount} listings. Errors: ${errorCount}`
    );
    return { success: true, successCount, errorCount, total: successCount + errorCount };
  } catch (error) {
    console.error("❌ Error adding sample listings:", error);
    return { success: false, error: error.message };
  }
}
