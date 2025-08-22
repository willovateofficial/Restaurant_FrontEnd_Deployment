import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom"; // Added useParams
import { ToastContainer, toast } from "react-toastify";
import { AiOutlineCloseCircle } from "react-icons/ai";
import "react-toastify/dist/ReactToastify.css";
import axios, { AxiosError } from "axios"; // Added AxiosError
import { baseUrl } from "../config";
import html2canvas from "html2canvas";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import { FaArrowLeft } from "react-icons/fa";

interface Item {
  productId: number;
  quantity: number;
  price: number;
  status?: string;
  name?: string;
}

interface ExtraPercent {
  vatLow: number;
  vatHigh: number;
  serviceTax: number;
  serviceCharge: number;
}

interface Business {
  name: string;
  themeColor: string;
  tagline: string;
}

interface ExtraDishInput {
  name: string;
  quantity: number;
  price: number;
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

interface Order {
  order_id: string;
  table_number: string | number; // Updated to handle string or number
  created_at: string;
  payment_method: string;
  customer_name: string;
  status: string;
  items: Item[];
  total_amount: number;
  pointsUsed?: number; // Added for consistency with OrderDetails.tsx
  discountAmount?: number;
}

const baseURL = baseUrl;
const API_URL = `${baseURL}/api/business`;
const LOCAL_STORAGE_KEY = "extra_percent";

const BillPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>(); // Added to get orderId from URL
  const [order, setOrder] = useState<Order | null>(
    location.state?.order || null
  );
  const [loading, setLoading] = useState(
    !location.state?.order && !location.pathname.includes("/bill/direct")
  ); // Load if no order and not direct bill
  const [error, setError] = useState<string | null>(null);

  const isDirectBill = location.pathname.includes("/bill/direct");

