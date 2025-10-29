import { Check } from "lucide-react";

export default function ProgressBar({ currentStep, totalSteps, steps }) {
  // Default steps if not provided
  const defaultSteps = [
    { number: 1, label: "Choose Role" },
    { number: 2, label: "Enter Details" },
    { number: 3, label: "Accept Policies" },
    { number: 4, label: "Verify Email" },
  ];

  const stepsToShow = steps || defaultSteps;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full bg-slate-900 border-b border-slate-700 p-3 sm:p-4 lg:p-6">
      <div className="max-w-sm sm:max-w-lg lg:max-w-2xl mx-auto">
        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-4">
          {stepsToShow.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              {/* Circle */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step.number
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>

                {/* Label */}
                <div className="hidden sm:block">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      currentStep >= step.number
                        ? "text-white"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < stepsToShow.length - 1 && (
                <div className="flex-1 h-1 mx-2 sm:mx-3 rounded-full bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all ${
                      currentStep > step.number
                        ? "bg-indigo-600"
                        : "bg-slate-700"
                    }`}
                    style={{
                      width:
                        currentStep > step.number
                          ? "100%"
                          : currentStep === step.number
                          ? "50%"
                          : "0%",
                    }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Step Counter */}
        <p className="text-center text-xs text-slate-400 mt-3">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  );
}
