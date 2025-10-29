export default function HeroSection() {
  return (
    <section className="relative overflow-x-hidden h-screen text-white flex items-center justify-center">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/hero-vid.mp4" type="video/mp4" />
      </video>

      {/* Background overlay with gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70"></div>

      {/* Content wrapper */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center overflow-x-hidden">
        {/* Small announcement text */}
        <div className="mb-8 inline-block">
          <p className="inline-block bg-white/15 backdrop-blur-md text-sm px-4 py-2 rounded-full mb-6 text-white/90 font-medium border border-white/20 hover:bg-white/20 transition-all">
            Welcome to BookingNest - Your Trusted Booking Platform
          </p>
        </div>

        {/* Main heading with better typography */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight text-white drop-shadow-lg">
          Your Perfect Getaway
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-400 to-blue-300">
            Awaits You
          </span>
        </h1>

        {/* Subtitle with improved readability */}
        <p className="text-base sm:text-lg lg:text-2xl text-white/90 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed drop-shadow-md font-light">
          Discover exceptional stays, unforgettable experiences, and reliable
          services.
          <br className="hidden sm:inline" />
          BookingNest connects you with the best properties worldwide.
        </p>

        {/* Call to actions with enhanced design */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 sm:px-0">
          <button className="group px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl text-base sm:text-lg font-bold transition-all shadow-2xl hover:shadow-3xl hover:scale-105 transform duration-300 flex items-center justify-center gap-2">
            <span>Get Started</span>
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
          <button className="px-8 sm:px-10 py-3 sm:py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 hover:border-white/60 text-white rounded-2xl text-base sm:text-lg font-bold transition-all hover:bg-white/20 transform hover:scale-105 duration-300">
            Learn More
          </button>
        </div>

        {/* Trust badges - Hidden on mobile */}
        <div className="hidden sm:flex mt-12 lg:mt-16 justify-center gap-6 lg:gap-8 flex-wrap">
          <div className="flex items-center gap-2 text-white/80">
            <svg
              className="w-5 h-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Verified Listings</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <svg
              className="w-5 h-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <svg
              className="w-5 h-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">24/7 Support</span>
          </div>
        </div>
      </div>
    </section>
  );
}
