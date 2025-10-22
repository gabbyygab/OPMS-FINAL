import { CheckCircle, Lock, DollarSign, Headphones } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Verified Properties",
      description:
        "Every listing is verified to ensure quality and authenticity",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Secure Booking",
      description:
        "Your payments and personal data are protected with bank-level security",
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Best Price Guarantee",
      description: "Find the best deals with our price match guarantee",
      color: "from-red-500 to-pink-500",
      bgColor: "from-red-50 to-pink-50",
    },
    {
      icon: <Headphones className="w-8 h-8" />,
      title: "24/7 Support",
      description: "Our team is always here to help you with any questions",
      color: "from-yellow-500 to-orange-500",
      bgColor: "from-yellow-50 to-orange-50",
    },
  ];

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-6xl font-bold text-center mb-6 text-slate-900 leading-tight">
            Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">BookingNest</span>
          </h2>
          <p className="text-center text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Experience hassle-free booking with our trusted platform featuring verified listings, secure payments, and round-the-clock support
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative h-full"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10`}></div>

              {/* Card */}
              <div className="bg-white h-full p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-indigo-200 group-hover:-translate-y-3 relative overflow-hidden">
                {/* Gradient border effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500 pointer-events-none`}></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon Container */}
                  <div className={`bg-gradient-to-br ${feature.bgColor} w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                    <div className={`bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`}>
                      {feature.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-indigo-600 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 leading-relaxed text-base">
                    {feature.description}
                  </p>

                  {/* Bottom accent line */}
                  <div className={`h-1 bg-gradient-to-r ${feature.color} rounded-full mt-6 w-0 group-hover:w-16 transition-all duration-500`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 transform duration-300">
            Learn More About Us
          </button>
        </div>
      </div>
    </section>
  );
}
