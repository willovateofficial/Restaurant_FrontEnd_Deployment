import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import { baseUrl } from "../config";

interface Item {
  productId: number;
  quantity: number;
  price: number;
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

interface BillData {
  table_number: number | string;
  created_at: string;
  customer_name: string;
  payment_method: string;
  items: Item[];
  total_amount: number;
  discountAmount?: number;
  pointsUsed?: number;
}

const BillPage: React.FC = () => {
  const navigate = useNavigate();

  const [percent, setPercent] = useState<ExtraPercent>(() =>
    JSON.parse(
      localStorage.getItem("extra_percent") ||
        '{"vatLow":0,"vatHigh":0,"serviceTax":0,"serviceCharge":0}'
    )
  );

  const [business, setBusiness] = useState<Business | null>(null);
  const [order, setOrder] = useState<BillData | null>(null);
  const [showSettings, setShowSettings] = useState(
    !localStorage.getItem("extra_percent")
  );

  useEffect(() => {
    const id = localStorage.getItem("businessId");
    if (id) {
      axios
        .get(`${baseUrl}/api/business/${id}`)
        .then((res) => setBusiness(res.data))
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("billData");
    if (stored) {
      setOrder(JSON.parse(stored));
    } else {
      toast.error("No bill data found.");
    }
  }, []);

  if (!order) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        No bill data found.
        <br />
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const calc = (amt: number, p: number) => (amt * p) / 100;

  const subtotal = order.items.reduce(
    (s: number, i: Item) => s + i.price * i.quantity,
    0
  );

  const total =
    subtotal +
    calc(subtotal, percent.vatLow) +
    calc(subtotal, percent.vatHigh) +
    calc(subtotal, percent.serviceTax) +
    calc(subtotal, percent.serviceCharge);

  const saveSettings = () => {
    localStorage.setItem("extra_percent", JSON.stringify(percent));
    toast.success("Settings saved!");
    setShowSettings(false);
  };

  const printBill = () => {
    const el = document.getElementById("receipt");
    if (!el) return;
    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) return;
    w.document.write(`<html><body>${el.outerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 30,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* RECEIPT */}
        <div
          id="receipt"
          style={{
            width: 380,
            minHeight: 400,
            padding: 20,
            border: "1px dashed #000",
            backgroundColor: "#fff",
            fontFamily: "Arial, sans-serif",
            lineHeight: "1.7",
            fontSize: "12px",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              color: business?.themeColor || "#000",
              fontSize: "20px",
              marginBottom: "6px",
            }}
          >
            🍽️ {business?.name || "Restaurant"}
          </h2>

          {business?.tagline && (
            <p
              style={{
                textAlign: "center",
                fontStyle: "italic",
                fontSize: "14px",
                marginBottom: "10px",
              }}
            >
              {business.tagline}
            </p>
          )}

          <p
            style={{
              textAlign: "center",
              fontSize: "14px",
              marginBottom: "10px",
            }}
          >
            <strong>Customer Name:</strong>{" "}
            {order.customer_name || localStorage.getItem("customerName") || "Guest"} <br />
            Date: {new Date(order.created_at).toLocaleDateString()} <br />
            Time: {new Date(order.created_at).toLocaleTimeString()} <br />
            Table: {order.table_number} | Payment: {order.payment_method}
          </p>

          <hr style={{ margin: "10px 0" }} />

          <table style={{ width: "100%", fontSize: "15px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Item</th>
                <th style={{ textAlign: "center" }}>Qty</th>
                <th style={{ textAlign: "right" }}>₹</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i: Item, idx: number) => (
                <tr key={idx}>
                  <td style={{ padding: "4px 0" }}>
                    {i.name || `Product #${i.productId}`}
                  </td>
                  <td style={{ textAlign: "center" }}>{i.quantity}</td>
                  <td style={{ textAlign: "right" }}>
                    {(i.price * i.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr style={{ margin: "10px 0" }} />

          <div style={{ fontSize: "15px" }}>
            <p style={{ textAlign: "right" }}>
              Subtotal: ₹{subtotal.toFixed(2)}
            </p>

            {order.discountAmount ? (
              <p style={{ textAlign: "right" }}>
                Discount: -₹{order.discountAmount.toFixed(2)}
              </p>
            ) : null}

            {order.pointsUsed ? (
              <p style={{ textAlign: "right" }}>
                Loyalty Points Used: -₹{order.pointsUsed.toFixed(2)}
              </p>
            ) : null}

            {percent.vatLow !== 0 && (
              <p style={{ textAlign: "right" }}>
                VAT Low {percent.vatLow}%: ₹
                {calc(subtotal, percent.vatLow).toFixed(2)}
              </p>
            )}

            {percent.vatHigh !== 0 && (
              <p style={{ textAlign: "right" }}>
                VAT High {percent.vatHigh}%: ₹
                {calc(subtotal, percent.vatHigh).toFixed(2)}
              </p>
            )}

            {percent.serviceTax !== 0 && (
              <p style={{ textAlign: "right" }}>
                Service Tax {percent.serviceTax}%: ₹
                {calc(subtotal, percent.serviceTax).toFixed(2)}
              </p>
            )}

            {percent.serviceCharge !== 0 && (
              <p style={{ textAlign: "right" }}>
                Service Charge {percent.serviceCharge}%: ₹
                {calc(subtotal, percent.serviceCharge).toFixed(2)}
              </p>
            )}

            <hr style={{ margin: "10px 0" }} />
            <p
              style={{
                fontWeight: "bold",
                textAlign: "right",
                fontSize: "16px",
              }}
            >
              Grand Total: ₹{total.toFixed(2)}
            </p>
          </div>

          <hr style={{ margin: "15px 0" }} />
          <p style={{ textAlign: "center", fontSize: "18px" }}>
            Thank You! Visit Again 🙏
          </p>
        </div>

        {/* SETTINGS PANEL */}
        {showSettings && (
          <div style={{ padding: 16, border: "1px solid #ccc", width: 280 }}>
            <h4 style={{ textAlign: "center" }}>Extra Charges (%)</h4>
            {Object.keys(percent).map((k) => (
              <input
                key={k}
                type="number"
                value={percent[k as keyof ExtraPercent]}
                onChange={(e) =>
                  setPercent({
                    ...percent,
                    [k]: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder={k}
                style={{
                  width: "100%",
                  margin: "6px 0",
                  padding: "6px",
                  borderRadius: "4px",
                  border: "1px solid #aaa",
                }}
              />
            ))}
            <button
              onClick={saveSettings}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "8px",
                borderRadius: "6px",
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          onClick={printBill}
          style={{
            marginRight: 10,
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Print
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ffc107",
            color: "#000",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Settings
        </button>
      </div>

      <ToastContainer position="top-center" autoClose={2000} />
      <style>{`@media print { .no-print { display: none; } }`}</style>
    </>
  );
};

export default BillPage;
