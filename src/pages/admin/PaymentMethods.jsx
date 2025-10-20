import { useState } from "react";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Settings,
  Shield,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

export default function PaymentMethods() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showApiKeys, setShowApiKeys] = useState({});

  const paymentProviders = [
    {
      id: 1,
      name: "PayPal",
      status: "active",
      transactionsToday: 145,
      totalVolume: 45280,
      successRate: 98.5,
      avgProcessingTime: "2.3s",
      logo: "💳",
      color: "indigo",
    },
    {
      id: 2,
      name: "Stripe",
      status: "active",
      transactionsToday: 89,
      totalVolume: 28950,
      successRate: 99.1,
      avgProcessingTime: "1.8s",
      logo: "💰",
      color: "violet",
    },
    {
      id: 3,
      name: "Credit Card",
      status: "active",
      transactionsToday: 234,
      totalVolume: 67820,
      successRate: 97.8,
      avgProcessingTime: "3.1s",
      logo: "💵",
      color: "emerald",
    },
    {
      id: 4,
      name: "Debit Card",
      status: "active",
      transactionsToday: 156,
      totalVolume: 38490,
      successRate: 98.2,
      avgProcessingTime: "2.9s",
      logo: "🏦",
      color: "amber",
    },
  ];

  const recentTransactions = [
    {
      id: "TXN-2024-001",
      method: "PayPal",
      guest: "Alice Cooper",
      amount: 450.0,
      fee: 13.5,
      status: "completed",
      date: "2024-02-15 14:23",
      type: "booking",
    },
    {
      id: "TXN-2024-002",
      method: "Credit Card",
      guest: "Bob Martin",
      amount: 280.0,
      fee: 8.4,
      status: "completed",
      date: "2024-02-15 13:45",
      type: "booking",
    },
    {
      id: "TXN-2024-003",
      method: "Stripe",
      guest: "Carol White",
      amount: 120.0,
      fee: 3.6,
      status: "pending",
      date: "2024-02-15 12:10",
      type: "booking",
    },
    {
      id: "TXN-2024-004",
      method: "PayPal",
      guest: "David Lee",
      amount: 95.0,
      fee: 2.85,
      status: "failed",
      date: "2024-02-15 11:30",
      type: "booking",
    },
    {
      id: "TXN-2024-005",
      method: "Debit Card",
      guest: "Eva Green",
      amount: 320.0,
      fee: 9.6,
      status: "completed",
      date: "2024-02-15 10:15",
      type: "refund",
    },
  ];

  const paymentConfig = [
    {
      provider: "PayPal",
      apiKey: "pk_live_51J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9",

      webhookUrl: "https://bookingnest.com/webhooks/paypal",
      testMode: false,
      color: "indigo",
    },
    {
      provider: "Stripe",
      apiKey: "pk_live_Z9Y8X7W6V5U4T3S2R1Q0P9O8N7M6L5K4J3",

      webhookUrl: "https://bookingnest.com/webhooks/stripe",
      testMode: false,
      color: "violet",
    },
  ];

  const stats = [
    {
      label: "Total Transactions",
      value: "624",
      change: "+18%",
      icon: CreditCard,
      color: "indigo",
    },
    {
      label: "Total Volume",
      value: "$180,540",
      change: "+24%",
      icon: DollarSign,
      color: "emerald",
    },
    {
      label: "Success Rate",
      value: "98.4%",
      change: "+2.1%",
      icon: CheckCircle,
      color: "violet",
    },
    {
      label: "Avg Processing",
      value: "2.5s",
      change: "-0.3s",
      icon: Zap,
      color: "amber",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
      case "completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "failed":
      case "inactive":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const toggleApiKeyVisibility = (provider) => {
    setShowApiKeys({
      ...showApiKeys,
      [provider]: !showApiKeys[provider],
    });
  };

  const maskApiKey = (key, show) => {
    if (show) return key;
    return key.substring(0, 12) + "•".repeat(key.length - 12);
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: TrendingUp },
    { id: "transactions", name: "Transactions", icon: CreditCard },
    { id: "configuration", name: "Configuration", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Payment Methods Management
        </h1>
        <p className="text-slate-400">
          Monitor and manage payment processing and methods
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-emerald-400 font-medium">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-800 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Payment Providers Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{provider.logo}</div>
                          <div>
                            <h4 className="text-lg font-semibold text-white">
                              {provider.name}
                            </h4>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                provider.status
                              )}`}
                            >
                              {provider.status}
                            </span>
                          </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">
                            Transactions Today
                          </p>
                          <p className="text-lg font-bold text-white">
                            {provider.transactionsToday}
                          </p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">
                            Total Volume
                          </p>
                          <p className="text-lg font-bold text-emerald-400">
                            ${provider.totalVolume.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">
                            Success Rate
                          </p>
                          <p className="text-lg font-bold text-indigo-400">
                            {provider.successRate}%
                          </p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">
                            Avg Time
                          </p>
                          <p className="text-lg font-bold text-violet-400">
                            {provider.avgProcessingTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Recent Transactions
                </h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Transaction ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Method
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Guest
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Fee
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm font-medium text-indigo-400">
                          {transaction.id}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400">
                            {transaction.method}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-white">
                          {transaction.guest}
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-white">
                          ${transaction.amount.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-400">
                          ${transaction.fee.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-300 capitalize">
                          {transaction.type}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-400">
                          {transaction.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === "configuration" && (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-300 font-medium mb-1">
                    Security Notice
                  </p>
                  <p className="text-xs text-amber-200/80">
                    API keys and secrets are sensitive information. Never share
                    them publicly or commit them to version control.
                  </p>
                </div>
              </div>

              {paymentConfig.map((config) => (
                <div
                  key={config.provider}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">
                      {config.provider} Configuration
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          config.testMode
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {config.testMode ? "Test Mode" : "Live Mode"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* API Key */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Publishable API Key
                      </label>
                      <div className="relative">
                        <input
                          type={
                            showApiKeys[config.provider] ? "text" : "password"
                          }
                          value={maskApiKey(
                            config.apiKey,
                            showApiKeys[config.provider]
                          )}
                          readOnly
                          className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() =>
                            toggleApiKeyVisibility(config.provider)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                          {showApiKeys[config.provider] ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Secret Key */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Secret Key
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={config.secretKey}
                          readOnly
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Webhook URL */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Webhook URL
                      </label>
                      <input
                        type="text"
                        value={config.webhookUrl}
                        readOnly
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium">
                        Update Configuration
                      </button>
                      <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium">
                        Test Connection
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
