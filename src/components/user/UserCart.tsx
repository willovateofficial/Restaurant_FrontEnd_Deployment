import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus, FaTrash } from "react-icons/fa";
import axios, { AxiosError } from "axios";
import cartImg from "../../assets/CartImg.jpg";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { baseUrl } from "../../config";

export interface CartItem {
  id: number;
  name: string;
  image: string;
  quantity: number;
  price: number;
  status?: string;
}

interface CartItemPayload {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  status: string;
}

interface OrderResponse {
  order_id?: string;
  id?: string;
}

interface OrderData {
  cart_items: CartItemPayload[];
  table_number: number;
  total_amount: number;
  payment_method: string;
  estimated_time: string;
  pointsUsed?: number;
  businessId: number | null;
  customerId?: number;
  customer_name: string;
  discountAmount?: number;
}

interface OrderType {
  order_id: string;
  items: CartItem[];
  table_number: number;
  total_amount: number;
  payment_method: string;
  estimated_time: string;
  pointsUsed?: number;
  status?: string;
  customerId?: number;
  businessId?: number;
}

interface UserCartProps {
  items: CartItem[];
  onClose: () => void;
  onIncrement?: (id: number) => void;
  onDecrement?: (id: number) => void;
  orderId?: string;
  onNextStep?: () => void;
  onItemDelete?: (id: number) => void;
  tableNumber?: number;
  discountAmount?: number;
}

function markTableBooked(tableNumber: number) {
  let bookedTables = JSON.parse(localStorage.getItem("bookedTables") || "{}");
  bookedTables[tableNumber] = true;
  localStorage.setItem("bookedTables", JSON.stringify(bookedTables));
}

const baseURL = baseUrl;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `${baseURL}/api`;

