"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { Plus, Trash2, Edit, Search, LogOut, X, Upload, AlertCircle, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useI18n } from "@/components/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { compressImage, validateImageFile } from "@/lib/imageCompression";

interface MenuItem {
  id: number;
  title: string;
  titleKurdish?: string;
  price: number;
  imageUrl: string;
  description: string;
  descriptionKurdish?: string;
  category: string;
}

function normalizeMenuItems(data: unknown): MenuItem[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((raw): MenuItem | null => {
      if (!raw || typeof raw !== "object") return null;
      const i = raw as Record<string, unknown>;

      const id = typeof i.id === "number" ? i.id : Number(i.id);
      if (!Number.isFinite(id)) return null;

      return {
        id,
        title: typeof i.title === "string" ? i.title : String(i.title ?? ""),
        titleKurdish: typeof i.titleKurdish === "string" ? i.titleKurdish : String(i.titleKurdish ?? ""),
        price: typeof i.price === "number" ? i.price : Number(i.price ?? 0),
        imageUrl:
          typeof i.imageUrl === "string"
            ? i.imageUrl
            : typeof i.image_url === "string"
              ? i.image_url
              : "",
        description: typeof i.description === "string" ? i.description : String(i.description ?? ""),
        descriptionKurdish: typeof i.descriptionKurdish === "string" ? i.descriptionKurdish : String(i.descriptionKurdish ?? ""),
        category: typeof i.category === "string" ? i.category : String(i.category ?? "drinks"),
      } satisfies MenuItem;
    })
    .filter((x): x is MenuItem => x !== null);
}

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [newCategory, setNewCategory] = useState("coffee");
  const [editCategory, setEditCategory] = useState("coffee");
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await fetch("/api/menu");
        if (response.ok) {
          const items = (await response.json()) as unknown;
          setMenuItems(normalizeMenuItems(items));
        }
      } catch (error) {
        console.error("Error loading items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, []);

  const loadItemsFromAPI = async () => {
    try {
      const response = await fetch("/api/menu");
      if (response.ok) {
        const items = (await response.json()) as unknown;
        setMenuItems(normalizeMenuItems(items));
      }
    } catch (error) {
      console.error("Error reloading items:", error);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(""), 2500);
  };

  const categoryLabel = (category?: string) => {
    if (!category) return t("categories.coffee");
    return t(`categories.${category}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUsername");
    router.push("/admin/login");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditForm = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file before compression
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setImageError(validation.error || t("admin.errUploadFailed"));
      return;
    }

    setCompressingImage(true);
    setImageError("");

    try {
      // Step 1: Compress the image on the client
      const compressedFile = await compressImage(file);
      console.log(`Image compression: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

      // Step 2: Upload compressed image
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", compressedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("admin.errUploadFailed"));
      }

      const data = await response.json();

      if (data.imageUrl) {
        setPreviewImage(data.imageUrl);

        if (isEditForm && editingItem) {
          setEditingItem({ ...editingItem, imageUrl: data.imageUrl });
        }
        
        // Reset the file input after successful upload
        if (e.target) {
          e.target.value = "";
        }
      } else {
        throw new Error(t("admin.errNoImageUrl"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      setImageError(error instanceof Error ? error.message : t("admin.errUploadFailed"));
    } finally {
      setCompressingImage(false);
      setUploadingImage(false);
    }
  };

  const handleAddMenuItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!previewImage) {
      setImageError(t("admin.errPleaseUpload"));
      return;
    }

    const formData = new FormData(e.currentTarget);

    try {
      const payload = {
        title: formData.get("title"),
        titleKurdish: formData.get("titleKurdish"),
        price: Number(formData.get("price")),
        description: formData.get("description"),
        descriptionKurdish: formData.get("descriptionKurdish"),
        category: newCategory,
        imageUrl: previewImage,
      };
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(t("admin.errAddFailed"));

      await loadItemsFromAPI();
      setIsAdding(false);
      setPreviewImage("");
      setNewCategory("coffee");
      setImageError("");
      (e.target as HTMLFormElement).reset();
      showSuccess(t("admin.successAdded"));
    } catch (error) {
      console.error("Error adding item:", error);
      const errorMsg = error instanceof Error ? error.message : t("admin.errAdd");
      setImageError(errorMsg);
    }
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsEditing(item.id);
    setPreviewImage(item.imageUrl);
    setEditCategory(item.category || "drinks");
  };

  const handleSaveEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!previewImage) {
      setImageError(t("admin.errPleaseUpload"));
      return;
    }

    const formData = new FormData(e.currentTarget);

    try {
      const payload = {
        id: editingItem.id,
        title: formData.get("title"),
        titleKurdish: formData.get("titleKurdish"),
        price: Number(formData.get("price")),
        imageUrl: previewImage,
        description: formData.get("description"),
        descriptionKurdish: formData.get("descriptionKurdish"),
        category: editCategory,
      };
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(t("admin.errUpdateFailed"));

      await loadItemsFromAPI();
      setIsEditing(null);
      setEditingItem(null);
      setPreviewImage("");
      setEditCategory("drinks");
      setImageError("");
      showSuccess(t("admin.successUpdated"));
    } catch (error) {
      console.error("Error updating item:", error);
      const errorMsg = error instanceof Error ? error.message : t("admin.errUpdate");
      setImageError(errorMsg);
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    try {
      const res = await fetch(`/api/menu?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("admin.errDeleteFailed"));
      await loadItemsFromAPI();
      setDeleteConfirm(null);
      showSuccess(t("admin.successDeleted"));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const filteredItems = menuItems.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-amber-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-50">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-emerald-600 text-white px-4 py-3 shadow-lg text-sm font-semibold">
          {successMessage}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-10 relative z-10">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/image/2.png" alt="Logo" width={48} height={48} />
              <div>
                <p className="text-xl font-bold text-amber-600">{t("admin.dashboardTitle")}</p>

              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2 border-slate-300 dark:border-slate-700"
              >
                <LogOut size={18} />
                {t("admin.logout")}
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(true);
                  setPreviewImage("");
                  setImageError("");
                  setNewCategory("coffee");
                }}
                className="gap-2 bg-amber-600 hover:bg-amber-600 text-white"
              >
                <Plus size={18} />
                {t("admin.addItem")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{t("admin.totalItems")}</CardDescription>
                <CardTitle className="text-3xl">{menuItems.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{t("admin.menuItemsTitle")}</CardTitle>
                  
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-3 text-gray-400 dark:text-slate-500" size={18} />
                  <Input
                    placeholder={t("admin.searchItemsPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isAdding && (
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>{t("admin.addNewItem")}</CardTitle>
                      <CardDescription>{t("admin.addNewItemDesc")}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIsAdding(false);
                        setPreviewImage("");
                        setImageError("");
                        setNewCategory("coffee");
                      }}
                    >
                      <X size={18} />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddMenuItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>{t("admin.itemName")} (English) *</Label>
                        <Input
                          name="title"
                          placeholder={t("admin.itemNamePlaceholder")}
                          required
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("admin.itemName")} (Kurdî)</Label>
                        <Input
                          name="titleKurdish"
                          placeholder="ناوی خواردنەوە"
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          dir="rtl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("admin.priceIqd")} *</Label>
                        <Input
                          name="price"
                          type="number"
                          placeholder="5000"
                          required
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <div className="h-2"></div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>{t("admin.uploadImage")} *</Label>
                        <div className="flex items-center gap-3">
                          <label
                            htmlFor="add-image-input"
                            className="flex-1 flex items-center justify-center gap-2 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-amber-600 transition"
                          >
                            {compressingImage ? (
                              <>
                                <Loader size={18} className="text-amber-600 animate-spin" />
                                <span className="text-sm font-semibold text-amber-600">{t("admin.compressing")}</span>
                              </>
                            ) : uploadingImage ? (
                              <>
                                <Upload size={18} className="text-amber-600 animate-pulse" />
                                <span className="text-sm font-semibold text-amber-600">{t("admin.uploading")}</span>
                              </>
                            ) : (
                              <>
                                <Upload size={18} className="text-amber-600" />
                                <span className="text-sm font-semibold text-amber-600">{t("admin.clickToUpload")}</span>
                              </>
                            )}
                          </label>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
                            onChange={(e) => handleImageUpload(e)}
                            disabled={uploadingImage || compressingImage}
                            className="hidden"
                            id="add-image-input"
                          />
                        </div>
                        {imageError && <p className="text-sm text-red-600 font-semibold">{imageError}</p>}
                        {previewImage && (
                          <div className="mt-3">
                            <p className="text-sm text-slate-500">{t("admin.preview")}</p>
                            <img src={previewImage} alt="Preview" className="h-32 w-32 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>{t("admin.description")} (English)</Label>
                        <Textarea
                          name="description"
                          rows={3}
                          placeholder={t("admin.descriptionPlaceholder")}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("admin.description")} (Kurdî)</Label>
                        <Textarea
                          name="descriptionKurdish"
                          rows={3}
                          placeholder=" وەسفی خواردنەوە بکە بە زمانی کوردی"
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          dir="rtl"
                        />
                      </div>


                      <div className="space-y-2 md:col-span-2">
                        <Label>{t("admin.category")} *</Label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                        >
                          <option value="icecoffee">{t("categories.icecoffee")}</option>
                          <option value="mexican">{t("categories.mexican")}</option>
                          <option value="freshdrinks">{t("categories.freshdrinks")}</option>
                          <option value="milkshake">{t("categories.milkshake")}</option>
                          <option value="syrup">{t("categories.syrup")}</option>
                          <option value="sweets">{t("categories.sweets")}</option>
                          <option value="hotdrinks">{t("categories.hotdrinks")}</option>
                          <option value="coffee">{t("categories.coffee")}</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 flex flex-col md:flex-row gap-3">
                        <Button type="submit" className="flex-1 gap-2 bg-amber-600 hover:bg-amber-600 text-white">
                          <Plus size={18} />
                          {t("admin.addItem")}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => {
                            setIsAdding(false);
                            setPreviewImage("");
                            setImageError("");
                            setNewCategory("coffee");
                          }}
                        >
                          {t("admin.cancel")}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {isEditing && editingItem && (
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>
                        {t("admin.edit")}: {editingItem.title}
                      </CardTitle>
                      <CardDescription>{t("admin.editItemDesc")}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIsEditing(null);
                        setEditingItem(null);
                        setPreviewImage("");
                        setImageError("");
                        setEditCategory("drinks");
                      }}
                    >
                      <X size={18} />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>{t("admin.itemName")} (English) *</Label>
                        <Input
                          name="title"
                          defaultValue={editingItem.title}
                          required
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("admin.itemName")} (Kurdî)</Label>
                        <Input
                          name="titleKurdish"
                          defaultValue={editingItem.titleKurdish || ""}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          dir="rtl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("admin.priceIqd")} *</Label>
                        <Input
                          name="price"
                          type="number"
                          defaultValue={editingItem.price}
                          required
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <div className="h-2"></div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>{t("admin.uploadImage")} *</Label>
                        <div className="flex items-center gap-3">
                          <label
                            htmlFor="edit-image-input"
                            className="flex-1 flex items-center justify-center gap-2 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-amber-600 transition"
                          >
                            {compressingImage ? (
                              <>
                                <Loader size={18} className="text-amber-600 animate-spin" />
                                <span className="text-sm font-semibold text-amber-600">{t("admin.compressing")}</span>
                              </>
                            ) : uploadingImage ? (
                              <>
                                <Upload size={18} className="text-amber-600 animate-pulse" />
                                <span className="text-sm font-semibold text-amber-600">{t("admin.uploading")}</span>
                              </>
                            ) : (
                              <>
                                <Upload size={18} className="text-amber-600" />
                                <span className="text-sm font-semibold text-amber-600">{t("admin.clickToChange")}</span>
                              </>
                            )}
                          </label>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
                            onChange={(e) => handleImageUpload(e, true)}
                            disabled={uploadingImage || compressingImage}
                            className="hidden"
                            id="edit-image-input"
                          />
                        </div>
                        {imageError && <p className="text-sm text-red-600 font-semibold">{imageError}</p>}
                        {previewImage && (
                          <div className="mt-3">
                            <p className="text-sm text-slate-500">{t("admin.preview")}</p>
                            <img src={previewImage} alt="Preview" className="h-32 w-32 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>{t("admin.description")} (English)</Label>
                        <Textarea
                          name="description"
                          defaultValue={editingItem.description}
                          rows={3}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("admin.description")} (Kurdî)</Label>
                        <Textarea
                          name="descriptionKurdish"
                          defaultValue={editingItem.descriptionKurdish || ""}
                          rows={3}
                          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          dir="rtl"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>{t("admin.category")} *</Label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                        >
                          <option value="icecoffee">{t("categories.icecoffee")}</option>
                          <option value="mexican">{t("categories.mexican")}</option>
                          <option value="freshdrinks">{t("categories.freshdrinks")}</option>
                          <option value="milkshake">{t("categories.milkshake")}</option>
                          <option value="syrup">{t("categories.syrup")}</option>
                          <option value="sweets">{t("categories.sweets")}</option>
                          <option value="hotdrinks">{t("categories.hotdrinks")}</option>
                          <option value="coffee">{t("categories.coffee")}</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 flex flex-col md:flex-row gap-3">
                        <Button type="submit" className="flex-1 gap-2 bg-amber-600 hover:bg-amber-600 text-white">
                          <Edit size={18} />
                          {t("admin.saveChanges")}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => {
                            setIsEditing(null);
                            setEditingItem(null);
                            setPreviewImage("");
                            setImageError("");
                            setEditCategory("drinks");
                          }}
                        >
                          {t("admin.cancel")}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5 py-8">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm animate-pulse overflow-hidden"
                    >
                      <div className="h-40 bg-linear-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="flex items-center justify-between pt-2">
                          <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                          <div className="h-6 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
                          <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className="overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all"
                    >
                      {/* Image */}
                      <div className="relative h-28 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={item.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = "https://via.placeholder.com/400x300?text=No+Image";
                          }}
                        />
                        <div className="absolute top-1.5 right-1.5">
                          <Badge className="bg-amber-600 text-white border-0 text-[10px]">
                            {categoryLabel(item.category)}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-2.5">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 line-clamp-1 mb-1">{item.title}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mb-2">{item.price?.toLocaleString("en-US")} IQD</p>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1 p-1.5"
                            onClick={() => handleEditMenuItem(item)}
                          >
                            <Edit size={14} />
                            <span className="hidden sm:inline">{t("admin.edit")}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 h-8 text-xs gap-1 p-1.5"
                            onClick={() => setDeleteConfirm(item.id)}
                          >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">{t("admin.delete")}</span>
                          </Button>
                        </div>

                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <CardContent className="py-12 text-center space-y-3 text-slate-500 dark:text-slate-400">
                    <AlertCircle className="mx-auto text-amber-600" size={32} />
                    <p className="text-base font-semibold">{t("admin.noItemsFound")}</p>
                    <p className="text-sm">{t("admin.noItemsFoundHint")}</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="text-center text-xl font-bold text-red-600">
            {t("admin.deleteThisItem")}
          </DialogTitle>
         
          
          <div className="flex gap-3 mt-6">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteConfirm(null)}
            >
              {t("admin.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (deleteConfirm) {
                  handleDeleteMenuItem(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
            >
              {t("admin.yesDelete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


