import { ChevronRight } from "lucide-react";
import FadeInSection from "../animation/FadeInSection";
export default function PopularDestinations() {
  const destinations = [
    {
      name: "Paris, France",
      image:
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400",
      properties: "2,340",
    },
    {
      name: "Tokyo, Japan",
      image:
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400",
      properties: "1,890",
    },
    {
      name: "New York, USA",
      image:
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400",
      properties: "3,210",
    },
    {
      name: "Bali, Indonesia",
      image:
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400",
      properties: "1,560",
    },
  ];

  return (
    <section className="py-20 px-6 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-800">
          Popular Destinations
        </h2>
        <p className="text-center text-gray-600 mb-16 text-lg">
          Explore the most sought-after locations worldwide
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((dest, index) => (
            <div
              key={index}
              className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer h-80"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {dest.name}
                </h3>
                <p className="text-purple-300 font-semibold">
                  {dest.properties} properties
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
