import axios from "axios";

export const fetchCustomersData = async () => {
  const res = await axios.get("/api/customers");
  return res.data;
};

export const fetchRatings = async () => {
  const res = await axios.get("/api/ratings");
  return res.data;
};

export const fetchTopMenuItems = async () => {
  const res = await axios.get("/api/top-dishes");
  return res.data;
};

export const fetchOrderById = async (orderId: string) => {
  const res = await axios.get(`/api/orders/${orderId}`);
  return res.data;
};
