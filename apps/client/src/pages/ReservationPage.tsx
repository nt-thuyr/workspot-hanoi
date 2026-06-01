import { useState, useEffect, useRef, type FC, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TopNavBar } from "../components/TopNavBar";
import "./ReservationPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface CafeMarker {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  tags: string[];
  image?: string;
  isOpenNow?: boolean;
  distance?: number | null;
  openTime?: string | null;
  closeTime?: string | null;
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="star-rating">
      {"★".repeat(Math.floor(value))}
      {"☆".repeat(5 - Math.floor(value))}
      <span className="star-value">{value.toFixed(1)}</span>
    </span>
  );
}

interface ReservationForm {
  guestName: string;
  date: string;
  time: string;
  guests: number;
  cafeId?: string;
}

type AlertVariant = "success" | "error";

const createCafeIcon = () => {
  return new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const createUserLocationIcon = () => {
  return L.divIcon({
    className: "",
    html: `<div class="current-pin">
      <div class="current-pin__pulse"></div>
      <div class="current-pin__dot"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const getTodayInputValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseTimeToMinutes = (time: string) => {
  const [hoursStr = "", minutesStr = ""] = time.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const isTimeWithinCafeHours = (
  time: string,
  openTime?: string | null,
  closeTime?: string | null,
) => {
  if (!openTime || !closeTime) return false;

  const target = parseTimeToMinutes(time);
  const open = parseTimeToMinutes(openTime);
  const close = parseTimeToMinutes(closeTime);

  if (target == null || open == null || close == null) return false;

  if (open <= close) {
    return target >= open && target <= close;
  }

  return target >= open || target <= close;
};

const buildReservationDateTime = (date: string, time: string) => {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${normalizedTime}`);
};

interface MapEventsProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onMapMoveEnd: (lat: number, lng: number) => void;
  disabled?: boolean;
}

function MapEvents({
  onLocationSelect,
  onMapMoveEnd,
  disabled,
}: MapEventsProps) {
  const map = useMap();
  useEffect(() => {
    if (disabled) return undefined;
    const handleMapClick = (e: any) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    };
    const handleMoveEnd = () => {
      const center = map.getCenter();
      onMapMoveEnd(center.lat, center.lng);
    };
    map.on("click", handleMapClick);
    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("click", handleMapClick);
      map.off("moveend", handleMoveEnd);
    };
  }, [map, onLocationSelect, onMapMoveEnd, disabled]);
  return null;
}

