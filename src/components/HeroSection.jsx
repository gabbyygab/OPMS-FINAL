export default function HeroSection() {
  return (
    <section className="relative overflow-x-hidden bg-[url('/hero.png')] h-screen text-white bg-cover bg-center flex items-center justify-center">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Content wrapper */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center overflow-x-hidden">
        {/* Small announcement text */}
        <p className="inline-block bg-white/10 text-sm px-4 py-2 rounded-full mb-3">
          Announcing new features for hosts and guests.
          <a href="#" className="text-indigo-400 hover:underline ml-1">
            Read more →
          </a>
        </p>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          Welcome to <span className="text-indigo-400">BookingNest</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-10">
          Your hub for hosts, guests, and smooth bookings. Power your business
          with tools designed to simplify online property management.
        </p>

        {/* Call to actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl">
            Get Started
          </button>
          <button className="px-8 py-4 bg-transparent border border-gray-400 text-white rounded-xl text-lg font-semibold hover:bg-gray-800 transition-all">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
