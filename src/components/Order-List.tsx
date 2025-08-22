import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiRefreshCw } from "react-icons/fi";
import { baseUrl } from "../config";

interface Item {
  quantity: number;
}

interface Order {
  order_id: string;
  id: number;
  table_number: number;
  customer_name: string;
  estimated_time: string;
  total_amount: number;
  payment_method: string;
  status: string;
  items: Item[];
}

const baseURL = baseUrl;

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchId, setSearchId] = useState<string>("");
  const [searchTable, setSearchTable] = useState<string>("");
  const [searchDate, setSearchDate] = useState<string>(""); // State for date filter
  const navigate = useNavigate();

  // Read role from localStorage
  const userRole = localStorage.getItem("role"); // 'owner', 'manager', 'staff', etc.

  // COMPLETELY FIXED fetchAllOrders function with proper debugging
  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    setOrders([]);

    try {
      const token = localStorage.getItem("authToken");

      const params = new URLSearchParams({ _: Date.now().toString() });
      if (searchDate) params.set("date", searchDate);

      const apiUrl = `${baseURL}/api/orders?${params.toString()}`;

      const { data } = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const transformed: Order[] = data.map((order: any) => ({
        order_id: order.order_id || `ORD${String(order.id).padStart(5, "0")}`,
        id: order.id,
        table_number: order.table_number || order.tableNumber,
        customer_name: order.customer_name || "",
        estimated_time: order.estimated_time || order.estimatedTime,
        total_amount: order.total_amount || order.totalAmount,
        payment_method: order.payment_method || order.paymentMethod,
        status: order.status,
        items: order.items || [],
      }));

      const sortedOrders = transformed.sort((a, b) => {
        if (
          a.status.toLowerCase() === "pending" &&
          b.status.toLowerCase() === "completed"
        )
          return -1;
        if (
          a.status.toLowerCase() === "completed" &&
          b.status.toLowerCase() === "pending"
        )
          return 1;
        return 0;
      });

      setOrders(sortedOrders);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch orders"
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [searchDate]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]); // Re-fetch when searchDate changes

  const handleRowClick = (orderId: string) => {
    navigate(`/order-details/${orderId}`);
  };

  const getStatusStyling = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-300";
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "ready":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "served":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesOrderId = searchId
      ? order.order_id.toLowerCase().includes(searchId.toLowerCase())
      : true;

    const matchesTableNumber = searchTable
      ? order.table_number.toString().includes(searchTable)
      : true;

    return matchesOrderId && matchesTableNumber;
  });

  useEffect(() => {
    const handleFocus = () => {
      fetchAllOrders();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchAllOrders]); // Include searchDate in dependencies

  // Format date for display in Active Filters and header
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white min-h-screen p-6 overflow-x-hidden relative -mt-4 -mb-10">
      <div className="absolute top-6 right-0 translate-x-1/2 w-10 h-10 bg-[#FFA500] rounded-full shadow-lg z-10" />
      <div className="max-w-6xl mx-auto text-left mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-900 tracking-tight">
          Manage Your Orders
        </h1>
        <p className="mt-2 text-gray-500 text-sm sm:text-base">
          Track, filter, and update all restaurant orders in one place.
        </p>
      </div>

      {/* Search Inputs */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <div className="w-full sm:w-80">
            <input
              type="text"
              aria-label="Search Order ID"
              placeholder="🔍 Search Order ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full px-4 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm placeholder-gray-500 transition duration-200 bg-white"
            />
          </div>

          <div className="w-full sm:w-80">
            <input
              type="text"
              aria-label="Search Table Number"
              placeholder="🪑 Search Table Number"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="w-full px-4 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm placeholder-gray-500 transition duration-200 bg-white"
            />
          </div>

          <div className="w-full sm:w-80">
            <input
              type="date"
              aria-label="Search Date"
              placeholder="🪑 Search Date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full px-4 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm placeholder-gray-500 transition duration-200 bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllOrders}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 transition duration-200 shadow-sm border border-orange-200"
              title="Refresh Orders"
            >
              <FiRefreshCw className="text-lg" />
            </button>

            {(searchId || searchTable || searchDate) && (
              <button
                onClick={() => {
                  setSearchId("");
                  setSearchTable("");
                  setSearchDate("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition duration-200 border border-gray-200 hover:border-red-200"
                title="Clear All Filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {(searchId || searchTable || searchDate) && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
              <span>Active Filters:</span>
              {searchId && (
                <span className="bg-blue-100 px-2 py-0.5 rounded">
                  Order: {searchId}
                </span>
              )}
              {searchTable && (
                <span className="bg-blue-100 px-2 py-0.5 rounded">
                  Table: {searchTable}
                </span>
              )}
              {searchDate && (
                <span className="bg-blue-100 px-2 py-0.5 rounded">
                  Date: {formatDisplayDate(searchDate)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between max-w-6xl mx-auto mb-4 px-4 gap-3">
        {/* Left: Heading */}
        <div className="text-xl font-bold text-gray-800 text-center sm:text-left">
          Orders for{" "}
          {searchDate
            ? formatDisplayDate(searchDate)
            : new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
        </div>

        {/* Right: Buttons group */}
        <div className="flex flex-row flex-wrap sm:flex-row sm:items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={() => navigate("/tables")}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow"
          >
            View Tables
          </button>

          {["owner", "manager", "staff"].includes(userRole || "") && (
            <button
              onClick={() => navigate("/bill/direct")}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg shadow"
            >
              Generate Direct Bill
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-8 overflow-x-auto">
        <div className="border-t-2 border-[#FFA500]" />

        {/* Desktop Table Header */}
        <div className="hidden sm:grid min-w-[768px] grid-cols-8 font-semibold text-[#686363] py-3 text-base text-center sticky top-0 bg-[#f9f9f9] z-20">
          <div>Table No.</div>
          <div>Customer Name</div>  
          <div>Order ID</div>
          <div>Item Count</div>
          <div>Estimated Time</div>
          <div>Amount</div>
          <div>Payment</div>
          <div>Status</div>
        </div>

        <div className="border-t-2 border-[#FFA500] mb-4" />

        {loading && <div className="text-center p-4">Loading orders...</div>}
        {error && <div className="text-center text-red-600 p-4">{error}</div>}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="text-center text-gray-500">
            {searchDate
              ? "No orders are avaliable on this date."
              : "No orders found."}
          </div>
        )}

        {!loading &&
          !error &&
          filteredOrders.map((order) => (
            <div
  key={order.order_id}
  onClick={() => handleRowClick(order.order_id)}
  className={`grid grid-cols-1 sm:grid-cols-8 gap-y-2 sm:gap-0 items-center mt-4 bg-white shadow-md rounded-xl px-4 py-4 sm:px-5 sm:py-4 border ${
    order.status.toLowerCase() === "completed"
      ? "border-green-400"
      : "border-yellow-300"
  } transition hover:scale-[1.01] duration-200 ease-in-out cursor-pointer`}
>
              {/* ✅ MOBILE View */}
              <div className="sm:hidden flex flex-col gap-2 text-sm text-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Order ID</span>
                  <span className="text-gray-900 font-semibold">
                    {order.order_id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Table</span>
                  <span className="text-gray-900 font-semibold">
                    {order.table_number}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Customer</span>
                  <span className="text-gray-900 font-semibold">{order.customer_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Items</span>
                  <span className="text-gray-900 font-semibold">
                    {order.items.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Est. Time</span>
                  <span className="text-gray-900 font-semibold">
                    {order.estimated_time}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Amount</span>
                  <span className="text-gray-900 font-semibold">
                    ₹{order.total_amount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Payment</span>
                  <span className="text-gray-900 font-semibold">
                    {order.payment_method}
                  </span>
                </div>

                <div className="mt-3 flex justify-center">
                  <span
                    className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${getStatusStyling(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* ✅ DESKTOP View */}
              <div className="hidden sm:block text-center font-semibold">
                {order.table_number}
              </div>
              <div className="hidden sm:block text-center font-semibold">
                {order.customer_name}
              </div>
              <div className="hidden sm:block text-center font-semibold">
                {order.order_id}
              </div>
              <div className="hidden sm:block text-center font-semibold">
                {order.items.reduce((acc, item) => acc + item.quantity, 0)}
              </div>
              <div className="hidden sm:block text-center font-semibold">
                {order.estimated_time}
              </div>
              <div className="hidden sm:block text-center font-semibold">
                ₹{order.total_amount}
              </div>
              <div className="hidden sm:block text-center font-semibold">
                {order.payment_method}
              </div>
              <div className="hidden sm:block text-center">
                <span
                  className={`font-semibold text-sm px-3 py-1 rounded-full border ${getStatusStyling(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default OrderList;
