import { Link } from "react-router-dom";

export default function SideBarProfile({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-4 h-screen sticky top-0">
      {/* Logo */}
      <div className="mb-4">
        <Link to="/" className="flex items-center gap-2 text-slate-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#4F46E5"
          >
            <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm13 8H4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10zm-4 4h-4v4h4v-4z" />
          </svg>
          <span className="text-lg font-bold">
            Booking<span className="text-indigo-600">Nest</span>
          </span>
        </Link>
      </div>

      {/* Profile Card */}
      <div className="mb-4 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-2 flex items-center justify-center">
          <span className="text-xl font-bold text-indigo-600">JD</span>
        </div>
        <h2 className="text-base font-semibold text-slate-900">John Doe</h2>
        <p className="text-slate-500 text-xs">john.doe@example.com</p>
        <button className="mt-2 text-indigo-600 hover:text-indigo-700 text-xs font-medium">
          Change Photo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-slate-50 rounded-lg text-center">
        <div>
          <div className="text-lg font-bold text-slate-900">12</div>
          <div className="text-[10px] text-slate-500">Bookings</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900">8</div>
          <div className="text-[10px] text-slate-500">Reviews</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900">24</div>
          <div className="text-[10px] text-slate-500">Favorites</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        <button
          onClick={() => setActiveTab("personal")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            activeTab === "personal"
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-sm font-medium">Personal Info</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            activeTab === "security"
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-sm font-medium">Security</span>
        </button>

        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          onClick={() => setActiveTab("bookings")}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm font-medium">My Bookings</span>
        </button>

        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          onClick={() => setActiveTab("settings")}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm font-medium">Settings</span>
        </button>
      </nav>
    </aside>
  );
}