const ReservationPage: FC = () => {
  const navigate = useNavigate();
  const centerHanoi: [number, number] = [21.0056, 105.8433];

  const [formData, setFormData] = useState<ReservationForm>({
    guestName: "",
    date: "",
    time: "",
    guests: 1,
  });

  const [cafes, setCafes] = useState<CafeMarker[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<CafeMarker | null>(null);
  const [bookingCafe, setBookingCafe] = useState<CafeMarker | null>(null);
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(centerHanoi);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [mapZoom, setMapZoom] = useState(13);
  const [map, setMap] = useState<L.Map | null>(null);
  const [showAlert, setShowAlert] = useState("");
  const [alertVariant, setAlertVariant] = useState<AlertVariant>("error");
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const hasCenteredRef = useRef(false);
  const [locationName, setLocationName] = useState("Hai Ba Trung, Hanoi");

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&accept-language=vi`,
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
        const city = addr.city || addr.town || addr.province || "Hanoi";
        if (district) {
          setLocationName(`${district}, ${city}`);
        } else {
          setLocationName(city);
        }
      }
    } catch (error) {
      console.error("[ReservationPage] Error reverse geocoding:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      reverseGeocode(mapCenter[0], mapCenter[1]);
    }, 400); // 400ms debounce to prevent spamming OSM Nominatim API
    return () => clearTimeout(timer);
  }, [mapCenter]);

  const openNativePicker = (inputRef: React.RefObject<HTMLInputElement>) => {
    const input = inputRef.current as
      | (HTMLInputElement & { showPicker?: () => void })
      | null;
    if (!input) return;
    if (input.showPicker) {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  };

  // Fetch cafes from API
  useEffect(() => {
    const fetchCafes = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const cafeId = params.get("cafeId");
        const response = await fetch(
          `${API_BASE_URL}/api/cafes/map?lat=${mapCenter[0]}&lng=${mapCenter[1]}&maxDistance=30`,
        );
        const data = await response.json();
        if (data.success) {
          const cafeList = (data.data || []).map((cafe: any) => ({
            id: cafe.id,
            name: cafe.name,
            address: cafe.address,
            lat: Number(cafe.location?.lat || 0),
            lng: Number(cafe.location?.lng || 0),
            rating: cafe.rating || 0,
            tags: cafe.tags || [],
            image: cafe.imageUrl,
            isOpenNow: cafe.isOpenNow,
            openTime: cafe.open_time || null,
            closeTime: cafe.close_time || null,
            distance: cafe.distance,
          }));
          setCafes(cafeList);

          let targetCafe: CafeMarker | null = null;

          if (cafeId) {
            targetCafe =
              cafeList.find((cafe: CafeMarker) => cafe.id === cafeId) || null;
            if (!targetCafe) {
              const detailResponse = await fetch(
                `${API_BASE_URL}/api/cafes/${cafeId}`,
              );
              const detailResult = await detailResponse.json();
              if (detailResult.success && detailResult.data) {
                const cafe = detailResult.data;

                const tagMap: Record<number, string> = {
                  1: "高速Wi-Fi",
                  2: "コンセント",
                  3: "静か",
                  4: "禁煙",
                  5: "エアコン",
                  6: "ペット可",
                  7: "駐車場",
                  8: "テラス席",
                  9: "飲食可",
                  10: "プロジェクター",
                  11: "会議室",
                  12: "24時間営業",
                };
                const standardTags = (cafe.amenities || [])
                  .map((a: any) => tagMap[a.amenity_id])
                  .filter(Boolean);
                const combinedTags = [
                  ...standardTags,
                  ...(cafe.custom_tags || []),
                ];

                const checkIsOpen = (openTime: string, closeTime: string) => {
                  if (!openTime || !closeTime) return false;
                  const now = new Date();
                  const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
                  return (
                    currentTimeStr >= openTime && currentTimeStr <= closeTime
                  );
                };

                targetCafe = {
                  id: cafe.id,
                  name: cafe.name,
                  address: cafe.address,
                  lat: Number(cafe.lat || 0),
                  lng: Number(cafe.lng || 0),
                  rating: cafe.avg_rating || 0,
                  tags: combinedTags,
                  image: cafe.images?.[0]?.image_url,
                  isOpenNow: checkIsOpen(cafe.open_time, cafe.close_time),
                  openTime: cafe.open_time || null,
                  closeTime: cafe.close_time || null,
                  distance: null,
                } as CafeMarker;
                setCafes((prev) => [targetCafe as CafeMarker, ...prev]);
              }
            }
          }

          if (!targetCafe && cafeList.length > 0) {
            targetCafe = cafeList[0];
          }

          if (targetCafe) {
            // Set initial selected and booking cafe
            setBookingCafe(targetCafe);
            setSelectedCafe(targetCafe);
            setFormData((prev) => ({ ...prev, cafeId: targetCafe!.id }));
            if (!hasCenteredRef.current && targetCafe.lat && targetCafe.lng) {
              setMapCenter([targetCafe.lat, targetCafe.lng]);
              setZoomLevel(15);
              hasCenteredRef.current = true;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching cafes:", error);
      }
    };
    fetchCafes();
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.warn(
            "[ReservationPage] GPS error, falling back to HUST B1:",
            error,
          );
        },
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "guests" ? parseInt(value) : value,
    }));
  };

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setMapCenter([lat, lng]);
  }, []);

  const handleMapMoveEnd = useCallback((lat: number, lng: number) => {
    setMapCenter([lat, lng]);
  }, []);

  const handleCafeSelect = (cafe: CafeMarker) => {
    if (bookingCafe && cafe.id !== bookingCafe.id) {
      navigate(`/?cafeId=${cafe.id}`);
    } else {
      setSelectedCafe(cafe);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.openPopup();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedCafe, cafes]);

  const handlePanToCurrent = () => {
    if (!map) return;
    if (currentLocation) {
      map.flyTo(currentLocation, 14, { animate: true });
      return;
    }
    map.flyTo(mapCenter, 14, { animate: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.guestName.trim() ||
      !formData.date ||
      !formData.time ||
      !selectedCafe
    ) {
      setAlertVariant("error");
      setShowAlert("すべての情報を入力し、カフェを選択してください。");
      return;
    }

    const selectedDateTime = buildReservationDateTime(
      formData.date,
      formData.time,
    );
    if (Number.isNaN(selectedDateTime.getTime())) {
      setAlertVariant("error");
      setShowAlert("予約日時が無効です。");
      return;
    }

    const now = new Date();
    if (selectedDateTime.getTime() < now.getTime()) {
      setAlertVariant("error");
      setShowAlert("過去の日時には予約できません。");
      return;
    }

    if (
      !isTimeWithinCafeHours(
        formData.time,
        selectedCafe.openTime,
        selectedCafe.closeTime,
      )
    ) {
      if (selectedCafe.openTime && selectedCafe.closeTime) {
        setAlertVariant("error");
        setShowAlert(
          `予約時間は営業時間内（${selectedCafe.openTime.slice(0, 5)}〜${selectedCafe.closeTime.slice(0, 5)}）で指定してください。`,
        );
      } else {
        setAlertVariant("error");
        setShowAlert("このカフェの営業時間が取得できませんでした。");
      }
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setAlertVariant("error");
        setShowAlert("予約するにはログインしてください。");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          guest_name: formData.guestName.trim(),
          res_date: formData.date,
          res_time: formData.time,
          num_guests: formData.guests,
          cafe_id: selectedCafe.id,
          // Không cần gửi user_id vì Backend đã tự lấy từ Token
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAlertVariant("success");
        setShowAlert("予約が完了しました。履歴をご確認ください。");
        // Reset form sau khi đặt thành công
        setFormData({ guestName: "", date: "", time: "", guests: 1 });
        setSelectedCafe(null);
      } else {
        setAlertVariant("error");
        setShowAlert(result.message || "予約に失敗しました");
      }
    } catch (error) {
      setAlertVariant("error");
      setShowAlert("サーバー接続エラー: " + String(error));
    }
  };

  return (
    <div className="reservation-page">
      <TopNavBar mode="guest" activeTab="home" />

      <div className="reservation-container">
        {/* Left Panel - Reservation Form */}
        <div className="reservation-panel">
          <div className="reservation-header">
            <button
              className="reservation-back-btn"
              onClick={() => window.history.back()}
            >
              <span className="reservation-back-btn__icon" aria-hidden="true">
                ←
              </span>
              <span className="reservation-back-btn__label">
                {bookingCafe
                  ? `${bookingCafe.name} の席を予約`
                  : "席を予約する"}
              </span>
            </button>
            <p className="reservation-subtitle">
              {bookingCafe
                ? `「${bookingCafe.name}」の予約情報をご入力ください`
                : "予約情報をご入力ください"}
            </p>
          </div>

          <form className="reservation-form" onSubmit={handleSubmit}>
            {/* Date Field */}
            <div className="form-group">
              <label htmlFor="guestName" className="form-label">
                氏名
              </label>
              <p className="form-hint">名前を入力してください</p>
              <input
                type="text"
                id="guestName"
                name="guestName"
                value={formData.guestName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="名前を入力"
                autoComplete="name"
              />
            </div>

            {/* Date Field */}
            <div className="form-group">
              <label htmlFor="date" className="form-label">
                日付
              </label>
              <p className="form-hint">日付を選択してください</p>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="form-input"
                  ref={dateInputRef}
                  min={getTodayInputValue()}
                />
                <span
                  className="calendar-icon"
                  onClick={() => openNativePicker(dateInputRef)}
                >
                  🗓
                </span>
              </div>
            </div>

            {/* Time Field */}
            <div className="form-group">
              <label htmlFor="time" className="form-label">
                時間
              </label>
              <p className="form-hint">予約時間を選択してください</p>
              <div className="time-input-wrapper">
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="form-input"
                  ref={timeInputRef}
                  min={
                    selectedCafe?.openTime
                      ? selectedCafe.openTime.slice(0, 5)
                      : undefined
                  }
                  max={
                    selectedCafe?.closeTime
                      ? selectedCafe.closeTime.slice(0, 5)
                      : undefined
                  }
                />
                <span
                  className="time-icon"
                  onClick={() => openNativePicker(timeInputRef)}
                >
                  🕒
                </span>
              </div>
            </div>

            {/* Guests Field */}
            <div className="form-group">
              <label htmlFor="guests" className="form-label">
                人数
              </label>
              <p className="form-hint">人数を選択してください</p>
              <select
                id="guests"
                name="guests"
                value={formData.guests}
                onChange={handleInputChange}
                className="form-input"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num}人
                  </option>
                ))}
              </select>
            </div>

            {/* Alert Message */}
            {showAlert && (
              <div className={`alert-message alert-message--${alertVariant}`}>
                {showAlert}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={!selectedCafe}
            >
              予約を確定する
            </button>

            <p className="reservation-note">
              予約後、予約状況の通知が送信されます
            </p>
          </form>
        </div>

        {/* Right Panel - Map */}
        <div className="map-panel">
          {/* Map */}
          <div className="map-container">
            <MapContainer
              center={mapCenter}
              zoom={zoomLevel}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
              ref={setMap}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />

              {/* User Location */}
              {currentLocation && (
                <Marker
                  position={currentLocation}
                  icon={createUserLocationIcon()}
                >
                  <Popup>あなたの現在地</Popup>
                </Marker>
              )}

              {/* Cafe Markers */}
              {cafes.map((cafe) => {
                if (!cafe.lat || !cafe.lng) return null;
                return (
                  <Marker
                    key={cafe.id}
                    position={[cafe.lat, cafe.lng]}
                    icon={createCafeIcon()}
                    ref={
                      cafe.id === selectedCafe?.id
                        ? selectedMarkerRef
                        : undefined
                    }
                    eventHandlers={{
                      click: () => handleCafeSelect(cafe),
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
                            <circle cx="12" cy="20" r="1" fill="currentColor" />
                          </svg>
                          {cafe.tags?.[0] ?? "Wi-Fi"}
                        </div>
                        <div className="popup-row popup-dist">
                          {cafe.distance ? `${cafe.distance} km` : ""}
                        </div>
                        {cafe.id === bookingCafe?.id ? (
                          <div
                            className="popup-booking-status"
                            style={{
                              textAlign: "center",
                              color: "#614734",
                              fontWeight: "bold",
                              fontSize: "11px",
                              marginTop: "8px",
                            }}
                          >
                            選択中
                          </div>
                        ) : (
                          <Link
                            to={`/?cafeId=${cafe.id}`}
                            className="popup-select-btn text-center decoration-none"
                            style={{
                              display: "block",
                              textAlign: "center",
                              textDecoration: "none",
                              marginTop: "8px",
                            }}
                          >
                            詳細を見る →
                          </Link>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              <MapEvents
                onLocationSelect={handleLocationSelect}
                onMapMoveEnd={handleMapMoveEnd}
              />
            </MapContainer>

            {/* KHU VỰC ĐANG XEM — bottom-center */}
            <div className="location-card" id="location-info-card">
              <span className="location-card__label">現在表示中</span>
              <span className="location-card__name">{locationName}</span>
            </div>

            {/* Map Controls */}
            <div className="map-controls">
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
                title="現在地に戻る"
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
      </div>
    </div>
  );
};

export default ReservationPage;
