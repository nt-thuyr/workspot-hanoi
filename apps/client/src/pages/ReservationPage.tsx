import { useState, useEffect, type FC } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TopNavBar } from "../components/TopNavBar";
import "./ReservationPage.css";

interface CafeMarker {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  tags: string[];
  image?: string;
}

interface ReservationForm {
  name: string;
  date: string;
  time: string;
  guests: number;
  cafeId?: number;
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
  return new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

interface MapEventsProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapEvents({ onLocationSelect }: MapEventsProps) {
  const map = useMap();
  useEffect(() => {
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
  const centerHanoi: [number, number] = [21.028511, 105.804817];

  const [formData, setFormData] = useState<ReservationForm>({
    name: "",
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

  // Fetch cafes from API
  useEffect(() => {
    const fetchCafes = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/cafes?lat=${mapCenter[0]}&lng=${mapCenter[1]}`
        );
        const data = await response.json();
        if (data.success) {
          setCafes(data.data || []);
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
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (!formData.name || !formData.date || !formData.time || !selectedCafe) {
      setShowAlert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({
          name: formData.name,
          res_date: formData.date,
          res_time: formData.time,
          num_guests: formData.guests,
          cafe_id: selectedCafe.id,
          user_id: localStorage.getItem("user_id"),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowAlert("Đặt chỗ thành công! Vui lòng kiểm tra email.");
        setFormData({ name: "", date: "", time: "", guests: 1 });
        setSelectedCafe(null);
      } else {
        setShowAlert(result.message || "Đặt chỗ thất bại");
      }
    } catch (error) {
      setShowAlert("Lỗi: " + String(error));
    }
  };

  return (
    <div className="reservation-page">
      <TopNavBar mode="guest" activeTab="booking" />

      <div className="reservation-container">
        {/* Left Panel - Reservation Form */}
        <div className="reservation-panel">
          <div className="reservation-header">
            <button className="back-btn" onClick={() => window.history.back()}>
              ← 席を予約する
            </button>
            <p className="reservation-subtitle">予約情報をご入力ください</p>
          </div>

          <form className="reservation-form" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                氏名
              </label>
              <p className="form-hint">名前を入力してください</p>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="山田太郎"
                className="form-input"
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
                  min={new Date().toISOString().split("T")[0]}
                />
                <span className="calendar-icon">📅</span>
              </div>
            </div>

            {/* Time Field */}
            <div className="form-group">
              <label htmlFor="time" className="form-label">
                時間
              </label>
              <p className="form-hint">予約時間を選択してください</p>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="form-input"
              />
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
              予約後の通知に関する案内テキスト
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
                    eventHandlers={{
                      click: () => handleCafeSelect(cafe),
                    }}
                  >
                    <Popup>
                      <div className="cafe-popup">
                        <strong className="popup-name">{cafe.name}</strong>
                        <p className="popup-wifi">
                          {cafe.tags?.includes("wifi") && "📶 無料WiFiあり"}
                        </p>
                        <p className="popup-distance">0.8 km～ Ba Dinh</p>
                        <div className="popup-tags">
                          {cafe.tags?.map((tag) => (
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
                +
              </button>
              <button
                className="map-ctrl-btn"
                onClick={() => handleZoom("out")}
                disabled={zoomLevel <= 1}
                title="Thu nhỏ"
              >
                −
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
                📍
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
