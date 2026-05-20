import { useState, useEffect, useRef, type FC } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TopNavBar } from "../components/TopNavBar";
import "./ReservationPage.css";

interface CafeMarker {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  tags: string[];
  image?: string;
}

interface ReservationForm {
  guestName: string;
  date: string;
  time: string;
  guests: number;
  cafeId?: string;
}

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

interface MapEventsProps {
  onLocationSelect: (lat: number, lng: number) => void;
  disabled?: boolean;
}

function MapEvents({ onLocationSelect, disabled }: MapEventsProps) {
  const map = useMap();
  useEffect(() => {
    if (disabled) return undefined;
    const handleMapClick = (e: any) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    };
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, onLocationSelect]);
  return null;
}

const ReservationPage: FC = () => {
  const centerHanoi: [number, number] = [21.0056, 105.8433];

  const [formData, setFormData] = useState<ReservationForm>({
    guestName: "",
    date: "",
    time: "",
    guests: 1,
  });

  const [cafes, setCafes] = useState<CafeMarker[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<CafeMarker | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(centerHanoi);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [showAlert, setShowAlert] = useState("");
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);

  const openNativePicker = (inputRef: React.RefObject<HTMLInputElement>) => {
    const input = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
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
          `http://localhost:3000/api/cafes?lat=${mapCenter[0]}&lng=${mapCenter[1]}`
        );
        const data = await response.json();
        if (data.success) {
          const cafeList = data.data || [];
          setCafes(cafeList);
          let nextSelected = selectedCafe;

          if (cafeId) {
            nextSelected = cafeList.find((cafe: CafeMarker) => cafe.id === cafeId) || null;
            if (!nextSelected) {
              const detailResponse = await fetch(`http://localhost:3000/api/cafes/${cafeId}`);
              const detailResult = await detailResponse.json();
              if (detailResult.success && detailResult.data) {
                const cafe = detailResult.data;
                nextSelected = {
                  id: cafe.id,
                  name: cafe.name,
                  address: cafe.address,
                  lat: Number(cafe.lat || 0),
                  lng: Number(cafe.lng || 0),
                  rating: cafe.avg_rating || 0,
                  tags: cafe.custom_tags || [],
                  image: cafe.images?.[0]?.image_url,
                } as CafeMarker;
                setCafes((prev) => [nextSelected as CafeMarker, ...prev]);
              }
            }
          }

          if (!nextSelected && cafeList.length > 0) {
            nextSelected = cafeList[0];
          }

          if (nextSelected) {
            setSelectedCafe(nextSelected);
            setFormData((prev) => ({ ...prev, cafeId: nextSelected!.id }));
            if (nextSelected.lat && nextSelected.lng) {
              setMapCenter([nextSelected.lat, nextSelected.lng]);
              setZoomLevel(15);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching cafes:", error);
      }
    };
    fetchCafes();
  }, [mapCenter]);

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
          console.warn("[ReservationPage] GPS error, falling back to HUST B1:", error);
        }
      );
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "guests" ? parseInt(value) : value,
    }));
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
  };

  const handleCafeSelect = (cafe: CafeMarker) => {
    setSelectedCafe(cafe);
    setFormData((prev) => ({ ...prev, cafeId: cafe.id }));
  };

  useEffect(() => {
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.openPopup();
    }
  }, [selectedCafe]);

  const handleZoom = (direction: "in" | "out") => {
    setZoomLevel((prev) => {
      if (direction === "in" && prev < 18) return prev + 1;
      if (direction === "out" && prev > 1) return prev - 1;
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.guestName.trim() || !formData.date || !formData.time || !selectedCafe) {
      setShowAlert("すべての情報を入力し、カフェを選択してください。");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setShowAlert("予約するにはログインしてください。");
        return;
      }

      const response = await fetch("http://localhost:3000/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          guest_name: formData.guestName.trim(),
          res_date: formData.date,
          res_time: formData.time,
          num_guests: formData.guests,
          cafe_id: selectedCafe.id
          // Không cần gửi user_id vì Backend đã tự lấy từ Token
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowAlert("✅ 予約が完了しました。履歴をご確認ください。");
        // Reset form sau khi đặt thành công
        setFormData({ guestName: "", date: "", time: "", guests: 1 });
        setSelectedCafe(null);
      } else {
        setShowAlert("❌ " + (result.message || "予約に失敗しました"));
      }
    } catch (error) {
      setShowAlert("サーバー接続エラー: " + String(error));
    }
  };

  return (
    <div className="reservation-page">
      <TopNavBar mode="guest" activeTab="booking" />

      <div className="reservation-container">
        {/* Left Panel - Reservation Form */}
        <div className="reservation-panel">
          <div className="reservation-header">
            <button className="reservation-back-btn" onClick={() => window.history.back()}>
              <span className="reservation-back-btn__icon" aria-hidden="true">←</span>
              <span className="reservation-back-btn__label">席を予約する</span>
            </button>
            <p className="reservation-subtitle">予約情報をご入力ください</p>
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
                  min={new Date().toISOString().split("T")[0]}
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
            {showAlert && <div className="alert-message">{showAlert}</div>}

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
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {/* User Location */}
              {currentLocation && (
                <Marker position={currentLocation} icon={createUserLocationIcon()}>
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
                    ref={cafe.id === selectedCafe?.id ? selectedMarkerRef : undefined}
                    eventHandlers={{
                      click: () => handleCafeSelect(cafe),
                    }}
                  >
                    <Popup>
                      <div className="cafe-popup">
                        <strong className="popup-name">{cafe.name}</strong>
                        <p className="popup-distance">0.8 km～ Ba Dinh</p>
                        <div className="popup-tags">
                          {(cafe.tags || []).map((tag) => (
                            <span key={tag} className="popup-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button onClick={() => handleCafeSelect(cafe)} className="popup-select-btn">
                          選択
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              <MapEvents onLocationSelect={handleLocationSelect} />
            </MapContainer>

            {/* Map Controls */}
            <div className="map-controls">
              <button
                className="map-ctrl-btn"
                onClick={() => handleZoom("in")}
                disabled={zoomLevel >= 18}
                title="Phóng to"
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
                onClick={() => handleZoom("out")}
                disabled={zoomLevel <= 1}
                title="Thu nhỏ"
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
                onClick={() => {
                  if (currentLocation) {
                    setMapCenter(currentLocation);
                  }
                }}
                title="Về vị trí hiện tại"
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
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                </svg>
              </button>
            </div>

            {/* Selected Cafe Info - Below Map */}
            {selectedCafe && (
              <div className="cafe-info-bottom">
                <div className="cafe-info-card">
                  <div className="cafe-card-header">
                    <h3 className="cafe-card-name">{selectedCafe.name}</h3>
                    <button
                      className="cafe-card-close"
                      onClick={() => setSelectedCafe(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="cafe-card-rating">
                    <span className="stars">★★★★★</span>
                    <span className="rating-value">{selectedCafe.rating || "N/A"}</span>
                  </div>
                  <div className="cafe-card-distance">0.6 km</div>
                  {(selectedCafe.tags || []).length > 0 && (
                    <div className="cafe-card-tags">
                      {selectedCafe.tags.map((tag) => (
                        <span key={tag} className="cafe-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <button className="cafe-card-btn">詳細を見る →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
