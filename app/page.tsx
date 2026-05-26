"use client";
import Link from "next/link";
import {
  Search,
  Coffee,
  Layers,
  Facebook,
  X,
  Phone,
  MapPin,
  Clock,
  Droplets,
  PillBottle,
  Flame,
  Wine,
  ArrowUp,
  Salad,
  Utensils,
  Citrus,
  ShoppingBag,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { useI18n } from "@/components/language-provider";
import { LanguageButton } from "@/components/language-fab";
import Image from "next/image";
import Celebration from "@/components/Celebration";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AnimatedCard } from "@/components/AnimatedCard";

interface MenuItem {
  id: number;
  title: string;
  titleKurdish?: string;
  price: number;
  imageUrl: string;
  description?: string;
  descriptionKurdish?: string;
  category?: string;
}

export default function HomePage() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const cardsTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currencyLabel = lang === "ckb" ? "دینار" : "IQD";

  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const updateCartQuantity = (item: MenuItem, change: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.item.id === item.id);
      if (existing) {
        const newQuantity = existing.quantity + change;
        if (newQuantity <= 0) {
          return prevCart.filter((ci) => ci.item.id !== item.id);
        }
        return prevCart.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: newQuantity } : ci
        );
      }
      if (change > 0) {
        return [...prevCart, { item, quantity: change }];
      }
      return prevCart;
    });
  };

  const generateWhatsAppLink = () => {
    const phone = "9647515481228";
    let message = "";
    if (lang === "ckb") {
      message = "سڵاو کافێ ٢٤ ☕\nمن دەمەوێت ئەم داواکارییە بنێرم:\n\n";
      message += `👤 *زانیاری کڕیار:*\n`;
      message += `• ناوی تەواو: ${customerName || "دیاری نەکراو"}\n`;
      message += `• ناونیشان: ${customerAddress || "دیاری نەکرا"}\n`;
      message += `• ژمارەی مۆبایل: ${customerPhone || "دیاری نەکراو"}\n\n`;
      message += `🛒 *لیستی داواکارییەکان:*\n`;
      cart.forEach((cartItem) => {
        const title = cartItem.item.titleKurdish || cartItem.item.title;
        message += `• *${title}* (${cartItem.quantity}x) - ${(cartItem.item.price * cartItem.quantity).toLocaleString()} ${currencyLabel}\n`;
      });
      const total = cart.reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0);
      message += `\n*💰 کۆی گشتی داواکاری: ${total.toLocaleString()} ${currencyLabel}*`;
    } else {
      message = "Hello Caffe 24 ☕\nI would like to place this order:\n\n";
      message += `👤 *Customer Info:*\n`;
      message += `• Full Name: ${customerName || "Not specified"}\n`;
      message += `• Address: ${customerAddress || "Not specified"}\n`;
      message += `• Mobile Number: ${customerPhone || "Not specified"}\n\n`;
      message += `🛒 *Order Items:*\n`;
      cart.forEach((cartItem) => {
        const title = cartItem.item.title;
        message += `• *${title}* (${cartItem.quantity}x) - ${(cartItem.item.price * cartItem.quantity).toLocaleString()} ${currencyLabel}\n`;
      });
      const total = cart.reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0);
      message += `\n*💰 Total Amount: ${total.toLocaleString()} ${currencyLabel}*`;
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const openItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/menu");
        const data = await response.json();
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
        setItems([]);
      } finally {
       
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };
    fetchItems();
  }, []);

  const categories = useMemo(
    () => [
      { id: "all", name: t("categories.all"), icon: Layers },
      { id: "icecoffee", name: t("categories.icecoffee"), icon: PillBottle },
      { id: "mexican", name: t("categories.mexican"), icon: Wine },
      { id: "freshdrinks", name: t("categories.freshdrinks"), icon: Citrus },
      { id: "milkshake", name: t("categories.milkshake"), icon: Salad },
      { id: "syrup", name: t("categories.syrup"), icon: Droplets },
      { id: "sweets", name: t("categories.sweets"), icon: Utensils },
      { id: "hotdrinks", name: t("categories.hotdrinks"), icon: Flame },
      { id: "coffee", name: t("categories.coffee"), icon: Coffee },
    ],
    [t],
  );

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const category = item.category || "coffee";
      const matchCategory =
        selectedCategory === "all" || category === selectedCategory;
      if (!matchCategory) return false;

      if (!q) return true;

      const title = (item.title ?? "").toLowerCase();
      const titleKurdish = (item.titleKurdish ?? "").toLowerCase();
      const desc = (item.description ?? "").toLowerCase();
      const descKurdish = (item.descriptionKurdish ?? "").toLowerCase();

      return (
        title.includes(q) ||
        desc.includes(q) ||
        titleKurdish.includes(q) ||
        descKurdish.includes(q)
      );
    });
  }, [items, selectedCategory, searchTerm]);


  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};

    filteredItems.forEach((item) => {
      const category = item.category || "coffee";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });


    const sorted: Record<string, MenuItem[]> = {};
    const categoryOrder = ["freshdrinks", "icecoffee", "coffee", "mexican", "milkshake", "hotdrinks", "syrup", "sweets"];
    
    categoryOrder.forEach((cat) => {
      if (groups[cat]) {
        sorted[cat] = groups[cat];
      }
    });
    
    // Add any remaining categories not in the order
    Object.keys(groups).forEach((cat) => {
      if (!sorted[cat]) {
        sorted[cat] = groups[cat];
      }
    });

    return sorted;
  }, [filteredItems]);

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const formatCategoryName = (category: string) => {
    // Format category names with proper spacing
    const formatted = category
      .replace(/icecoffee/gi, "Ice Coffee")
      .replace(/hotdrinks/gi, "Hot Drinks")
      .replace(/freshdrinks/gi, "Fresh Drinks")
      .replace(/milkshake/gi, "Milk Shake");

    // Capitalize first letter if not already formatted
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      icecoffee: "bg-cyan-100 text-cyan-800",
      mexican: "bg-yellow-100 text-yellow-800",
      freshdrinks: "bg-blue-100 text-blue-800",
      milkshake: "bg-pink-100 text-pink-800",
      syrup: "bg-purple-100 text-purple-800",
      sweets: "bg-rose-100 text-rose-800",
      hotdrinks: "bg-amber-100 text-amber-800",
      coffee: "bg-amber-100 text-amber-800",
      drinks: "bg-blue-100 text-blue-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  // Show loading spinner while fetching data
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-white to-gray-50 text-slate-900">
      <Celebration />
      <nav className="bg-white/90 sm:backdrop-blur shadow-sm border-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/image/2.png" alt="Logo" width={48} height={48} />
          </div>
          <div className="flex items-center gap-2">
            <LanguageButton className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition" />
            <button
              onClick={() => setShowAbout(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              aria-label="Contact us"
              title="Contact information"
            >
              <Phone size={16} />
              <span className="hidden sm:inline">Contact</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-2.5 sm:px-6 py-5 w-full">
        {!loading && items.length > 0 ? (
          <>
            {/* Header Section */}
            <div className="mb-8 text-center animate-in fade-in slide-in-from-top-6 duration-700 ease-out">
              <h1
                className="title-underline text-3xl md:text-4xl lg:text-5xl font-bold mb-2 animate-in fade-in slide-in-from-top-8 duration-1000 ease-out"
                style={{ animationDelay: "100ms" }}
              >
                {lang === "ckb" ? (
                  <>
                    {t("home.titleKurdish").split("24")[0]}
                    <span className="text-amber-600">24</span>
                  </>
                ) : (
                  <>
                    {t("home.title").split("24")[0]}
                    <span className="text-amber-600">24</span>
                  </>
                )}
              </h1>
              <p
                className="text-gray-600 text-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out"
                style={{ animationDelay: "300ms" }}
              >
                {t("home.subtitle")}
              </p>
            </div>

            {/* Category Filter */}
            <div className="mb-6 -mx-2.5 sm:mx-0">
              <div className="overflow-x-auto scrollbar-hide px-2.5 sm:px-0">
                <div className="flex items-center gap-2 min-w-max sm:min-w-0 sm:justify-center sm:flex-wrap">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const active = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                          active
                            ? "bg-amber-600 text-white shadow-md shadow-amber-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8 flex flex-col items-center">
              <div className="relative w-full max-w-2xl">
                {/* 1.5px border animation wrapper */}
                <div className="relative rounded-xl p-[1.5px] overflow-hidden shadow-xs bg-slate-200">
                  <div 
                    className="absolute inset-[-100%] rounded-xl animate-[spin_5s_linear_infinite]" 
                    style={{
                      background: "conic-gradient(from 0deg, transparent 50%, #1f2937 80%, transparent 100%)"
                    }} 
                  />
                  <div className="relative bg-white rounded-[10px] flex items-center">
                    <Search
                      className="absolute left-3 text-gray-400"
                      size={20}
                    />
                    <Input
                      type="text"
                      placeholder={t("home.searchPlaceholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 text-sm sm:text-base bg-transparent border-0 text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-[10px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items Grid */}
            {filteredItems.length > 0 ? (
              <div ref={cardsTopRef} className="space-y-12">
                {Object.entries(groupedItems).map(
                  ([categoryId, categoryItems]) => (
                    <div key={categoryId} className="space-y-6">
                      {/* Category Header */}
                      <div className="flex items-center gap-3 pt-2 pb-1">
                        <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-800 to-transparent"></div>
                        <h2 className="text-base md:text-lg font-bold text-gray-800 whitespace-nowrap px-2">
                          {getCategoryName(categoryId)}
                        </h2>
                        <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-800 to-transparent"></div>
                      </div>

                      {/* Items Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
                        {categoryItems.map((item, index) => (
                          <AnimatedCard key={item.id} index={index}>
                            <div
                              className="bg-white border border-gray-100 rounded-xl shadow-sm transition-shadow cursor-pointer relative h-full"
                              onClick={() => openItem(item)}
                            >
                              <div className="relative w-full h-36 sm:h-44 md:h-52 overflow-hidden rounded-t-xl">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.title}
                                  fill
                                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                  className="object-cover transition-transform duration-300 bg-gray-200"
                                />
                              </div>

                              {/* Badge */}
                              <div className="absolute top-3 right-3">
                                <Badge
                                  className={getCategoryBadgeColor(
                                    item.category || "drinks",
                                  )}
                                >
                                  {formatCategoryName(item.category || "drinks")}
                                </Badge>
                              </div>

                              {/* Content */}
                              <div className="px-3 pt-2 pb-3">
                                <div className="flex flex-col gap-1.5">
                                  {/* Title + Price on same row */}
                                  <div className="flex items-center justify-between gap-1">
                                    <h5
                                      className="text-xs sm:text-sm font-semibold text-gray-900 truncate flex-1"
                                      dir={lang === "ckb" ? "rtl" : "ltr"}
                                    >
                                      {lang === "ckb"
                                        ? item.titleKurdish || item.title
                                        : item.title}
                                    </h5>
                                    <span className="text-xs font-extrabold text-amber-700 whitespace-nowrap shrink-0">
                                      {item.price?.toLocaleString()}
                                    </span>
                                  </div>

                                  {/* Add / Quantity Control — below title+price */}
                                  <div
                                    className="relative z-20"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {(() => {
                                      const cartItem = cart.find((ci) => ci.item.id === item.id);
                                      if (cartItem) {
                                        return (
                                          <div className="w-full h-8 flex items-center justify-between gap-1 bg-amber-50 border border-amber-200 rounded-lg px-1">
                                            <button
                                              onClick={() => updateCartQuantity(item, -1)}
                                              className="w-6 h-6 flex items-center justify-center rounded-md bg-amber-600 text-white hover:bg-amber-700 active:scale-95 transition-all text-sm font-black"
                                              aria-label="Decrease quantity"
                                            >−</button>
                                            <span className="text-sm font-bold text-amber-900 min-w-[20px] text-center">
                                              {cartItem.quantity}
                                            </span>
                                            <button
                                              onClick={() => updateCartQuantity(item, 1)}
                                              className="w-6 h-6 flex items-center justify-center rounded-md bg-amber-600 text-white hover:bg-amber-700 active:scale-95 transition-all text-sm font-black"
                                              aria-label="Increase quantity"
                                            >+</button>
                                          </div>
                                        );
                                      }
                                      return (
                                        <button
                                          onClick={() => updateCartQuantity(item, 1)}
                                          className="w-full h-8 flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all active:scale-95 font-bold text-xs"
                                          aria-label="Add to cart"
                                        >
                                          <ShoppingBag size={13} />
                                          <span>{lang === "ckb" ? "داواکردن" : "Order"}</span>
                                        </button>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AnimatedCard>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  {t("home.noItemsFound")}
                </p>
              </div>
            )}
          </>
        ) : loading ? (
          <div className="py-16 space-y-10">
            <div className="max-w-3xl mx-auto space-y-3 animate-pulse">
              <div className="h-10 w-48 mx-auto rounded-full bg-gray-200" />
              <div className="h-4 w-64 mx-auto rounded-full bg-gray-200" />
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-8 w-20 rounded-full bg-gray-200"
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-pulse"
                >
                  <div className="h-32 sm:h-40 md:h-44 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200" />
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="h-3 w-3/4 rounded-full bg-gray-200" />
                    <div className="h-3 w-1/2 rounded-full bg-gray-200" />
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-6 w-16 rounded-full bg-gray-200" />
                      <div className="h-6 w-12 rounded-full bg-gray-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-32">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t("home.noMenuYet")}
            </h2>
            <p className="text-gray-600 mb-8">{t("home.startByAdding")}</p>
            <Link href="/admin/login">
              <button className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg transition">
                {t("home.goAdmin")}
              </button>
            </Link>
          </div>
        )}
      </main>

      {/* Item Detail Modal */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-5xl p-0 overflow-hidden"
        >
          <div className="sr-only">Item details</div>
          {selectedItem && (
            <>
              <DialogClose className="absolute top-3 right-3 z-50 rounded-full bg-black/45 hover:bg-black/60 text-white backdrop-blur-sm p-2">
                <X size={18} />
                <span className="sr-only">{t("common.close")}</span>
              </DialogClose>

              {/* Image */}
              <div className="w-full h-[45vh] sm:h-[55vh] overflow-hidden bg-gray-50 flex items-center justify-center">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Content */}
              <div className="px-6 py-4 max-h-[40vh] overflow-y-auto">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 mb-3">
                  <h2
                    className="text-lg font-semibold text-gray-900 leading-tight wrap-break-word"
                    dir={lang === "ckb" ? "rtl" : "ltr"}
                  >
                    {lang === "ckb"
                      ? selectedItem.titleKurdish || selectedItem.title
                      : selectedItem.title}
                  </h2>
                  <span className="text-base font-bold text-amber-700 whitespace-nowrap justify-self-end row-span-2 self-center">
                    {selectedItem.price?.toLocaleString()} {currencyLabel}
                  </span>
                </div>

                <p
                  className="text-gray-600 text-sm mb-4"
                  dir={lang === "ckb" ? "rtl" : "ltr"}
                >
                  {lang === "ckb"
                    ? selectedItem.descriptionKurdish ||
                      selectedItem.description
                    : selectedItem.description}
                </p>

                {/* Add to cart controls inside modal */}
                {(() => {
                  const cartItem = cart.find((ci) => ci.item.id === selectedItem.id);
                  if (cartItem) {
                    return (
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-1">
                          <button
                            onClick={() => updateCartQuantity(selectedItem, -1)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-base active:scale-90 transition-all shadow-xs"
                            aria-label="Decrease"
                          >−</button>
                          <span className="text-sm font-bold text-amber-900 min-w-[24px] text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(selectedItem, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-base active:scale-90 transition-all shadow-xs"
                            aria-label="Increase"
                          >+</button>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {lang === "ckb" ? "لە سەبەتەکەدایە" : "In your cart"}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <button
                      onClick={() => updateCartQuantity(selectedItem, 1)}
                      className="w-full mb-4 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span className="text-lg font-black">+</span>
                      {lang === "ckb" ? "زیادکردن بۆ داواکاری" : "Add to Order"}
                    </button>
                  );
                })()}

                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition text-sm"
                >
                  {t("common.close")}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Side Drawer Checkout */}
      {showCheckout && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity duration-300"
          onClick={() => setShowCheckout(false)}
        />
      )}

      <div
        className={`fixed top-0 bottom-0 left-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col ${
          showCheckout ? "translate-x-0" : "-translate-x-full"
        }`}
        dir={lang === "ckb" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6F4E37] to-[#3C2A21] px-5 py-5 text-white flex justify-between items-center relative">
          <div>
            <h2 className="text-lg font-bold">
              {lang === "ckb" ? "تەواوکردنی داواکاری" : "Complete Your Order"}
            </h2>
            <p className="text-xs text-amber-200/90 font-light mt-0.5">
              {lang === "ckb" ? "زانیارییەکانت بنووسە بۆ ناردنی داواکاری" : "Enter your info to place the order"}
            </p>
          </div>
          <button
            onClick={() => setShowCheckout(false)}
            className="rounded-lg bg-black/25 hover:bg-black/40 text-white p-2 transition-all"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {/* Cart Summary */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === "ckb" ? "خواردنەوە هەڵبژێردراوەکان" : "Selected Items"}
            </p>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {cart.map((cartItem) => (
                <div key={cartItem.item.id} className="flex items-center gap-2 text-sm">
                  {/* Name + price */}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-semibold truncate">
                      {lang === "ckb" ? cartItem.item.titleKurdish || cartItem.item.title : cartItem.item.title}
                    </p>
                    <p className="text-amber-600 font-bold text-xs">
                      {(cartItem.item.price * cartItem.quantity).toLocaleString()} {currencyLabel}
                    </p>
                  </div>
                  {/* Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateCartQuantity(cartItem.item, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-xs active:scale-90 transition-all shadow-xs"
                      aria-label="Decrease"
                    >−</button>
                    <span className="text-xs font-bold text-slate-800 min-w-[18px] text-center">{cartItem.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(cartItem.item, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-xs active:scale-90 transition-all shadow-xs"
                      aria-label="Increase"
                    >+</button>
                    <button
                      onClick={() => updateCartQuantity(cartItem.item, -cartItem.quantity)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white active:scale-90 transition-all shadow-xs"
                      aria-label="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200/60 pt-3 flex justify-between items-center mt-2">
              <span className="text-slate-900 font-extrabold text-sm">
                {lang === "ckb" ? "کۆی گشتی:" : "Total Amount:"}
              </span>
              <span className="text-amber-700 font-black text-base">
                {cart.reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0).toLocaleString()} {currencyLabel}
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">
                {lang === "ckb" ? "ناوی تەواو *" : "Full Name *"}
              </label>
              <input
                type="text"
                required
                placeholder={lang === "ckb" ? "  بۆنموونە: هەڵمەت قادر" : "Halmat qadir"}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition text-slate-800 placeholder:text-slate-400 placeholder:text-[11px] sm:placeholder:text-xs"
              />
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">
                {lang === "ckb" ? "ناونیشانی نیشتەجێبوون *" : "Delivery Address *"}
              </label>
              <input
                type="text"
                required
                placeholder={lang === "ckb" ? "بۆ نموونە: قەڵادزێ - بەرامبەر پاڕکی شار" : "e.g., Qalatdizah - Opposite Shar Park"}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition text-slate-800 placeholder:text-slate-400 placeholder:text-[11px] sm:placeholder:text-xs"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">
                {lang === "ckb" ? "ژمارەی مۆبایل *" : "Mobile Number *"}
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                placeholder={lang === "ckb" ? "07515481228" : "e.g., 07515481228"}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition text-slate-800 placeholder:text-slate-400 placeholder:text-[11px] sm:placeholder:text-xs text-left ${lang === "ckb" ? "placeholder:text-right" : "placeholder:text-left"}`}
              />
            </div>
          </div>
        </div>

        {/* Footer Submit */}
        <div className="p-5 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              if (!customerName.trim() || !customerAddress.trim() || !customerPhone.trim()) {
                alert(lang === "ckb" ? "تکایە هەموو خانەکان بە دروستی پڕ بکەرەوە!" : "Please fill in all required fields!");
                return;
              }
              window.open(generateWhatsAppLink(), "_blank");
              setShowCheckout(false);
            }}
            className="w-full py-3 bg-gradient-to-r from-[#6F4E37] to-[#3C2A21] text-white rounded-xl shadow-lg shadow-amber-950/20 hover:shadow-xl hover:shadow-amber-950/30 font-extrabold flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-300 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            <span>{lang === "ckb" ? "  ناردنی داواکاری لەڕێگای whatsup " : "Confirm via WhatsApp"}</span>
          </button>
        </div>
      </div>

      {/* Contact Information Modal */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent
          showCloseButton={false}
          className="max-w-xs p-0 overflow-hidden w-80"
        >
          <DialogClose className="absolute top-3 right-3 z-50 rounded-full bg-black/45 hover:bg-black/60 text-white backdrop-blur-sm p-2">
            <X size={18} />
          </DialogClose>

          <div className="bg-linear-to-br from-[#6F4E37] to-[#3C2A21]">
            {/* Header */}
            <div className="px-4 py-3 text-center text-white">
              <div className="flex justify-center mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                  <Image src="/image/2.png" alt="Logo" width={40} height={40} />
                </div>
              </div>
              <h2 className="text-lg font-bold mb-0">
                {lang === "ckb" ? (
                  <>
                    {t("home.titleKurdish").split("24")[0]}
                    <span className="text-amber-600">24</span>
                  </>
                ) : (
                  <>
                    {t("home.title").split("24")[0]}
                    <span className="text-amber-600">24</span>
                  </>
                )}
              </h2>
            </div>
            {/* Cards Container */}
            <div className="bg-white rounded-t-3xl p-3 space-y-2">
              {/* Phone Numbers Card */}

              {/* Social Media Card */}
              <div className="bg-linear-to-br from-pink-50 to-pink-100 rounded-lg p-1.5 border border-pink-200">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="rounded-full p-1.5">
                    <Image
                      src="/image/halmat.jpeg"
                      alt="Social Media"
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  </div>
                  <p className="text-[9px] font-bold text-pink-900 uppercase tracking-wide">
                    {lang === "en" ? "Social Media" : "سۆشیال میدیا"}
                  </p>
                </div>

                {/* Social Links */}
                <div className="flex gap-1.5">
                  {/* Snapchat */}
                  <a
                    href={t("contact.snapchat")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 rounded-md p-1.5 flex flex-col items-center gap-0.5 transition-all hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.149-.052-.238.015-.225.18-.45.42-.494 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" />
                    </svg>
                    <span className="text-[8px] font-bold text-white">
                      Snap
                    </span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={t("contact.whatsapp")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-500 hover:bg-green-600 rounded-md p-1.5 flex flex-col items-center gap-0.5 transition-all hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span className="text-[8px] font-bold text-white">
                      WhatsApp
                    </span>
                  </a>

                  {/* Viber */}
                  <a
                    href={t("contact.viber")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 rounded-md p-1.5 flex flex-col items-center gap-0.5 transition-all hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.177.693 6.698.623 9.82c-.06 3.11-.13 8.95 5.5 10.541v2.42s-.038.97.602 1.17c.79.25 1.24-.499 1.99-1.299l1.4-1.58c3.85.32 6.8-.419 7.14-.529.78-.25 5.181-.811 5.901-6.652.74-6.031-.36-9.831-2.34-11.551l-.01-.002c-.6-.55-3-2.3-8.37-2.32 0 0-.396-.025-1.038-.016zm.067 1.697c.545-.003.88.02.88.02 4.54.01 6.711 1.38 7.221 1.84 1.67 1.429 2.528 4.856 1.9 9.892-.6 4.88-4.17 5.19-4.83 5.4-.28.09-2.88.73-6.152.52 0 0-2.439 2.941-3.199 3.701-.12.13-.26.17-.35.15-.13-.03-.17-.19-.16-.41l.02-4.019c-4.771-1.32-4.491-6.302-4.441-8.902.06-2.6.55-4.732 2-6.222 1.99-1.8 5.681-2.053 7.511-1.941l-.4-.029zm.358 2.021a.362.362 0 0 0-.34.363c0 .2.161.363.361.363 2.932.01 5.3 2.379 5.311 5.311 0 .2.162.362.361.362s.36-.162.36-.362c-.01-3.333-2.7-6.027-6.032-6.037h-.021zm-3.041.94a.956.956 0 0 0-.6.231c-.32.26-.63.56-.91.9-.28.35-.17.47-.05.7.45.88 1.51 2.699 2.8 4.13s3.25 2.35 4.131 2.8c.23.12.35.23.71-.05.33-.28.63-.59.89-.91.26-.32.32-.44.23-.7-.21-.53-1.201-1.59-1.721-2.05-.46-.4-.84-.14-1.091.03-.25.16-.37.24-.52.24s-.27-.06-.44-.17c-.51-.31-1.141-.8-1.64-1.32-.51-.51-.99-1.14-1.311-1.65-.09-.17-.14-.29-.14-.44s.08-.27.24-.52c.17-.25.43-.631.03-1.091-.46-.52-1.52-1.511-2.05-1.721a.597.597 0 0 0-.21-.039l-.01-.002zm3.121 1.47a.36.36 0 0 0-.34.362c0 .2.162.362.361.362 2.133 0 3.871 1.738 3.871 3.871 0 .2.161.361.361.361s.36-.161.36-.361c0-2.535-2.058-4.595-4.592-4.595h-.021zm0 1.674a.36.36 0 0 0-.34.362c0 .2.161.362.36.362 1.345 0 2.44 1.096 2.44 2.441 0 .2.162.361.362.361s.361-.161.361-.361c0-1.744-1.42-3.164-3.162-3.164l-.021-.001z" />
                    </svg>
                    <span className="text-[8px] font-bold text-white">
                      Viber
                    </span>
                  </a>
                </div>
              </div>
              <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-3 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-blue-500 rounded-full p-1.5">
                    <Phone size={16} className="text-white" />
                  </div>

                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                    {lang === "en" ? "Phone Numbers" : "ژمارە تەلەفۆن"}
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <button
                    onClick={() =>
                      (window.location.href = `tel:${t("contact.phone1")}`)
                    }
                    className="text-sm font-bold text-blue-900 hover:text-blue-600 transition break-all text-left hover:underline"
                  >
                    {t("contact.phone1")}
                  </button>
                </div>
              </div>

              {/* Hours Card */}
              <div className="bg-linear-to-br from-amber-50 to-amber-100 rounded-xl p-3 border-2 border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-amber-500 rounded-full p-1.5">
                    <Clock size={16} className="text-white" />
                  </div>
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    {lang === "en" ? "Opening Hours" : " کراوەیە "}
                  </p>
                </div>
                <p className="text-sm font-bold text-amber-900">
                  {t("contact.hours")}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {t("contact.daily")}
                </p>
              </div>

              {/* Location Card */}
              <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-3 border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-purple-500 rounded-full p-1.5">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <p className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                    {lang === "en" ? "Location" : "ناونیشان"}
                  </p>
                </div>
                <p className="text-xs text-purple-900 font-semibold leading-snug">
                  {t("contact.location")}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowAbout(false)}
                className="w-full py-2 bg-linear-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold rounded-lg transition text-xs"
              >
                {lang === "en" ? "Close" : "داخستن"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="text-xs   pt-12 pb-6 w-full">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <p className="text-gray-500 text-sm font-light tracking-wide">
            Designed and Developed by
          </p>
          <a
            href="https://www.facebook.com/mahamad.khdir.104"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-gray-800 underline flex items-center hover:text-amber-700 transition"
          >
            <Facebook size={17} />
            Hama Sha
          </a>
        </div>
      </footer>

      {/* WhatsApp Cart Floating Button */}
      {cart.length > 0 && !showCheckout && (
        <button
          onClick={() => setShowCheckout(true)}
          className={`fixed z-50 flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-xl shadow-lg transition transform hover:scale-110 duration-300 right-8 ${
            showScrollTop ? "bottom-[88px]" : "bottom-8"
          }`}
          aria-label="Open checkout"
        >
          <div className="relative flex items-center justify-center">
            <ShoppingBag size={24} />
            <span className="absolute -top-4 -right-4 bg-rose-500 text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center border border-white font-black animate-pulse shadow-md">
              {cart.reduce((sum, ci) => sum + ci.quantity, 0)}
            </span>
          </div>
        </button>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && !showCheckout && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-xl shadow-lg transition transform hover:scale-110 animate-fade-in z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}
