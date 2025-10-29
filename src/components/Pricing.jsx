import { Check } from "lucide-react";
import { useContext } from "react";
import { AuthModalContext } from "../context/AuthModalContext";

export default function Pricing() {
  const { selectSignUpRole } = useContext(AuthModalContext);

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex flex-col">
            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
              <p className="text-gray-600 mb-6">Perfect for new hosts</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">₱400</span>
                <span className="text-gray-600"> / 5 posts</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">
                    Up to 5 property listings
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">
                    Basic exposure on platform
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">Standard support</span>
                </li>
              </ul>
            </div>
            <button onClick={() => selectSignUpRole("host")} className="mt-auto w-full px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
              Become a Host
            </button>
          </div>

          {/* Featured Plan */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-8 rounded-2xl shadow-xl transform md:scale-105 relative flex flex-col">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-white mb-2">Featured</h3>
              <p className="text-purple-100 mb-6">For growing hosts</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">₱900</span>
                <span className="text-purple-100"> / 15 posts</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-purple-100">
                    Up to 15 property listings
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-purple-100">
                    Priority placement on listings
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-purple-100">
                    Highlighted host badge
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-purple-100">Priority support</span>
                </li>
              </ul>
            </div>
            <button onClick={() => selectSignUpRole("host")} className="mt-auto w-full px-6 py-3 bg-white text-purple-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              Become a Host
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex flex-col">
            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
              <p className="text-gray-600 mb-6">
                For professional property managers
              </p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">₱1,800</span>
                <span className="text-gray-600"> / 40 posts</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">
                    Up to 40 property listings
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">
                    Top placement in searches
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">Featured host profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-600">Dedicated support</span>
                </li>
              </ul>
            </div>
            <button onClick={() => selectSignUpRole("host")} className="mt-auto w-full px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
              Become a Host
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
