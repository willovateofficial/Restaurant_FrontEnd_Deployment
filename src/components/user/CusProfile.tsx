import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUser, FaEnvelope, FaPhone, FaCrown } from "react-icons/fa";
import { FiEdit, FiCheck, FiX } from "react-icons/fi";
import { baseUrl } from "../../config";
import { toast } from "react-toastify";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

const CusProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", mobile: "" });
  const [originalData, setOriginalData] = useState({ name: "", mobile: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCustomerProfile = async () => {
      try {
        const token = localStorage.getItem("customerToken");
        const response = await axios.get(`${baseUrl}/api/customers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setFormData({
          name: response.data.name,
          mobile: response.data.mobile,
        });
        setOriginalData({
          name: response.data.name,
          mobile: response.data.mobile,
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("customerToken");
      await axios.put(
        `${baseUrl}/api/customers/customer/${user.id}/full`,
        { name: formData.name, mobile: formData.mobile },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser((prev: any) => ({ ...prev, ...formData }));
      setOriginalData(formData);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (): void => {
    setFormData(originalData);
    setIsEditing(false);
    toast.info("Changes discarded");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-500">
          Loading your profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10 text-red-500">
        Failed to load profile data
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 -mt-4 -mb-10">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center space-x-3 mb-4">
          <div className="w-16 h-1 bg-orange-300 rounded-full"></div>
          <ShieldCheckIcon className="h-8 w-8 text-orange-500" />
          <div className="w-16 h-1 bg-orange-300 rounded-full"></div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-600">
            My Profile
          </span>
        </h1>
        <p className="mt-3 text-md text-gray-600 font-medium">
          Manage your profile and settings
        </p>
      </div>
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">My Profile</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm transition-all"
              >
                <FiEdit className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1 bg-white text-amber-600 hover:bg-white/90 px-3 py-1 rounded-full text-sm transition-all disabled:opacity-70"
                >
                  <FiCheck className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 bg-black/20 hover:bg-black/30 px-3 py-1 rounded-full text-sm transition-all"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Name Field */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                  <FaUser className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Name
                  </p>
                  {isEditing ? (
                    <input
                      placeholder="Name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full font-medium text-gray-800 bg-transparent border-b border-orange-300 focus:outline-none focus:border-orange-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-800">{formData.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                  <FaEnvelope className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Email
                  </p>
                  <p className="font-medium text-gray-800">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Mobile Field */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                  <FaPhone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Mobile
                  </p>
                  {isEditing ? (
                    <input
                      placeholder="Mobile No."
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="w-full font-medium text-gray-800 bg-transparent border-b border-orange-300 focus:outline-none focus:border-orange-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-800">
                      {formData.mobile}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Loyalty Points */}
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                  <FaCrown className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Loyalty Points
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800">
                      {user.points ?? 0}
                    </p>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      VIP Member
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CusProfile;