const UserCart: React.FC<UserCartProps> = ({
  items,
  onClose,
  onIncrement,
  onDecrement,
  orderId,
  onNextStep,
  onItemDelete,
  tableNumber: tableNumberProp,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<"Cash on Counter">("Cash on Counter");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [originalQuantities, setOriginalQuantities] = useState<
    Record<number, number>
  >({});
  const [existingItemIds, setExistingItemIds] = useState<Set<number>>(
    new Set()
  );
  const [role, setRole] = useState<string | null>(null);
  const [isPrivilegedUser, setIsPrivilegedUser] = useState<boolean>(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
    setIsPrivilegedUser(
      ["owner", "staff", "manager", "chief"].includes(storedRole || "")
    );
  }, []);

  console.log(order);

  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("customerToken");

  const billData = {
    table_number: tableNumber,
    created_at: new Date().toISOString(),
    payment_method: paymentMethod,
    status: "Pending",
    items: cartItems,
    discountAmount,
  };

  const currentOrderId = orderId || localStorage.getItem("editOrderId");
  const isValidOrderId = currentOrderId && /^ORD\d{5,}$/.test(currentOrderId);
  const isEditMode = !!currentOrderId;

  const mergeAllItems = (
    propItems: CartItem[],
    existingItems: CartItem[],
    newItems: CartItem[]
  ): CartItem[] => {
    const merged = new Map<number, CartItem>();

    // Add all existing (original) items - preserve their status
    existingItems.forEach((item) =>
      merged.set(item.id, {
        ...item,
        image: item.image || cartImg,
        status: item.status || "Pending", // Keep existing status
      })
    );

    // Add or merge with newItems (sum quantities if present)
    newItems.forEach((item) => {
      if (!merged.has(item.id)) {
        merged.set(item.id, {
          ...item,
          image: item.image || cartImg,
          status: item.status || "Pending", // New items should be Pending
        });
      } else {
        const ex = merged.get(item.id)!;
        merged.set(item.id, {
          ...ex,
          quantity: ex.quantity + item.quantity,
          // Don't reset status here - let checkForModifications handle it
        });
      }
    });

    // Add propItems as final override
    propItems.forEach((item) => {
      if (!merged.has(item.id)) {
        merged.set(item.id, {
          ...item,
          image: item.image || cartImg,
          status: item.status || "Pending",
        });
      }
      // Do NOT override here; trust previous logic for quantity
    });

    // Ensure all quantities minimum 1
    const arr = Array.from(merged.values()).map((x) => ({
      ...x,
      quantity:
        typeof x.quantity === "number" && x.quantity > 0 ? x.quantity : 1,
    }));
    return arr;
  };

  useEffect(() => {
    console.log("orderId:", orderId);
    console.log("Passed tableNumber prop:", tableNumberProp);
    console.log("Props items:", items);

    // Define fetchOrderDetails function inside useEffect
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      setLoading(true);
      const token = localStorage.getItem("customerToken");
      try {
        const numericOrderId = orderId ? orderId.replace("ORD", "") : "";
        if (!numericOrderId) {
          toast.error("Invalid order ID", {
            position: "top-center",
            autoClose: 3000,
          });
          setLoading(false);
          return;
        }
        const res = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(res.data);
        if (res.data.customer_name) {
          setCustomerName(res.data.customer_name);
          localStorage.setItem("customerName", res.data.customer_name);
        }
        if (res.data.discountAmount) {
          setDiscountAmount(res.data.discountAmount);
        }
        if (res.data.appliedCouponCode) {
          setCouponCode(res.data.appliedCouponCode);
          setAppliedCoupon({ code: res.data.appliedCouponCode });
        }
        const fetchedItems: CartItem[] = res.data.items.map((item: any) => ({
          id: item.productId,
          name: item.name,
          image: item.image || cartImg,
          quantity: item.quantity,
          price: item.price,
          status: item.status,
        }));
        setCartItems(fetchedItems);

        localStorage.setItem(
          "originalExistingItems",
          JSON.stringify(fetchedItems)
        );

        const fetchedIds = new Set(fetchedItems.map((item) => item.id));
        setExistingItemIds(fetchedIds);
        const origQtys: Record<number, number> = {};
        fetchedItems.forEach((item) => {
          origQtys[item.id] = item.quantity;
        });
        setOriginalQuantities(origQtys);
        localStorage.setItem(
          "originalExistingItems",
          JSON.stringify(fetchedItems)
        );
        localStorage.setItem("existingItems", JSON.stringify(fetchedItems));
      } catch (error) {
        toast.error("Failed to fetch order details. Please try again.", {
          position: "top-center",
          autoClose: 3000,
        });
      }
      setLoading(false);
    };

    let finalTableNumber: number | null = null;

    if (orderId) {
      const orderTableNum = localStorage.getItem(
        `order_${orderId}_tableNumber`
      );
      if (orderTableNum) {
        finalTableNumber = parseInt(orderTableNum);
      } else if (tableNumberProp) {
        finalTableNumber = tableNumberProp;
        localStorage.setItem(
          `order_${orderId}_tableNumber`,
          finalTableNumber.toString()
        );
      }
    } else if (tableNumberProp) {
      finalTableNumber = tableNumberProp;
    } else {
      const qrTableNumber = localStorage.getItem("qrScannedTableNumber");
      if (qrTableNumber) {
        finalTableNumber = parseInt(qrTableNumber);
      }
    }

    if (finalTableNumber === null) {
      const persistedTableNumber = localStorage.getItem("persistedTableNumber");
      if (persistedTableNumber) {
        finalTableNumber = parseInt(persistedTableNumber);
      }
      const storedTable =
        localStorage.getItem("selectedTableNumber") ||
        localStorage.getItem("table_number");
      if (storedTable) finalTableNumber = parseInt(storedTable);
    }

    setTableNumber(finalTableNumber);

    if (orderId && finalTableNumber !== null) {
      markTableBooked(finalTableNumber);
    }

    const storedName = localStorage.getItem("customerName");
    if (storedName) setCustomerName(storedName);

    setIsEditing(isEditMode);

    // Fetch points if logged in
    if (isLoggedIn) {
      const customerToken = localStorage.getItem("customerToken");
      if (customerToken) {
        axios
          .get(`${API_BASE_URL}/customers/customer`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          })
          .then((res) => {
            const customers = res.data;
            const myId = localStorage.getItem("customerId");
            const me = customers.find((c: any) => c.id === Number(myId));
            if (me) setAvailablePoints(me.points || 0);
          })
          .catch(() => {
            toast.error("Failed to fetch customer points", {
              position: "top-center",
              autoClose: 3000,
            });
          });
      }
    }

    // Handle cart items initialization and merging
    if (isEditMode && orderId) {
      const hasFetched = localStorage.getItem(`fetched_${orderId}`);
      if (!hasFetched) {
        localStorage.setItem(`fetched_${orderId}`, "true");
        fetchOrderDetails();
      } else {
        // If already fetched, get existing items and merge with new ones
        let existingItems: CartItem[] = [];
        try {
          existingItems = JSON.parse(
            localStorage.getItem("existingItems") || "[]"
          );
        } catch {
          existingItems = [];
        }

        let newItems: CartItem[] = [];
        try {
          newItems = JSON.parse(
            localStorage.getItem("newlyAddedItems") || "[]"
          );
        } catch {
          newItems = [];
        }

        const allItems = mergeAllItems(items, existingItems, newItems);
        setCartItems(allItems);

        // Update localStorage with merged items
        localStorage.setItem("existingItems", JSON.stringify(allItems));

        if (newItems.length > 0 || items.length > 0) {
          const newItemNames = [...newItems, ...items];
          if (newItemNames) {
            toast.success(`Added to cart: ${newItemNames}`, {
              position: "top-center",
              autoClose: 3000,
            });
          }
          localStorage.setItem("newlyAddedItems", JSON.stringify([]));
        }
      }
    } else if (isEditMode && !orderId) {
      let existingItems: CartItem[] = [];
      try {
        existingItems = JSON.parse(
          localStorage.getItem("originalExistingItems") || "[]"
        );
        setExistingItemIds(new Set(existingItems.map((item) => item.id)));
        const origQtys: Record<number, number> = {};
        existingItems.forEach((item) => {
          origQtys[item.id] = item.quantity;
        });
        setOriginalQuantities(origQtys);
      } catch {}

      let newItems: CartItem[] = [];
      try {
        newItems = JSON.parse(localStorage.getItem("newlyAddedItems") || "[]");
      } catch {
        newItems = [];
      }

      if (currentOrderId) {
        newItems = newItems.filter((item) => {
          const itemOrderId = localStorage.getItem(`item_${item.id}_orderId`);
          return !itemOrderId || itemOrderId === currentOrderId;
        });
      }

      const allItems = mergeAllItems(items, existingItems, newItems);
      setCartItems(allItems);
      localStorage.setItem("existingItems", JSON.stringify(allItems));

      if (newItems.length > 0 || items.length > 0) {
        localStorage.setItem("newlyAddedItems", JSON.stringify([]));
      }
    } else {
      // Non-edit mode
      setExistingItemIds(new Set());
      setOriginalQuantities({});

      let existingItems: CartItem[] = [];
      try {
        existingItems = JSON.parse(
          localStorage.getItem("existingItems") || "[]"
        );
      } catch {
        existingItems = [];
      }

      let newItems: CartItem[] = [];
      try {
        newItems = JSON.parse(localStorage.getItem("newlyAddedItems") || "[]");
      } catch {
        newItems = [];
      }

      const allItems = mergeAllItems(items, existingItems, newItems);
      setCartItems(allItems);
      localStorage.setItem("existingItems", JSON.stringify(allItems));

      if (newItems.length > 0 || items.length > 0) {
        const newItemNames = [...newItems, ...items]
          .map((item) => item.name)
          .join(", ");
        if (newItemNames) {
          toast.success(`Added to cart: ${newItemNames}`, {
            position: "top-center",
            autoClose: 3000,
          });
        }
        localStorage.setItem("newlyAddedItems", JSON.stringify([]));
      }
    }

    // Cleanup function
    return () => {
      if (orderId) {
        localStorage.removeItem(`fetched_${orderId}`);
      }
    };
  }, [orderId, items, currentOrderId, isLoggedIn, isEditMode, tableNumberProp]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/coupons/validate`,
        { code: couponCode, orderTotal: total },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { discount = 0, coupon = null } = res.data;
      setDiscountAmount(discount);
      setAppliedCoupon(coupon);
      toast.success(`Coupon applied: ₹${discount} off`, {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error || "Invalid or expired coupon code",
        {
          position: "top-center",
          autoClose: 3000,
        }
      );
      setAppliedCoupon(null);
      setDiscountAmount(0);
    }
  };

  const handleIncrement = (id: number) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      );
      localStorage.setItem("existingItems", JSON.stringify(updatedItems));
      return updatedItems;
    });
    if (onIncrement) onIncrement(id);
  };

  const handleDecrement = (id: number) => {
    const isExisting = isEditMode && existingItemIds.has(id);
    const originalQty = originalQuantities[id] || 1;

    setCartItems((prevItems) => {
      const updated = prevItems.map((item) => {
        if (item.id === id) {
          // For original items, allow decrement only down to original quantity
          if (isExisting) {
            if (item.quantity > originalQty) {
              return { ...item, quantity: item.quantity - 1 };
            } else {
              toast.info("Cannot reduce quantity below original amount", {
                position: "top-center",
                autoClose: 2000,
              });
              return item;
            }
          }
          // For new items, allow decrement to 1
          if (item.quantity > 1) {
            return { ...item, quantity: item.quantity - 1 };
          }
        }
        return item;
      });
      localStorage.setItem("existingItems", JSON.stringify(updated));
      return updated;
    });
    if (onDecrement) onDecrement(id);
  };

  const handleDelete = (id: number) => {
    if (isEditMode && existingItemIds.has(id)) {
      toast.info("Cannot delete original items in edit mode", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    const itemToDelete = cartItems.find((item) => item.id === id);
    const updatedItems = cartItems.filter((item) => item.id !== id);
    setCartItems(updatedItems);
    localStorage.setItem("existingItems", JSON.stringify(updatedItems));
    localStorage.removeItem(`item_${id}_orderId`);

    if (onItemDelete) onItemDelete(id);
    if (itemToDelete) {
      toast.info(`Removed: ${itemToDelete.name}`, {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const handleAddNewItem = () => {
    const editId = orderId || localStorage.getItem("editOrderId") || "";
    localStorage.setItem("existingItems", JSON.stringify(cartItems));
    localStorage.setItem("editOrderId", editId);
    localStorage.setItem(
      "persistedTableNumber",
      (tableNumber ?? "").toString()
    );

    cartItems.forEach((item) => {
      localStorage.setItem(`item_${item.id}_orderId`, editId);
    });

    // Clear newly added items to prevent duplication
    localStorage.setItem("newlyAddedItems", JSON.stringify([]));
    navigate("/restaurant");
  };

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const finalAmount = Math.max(0, total - discountAmount - pointsToUse);

  const cleanupLocalStorage = () => {
    localStorage.removeItem("editOrderId");
    localStorage.removeItem("existingItems");
    localStorage.removeItem("newlyAddedItems");
    localStorage.removeItem("originalExistingItems");
    cartItems.forEach((item) => {
      localStorage.removeItem(`item_${item.id}_orderId`);
    });
  };

  const handleOrderSubmit = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name before placing the order.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    if (!tableNumber || tableNumber <= 0) {
      toast.error("Please select a valid table number.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    if (pointsToUse < 0 || isNaN(pointsToUse)) {
      toast.error("Invalid points value.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);

    // Check if there are any modifications
    const itemStatuses = getItemStatuses(cartItems);
    const hasModifications = Object.values(itemStatuses).some(
      (status) => status === "Pending"
    );

    const cart_items: CartItemPayload[] = cartItems.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      status: itemStatuses[item.id], // Only reset to Pending if there are modifications
    }));

    const businessId = Number(localStorage.getItem("businessId"));
    const token = localStorage.getItem("customerToken");
    const customerId = localStorage.getItem("customerId");
    const orderData: OrderData = {
      businessId,
      table_number: tableNumber,
      cart_items,
      total_amount: finalAmount,
      discountAmount,
      payment_method: paymentMethod,
      estimated_time: "15 min",
      pointsUsed: pointsToUse,
      customer_name: customerName,
      ...(customerId && { customerId: parseInt(customerId) }),
    };

    try {
      const response = currentOrderId
        ? await axios.put<OrderResponse>(
            `${API_BASE_URL}/orders/${currentOrderId}`,
            orderData,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        : await axios.post<OrderResponse>(`${API_BASE_URL}/orders`, orderData, {
            headers: { Authorization: `Bearer ${token}` },
          });

      if ([200, 201].includes(response.status)) {
        const newOrderId =
          response.data.order_id || response.data.id || currentOrderId || "N/A";

        localStorage.setItem(
          `order_${newOrderId}_tableNumber`,
          tableNumber.toString()
        );
        localStorage.setItem("lastOrderId", newOrderId);
        markTableBooked(tableNumber);
        cleanupLocalStorage();

        if (isEditMode) {
          toast.success(
            hasModifications
              ? "Order updated successfully! Modified items reset to Pending."
              : "Order saved with no changes.",
            {
              position: "top-center",
              autoClose: 2000,
            }
          );
          setLoading(false);
          onClose();
          if (onNextStep) onNextStep();
          if (isValidOrderId) {
            if (isPrivilegedUser) {
              navigate(`/order-details/${currentOrderId}`, { replace: true });
            } else {
              setTimeout(() => {
                localStorage.setItem("trackFromRedirect", "true");
                navigate("/track-order", { replace: true });
              }, 300);
            }
          }
        } else {
          toast.success("Order placed successfully!", {
            position: "top-center",
            autoClose: 2000,
          });
          onClose();
          if (isPrivilegedUser) {
            navigate(`/order-details/${newOrderId}`, { replace: true });
          } else {
            navigate("/track-order", { replace: true });
          }
        }
      }
    } catch (error) {
      const err = error as AxiosError;
      if (err?.response?.status === 404) {
        toast.error(
          `Order ${currentOrderId} not found! Please check the order ID or contact support.`,
          {
            position: "top-center",
            autoClose: 3000,
          }
        );
      } else {
        toast.error("Something went wrong! Please try again.", {
          position: "top-center",
          autoClose: 2000,
        });
      }
      setLoading(false);
    }
  };

  // Add this function to check for modifications
  const getItemStatuses = (
    currentItems: CartItem[]
  ): Record<number, string> => {
    if (!isEditMode) {
      // For new orders, all items should be Pending
      const statuses: Record<number, string> = {};
      currentItems.forEach((item) => {
        statuses[item.id] = "Pending";
      });
      return statuses;
    }

    // Get original items from localStorage
    const originalItemsStr = localStorage.getItem("originalExistingItems");
    if (!originalItemsStr) {
      // If no original items found, all items should be Pending
      const statuses: Record<number, string> = {};
      currentItems.forEach((item) => {
        statuses[item.id] = "Pending";
      });
      return statuses;
    }

    try {
      const originalItems: CartItem[] = JSON.parse(originalItemsStr);
      const statuses: Record<number, string> = {};

      // For each current item, determine its status
      for (const currentItem of currentItems) {
        const originalItem = originalItems.find(
          (item) => item.id === currentItem.id
        );

        if (!originalItem) {
          // New item added - should be Pending
          statuses[currentItem.id] = "Pending";
        } else if (originalItem.quantity !== currentItem.quantity) {
          // Quantity changed - should be Pending
          statuses[currentItem.id] = "Pending";
        } else {
          // No changes - keep original status
          statuses[currentItem.id] = originalItem.status || "Pending";
        }
      }

      return statuses;
    } catch (error) {
      console.error("Error determining item statuses:", error);
      // If there's an error, all items should be Pending
      const statuses: Record<number, string> = {};
      currentItems.forEach((item) => {
        statuses[item.id] = "Pending";
      });
      return statuses;
    }
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
        <div className="w-[90%] max-w-sm md:max-w-lg bg-white shadow-2xl flex flex-col rounded-2xl overflow-hidden">
          <div className="relative">
            <img
              src={cartImg}
              alt="Cart banner"
              className="w-full h-36 object-cover"
            />
            <button
              className="absolute top-3 right-3 bg-[#FF2E2E] text-white rounded-full w-8 h-8 flex items-center justify-center"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="p-4 overflow-y-auto text-[#333] max-h-[60vh]">
            <div className="flex justify-between text-sm font-semibold mb-2 text-[#555]">
              <div className="font-bold">
                {isEditMode ? (
                  <div>
                    <div className="text-orange-600">Editing Order</div>
                    <div className="text-xs text-gray-600">
                      {currentOrderId}
                    </div>
                  </div>
                ) : (
                  "My Cart"
                )}
              </div>
              <span className="text-xl font-bold">›</span>
            </div>

            <h2 className="text-xl font-bold mb-3">Today's Meal</h2>

            {cartItems.length === 0 && (
              <p className="text-center text-gray-500">No items in cart.</p>
            )}

            {cartItems.map((item) => {
              const isExisting = isEditMode && existingItemIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className="flex justify-between bg-[#FFF6F0] p-3 mb-3 rounded-xl shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || cartImg}
                      alt={item.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-semibold">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border border-gray-300 shadow">
                    <button
                      onClick={() => handleDecrement(item.id)}
                      className={`transition-colors ${
                        isExisting &&
                        item.quantity <= (originalQuantities[item.id] || 1)
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:text-orange-600"
                      }`}
                      title={
                        isExisting &&
                        item.quantity <= (originalQuantities[item.id] || 1)
                          ? "Cannot reduce below original"
                          : "Decrease quantity"
                      }
                      disabled={
                        isExisting &&
                        item.quantity <= (originalQuantities[item.id] || 1)
                      }
                    >
                      <FaMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleIncrement(item.id)}
                      className="transition-colors hover:text-orange-600"
                      title="Increase quantity"
                    >
                      <FaPlus />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className={`text-red-600 transition-colors ${
                        isExisting
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:text-red-700"
                      }`}
                      title={
                        isExisting
                          ? "Cannot delete original item"
                          : "Remove item"
                      }
                      disabled={isExisting}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="text-center mb-4">
              <button
                onClick={handleAddNewItem}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                + Add New Item
              </button>
            </div>

            {isLoggedIn && availablePoints > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Use Loyalty Points ({availablePoints} available)
                </label>
                <input
                  type="number"
                  min="0"
                  max={availablePoints}
                  value={pointsToUse}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= 0 && value <= availablePoints) {
                      setPointsToUse(value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter points to use"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  localStorage.setItem("customerName", e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter your name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apply Coupon
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="text-green-600 text-sm mt-1">
                  ✅ Applied: {appliedCoupon.code} (−₹{discountAmount})
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Number
              </label>
              <input
                placeholder="Table Number"
                type="number"
                value={tableNumber ?? ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>

            <table className="w-full text-sm mb-3 border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="text-left px-3 py-2">Item</th>
                  <th className="text-center px-3 py-2">Qty</th>
                  <th className="text-right px-3 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="px-3 py-1">{item.name}</td>
                    <td className="text-center px-3 py-1">{item.quantity}</td>
                    <td className="text-right px-3 py-1">
                      ₹{item.price * item.quantity}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} className="font-bold text-right px-3 py-2">
                    Total
                  </td>
                  <td className="font-bold text-right px-3 py-2">
                    ₹{finalAmount}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="px-4 pt-2 text-center text-lg font-bold text-black">
              Total to pay ₹{finalAmount}
            </div>

            <div className="text-sm mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="Cash on Counter"
                  checked={paymentMethod === "Cash on Counter"}
                  onChange={() => setPaymentMethod("Cash on Counter")}
                />
                Cash on Counter
              </label>
            </div>

            <div className="bg-[#FFF7F0] border border-[#FFD2A8] rounded-xl p-3 text-center text-sm text-orange-600 font-semibold mb-4">
              <div className="text-xl mb-1">🛎️</div>
              At Your Table <br /> in <strong>15 min</strong>
            </div>
          </div>

          <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2">
            {isPrivilegedUser && (
              <button
                onClick={() => {
                  localStorage.setItem("billData", JSON.stringify(billData));
                  navigate(`/bill-print-example`);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl w-full py-3 shadow-md transition"
              >
                Print Bill
              </button>
            )}

            <button
              onClick={handleOrderSubmit}
              disabled={loading || cartItems.length === 0}
              className={`bg-[#FF6B00] hover:bg-orange-700 text-white font-bold rounded-xl w-full py-3 shadow-md transition ${
                loading || cartItems.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {loading
                ? isEditMode
                  ? "Saving..."
                  : "Placing Order..."
                : isEditMode
                ? "Save Changes"
                : "Secure Payment"}
            </button>
          </div>
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow text-center">
            <div className="loader mb-2"></div>
            <div className="font-semibold text-orange-600">
              {isEditMode ? "Updating Order..." : "Placing Order..."}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserCart;
