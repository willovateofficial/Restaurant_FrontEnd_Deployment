import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaEdit, FaTrash } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useCategories } from "../hooks/useCategory";
import { baseUrl } from "../config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../components/Loader";

interface SidebarProps {
  onCategorySelect: (category: string) => void;
  onCategoryDeleted?: () => void; // 🔹 NEW callback to notify parent
}

const Sidebar: React.FC<SidebarProps> = ({
  onCategorySelect,
  onCategoryDeleted,
}) => {
  const businessId = localStorage.getItem("businessId");
  const { data: categories = [], isLoading } = useCategories(businessId);
  const [newItem, setNewItem] = useState("");
  const [showInput, setShowInput] = useState(false);
  const newItemInputRef = useRef<HTMLInputElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const [activeItem, setActiveItem] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<null | any>(null);

  const queryClient = useQueryClient();
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (showInput && newItemInputRef.current) {
      newItemInputRef.current.focus();
    }
  }, [showInput]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  // Add Category
  const { mutate: addCategory, isPending: isAdding } = useMutation({
    mutationFn: async (newCategory: string) => {
      const formData = new FormData();
      formData.append("name", newCategory);
      if (newImage) formData.append("image", newImage);
      return axios.post(`${baseUrl}/api/categories`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewItem("");
      setNewImage(null);
      setShowInput(false);
      toast.success("Category added successfully!");
    },
    onError: () => toast.error("Error adding category"),
  });

  // Edit Category
  const { mutate: editCategory, isPending: isEditing } = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const formData = new FormData();
      formData.append("name", name);
      if (editImage) formData.append("image", editImage);
      return axios.put(`${baseUrl}/api/categories/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditId(null);
      setEditName("");
      setEditImage(null);
      toast.success("Category updated successfully!");
    },
    onError: () => toast.error("Error updating category"),
  });

  // Delete Category + Its Dishes
  const deleteCategoryMutation = useMutation({
    mutationFn: async (category: any) => {
      // 1. Delete all dishes in this category
      await axios.delete(`${baseUrl}/api/products`, {
        params: { categoryId: category.id },
        headers: { Authorization: `Bearer ${token}` },
      });

      // 2. Delete the category itself
      return axios.delete(`${baseUrl}/api/categories/${category.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Category and its dishes deleted successfully!");
      if (onCategoryDeleted) onCategoryDeleted(); // 🔹 notify parent to refresh dishes
    },
    onError: () =>
      toast.error("Error deleting category and its associated dishes"),
  });

  const handleSelect = (item: string) => {
    setActiveItem(item);
    onCategorySelect(item);
    setDropdownOpen(false);
  };

  const handleAddItem = () => {
    if (!newItem.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!newImage) {
      toast.error("Please upload an image for the category");
      return;
    }
    addCategory(newItem.trim());
  };

  const renderCategory = (item: any) => {
    const isEditingItem = editId === item.id;
    return (
      <li
        key={item.id}
        className={`group px-2 py-2 rounded hover:bg-yellow-400 ${
          activeItem === item.name
            ? "bg-yellow-400 text-white font-semibold"
            : ""
        }`}
      >
        {isEditingItem ? (
          <div className="flex flex-col gap-2 bg-yellow-50 p-2 rounded">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Edit category name"
              className="w-full px-3 py-1 border border-gray-300 rounded text-black"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEditImage(e.target.files?.[0] || null)}
              className="w-full"
              title="Upload category image"
              placeholder="Upload category image"
            />
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => editCategory({ id: item.id, name: editName })}
                className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                disabled={isEditing}
              >
                {isEditing ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditId(null)}
                className="bg-gray-300 text-black px-4 py-1 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span
              className="flex-1 cursor-pointer text-lg"
              onClick={() => handleSelect(item.name)}
            >
              {item.name}
            </span>
            <FaEdit
              onClick={() => {
                setEditId(item.id);
                setEditName(item.name);
              }}
              className="text-blue-600 cursor-pointer ml-2 opacity-0 group-hover:opacity-100 transition"
            />
            <FaTrash
              onClick={() => setDeleteConfirm(item)}
              className="text-red-600 cursor-pointer ml-2 opacity-0 group-hover:opacity-100 transition"
            />
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      {isAdding && <Loader />}
      <aside className="w-full md:w-64 bg-white shadow-md md:p-4 p-2">
        {/* ===== Mobile View Dropdown ===== */}
        <div className="md:hidden">
          <div
            className="flex items-center justify-between text-xl font-bold px-4 py-2 rounded-full cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>Category</span>
            {dropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
          </div>

          {dropdownOpen && (
            <ul className="mt-2 space-y-1">
              <li>
                <button
                  onClick={() => setShowInput(true)}
                  className="w-full bg-yellow-400 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white py-1 rounded-full font-bold flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">+</span> Add
                </button>
              </li>

              {showInput && (
                <li className="mt-2">
                  <input
                    ref={newItemInputRef}
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter new menu item"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    title="Upload Category Image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewImage(e.target.files?.[0] || null)}
                    onKeyDown={handleKeyPress}
                    className="mt-2 w-full"
                  />
                  <button
                    ref={addButtonRef}
                    onClick={handleAddItem}
                    disabled={isAdding}
                    className="mt-1 w-full bg-green-500 text-white px-4 py-2 rounded"
                  >
                    {isAdding ? "Adding..." : "Add Category"}
                  </button>
                </li>
              )}

              {/* All dishes option */}
              <li
                className={`group px-2 py-2 rounded hover:bg-yellow-400 cursor-pointer text-lg ${
                  activeItem === ""
                    ? "bg-yellow-400 text-white font-semibold"
                    : ""
                }`}
                onClick={() => handleSelect("")}
              >
                All Dishes
              </li>

              {isLoading ? (
                <li>Loading...</li>
              ) : (
                categories.map((item) => renderCategory(item))
              )}
            </ul>
          )}
        </div>

        {/* ===== Desktop Sidebar ===== */}
        <div
          className="hidden md:block"
          style={{ height: "calc(100vh - 64px)", overflowY: "auto" }}
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold">Category</h2>
            <button
              onClick={() => setShowInput(true)}
              className="bg-yellow-400 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white py-1 px-5 rounded-xl font-bold flex items-center gap-1"
            >
              <span className="text-xl">+</span> Add
            </button>
          </div>

          {showInput && (
            <div className="mb-4">
              <input
                type="text"
                ref={newItemInputRef}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter new menu item"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              <input
                title="Upload category image"
                type="file"
                accept="image/*"
                onChange={(e) => setNewImage(e.target.files?.[0] || null)}
                onKeyDown={handleKeyPress}
                className="mt-2 w-full"
              />
              <button
                ref={addButtonRef}
                onClick={handleAddItem}
                disabled={isAdding}
                className="mt-1 bg-green-500 text-white px-4 py-2 rounded"
              >
                {isAdding ? "Adding..." : "Add Category"}
              </button>
            </div>
          )}

          <ul className="space-y-1">
            <li
              className={`px-2 py-2 rounded hover:bg-yellow-400 cursor-pointer text-lg ${
                activeItem === ""
                  ? "bg-yellow-400 text-white font-semibold"
                  : ""
              }`}
              onClick={() => handleSelect("")}
            >
              All Dishes
            </li>
            {isLoading ? (
              <li>Loading...</li>
            ) : (
              categories.map((item) => renderCategory(item))
            )}
          </ul>
        </div>
      </aside>

      {/* ===== Delete Confirmation Popup ===== */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-80">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Delete Category?
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete category <b>{deleteConfirm.name}</b>{" "}
              and all its dishes.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteCategoryMutation.mutate(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={1500} />
    </>
  );
};

export default Sidebar;