  // Fetch order if not provided via state and not in direct bill mode
  useEffect(() => {
    if (order || isDirectBill || !orderId) return;

    const fetchOrder = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Please log in to view bill", {
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
      } catch (error) {
        const err = error as AxiosError;
        console.error("Error fetching order:", error);
        if (err.response?.status === 404) {
          setError("Order not found");
          toast.error("Order not found", {
            position: "top-center",
            autoClose: 3000,
          });
          navigate("/order-list", { replace: true });
        } else {
          setError("Failed to fetch bill. Please try again.");
          toast.error("Failed to fetch bill. Please try again.", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [order, isDirectBill, orderId, navigate]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/order-list");
    }
  };

  // Initialize order for direct bill mode
  useEffect(() => {
    if (!order && isDirectBill) {
      setOrder({
        order_id: "DIRECT",
        customer_name: localStorage.getItem("customerName") || "",
        table_number: "",
        created_at: new Date().toISOString(),
        payment_method: "",
        status: "Custom",
        items: [],
        total_amount: 0,
      });
    }
  }, [order, isDirectBill]);

  const [percent, setPercent] = useState<ExtraPercent>({
    vatLow: 0,
    vatHigh: 0,
    serviceTax: 0,
    serviceCharge: 0,
  });

  const [business, setBusiness] = useState<Business | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [cloudinaryLink, setCloudinaryLink] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showModifiedBill, setShowModifiedBill] = useState(false);
  const [extraDishes, setExtraDishes] = useState<ExtraDishInput[]>([]);
  const [newExtraDish, setNewExtraDish] = useState<ExtraDishInput>({
    name: "",
    quantity: 1,
    price: 0,
  });

  const storedBills = JSON.parse(localStorage.getItem("storedBills") || "[]");

  useEffect(() => {
    const id = localStorage.getItem("businessId");
    if (!id) return;

    axios
      .get(`${baseUrl}/api/products`, {
        params: { businessId: id },
      })
      .then((res) => {
        setMenuItems(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch menu:", err);
        toast.error("Unable to load menu items", {
          position: "top-center",
          autoClose: 3000,
        });
      });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setPercent(JSON.parse(saved));
    }
    setShowSettings(false);

    const fetchBusiness = async () => {
      const id = localStorage.getItem("businessId");
      if (id) {
        try {
          const res = await axios.get(`${API_URL}/${id}`);
          setBusiness(res.data);
        } catch (error) {
          console.error("Error fetching business:", error);
          toast.error("Failed to fetch business details", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      }
    };

    fetchBusiness();
  }, []);

  const addExtraDish = () => {
    if (!newExtraDish.name) {
      toast.error("Please select a dish", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    if (newExtraDish.quantity <= 0) {
      toast.error("Quantity must be greater than zero", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    setExtraDishes([...extraDishes, newExtraDish]);
    setNewExtraDish({ name: "", quantity: 1, price: 0 });
  };

  const removeExtraDish = (idx: number) => {
    setExtraDishes(extraDishes.filter((_, i) => i !== idx));
  };

  const calcPercentAmount = (amount: number, percentValue: number) =>
    (amount * percentValue) / 100;

  // Guard against undefined order
  const displayedItems = order
    ? showModifiedBill && extraDishes.length > 0
      ? [
          ...order.items,
          ...extraDishes.map((dish) => ({
            productId: 0,
            quantity: dish.quantity,
            price: dish.price,
            name: dish.name,
          })),
        ]
      : order.items
    : [];

  const displayedSubtotal = displayedItems.reduce(
    (sum: number, item: Item) => sum + item.price * item.quantity,
    0
  );

  const discountedSubtotal = displayedSubtotal - (order?.discountAmount || 0);
  const displayedTotalWithCharges =
    discountedSubtotal +
    (percent.vatLow > 0
      ? calcPercentAmount(discountedSubtotal, percent.vatLow)
      : 0) +
    (percent.vatHigh > 0
      ? calcPercentAmount(discountedSubtotal, percent.vatHigh)
      : 0) +
    (percent.serviceTax > 0
      ? calcPercentAmount(discountedSubtotal, percent.serviceTax)
      : 0) +
    (percent.serviceCharge > 0
      ? calcPercentAmount(discountedSubtotal, percent.serviceCharge)
      : 0);

  const extrasSubtotal = extraDishes.reduce(
    (sum: number, dish: ExtraDishInput) => sum + dish.price * dish.quantity,
    0
  );
  const modifiedSubtotal = displayedSubtotal;

  const handleSaveSettings = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(percent));
    toast.success("Settings saved!", {
      position: "top-center",
      autoClose: 2000,
    });
    setShowSettings(false);
  };

  const handleStoreBill = async () => {
    if (!order) return;
    setShowStoreModal(false);
    try {
      const receiptElement = document.getElementById("receipt");
      if (!receiptElement) {
        toast.error("Receipt element not found.", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      if (showModifiedBill && extraDishes.length > 0) {
        try {
          const allItems = [
            ...order.items.map((item: Item) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
            ...extraDishes.map((dish) => ({
              productId: 0, // Use 0 for custom dishes
              name: dish.name,
              price: dish.price,
              quantity: dish.quantity,
            })),
          ];

          const token = localStorage.getItem("authToken");
          if (!token) {
            toast.error("Please log in to store bill", {
              position: "top-center",
              autoClose: 3000,
            });
            navigate("/login", { replace: true });
            return;
          }

          await axios.put(
            `${baseUrl}/api/bill/${parseInt(
              order.order_id.replace(/\D/g, "")
            )}/update-items`,
            { items: allItems },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          setOrder({ ...order, items: allItems });
          toast.success("Bill updated with extra dishes!", {
            position: "top-center",
            autoClose: 2000,
          });
        } catch (error) {
          console.error("Failed to update bill items:", error);
          toast.error("Failed to update bill with extra dishes", {
            position: "top-center",
            autoClose: 3000,
          });
          return;
        }
      }

      const canvas = await html2canvas(receiptElement);
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to generate image.", {
            position: "top-center",
            autoClose: 3000,
          });
          return;
        }

        const file = new File([blob], "receipt.png", { type: "image/png" });
        const uploadResult = await uploadToCloudinary(file);

        if (uploadResult) {
          const { url, publicId } = uploadResult;
          const orderKey = order.order_id;
          const token = localStorage.getItem("authToken");
          if (!token) {
            toast.error("Please log in to store bill", {
              position: "top-center",
              autoClose: 3000,
            });
            navigate("/login", { replace: true });
            return;
          }

          await axios.put(
            `${baseUrl}/api/bill/${parseInt(
              orderKey.replace(/\D/g, "")
            )}/store-link`,
            {
              billStoreLink: url,
              cloudinaryPublicId: publicId,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const updatedStored = [...storedBills];
          if (!updatedStored.includes(orderKey)) {
            updatedStored.push(orderKey);
            localStorage.setItem("storedBills", JSON.stringify(updatedStored));
          }
          localStorage.setItem(`billLink_${orderKey}`, url);

          setCloudinaryLink(url);
          setShowWhatsAppModal(true);
          toast.success("Bill stored successfully!", {
            position: "top-center",
            autoClose: 2000,
          });

          setShowModifiedBill(false);
          setExtraDishes([]);
        } else {
          toast.error("Upload failed", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      });
    } catch (error) {
      console.error("Store bill error:", error);
      toast.error("Something went wrong!", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const handleSendWhatsAppClick = async () => {
    if (!order) return;

    if (showModifiedBill && extraDishes.length > 0) {
      setShowStoreModal(true);
      return;
    }

    const currentOrderKey = order.order_id;
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Please log in to send bill", {
        position: "top-center",
        autoClose: 3000,
      });
      navigate("/login", { replace: true });
      return;
    }

    if (storedBills.includes(currentOrderKey)) {
      try {
        const res = await axios.get(
          `${baseUrl}/api/bill/${parseInt(currentOrderKey.replace(/\D/g, ""))}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data && res.data.billStoreLink) {
          setCloudinaryLink(res.data.billStoreLink);
          setShowWhatsAppModal(true);
        } else {
          toast.error("Bill not stored yet. Please store the bill first.", {
            position: "top-center",
            autoClose: 3000,
          });
          setShowStoreModal(true);
        }
      } catch (error) {
        console.error("Error fetching stored bill:", error);
        toast.error("Unable to fetch bill link.", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } else {
      setShowStoreModal(true);
    }
  };

  const handleChange = (field: keyof ExtraPercent, value: number) => {
    setPercent((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    const element = document.getElementById("receipt");
    if (element) {
      const win = window.open("", "_blank", "width=600,height=800");
      if (!win) return;
      win.document.write(`
        <html>
          <head>
            <title>Print Bill</title>
            <style>
              body { font-family: 'Courier New', monospace; }
              table { width: 100%; border-collapse: collapse; font-size: 14px; }
              th, td { padding: 4px 0; border-bottom: 1px dotted #000; }
            </style>
          </head>
          <body>${element.outerHTML}</body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: "flex",
      justifyContent: "center",
      gap: "30px",
      marginTop: "20px",
      flexWrap: "wrap",
    },
    receipt: {
      fontFamily: "'Courier New', monospace",
      width: "320px",
      padding: "16px",
      backgroundColor: "white",
      color: "black",
      border: "1px dashed #000",
      boxShadow: "0 0 8px rgba(0, 0, 0, 0.1)",
    },
    settings: {
      width: "300px",
      padding: "16px",
      border: "1px solid #ccc",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
      fontFamily: "'Courier New', monospace",
    },
    input: {
      width: "100%",
      padding: "8px",
      margin: "8px 0",
      borderRadius: "4px",
      border: "1px solid #ccc",
      fontSize: "14px",
    },
    centerText: {
      textAlign: "center",
      margin: "4px 0",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "14px",
      marginTop: "10px",
    },
    thtd: {
      padding: "4px 0",
      borderBottom: "1px dotted #000",
    },
    total: {
      textAlign: "right",
      fontWeight: "bold",
    },
    printSettingsContainer: {
      width: "320px",
      margin: "20px auto 0",
      textAlign: "center",
    },
    button: {
      padding: "8px 16px",
      backgroundColor: "#28a745",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginRight: "10px",
      marginBottom: "10px",
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-lg text-gray-600">Loading bill...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-lg text-red-600">{error}</div>
        <button
          onClick={() => navigate("/order-list")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Go to Order List
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-lg text-red-600">
          No order data available. Please go back.
        </div>
        <button
          onClick={() => navigate("/order-list")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Go to Order List
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="no-print px-2 py-0.5">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-medium transition-colors"
        >
          <FaArrowLeft className="text-lg" />
          <span>Back</span>
        </button>
      </div>
      <div className="no-print flex justify-center px-5 my-2">
        <label className="flex items-center font-bold text-base sm:text-lg gap-2 text-center">
          <input
            type="checkbox"
            checked={showModifiedBill}
            onChange={(e) => setShowModifiedBill(e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          <span>Show Modified Bill (Preview mode, add extra dish)</span>
        </label>
      </div>
      <div style={styles.container}>
        <div style={styles.receipt} id="receipt">
          <h2 style={styles.centerText}>
            🍽️ {business?.name || "Saoji Dhaba & Family Restaurant"}
          </h2>
          <h3 style={styles.centerText}>-- Bill Summary --</h3>
          <p style={styles.centerText}>Order ID: {order.order_id}</p>
          <p style={styles.centerText}>Customer Name: {order.customer_name}</p>
          <p style={styles.centerText}>
            Date: {new Date(order.created_at).toLocaleDateString()}
            <br />
            Time: {new Date(order.created_at).toLocaleTimeString()}
          </p>
          <p style={styles.centerText}>
            Table: {order.table_number} | Payment: {order.payment_method}
          </p>
          <p style={styles.centerText}>Status: {order.status}</p>
          <hr />
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thtd}>Item</th>
                <th style={styles.thtd}>Qty</th>
                <th style={styles.thtd}>₹</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.map((item: Item, idx: number) => (
                <tr key={idx}>
                  <td style={styles.thtd}>
                    {item.name || `Product #${item.productId}`}
                  </td>
                  <td style={{ ...styles.thtd, textAlign: "center" }}>
                    {item.quantity}
                  </td>
                  <td style={{ ...styles.thtd, textAlign: "right" }}>
                    {(item.quantity * item.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
          <p style={styles.total}>Subtotal: ₹{displayedSubtotal.toFixed(2)}</p>
          {percent.vatLow > 0 && (
            <p style={styles.total}>
              VAT Low ({percent.vatLow}%): ₹
              {calcPercentAmount(displayedSubtotal, percent.vatLow).toFixed(2)}
            </p>
          )}
          {percent.vatHigh > 0 && (
            <p style={styles.total}>
              VAT High ({percent.vatHigh}%): ₹
              {calcPercentAmount(displayedSubtotal, percent.vatHigh).toFixed(2)}
            </p>
          )}
          {percent.serviceTax > 0 && (
            <p style={styles.total}>
              Service Tax ({percent.serviceTax}%): ₹
              {calcPercentAmount(displayedSubtotal, percent.serviceTax).toFixed(
                2
              )}
            </p>
          )}
          {percent.serviceCharge > 0 && (
            <p style={styles.total}>
              Service Charge ({percent.serviceCharge}%): ₹
              {calcPercentAmount(
                displayedSubtotal,
                percent.serviceCharge
              ).toFixed(2)}
            </p>
          )}
          <hr />
          <p style={styles.total}>
            Grand Total: ₹{displayedTotalWithCharges.toFixed(2)}
          </p>
          {order.pointsUsed !== undefined && order.pointsUsed > 0 && (
            <p style={styles.centerText}>Points Used: {order.pointsUsed}</p>
          )}
          <hr />
          <p style={styles.centerText}>Thank You! Visit Again 🙏</p>
        </div>

        {showSettings && (
          <div style={styles.settings} className="no-print">
            <h3 style={styles.centerText}>Extra Charges (%)</h3>
            {["vatLow", "vatHigh", "serviceTax", "serviceCharge"].map(
              (field) => (
                <div key={field}>
                  <label>{field.replace(/([A-Z])/g, " $1")}</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={percent[field as keyof ExtraPercent]}
                    onChange={(e) =>
                      handleChange(
                        field as keyof ExtraPercent,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder={`Enter ${field.replace(
                      /([A-Z])/g,
                      " $1"
                    )} (%)`}
                    title={`Enter ${field.replace(
                      /([A-Z])/g,
                      " $1"
                    )} percentage`}
                  />
                </div>
              )
            )}
            <button
              style={{ ...styles.button, backgroundColor: "orange" }}
              onClick={handleSaveSettings}
            >
              Set
            </button>
          </div>
        )}

        {showModifiedBill && (
          <div
            id="modified-preview"
            style={{
              border: "2px solid #0d6efd",
              padding: "16px",
              width: "320px",
              fontFamily: "'Courier New', monospace",
              backgroundColor: "#f5faff",
              marginTop: "0",
              boxShadow: "0 2px 8px #ced4da",
            }}
            className="no-print"
          >
            <h3
              style={{
                textAlign: "center",
                color: "#0d6efd",
                marginBottom: "5px",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              Modified Bill Preview
            </h3>
            <div
              style={{
                marginBottom: "10px",
                borderBottom: "1px solid #dbeafe",
                paddingBottom: 10,
              }}
            >
              <div
                style={{
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="select-dish"
                    style={{ fontSize: 14, fontWeight: 500 }}
                  >
                    Dish Name
                  </label>
                  <select
                    id="select-dish"
                    title="Select Extra Dish"
                    value={newExtraDish.name}
                    onChange={(e) => {
                      const selectedDish = menuItems.find(
                        (d) => d.name === e.target.value
                      );
                      if (selectedDish) {
                        setNewExtraDish({
                          ...newExtraDish,
                          name: selectedDish.name,
                          price: selectedDish.price,
                        });
                      }
                    }}
                    style={{ width: "100%", padding: "6px" }}
                  >
                    <option value="">-- Select Dish --</option>
                    {menuItems.map((dish) => (
                      <option key={dish.id} value={dish.name}>
                        {dish.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNewExtraDish({ name: "", quantity: 1, price: 0 })
                  }
                  title="Clear selection"
                  style={{
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    marginTop: "22px",
                    fontSize: "22px",
                    color: "#ff0000ff",
                  }}
                >
                  <AiOutlineCloseCircle />
                </button>
              </div>
              <div style={{ display: "flex", gap: "4%", marginBottom: "6px" }}>
                <div style={{ width: "48%" }}>
                  <label
                    htmlFor="quantity"
                    style={{ fontSize: 14, fontWeight: 500 }}
                  >
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    placeholder="e.g. 2"
                    value={newExtraDish.quantity}
                    onChange={(e) =>
                      setNewExtraDish({
                        ...newExtraDish,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ width: "48%" }}>
                  <label
                    htmlFor="price"
                    style={{ fontSize: 14, fontWeight: 500 }}
                  >
                    Price (₹)
                  </label>
                  <input
                    id="price"
                    type="number"
                    value={newExtraDish.price}
                    readOnly
                    style={{ width: "100%", background: "#f5f5f5" }}
                  />
                </div>
              </div>
              <button
                onClick={addExtraDish}
                style={{
                  marginTop: "9px",
                  width: "100%",
                  padding: "4px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Add Extra Dish
              </button>
            </div>
            {extraDishes.length > 0 && (
              <table style={{ width: "100%", fontSize: "14px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Dish</th>
                    <th>Qty</th>
                    <th style={{ textAlign: "right" }}>₹</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {extraDishes.map((dish: ExtraDishInput, idx: number) => (
                    <tr key={idx}>
                      <td>{dish.name}</td>
                      <td style={{ textAlign: "center" }}>{dish.quantity}</td>
                      <td style={{ textAlign: "right" }}>
                        {(dish.price * dish.quantity).toFixed(2)}
                      </td>
                      <td>
                        <button
                          style={{
                            background: "#ef4444",
                            color: "#fff",
                            fontSize: "12px",
                            border: "none",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            cursor: "pointer",
                          }}
                          title="Remove"
                          onClick={() => removeExtraDish(idx)}
                        >
                          ✗
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <hr />
            <p style={{ textAlign: "right", fontWeight: "bold" }}>
              Original Subtotal: ₹{displayedSubtotal.toFixed(2)}
            </p>
            <p style={{ textAlign: "right", fontWeight: "bold" }}>
              Extras Subtotal: ₹{extrasSubtotal.toFixed(2)}
            </p>
            <p style={{ textAlign: "right", fontWeight: "bold" }}>
              Modified Subtotal: ₹{modifiedSubtotal.toFixed(2)}
            </p>
            <p style={{ textAlign: "right" }}>
              VAT Low ({percent.vatLow}%): ₹
              {calcPercentAmount(modifiedSubtotal, percent.vatLow).toFixed(2)}
            </p>
            <p style={{ textAlign: "right" }}>
              VAT High ({percent.vatHigh}%): ₹
              {calcPercentAmount(modifiedSubtotal, percent.vatHigh).toFixed(2)}
            </p>
            <p style={{ textAlign: "right" }}>
              Service Tax ({percent.serviceTax}%): ₹
              {calcPercentAmount(modifiedSubtotal, percent.serviceTax).toFixed(
                2
              )}
            </p>
            <p style={{ textAlign: "right" }}>
              Service Charge ({percent.serviceCharge}%): ₹
              {calcPercentAmount(
                modifiedSubtotal,
                percent.serviceCharge
              ).toFixed(2)}
            </p>
            <hr />
            <p
              style={{
                textAlign: "right",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              Modified Grand Total: ₹{displayedTotalWithCharges.toFixed(2)}
            </p>
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginTop: 20,
          flexWrap: "wrap",
        }}
        className="no-print"
      >
        {localStorage.getItem("plan") === "standard" && (
          <button
            onClick={handleSendWhatsAppClick}
            style={{
              ...styles.button,
              backgroundColor: "#007bff",
              minWidth: "120px",
            }}
          >
            Send on WhatsApp
          </button>
        )}
        <button
          onClick={handlePrint}
          style={{
            ...styles.button,
            backgroundColor: "orange",
            minWidth: "120px",
          }}
        >
          Print
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            ...styles.button,
            backgroundColor: "orange",
            minWidth: "120px",
          }}
        >
          Settings
        </button>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #receipt, #receipt * {
              visibility: visible;
            }
            #receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      {showStoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-xl font-semibold mb-4">
              Store {showModifiedBill ? "Modified" : "Original"} Bill
            </h2>
            <p className="mb-4">
              Do you want to store this{" "}
              {showModifiedBill ? "modified" : "original"} bill on cloud? You
              can then send it via WhatsApp to your customer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowStoreModal(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleStoreBill}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Store {showModifiedBill ? "Modified" : "Original"} Bill
              </button>
            </div>
          </div>
        </div>
      )}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80">
            <h2 className="text-xl font-semibold mb-2">
              Send Bill Via WhatsApp
            </h2>
            <input
              type="tel"
              placeholder="Enter Mobile Number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowWhatsAppModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => {
                  const formattedNumber = mobileNumber.replace(/\D/g, "");
                  if (formattedNumber.length !== 10) {
                    toast.error("Enter a valid 10-digit mobile number", {
                      position: "top-center",
                      autoClose: 3000,
                    });
                    return;
                  }
                  if (!cloudinaryLink) {
                    toast.error("Bill link is missing or invalid", {
                      position: "top-center",
                      autoClose: 3000,
                    });
                    return;
                  }

                  navigator.clipboard
                    .writeText(cloudinaryLink)
                    .then(() => {
                      toast.success("Bill link copied! Paste in WhatsApp.", {
                        position: "top-center",
                        autoClose: 2000,
                      });
                      window.open(
                        `https://wa.me/91${formattedNumber}?text=Here is Your Bill: ${cloudinaryLink}`
                      );
                      setShowWhatsAppModal(false);
                    })
                    .catch(() =>
                      toast.error("Failed to copy bill link.", {
                        position: "top-center",
                        autoClose: 3000,
                      })
                    );
                }}
              >
                Send Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BillPage;
