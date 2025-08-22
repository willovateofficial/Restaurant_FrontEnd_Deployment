import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { baseUrl } from "../config";
import UserCart from "./user/UserCart";

interface Item {
  productId: number;
  quantity: number;
  price: number;
  status: string;
  name: string;
  id?: number;
}

interface Order {
  order_id: string;
  table_number: number;
  total_amount: number;
  payment_method: string;
  estimated_time: string;
  status: string;
  customer_name: string;
  created_at: string;
  items: Item[];
  pointsUsed?: number;
  discountAmount?: number;
}

const baseURL = baseUrl;

const OrderDetails: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const [showCart, setShowCart] = useState(false);

  const fetchOrder = React.useCallback(async () => {
    if (!orderId) {
      toast.error("Invalid order ID", {
        position: "top-center",
        autoClose: 3000,
      });
      navigate("/order-list", { replace: true });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to view order details", {
        position: "top-center",
        autoClose: 3000,
      });
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data);
      console.log("Fetched Order:", response.data);
    } catch (error) {
      const err = error as AxiosError;
      console.error("Error fetching order:", error);
      if (err.response?.status === 404) {
        toast.error("Order not found", {
          position: "top-center",
          autoClose: 3000,
        });
        navigate("/order-list", { replace: true });
      } else {
        toast.error("Failed to fetch order details. Please try again.", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-red-500";
      case "ready":
        return "bg-blue-500";
      case "served":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const updateItemStatus = async (itemIndex: number, newStatus: string) => {
    if (!order) return;

    setUpdatingItems((prev) => new Set(prev).add(itemIndex));

    try {
      const numericId = parseInt(order.order_id.replace("ORD", ""), 10);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to update item status", {
          position: "top-center",
          autoClose: 3000,
        });
        navigate("/login", { replace: true });
        return;
      }

      const item = order.items[itemIndex];
      await axios.patch(
        `${baseURL}/api/orders/${numericId}/items/${item.productId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedItems = [...order.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        status: newStatus,
      };

      const allItemsCompleted = updatedItems.every(
        (item) => item.status === "Completed"
      );
      const overallStatus = allItemsCompleted ? "Completed" : "Pending";

      setOrder({ ...order, items: updatedItems, status: overallStatus });
      toast.success(`Item status updated to ${newStatus}`, {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Failed to update item status", error);
      toast.error("Failed to update item status. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemIndex);
        return newSet;
      });
    }
  };

  const handleCompleteAllItems = async () => {
    if (!order) return;

    setUpdating(true);

    try {
      const numericId = parseInt(order.order_id.replace("ORD", ""), 10);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to complete order", {
          position: "top-center",
          autoClose: 3000,
        });
        navigate("/login", { replace: true });
        return;
      }

      await axios.patch(
        `${baseURL}/api/orders/${numericId}/complete-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedItems = order.items.map((item) => ({
        ...item,
        status: "Completed",
      }));

      setOrder({ ...order, items: updatedItems, status: "Completed" });
      toast.success("All items marked as completed!", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Failed to complete all items", error);
      toast.error("Failed to complete all items. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleProceedtoBilling = async () => {
    if (!order) return;

    const allItemsCompleted = order.items.every(
      (item) => item.status === "Completed"
    );

    if (!allItemsCompleted) {
      toast.warning("Please complete all items before proceeding to billing", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    // Restored passing order via state
    navigate(`/bill/${order.order_id}`, { state: { order } });
  };

  const handleCartEditDone = async () => {
    await fetchOrder();
  };

  const handleCloseCart = () => {
    setShowCart(false);
    handleCartEditDone();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-lg text-gray-600">
          Loading order details...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-lg text-red-600">Order not found.</div>
      </div>
    );
  }

  const completedItemsCount = order.items.filter(
    (item) => item.status === "Completed"
  ).length;
  const totalItemsCount = order.items.length;

  return (
    <div className="bg-white min-h-screen font-sans -mt-4 -mb-10">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-4">
          <button
            onClick={() => navigate("/order-list")}
            className="flex items-center gap-2 text-gray-700 hover:text-orange-600 transition-colors font-medium"
          >
            <FaArrowLeft className="text-lg" />
            <span>Back to Orders</span>
          </button>
        </div>
        <div className="bg-[#060224] text-white px-6 py-4 rounded-xl shadow-lg mb-6">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">
              Table No: {order.table_number}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{order.status}</div>
              <div className="text-xs opacity-75 mt-1">
                {completedItemsCount}/{totalItemsCount} items completed
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Order ID
            </h3>
            <p className="text-lg font-medium text-black">{order.order_id}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Customer Name
            </h3>
            <p className="text-lg font-medium text-black">
              {order.customer_name}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Payment Method
            </h3>
            <p className="text-lg font-medium text-black">
              {order.payment_method}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Estimated Time
            </h3>
            <p className="text-lg font-medium text-black">
              {order.estimated_time}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md ">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Total Amount
            </h3>
            <p className="text-lg font-medium text-black">
              ₹{order.total_amount}
              {order.pointsUsed !== undefined && order.pointsUsed > 0 && (
                <span className="text-sm text-gray-500">
                  {" "}
                  ({order.pointsUsed} points used)
                </span>
              )}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Discount
            </h3>
            <p className="text-lg font-medium text-black">
              − ₹{order.discountAmount || 0}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-700">Items Ordered</h2>
          <div className="flex flex-row gap-2 w-full sm:w-auto sm:gap-3">
            <button
              onClick={() => setShowCart(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition duration-300 flex-1 sm:flex-none"
            >
              Edit Order
            </button>
            <button
              onClick={handleCompleteAllItems}
              disabled={completedItemsCount === totalItemsCount}
              className={`${
                updating || completedItemsCount === totalItemsCount
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition duration-300 flex-1 sm:flex-none`}
            >
              {updating ? "Processing..." : "Order Complete"}
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="font-semibold text-black text-lg">
                  {item.name}
                </div>
                <div className="text-lg font-semibold text-gray-700">
                  ₹{item.price}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Qty: {item.quantity}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-600 font-medium">
                    Status:
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Change item status"
                      value={item.status}
                      onChange={(e) => updateItemStatus(index, e.target.value)}
                      disabled={updatingItems.has(index)}
                      className={`font-medium px-3 py-1 rounded-full text-white text-xs border-none outline-none cursor-pointer ${getStatusColor(
                        item.status
                      )} ${
                        updatingItems.has(index)
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Ready">Ready</option>
                      <option value="Served">Served</option>
                      <option value="Completed">Completed</option>
                    </select>
                    {updatingItems.has(index) && (
                      <div className="text-xs text-gray-500 animate-pulse">
                        Updating...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <button
            onClick={handleProceedtoBilling}
            disabled={completedItemsCount !== totalItemsCount}
            className={`${
              completedItemsCount !== totalItemsCount
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#060224] hover:bg-[#1a1a40]"
            } text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition duration-300 transform hover:scale-105`}
          >
            Proceed to Billing
          </button>
          {completedItemsCount !== totalItemsCount && (
            <p className="text-sm text-gray-500 mt-3">
              Please complete all items before proceeding to billing
            </p>
          )}
        </div>
      </div>

      {showCart && order && (
        <UserCart
          items={order.items.map((item, index) => ({
            id: typeof item.productId === "number" ? item.productId : index,
            name: item.name,
            image: "",
            quantity: item.quantity,
            price: item.price,
            status: item.status,
          }))}
          orderId={order.order_id}
          tableNumber={order.table_number}
          discountAmount={order.discountAmount || 0}
          onClose={handleCloseCart}
        />
      )}
    </div>
  );
};

export default OrderDetails;
