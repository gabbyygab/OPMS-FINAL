import { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

// Sample booking data - replace with your Firebase data
const sampleBookings = [
  {
    id: 1,
    title: "Beachfront Villa",
    location: "Boracay, Philippines",
    checkIn: "2025-10-20",
    checkOut: "2025-10-23",
    guests: 4,
    price: 5000,
    status: "confirmed",
    photo: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400",
    type: "stays",
  },
  {
    id: 2,
    title: "Mountain Hiking Tour",
    location: "Baguio, Philippines",
    checkIn: "2025-10-25",
    checkOut: "2025-10-25",
    guests: 2,
    price: 1500,
    status: "pending",
    photo: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400",
    type: "experiences",
  },
  {
    id: 3,
    title: "Photography Service",
    location: "Manila, Philippines",
    checkIn: "2025-11-05",
    checkOut: "2025-11-05",
    guests: 6,
    price: 3000,
    status: "confirmed",
    photo: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400",
    type: "services",
  },
  {
    id: 4,
    title: "Luxury Condo Stay",
    location: "Makati, Philippines",
    checkIn: "2025-11-15",
    checkOut: "2025-11-18",
    guests: 2,
    price: 8000,
    status: "confirmed",
    photo: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
    type: "stays",
  },
];

function parseDate(dateStr) {
  return dateStr ? new Date(dateStr) : null;
}

function formatDate(dateStr) {
  const date = parseDate(dateStr);
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyBookingsSection() {
  const [bookings, setBookings] = useState(sampleBookings);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Get bookings for selected date
  const getBookingsForDate = (date) => {
    return bookings.filter((booking) => {
      const checkIn = parseDate(booking.checkIn);
      const checkOut = parseDate(booking.checkOut);
      return date >= checkIn && date <= checkOut;
    });
  };

  // Get all dates with bookings in current month
  const getDatesWithBookings = () => {
    const dates = new Set();
    bookings.forEach((booking) => {
      const checkIn = parseDate(booking.checkIn);
      const checkOut = parseDate(booking.checkOut);
      const current = new Date(checkIn);

      while (current <= checkOut) {
        if (
          current.getMonth() === currentMonth.getMonth() &&
          current.getFullYear() === currentMonth.getFullYear()
        ) {
          dates.add(current.getDate());
        }
        current.setDate(current.getDate() + 1);
      }
    });
    return dates;
  };

  const datesWithBookings = getDatesWithBookings();

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const selectDate = (day) => {
    setSelectedDate(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    );
  };

  // Filter bookings
  const filteredBookings =
    activeFilter === "all"
      ? bookings
      : bookings.filter((b) => b.type === activeFilter);

  const selectedDateBookings = getBookingsForDate(selectedDate);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('/guestBg.png')] bg-cover bg-center opacity-5"></div>

      <div className="relative z-10">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
            <p className="text-slate-300">
              View and manage your upcoming reservations
            </p>
          </div>

          <div className="flex gap-3 mb-8 flex-wrap">
            {["all", "stays", "services", "experiences"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeFilter === filter
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white hover:border-slate-600"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 cursor-pointer group"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-48 h-48 flex-shrink-0 relative overflow-hidden">
                        <img
                          src={booking.photo}
                          alt={booking.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-white">
                              {booking.title}
                            </h3>
                            <span
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                booking.status === "confirmed"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {booking.status.charAt(0).toUpperCase() +
                                booking.status.slice(1)}
                            </span>
                          </div>

                          <div className="flex items-center text-slate-300 text-sm mb-2">
                            <MapPin className="w-4 h-4 mr-1.5 text-indigo-400" />
                            {booking.location}
                          </div>

                          <div className="flex items-center text-slate-400 text-sm mb-2">
                            <Calendar className="w-4 h-4 mr-1.5 text-emerald-400" />
                            {formatDate(booking.checkIn)} -{" "}
                            {formatDate(booking.checkOut)}
                          </div>

                          <div className="flex items-center text-slate-400 text-sm">
                            <Users className="w-4 h-4 mr-1.5 text-amber-400" />
                            {booking.guests}{" "}
                            {booking.guests === 1 ? "Guest" : "Guests"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                          <div>
                            <span className="text-xs text-slate-400 block">Total Amount</span>
                            <span className="text-xl font-bold text-white">
                              ₱{booking.price.toFixed(2)}
                            </span>
                          </div>
                          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-12 text-center">
                  <Calendar className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No bookings found
                  </h3>
                  <p className="text-slate-400">
                    You don't have any{" "}
                    {activeFilter !== "all" ? activeFilter : "bookings"} yet.
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg p-6 sticky top-36">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={previousMonth}
                      className="p-1.5 hover:bg-slate-700 rounded-lg transition"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-1.5 hover:bg-slate-700 rounded-lg transition"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-slate-400 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const hasBooking = datesWithBookings.has(day);
                    return (
                      <button
                        key={day}
                        onClick={() => selectDate(day)}
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition-all relative ${
                          isSelected(day)
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                            : isToday(day)
                            ? "bg-slate-700 text-white"
                            : "text-slate-300 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {day}
                        {hasBooking && (
                          <span
                            className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                              isSelected(day) ? "bg-white" : "bg-indigo-400"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>

                  {selectedDateBookings.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="p-3 bg-slate-900/50 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-900 hover:border-slate-600 transition-all"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <p className="text-sm font-semibold text-white truncate">
                            {booking.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {booking.location}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      No bookings on this date
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {selectedBooking && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <img
                src={selectedBooking.photo}
                alt={selectedBooking.title}
                className="w-full h-48 object-cover rounded-xl mb-4 border border-slate-700"
              />

              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {selectedBooking.title}
                </h2>
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    selectedBooking.status === "confirmed"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {selectedBooking.status.charAt(0).toUpperCase() +
                    selectedBooking.status.slice(1)}
                </span>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center text-slate-300 text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-indigo-400" />
                  {selectedBooking.location}
                </div>

                <div className="flex items-center text-slate-300 text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-emerald-400" />
                  {formatDate(selectedBooking.checkIn)} -{" "}
                  {formatDate(selectedBooking.checkOut)}
                </div>

                <div className="flex items-center text-slate-300 text-sm">
                  <Users className="w-4 h-4 mr-2 text-amber-400" />
                  {selectedBooking.guests}{" "}
                  {selectedBooking.guests === 1 ? "Guest" : "Guests"}
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Amount</span>
                  <span className="text-2xl font-bold text-white">
                    ₱{selectedBooking.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-slate-700 text-white py-3 rounded-lg font-semibold hover:bg-slate-600 transition-all border border-slate-600">
                  Cancel Booking
                </button>
                <button className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                  Contact Host
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
