import { Home, Shield, Heart, Star } from "lucide-react";
export default function FeaturesSection() {
  const features = [
    {
      icon: <Home className="w-8 h-8" />,
      title: "Verified Properties",
      description:
        "Every listing is verified to ensure quality and authenticity",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Booking",
      description:
        "Your payments and personal data are protected with bank-level security",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Best Price Guarantee",
      description: "Find the best deals with our price match guarantee",
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "24/7 Support",
      description: "Our team is always here to help you with any questions",
    },
  ];
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-800">
          Why Choose BookingNest
        </h2>
        <p className="text-center text-gray-600 mb-16 text-lg">
          Experience hassle-free booking with our trusted platform
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100"
            >
              <div className="bg-gradient-to-br from-purple-100 to-indigo-100 w-16 h-16 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
