import { CheckCircle, Lock, DollarSign, Headphones } from "lucide-react";
import { useEffect, useRef } from "react";

export default function FeaturesSection() {
  const canvasRef = useRef(null);

  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = [];
    const particleCount = 50;

    // Track mouse position
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current.x = e.clientX - rect.left;
      mousePos.current.y = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
        this.color = ["#06B6D4", "#0EA5E9", "#8B5CF6", "#EC4899"][
          Math.floor(Math.random() * 4)
        ];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.1)";
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw connecting lines between particles and to mouse cursor
      for (let i = 0; i < particles.length; i++) {
        // Draw lines from particle to mouse
        const dxMouse = particles[i].x - mousePos.current.x;
        const dyMouse = particles[i].y - mousePos.current.y;
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distanceMouse < 250) {
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 - distanceMouse / 1250})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mousePos.current.x, mousePos.current.y);
          ctx.stroke();
        }

        // Draw lines between particles
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.3 - distance / 500})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

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
    <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Interactive Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      ></canvas>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold text-center mb-4 sm:mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400">
              Why Choose BookingNest
            </span>
          </h2>
          <p className="text-center text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-200">
            Experience hassle-free booking with our trusted platform featuring
            verified listings, secure payments, and round-the-clock support
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative h-full perspective">
              {/* Card */}
              <div className="h-full p-6 sm:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-white/40 relative overflow-hidden hover:bg-white/15 transform group-hover:scale-105 group-hover:-translate-y-3 group-hover:rotate-y-5">
                {/* Gradient border glow effect on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 rounded-2xl sm:rounded-3xl transition-opacity duration-500 blur-xl pointer-events-none -z-10`}
                ></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full items-center text-center">
                  {/* Icon Container - Centered */}
                  <div
                    className={`bg-gradient-to-br ${feature.color} w-16 sm:w-20 h-16 sm:h-20 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-125 transition-transform duration-500 shadow-lg`}
                  >
                    <div className="text-white drop-shadow-lg">
                      {feature.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 group-hover:from-cyan-300 group-hover:to-blue-300 transition-all duration-300">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="leading-relaxed text-xs sm:text-sm lg:text-base text-white/80 group-hover:text-white/90 transition-colors duration-300 flex-1">
                    {feature.description}
                  </p>

                  {/* Bottom accent line */}
                  <div
                    className={`h-1 bg-gradient-to-r ${feature.color} rounded-full mt-4 sm:mt-6 w-0 group-hover:w-12 sm:group-hover:w-16 transition-all duration-500`}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 sm:mt-16 lg:mt-20">
          <button className="inline-block px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 hover:from-cyan-300 hover:via-blue-300 hover:to-purple-300 text-slate-900 font-bold text-sm sm:text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105 transform duration-300">
            Learn More About Us
          </button>
        </div>
      </div>
    </section>
  );
}
