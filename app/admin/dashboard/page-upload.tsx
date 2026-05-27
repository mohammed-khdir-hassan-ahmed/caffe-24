"use client";

import { addMenuItem, deleteMenuItem, updateMenuItem } from "@/app/actions";
import { useState, FormEvent } from "react";
import { Plus, Trash2, Edit, Search, LogOut, Home, X, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: number;
  title: string;
  price: number;
  image_url: string;
  description: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: 1, title: "Latte", price: 5000, image_url: "/uploads/sample-latte.jpg", description: "Smooth and creamy latte with high quality espresso" },
    { id: 2, title: "Espresso", price: 4000, image_url: "/uploads/sample-espresso.jpg", description: "Strong and bold espresso shot" },
    { id: 3, title: "Cappuccino", price: 6000, image_url: "/uploads/sample-cappuccino.jpg", description: "Classic cappuccino with foam top" },
  ]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUsername");
    router.push("/admin/login");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditForm = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setImageError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      console.log("Upload response:", data);
      
      if (data.imageUrl) {
        setPreviewImage(data.imageUrl);

        if (isEditForm && editingItem) {
          setEditingItem({ ...editingItem, image_url: data.imageUrl });
        }
      } else {
        throw new Error("No image URL returned from server");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setImageError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddMenuItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!previewImage) {
      setImageError("Please upload an image");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("image_url", previewImage);

    const newItem: MenuItem = {
      title: formData.get("title") as string,
      price: parseInt(formData.get("price") as string),
      image_url: previewImage,
      description: formData.get("description") as string,
      id: Date.now(),
    };

    setMenuItems([...menuItems, newItem]);
    setIsAdding(false);
    setPreviewImage("");
    setImageError("");
    (e.target as HTMLFormElement).reset();

    try {
      await addMenuItem(formData);
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsEditing(item.id);
    setPreviewImage(item.image_url);
  };

  const handleSaveEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!previewImage) {
      setImageError("Please upload an image");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("image_url", previewImage);

    const updatedItem: MenuItem = {
      ...editingItem,
      title: formData.get("title") as string,
      price: parseInt(formData.get("price") as string),
      image_url: previewImage,
      description: formData.get("description") as string,
    };

    setMenuItems(menuItems.map((item) => (item.id === editingItem.id ? updatedItem : item)));
    setIsEditing(null);
    setEditingItem(null);
    setPreviewImage("");
    setImageError("");

    try {
      await updateMenuItem(editingItem.id, {
        title: updatedItem.title,
        price: updatedItem.price,
        imageUrl: updatedItem.image_url,
        description: updatedItem.description,
      });
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setMenuItems(menuItems.filter((item) => item.id !== id));
      try {
        await deleteMenuItem(id);
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const filteredItems = menuItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 hover:text-amber-600 transition">
              <Home size={20} />
              <span className="font-semibold text-gray-800">Back to Admin</span>
            </Link>
            <div className="text-2xl font-bold text-orange-600">📋 Menu Manager</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Search and Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Café Menu</h1>
            <p className="text-gray-600 mt-1">Total {menuItems.length} items</p>
          </div>
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setPreviewImage("");
              setImageError("");
            }}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            <Plus size={20} />
            Add New Item
          </button>
        </div>

        {/* Add Form */}
        {isAdding && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-orange-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Add New Item</h2>
            <form onSubmit={handleAddMenuItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Item Name *</label>
                <input
                  name="title"
                  className="p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition placeholder-gray-400"
                  placeholder="e.g., Latte"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Price (IQD) *</label>
                <input
                  name="price"
                  type="number"
                  className="p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition placeholder-gray-400"
                  placeholder="5000"
                  required
                />
              </div>

              {/* Image Upload */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Upload Image *</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
                    onChange={(e) => handleImageUpload(e)}
                    disabled={uploadingImage}
                    className="hidden"
                    id="add-image-input"
                  />
                  <label
                    htmlFor="add-image-input"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50 cursor-pointer hover:border-orange-500 transition"
                  >
                    <Upload size={20} className="text-orange-600" />
                    <span className="text-orange-600 font-semibold">
                      {uploadingImage ? "Uploading..." : "Click to upload image"}
                    </span>
                  </label>
                </div>
                {imageError && <p className="text-red-600 text-sm font-semibold">{imageError}</p>}
              </div>

              {/* Image Preview */}
              {previewImage && (
                <div className="md:col-span-2">
                  <p className="text-sm font-bold text-gray-700 mb-2">Preview:</p>
                  <img src={previewImage} alt="Preview" className="h-40 w-40 object-cover rounded-lg border-2 border-gray-300" />
                </div>
              )}

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition resize-none placeholder-gray-400"
                  placeholder="Describe the ingredients and flavors..."
                />
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setPreviewImage("");
                    setImageError("");
                  }}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && editingItem && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-blue-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit: {editingItem.title}</h2>
              <button
                onClick={() => {
                  setIsEditing(null);
                  setEditingItem(null);
                  setPreviewImage("");
                  setImageError("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Item Name *</label>
                <input
                  name="title"
                  defaultValue={editingItem.title}
                  className="p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-400"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Price (IQD) *</label>
                <input
                  name="price"
                  type="number"
                  defaultValue={editingItem.price}
                  className="p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-400"
                  required
                />
              </div>

              {/* Image Upload for Edit */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Upload Image *</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
                    onChange={(e) => handleImageUpload(e, true)}
                    disabled={uploadingImage}
                    className="hidden"
                    id="edit-image-input"
                  />
                  <label
                    htmlFor="edit-image-input"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 cursor-pointer hover:border-blue-500 transition"
                  >
                    <Upload size={20} className="text-blue-600" />
                    <span className="text-blue-600 font-semibold">
                      {uploadingImage ? "Uploading..." : "Click to change image"}
                    </span>
                  </label>
                </div>
                {imageError && <p className="text-red-600 text-sm font-semibold">{imageError}</p>}
              </div>

              {/* Image Preview */}
              {previewImage && (
                <div className="md:col-span-2">
                  <p className="text-sm font-bold text-gray-700 mb-2">Preview:</p>
                  <img src={previewImage} alt="Preview" className="h-40 w-40 object-cover rounded-lg border-2 border-gray-300" />
                </div>
              )}

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingItem.description}
                  rows={3}
                  className="p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none placeholder-gray-400"
                />
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Edit size={20} />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(null);
                    setEditingItem(null);
                    setPreviewImage("");
                    setImageError("");
                  }}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-4 text-gray-400 dark:text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-4 pl-12 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-500/50 dark:focus:border-orange-500/50 outline-none transition"
            />
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition border border-gray-100 group">
                <div className="relative h-48 overflow-hidden bg-gray-200">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-orange-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                    {item.price.toLocaleString("en-US")} IQD
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">{item.description}</p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditMenuItem(item)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2 rounded-lg transition"
                    >
                      <Edit size={18} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Items Found</h3>
            <p className="text-gray-600">No menu items found or search returned no results</p>
          </div>
        )}
      </div>
    </div>
  );
}
