import {
  useState,
  useEffect,
  type FC,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { TopNavBar } from "../../components/TopNavBar";
import "./HomePage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// 2. Cấu hình Icon cho ghim (Marker) — dùng divIcon để hỗ trợ CSS shadow/border
const createCafeIcon = (isSelected = false) => {
  return L.divIcon({
    className: "",
    html: `<div class="cafe-marker-pin ${isSelected ? "cafe-marker-pin--selected" : ""}"></div>`,
    iconSize: isSelected ? [50, 50] : [40, 40],
    iconAnchor: isSelected ? [25, 50] : [20, 40],
    popupAnchor: [0, -40],
  });
};

const createCurrentLocationIcon = () =>
  L.divIcon({
    className: "",
    html: `<div class="current-pin">
      <div class="current-pin__pulse"></div>
      <div class="current-pin__dot"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

interface CafeInfo {
  id: string | number;
  name: string;
  location: { lat: number; lng: number };
  rating: number;
  reviewCount: number;
  isOpenNow: boolean;
  tags: string[];
  distance: number | null;
  imageUrl?: string;
  address?: string;
}

const FILTER_CHIPS = ["近くの店", "営業中", "高評価"];
const RECOMMENDED_KEYWORDS = [
  "高速Wi-Fi",
  "静か",
  "コンセント",
  "エアコン",
  "テラス席",
];
const centerHanoi: [number, number] = [21.004519737728625, 105.84671270832611];

function StarRating({ value }: { value: number }) {
  return (
    <span className="star-rating">
      {"★".repeat(Math.floor(value))}
      {"☆".repeat(5 - Math.floor(value))}
      <span className="star-value">{value.toFixed(1)}</span>
    </span>
  );
}

// Component hỗ trợ bắt sự kiện click lên vùng trống của bản đồ
function MapEventsHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click() {
      onMapClick();
    },
  });
  return null;
}

const HomePage: FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [cafes, setCafes] = useState<CafeInfo[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<CafeInfo | null>(null);
  const [fullCafeDetail, setFullCafeDetail] = useState<any | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [menuPreviewOpen, setMenuPreviewOpen] = useState(false);
  const [menuPreviewIndex, setMenuPreviewIndex] = useState(0);
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapZoom, setMapZoom] = useState(14);
  const location = useLocation();
  const lastProcessedCafeIdRef = useRef<string | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 1 || cafes.length === 0) return [];
    const seen = new Set<string>();
    const results: {
      label: string;
      sub: string;
      type: "cafe" | "area";
      cafeRef?: CafeInfo;
    }[] = [];
    cafes.forEach((c) => {
      if (c.name.toLowerCase().includes(q) && !seen.has(c.name)) {
        seen.add(c.name);
        results.push({
          label: c.name,
          sub: (c as any).address || "",
          type: "cafe",
          cafeRef: c,
        });
      }
      const addrPart = (c as any).address?.split(",").pop()?.trim() || "";
      if (
        addrPart &&
        addrPart.toLowerCase().includes(q) &&
        !seen.has(addrPart)
      ) {
        seen.add(addrPart);
        results.push({ label: addrPart, sub: "エリア", type: "area" });
      }
    });
    return results.slice(0, 6);
  }, [searchQuery, cafes]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.openPopup();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedCafe, cafes]);

  const [userCoords, setUserCoords] = useState<[number, number]>(centerHanoi);
  const [locationName, setLocationName] = useState("Hai Bà Trưng, Hà Nội");

  // Lấy GPS người dùng khi mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(
            "[HomePage] GPS successfully retrieved:",
            latitude,
            longitude,
          );
          setUserCoords([latitude, longitude]);
        },
        (error) => {
          console.warn("[HomePage] GPS error, falling back to HUST B1:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    }
  }, []);

  // Sync zoom level state with map events
  useEffect(() => {
    if (!map) return;
    const onZoomEnd = () => setMapZoom(map.getZoom());
    map.on("zoomend", onZoomEnd);
    return () => {
      map.off("zoomend", onZoomEnd);
    };
  }, [map]);

  // Cập nhật locationName theo tâm bản đồ khi người dùng kéo/zoom (debounce 600ms)
  useEffect(() => {
    if (!map) return;
    const onMoveEnd = () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
      geocodeTimerRef.current = setTimeout(() => {
        const center = map.getCenter();
        reverseGeocode(center.lat, center.lng);
      }, 600);
    };
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    };
  }, [map]);

  // Xoay bản đồ tới vị trí người dùng khi có GPS mới (chỉ tự động chạy nếu không có cafeId trên URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCafeId = params.get("cafeId");
    if (!urlCafeId && map && userCoords !== centerHanoi) {
      map.setView(userCoords, 14);
    }
  }, [map, userCoords]);

  // Chuyển đổi tọa độ sang địa chỉ
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&language=vi`,
      );
      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        const district =
          addr.suburb ||
          addr.city_district ||
          addr.district ||
          addr.county ||
          "";
        const city = addr.city || addr.town || addr.province || "Hà Nội";
        if (district) {
          setLocationName(`${district}, ${city}`);
        } else {
          setLocationName(city);
        }
      }
    } catch (error) {
      console.error("[HomePage] Error reverse geocoding:", error);
    }
  };

  useEffect(() => {
    reverseGeocode(userCoords[0], userCoords[1]);
  }, [userCoords]);
  // Tự động hiển thị chi tiết quán khi có query param ?cafeId=... (chỉ khi mount lần đầu có map)
  // Việc back từ trang khác sẽ được xử lý bởi effect theo dõi location.search bên dưới
  useEffect(() => {
    if (!map) return;
    const params = new URLSearchParams(location.search);
    const cafeId = params.get("cafeId");
    if (!cafeId) return;
    // Đã xử lý bởi effect dưới — không cần flyTo ở đây
  }, [map]);

  // 3. Gọi API lấy dữ liệu từ Backend
  const fetchCafes = async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilters.includes("営業中")) params.append("isOpen", "true");
      if (activeFilters.includes("高評価")) params.append("minRating", "4");
      if (searchQuery.trim()) params.append("keyword", searchQuery.trim());

      params.append("lat", userCoords[0].toString());
      params.append("lng", userCoords[1].toString());
      // 近くの店: bán kính 10km; mặc định 30km
      if (activeFilters.includes("近くの店")) {
        params.append("maxDistance", "10");
      } else {
        params.append("maxDistance", "30");
      }

      // Khớp với cổng backend bạn đã khai báo trong apps/server/.env
      const url = `${API_BASE_URL}/api/cafes/map?${params.toString()}`;
      console.log("[HomePage] Fetching cafes from:", url);

      const response = await fetch(url);
      const result = await response.json();

      console.log("[HomePage] API Response:", result);

      if (result.success) {
        console.log("[HomePage] Cafes loaded:", result.data?.length || 0);
        setCafes(result.data);
      } else {
        console.error("[HomePage] API failed:", result.message);
      }
    } catch (error) {
      console.error("[HomePage] Error fetching cafes:", error);
    }
  };

  // Debounce chỉ cho search text (300ms), filter/tag gọi ngay
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCafes();
    }, 300); // debounce khi gõ text
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter chip: gọi API ngay, không debounce
  useEffect(() => {
    fetchCafes();
  }, [activeFilters, userCoords]);

  useEffect(() => {
    if (cafes.length === 0 && selectedCafe) {
      handleCloseDetail();
    }
  }, [cafes]);

  // Extract menu images for the currently selected cafe (used in carousel & popup)
  const menuImagesForCafe = useMemo(() => {
    if (!fullCafeDetail?.images) return [];
    return fullCafeDetail.images
      .filter((img: any) => img.image_type === "MENU")
      .map((img: any) => img.image_url);
  }, [fullCafeDetail]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    fetchCafes();
  };

  const handleSelectSuggestion = (s: {
    label: string;
    type: "cafe" | "area";
    cafeRef?: CafeInfo;
  }) => {
    if (s.type === "cafe" && s.cafeRef) {
      setShowSuggestions(false);
      handleSelectCafe(s.cafeRef);
    } else {
      setSearchQuery(s.label);
      setShowSuggestions(false);
    }
  };

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const handleSelectCafe = useCallback(
    async (cafe: CafeInfo) => {
      setSelectedCafe(cafe);
      setFullCafeDetail(null);
      setActiveImageIndex(0);
      if (map) {
        map.flyTo([cafe.location.lat, cafe.location.lng], 15, {
          animate: true,
          duration: 0.6,
        });
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/cafes/${cafe.id}`);
        const result = await response.json();
        if (result.success) {
          setFullCafeDetail(result.data);
        }
      } catch (error) {
        console.error("Error fetching cafe detail:", error);
      }
    },
    [map],
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedCafe(null);
    setFullCafeDetail(null);
    setActiveImageIndex(0);
  }, []);

  const handlePanToCurrent = () => {
    if (map) {
      map.flyTo(userCoords, 14, { animate: true });
    }
  };

  // Khi URL thay đổi (bao gồm cả khi bấm nút back), xử lý cafeId trên query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCafeId = params.get("cafeId");

    // Không có cafeId trên URL → không làm gì (panel đã mở vẫn giữ nguyên)
    if (!urlCafeId) return;

    // Nếu cafeId này đã xử lý rồi → bỏ qua để tránh zoom lại khi re-render
    if (lastProcessedCafeIdRef.current === urlCafeId) return;

    if (!map) return;

    const checkAndSelectUrlCafe = async () => {
      const existing = cafes.find((c) => String(c.id) === urlCafeId);
      if (existing) {
        lastProcessedCafeIdRef.current = urlCafeId;
        // Khi back về: chỉ mở panel, panTo nhẹ nhàng KHÔNG flyTo/zoom
        setSelectedCafe(existing);
        setFullCafeDetail(null);
        setActiveImageIndex(0);
        if (existing.location.lat && existing.location.lng) {
          map.panTo([existing.location.lat, existing.location.lng], { animate: true });
        }
        try {
          const response = await fetch(`${API_BASE_URL}/api/cafes/${existing.id}`);
          const result = await response.json();
          if (result.success) setFullCafeDetail(result.data);
        } catch (err) {
          console.error("Error fetching URL cafe detail:", err);
        }
      } else {
        try {
          const response = await fetch(`${API_BASE_URL}/api/cafes/${urlCafeId}`);
          const result = await response.json();
          if (result.success && result.data) {
            const cafe = result.data;
            const mappedCafe: CafeInfo = {
              id: cafe.id,
              name: cafe.name,
              location: {
                lat: Number(cafe.lat || 0),
                lng: Number(cafe.lng || 0),
              },
              rating: cafe.avg_rating || 0,
              reviewCount: cafe.review_count || 0,
              isOpenNow: true,
              tags: cafe.custom_tags || [],
              distance: null,
              imageUrl: cafe.images?.[0]?.image_url,
              address: cafe.address,
            };
            setCafes((prev) => {
              if (prev.some((c) => c.id === mappedCafe.id)) return prev;
              return [mappedCafe, ...prev];
            });
            lastProcessedCafeIdRef.current = urlCafeId;
            // Cafe chưa có trong list → mở panel + flyTo (lần đầu)
            setSelectedCafe(mappedCafe);
            setFullCafeDetail(cafe);
            setActiveImageIndex(0);
            if (mappedCafe.location.lat && mappedCafe.location.lng) {
              map.flyTo([mappedCafe.location.lat, mappedCafe.location.lng], 15, {
                animate: true,
                duration: 0.6,
              });
            }
          }
        } catch (err) {
          console.error("Error fetching URL cafe:", err);
        }
      }
    };

    checkAndSelectUrlCafe();
  }, [location.search, map, cafes]);

  return (
    <div className="home-root">
      <TopNavBar mode="guest" activeTab="home" />

      <div className="home-main">
        <aside
          className={`home-sidebar ${selectedCafe ? "home-sidebar--detail" : ""}`}
          id="search-sidebar"
        >
          {selectedCafe ? (
            <div className="cafe-detail-panel flex flex-col h-full bg-[#fbf9f6]">
              {/* Cover Image */}
              <div
                className="cafe-detail-cover relative h-48 w-full bg-cover bg-center shrink-0"
                style={{
                  backgroundImage: `url(${selectedCafe.imageUrl ||
                    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60"
                    })`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30 flex flex-col justify-between p-4">
                  {/* Close button */}
                  <div className="flex justify-end">
                    <button
                      className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors border-0 cursor-pointer"
                      onClick={handleCloseDetail}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        width="16"
                        height="16"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  {/* Title & subtitle inside cover */}
                  <div className="text-white text-center pb-2">
                    <h2 className="text-xl font-extrabold tracking-tight drop-shadow-md">
                      {selectedCafe.name}
                    </h2>
                    <p className="text-[10px] text-gray-200/90 font-medium tracking-wider mt-0.5">
                      2014年創業 • コーヒーの家
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail Info Body */}
              <div className="cafe-detail-body flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-[#3d2c20]">
                <div>
                  <h3 className="text-xl font-extrabold text-[#1a1208] leading-snug">
                    {selectedCafe.name}
                  </h3>

                  {/* Distance & Time */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#a0896b] font-medium">
                    {selectedCafe.distance !== null && (
                      <div className="flex items-center gap-1">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          width="13"
                          height="13"
                          className="text-[#c8843a]"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{selectedCafe.distance} km 先</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        width="13"
                        height="13"
                        className="text-[#c8843a]"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>
                        {fullCafeDetail?.open_time && fullCafeDetail?.close_time
                          ? `${fullCafeDetail.open_time.substring(0, 5)} - ${fullCafeDetail.close_time.substring(0, 5)}`
                          : "07:00 - 22:00"}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1.5 mt-2.5 text-xs text-[#6b5e4e] leading-relaxed">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="13"
                      height="13"
                      className="text-gray-400 shrink-0 mt-0.5"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>
                      {fullCafeDetail?.address ||
                        selectedCafe.address ||
                        "Hanoi, Vietnam"}
                    </span>
                  </div>
                </div>

                {/* Status & Rating */}
                <div className="flex items-center justify-between border-t border-b border-[#f0ebe3] py-3 my-1">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${selectedCafe.isOpenNow
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                  >
                    {selectedCafe.isOpenNow ? "営業中" : "閉店中"}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-lg">★</span>
                    <span className="text-sm font-bold text-[#3d2c20]">
                      {selectedCafe.rating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      ({selectedCafe.reviewCount || 0})
                    </span>
                  </div>
                </div>

                {/* Feature Tags / Amenities */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedCafe.tags &&
                    selectedCafe.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#f5ede2] text-[#a0522d] border border-[#ebdcc7]"
                      >
                        {tag}
                      </span>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 mt-2">
                  <Link
                    to={`/booking?cafeId=${selectedCafe.id}`}
                    className="flex-1 bg-gradient-to-r from-[#3d2f1e] to-[#1a1208] text-white text-xs font-bold text-center py-3 rounded-xl hover:from-[#c8843a] hover:to-[#a0522d] transition-all shadow-sm flex items-center justify-center gap-1.5 border-0 cursor-pointer decoration-none"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      width="14"
                      height="14"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    席を予約
                  </Link>
                  <Link
                    to={`/reviews?cafeId=${selectedCafe.id}`}
                    className="flex-1 bg-white text-[#3d2f1e] border border-[#d6cfc7] text-xs font-bold py-3 rounded-xl hover:bg-[#faf8f6] hover:border-[#614734] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-decoration-none"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      width="14"
                      height="14"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    レビューを書く
                  </Link>
                </div>

                {/* Menu Highlight Section */}
                <div className="mt-2 border-t border-[#f0ebe3] pt-4">
                  <h4 className="text-xs font-bold text-[#c8843a] uppercase tracking-wider mb-3">
                    メニューハイライト
                  </h4>

                  {/* Image Carousel */}
                  {menuImagesForCafe.length > 0 ? (
                    <div className="relative rounded-xl overflow-hidden shadow-sm bg-gray-100 aspect-video group">
                      <img
                        src={menuImagesForCafe[activeImageIndex]}
                        alt="Menu item"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => {
                          setMenuPreviewIndex(activeImageIndex);
                          setMenuPreviewOpen(true);
                        }}
                      />
                      {menuImagesForCafe.length > 1 && (
                        <>
                          <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center text-sm font-bold border-0 cursor-pointer transition-colors"
                            onClick={() =>
                              setActiveImageIndex((prev) =>
                                prev === 0
                                  ? menuImagesForCafe.length - 1
                                  : prev - 1,
                              )
                            }
                          >
                            ‹
                          </button>
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center text-sm font-bold border-0 cursor-pointer transition-colors"
                            onClick={() =>
                              setActiveImageIndex((prev) =>
                                prev === menuImagesForCafe.length - 1
                                  ? 0
                                  : prev + 1,
                              )
                            }
                          >
                            ›
                          </button>

                          {/* Dots */}
                          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
                            {menuImagesForCafe.map((_: any, idx: number) => (
                              <button
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-all border-0 p-0 ${idx === activeImageIndex
                                  ? "bg-white scale-110"
                                  : "bg-white/40 hover:bg-white/60"
                                  }`}
                                onClick={() => setActiveImageIndex(idx)}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed border-[#d6cfc7] bg-white">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        width="28"
                        height="28"
                        className="text-gray-400"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-xs text-gray-400 mt-2 font-medium">
                        メニュー画像はありません
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="sidebar-hero">
                <h1 className="sidebar-hero__title">理想のワークスペース</h1>
                <p className="sidebar-hero__sub">厳選されたカフェスペース</p>
              </div>

              <form className="sidebar-search" onSubmit={handleSearchSubmit}>
                <div className="hp-search-wrap" ref={searchWrapRef}>
                  <div className="hp-search-field">
                    <svg
                      className="search-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="15"
                      height="15"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      id="search-bar"
                      className="search-input"
                      type="text"
                      placeholder="キーワードやタグで検索..."
                      value={searchQuery}
                      autoComplete="off"
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="hp-search-clear"
                        onClick={() => {
                          setSearchQuery("");
                          setShowSuggestions(false);
                        }}
                        aria-label="クリア"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="hp-suggestions" id="search-suggestions">
                      {suggestions.map((s, i) => (
                        <li
                          key={i}
                          className="hp-suggestion-item"
                          onMouseDown={() => handleSelectSuggestion(s)}
                        >
                          <span className="hp-suggestion-icon">
                            {s.type === "cafe" ? (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                width="13"
                                height="13"
                              >
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                                <line x1="6" y1="1" x2="6" y2="4" />
                                <line x1="10" y1="1" x2="10" y2="4" />
                                <line x1="14" y1="1" x2="14" y2="4" />
                              </svg>
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                width="13"
                                height="13"
                              >
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                            )}
                          </span>
                          <span className="hp-suggestion-label">{s.label}</span>
                          <span className="hp-suggestion-type">
                            {s.type === "cafe" ? "カフェ" : "エリア"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </form>

              <div className="filter-chips">
                {FILTER_CHIPS.map((f) => (
                  <button
                    key={f}
                    className={`filter-chip${activeFilters.includes(f) ? " filter-chip--active" : ""}`}
                    onClick={() => toggleFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Keywords section — ẩn khi đang search/filter */}
              {!(searchQuery.trim() !== "" || activeFilters.length > 0) && (
                <div className="sidebar-tags mt-4">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <p className="sidebar-tags__title" style={{ margin: 0 }}>
                      おすすめキーワード
                    </p>
                  </div>
                  <div className="tag-list">
                    {RECOMMENDED_KEYWORDS.map((tag) => (
                      <button
                        key={tag}
                        className="search-tag"
                        onClick={() => setSearchQuery(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Danh sách quán — hiển thị sau khi tìm kiếm/lọc */}
              {(searchQuery.trim() !== "" ||
                activeFilters.length > 0) && (
                  <div className="search-results-section flex-1 overflow-y-auto pr-2 pb-4">
                    <div className="text-sm text-gray-600 mb-4 font-medium">
                      <span className="font-bold text-[#614734]">
                        「
                        {searchQuery
                          ? searchQuery
                          : activeFilters.length > 0
                            ? activeFilters.join("・")
                            : "すべて"}
                        」
                      </span>
                      {" で "}
                      <span className="font-bold text-[#614734]">
                        {cafes.length}件
                      </span>
                      {" のカフェが見つかりました"}
                    </div>

                    <div className="flex flex-col gap-4">
                      {cafes.map((cafe) => {
                        const isSelected = (selectedCafe as any)?.id === cafe.id;
                        return (
                          <div
                            key={cafe.id}
                            className={`bg-white rounded-xl p-4 cursor-pointer transition-all border-2 ${isSelected
                              ? "border-[#614734] shadow-md transform scale-[1.02]"
                              : "border-transparent shadow-sm hover:shadow-md hover:border-[#614734]/30"
                              }`}
                            onClick={() => handleSelectCafe(cafe)}
                          >
                            <div className="flex gap-4">
                              <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 relative bg-gray-100">
                                {cafe.imageUrl ? (
                                  <img
                                    src={cafe.imageUrl}
                                    alt={cafe.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      width="24"
                                      height="24"
                                    >
                                      <rect
                                        x="3"
                                        y="3"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                      ></rect>
                                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                      <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                  </div>
                                )}
                                <div
                                  className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${cafe.isOpenNow
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                    }`}
                                >
                                  {cafe.isOpenNow ? "営業中" : "閉店中"}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div>
                                  <h3
                                    className="font-bold text-[#3d2c20] text-base truncate"
                                    title={cafe.name}
                                  >
                                    {cafe.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1 text-xs">
                                    <StarRating value={cafe.rating} />
                                    <span className="text-gray-400">
                                      ({cafe.reviewCount})
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1 mt-2 text-xs text-gray-500">
                                  {cafe.tags?.includes("高速Wi-Fi") && (
                                    <div className="flex items-center gap-1.5 truncate">
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        width="12"
                                        height="12"
                                        className="text-[#614734]"
                                      >
                                        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                                        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                                        <circle
                                          cx="12"
                                          cy="20"
                                          r="1"
                                          fill="currentColor"
                                        />
                                      </svg>
                                      <span className="truncate">高速Wi-Fi</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 truncate">
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      width="12"
                                      height="12"
                                      className="text-gray-400"
                                    >
                                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                      <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <span className="truncate">
                                      {cafe.distance
                                        ? `${cafe.distance}km先`
                                        : ""}
                                      {(cafe as any).address
                                        ? ` • ${(cafe as any).address.split(",").pop()?.trim()}`
                                        : ""}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </>
          )}
        </aside>

        <div className="map-area" id="main-map">
          <div className="map-inner" style={{ height: "100%", width: "100%" }}>
            {/* 4. RENDER BẢN ĐỒ OPENSTREETMAP */}
            <MapContainer
              center={userCoords}
              zoom={14}
              minZoom={8}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
              ref={setMap}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapEventsHandler onMapClick={handleCloseDetail} />

              {/* ⑨ Current Location Marker */}
              <Marker
                position={userCoords}
                icon={createCurrentLocationIcon()}
              />

              {/* Render các quán Cafe dưới dạng ghim */}
              {cafes.map((cafe) => {
                if (!cafe.location?.lat || !cafe.location?.lng) return null;

                return (
                  <Marker
                    key={cafe.id}
                    position={[
                      Number(cafe.location.lat),
                      Number(cafe.location.lng),
                    ]}
                    icon={createCafeIcon(selectedCafe?.id === cafe.id)}
                    ref={
                      cafe.id === selectedCafe?.id
                        ? selectedMarkerRef
                        : undefined
                    }
                    eventHandlers={{
                      click: () => handleSelectCafe(cafe),
                    }}
                  >
                    <Popup className="cafe-popup" closeButton={false}>
                      <div className="popup-inner">
                        <div className="popup-header">
                          <p className="popup-name">{cafe.name}</p>
                          <span
                            className={`popup-badge ${cafe.isOpenNow ? "popup-badge--open" : "popup-badge--closed"}`}
                          >
                            {cafe.isOpenNow ? "営業中" : "閉店中"}
                          </span>
                        </div>
                        <StarRating value={cafe.rating} />
                        {cafe.tags?.includes("高速Wi-Fi") && (
                          <div className="popup-row">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              width="12"
                              height="12"
                            >
                              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                              <circle
                                cx="12"
                                cy="20"
                                r="1"
                                fill="currentColor"
                              />
                            </svg>
                            高速Wi-Fi
                          </div>
                        )}
                        <div className="popup-row popup-dist">
                          {cafe.distance ? `${cafe.distance} km` : ""}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* KHU VỰC ĐANG XEM — bottom-center */}
            <div className="location-card" id="location-info-card">
              <span className="location-card__label">現在表示中</span>
              <span className="location-card__name">{locationName}</span>
            </div>
          </div>

          <div className="map-controls" style={{ zIndex: 1000 }}>
            <button
              className="map-ctrl-btn"
              onClick={() => map?.zoomIn()}
              disabled={!map || mapZoom >= (map?.getMaxZoom?.() ?? 18)}
              title="ズームイン"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              className="map-ctrl-btn"
              onClick={() => map?.zoomOut()}
              disabled={!map || mapZoom <= (map?.getMinZoom?.() ?? 1)}
              title="ズームアウト"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              className="map-ctrl-btn map-ctrl-btn--location"
              onClick={handlePanToCurrent}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Image Preview Modal */}
      {menuPreviewOpen && (
        <div className="image-modal-overlay" onClick={() => setMenuPreviewOpen(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setMenuPreviewOpen(false)}>✕</button>
            <div className="image-modal-body">
              <img src={menuImagesForCafe[menuPreviewIndex]} alt="Menu preview" className="image-modal-img" />
              {menuImagesForCafe.length > 1 && (
                <>
                  <button className="modal-arrow modal-arrow--prev" onClick={(e) => { e.stopPropagation(); setMenuPreviewIndex(prev => (prev - 1 + menuImagesForCafe.length) % menuImagesForCafe.length); }}>‹</button>
                  <button className="modal-arrow modal-arrow--next" onClick={(e) => { e.stopPropagation(); setMenuPreviewIndex(prev => (prev + 1) % menuImagesForCafe.length); }}>›</button>
                  <div className="modal-counter">{menuPreviewIndex + 1} / {menuImagesForCafe.length}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
