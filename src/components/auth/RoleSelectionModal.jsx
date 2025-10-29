import { Home, Briefcase, ArrowRight } from "lucide-react";
import ProgressBar from "./ProgressBar";

export default function RoleSelectionModal({ onSelectRole, onCancel }) {
  const steps = [
    { number: 1, label: "Choose Role" },
    { number: 2, label: "Enter Details" },
    { number: 3, label: "Accept Policies" },
    { number: 4, label: "Verify Email" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col overflow-y-auto">
      {/* Progress Bar */}
      <ProgressBar currentStep={1} totalSteps={4} steps={steps} />

      {/* Modal Content */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-sm sm:max-w-lg lg:max-w-2xl border border-slate-700 shadow-2xl overflow-hidden my-auto">
          {/* Header */}
          <div className="p-4 sm:p-6 lg:p-8 text-center border-b border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
              How do you want to use BookingNest?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Choose your role to get started with our platform
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guest Card */}
              <button
                onClick={() => onSelectRole("guest")}
                className="group relative p-6 rounded-xl border-2 border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50 transition-all duration-300 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-indigo-600/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="relative">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Home className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-2">Guest</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Book amazing stays, experiences, and services from trusted hosts.
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                      Browse listings
                    </li>
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                      Make bookings
                    </li>
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                      Manage payments
                    </li>
                  </ul>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-indigo-400 group-hover:text-indigo-300 transition-colors font-medium text-sm">
                    Continue as Guest
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Host Card */}
              <button
                onClick={() => onSelectRole("host")}
                className="group relative p-6 rounded-xl border-2 border-slate-700 hover:border-purple-500 hover:bg-slate-800/50 transition-all duration-300 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-purple-600/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="relative">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-2">Host</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    List your properties, experiences, or services and earn money.
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                      Create listings
                    </li>
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                      Manage bookings
                    </li>
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                      Earn money
                    </li>
                  </ul>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300 transition-colors font-medium text-sm">
                    Continue as Host
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="w-full mt-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 hover:border-slate-500 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
