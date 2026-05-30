import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavBar } from "../../components/TopNavBar";
import { FormInput } from "../../components/FormInput";
import { ImageUploadArea } from "../../components/cafe/ImageUploadArea";
import { MenuImageGrid } from "../../components/cafe/MenuImageGrid";
import { FeatureTags } from "../../components/cafe/FeatureTags";
import {
  LocationMap,
  type LocationMapHandle,
} from "../../components/cafe/LocationMap";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface MenuImage {
  id: string;
  src: string;
  alt: string;
  file?: File; // Store the actual File object
}

interface CafeFormData {
  cafeName: string;
  ward: string;
  street: string;
  tags: string[];
  openTime: string;
  closeTime: string;
  latitude: number | null;
  longitude: number | null;
  coverImage: File | null;
  menuImages: MenuImage[];
}

export const RegisterCafePage: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const ownerId = localStorage.getItem("user_id");
    const userRole = localStorage.getItem("user_role");
    if (!ownerId || userRole !== "cafe_owner") {
      navigate("/");
    }
  }, [navigate]);

  const locationMapRef = useRef<LocationMapHandle>(null);
  const [formData, setFormData] = useState<CafeFormData>({
    cafeName: "",
    ward: "",
    street: "",
    tags: [],
    openTime: "",
    closeTime: "",
    latitude: null,
    longitude: null,
    coverImage: null,
    menuImages: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fullAddress = useMemo(() => {
    return [formData.street, formData.ward].filter(Boolean).join(", ");
  }, [formData.ward, formData.street]);

  // Auto-geocode khi địa chỉ thay đổi (debounce 800ms) để cập nhật mượt mà
  React.useEffect(() => {
    if (!fullAddress.trim()) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (locationMapRef.current && fullAddress.trim()) {
        locationMapRef.current.geocodeAndSearch(fullAddress);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [fullAddress]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Trigger geocoding when Enter is pressed
      if (locationMapRef.current && fullAddress.trim()) {
        locationMapRef.current.geocodeAndSearch(fullAddress);
      }
    }
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleLocationSelect = (
    lat: number,
    lng: number,
    address: string,
    fromGeocode?: boolean,
  ) => {
    setFormData((prev) => {
      const updateData = {
        ...prev,
        latitude: lat,
        longitude: lng,
      };

      // Nếu cập nhật vị trí xuất phát từ việc gõ địa chỉ, không ghi đè text input đang gõ
      if (fromGeocode) {
        return updateData;
      }

      const addressParts = address
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

      const wardPatterns = [
        "phường",
        "quận",
        "huyện",
        "xã",
        "thị trấn",
        "tp.",
        "thành phố",
        "ward",
        "district",
        "commune",
        "city",
        "town",
      ];

      const wardIndex = addressParts.findIndex((part) =>
        wardPatterns.some((pattern) => part.toLowerCase().includes(pattern)),
      );

      let parsedWard = "";
      let parsedStreet = "";

      if (wardIndex > 0) {
        parsedStreet = addressParts.slice(0, wardIndex).join(", ");
        parsedWard = addressParts.slice(wardIndex).join(", ");
      } else if (wardIndex === 0) {
        parsedStreet = "";
        parsedWard = addressParts.join(", ");
      } else if (addressParts.length > 1) {
        parsedStreet = addressParts.slice(0, -1).join(", ");
        parsedWard = addressParts.slice(-1)[0] || "";
      } else {
        parsedStreet = addressParts[0] || "";
        parsedWard = "";
      }

      updateData.street = parsedStreet;
      updateData.ward = parsedWard;

      return updateData;
    });
  };

  const handleCoverImageSelect = (file: File) => {
    setFormData((prev) => ({
      ...prev,
      coverImage: file,
    }));
  };

  const handleAddMenuImage = (file: File) => {
    const newImage: MenuImage = {
      id: Date.now().toString(),
      src: URL.createObjectURL(file),
      alt: file.name,
      file: file, // Store the actual File object
    };
    setFormData((prev) => ({
      ...prev,
      menuImages: [...prev.menuImages, newImage],
    }));
  };

  const handleDeleteMenuImage = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      menuImages: prev.menuImages.filter((img) => img.id !== id),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cafeName.trim()) newErrors.cafeName = "カフェ名は必須です";
    if (!formData.ward.trim()) newErrors.ward = "区・町名は必須です";
    if (!formData.street.trim()) newErrors.street = "番地・通り名は必須です";
    if (!formData.openTime.trim()) newErrors.openTime = "開店時間は必須です";
    if (!formData.closeTime.trim()) newErrors.closeTime = "閉店時間は必須です";
    if (formData.latitude === null || formData.longitude === null) {
      newErrors.location = "地図から場所を選択してください";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData to include files
      const formDataToSend = new FormData();
      formDataToSend.append("cafeName", formData.cafeName);
      formDataToSend.append("ward", formData.ward);
      formDataToSend.append("street", formData.street);
      formDataToSend.append("openTime", formData.openTime);
      formDataToSend.append("closeTime", formData.closeTime);
      formDataToSend.append("lat", formData.latitude?.toString() || "");
      formDataToSend.append("lng", formData.longitude?.toString() || "");
      formDataToSend.append("tags", JSON.stringify(formData.tags));

      // Get actual user ID from localStorage
      const ownerId = localStorage.getItem("user_id");
      if (!ownerId) {
        throw new Error("Vui lòng đăng nhập lại để tiếp tục");
      }
      formDataToSend.append("owner_id", ownerId);

      // Add cover image if present
      if (formData.coverImage) {
        formDataToSend.append("coverImage", formData.coverImage);
      }

      // Add menu images (collect only those with File objects)
      formData.menuImages.forEach((img) => {
        if (img.file) {
          formDataToSend.append("menuImages", img.file);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/cafes`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to register café",
        );
      }

      // Success!
      toast.success("Tạo quán thành công!");
      setTimeout(() => {
        navigate("/dashboard"); // Redirect to dashboard
      }, 1500);
    } catch (error: any) {
      console.error("[RegisterCafe] Error submitting form:", error);
      toast.error(
        error.message || "Failed to register café. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      cafeName: "",
      ward: "",
      street: "",
      tags: [],
      openTime: "",
      closeTime: "",
      latitude: null,
      longitude: null,
      coverImage: null,
      menuImages: [],
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#fdf9f4] text-[#1c1c19] pb-24 md:pb-0">
      <TopNavBar mode="owner" activeTab="register" />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-[#614734] tracking-tight mb-4">
            新しいカフェを登録
          </h1>
          <p className="text-[#4f453e] max-w-lg mx-auto font-body text-base">
            WorkSpotのコミュニティに参加して、ハノイのリモートワーカーにあなたのユニークな空間を紹介しましょう。
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-[#f7f3ee] p-8 md:p-12 rounded-[2rem] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Basic Info Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2 border-b border-[#e5e3df] pb-4">
                <span className="material-symbols-outlined text-[#614734]">
                  storefront
                </span>
                <h2 className="font-headline text-xl font-semibold text-[#614734]">
                  基本情報
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* Left Column: Form Fields */}
                <div className="space-y-6">
                  <FormInput
                    label="カフェ名"
                    name="cafeName"
                    placeholder="カフェの名前"
                    value={formData.cafeName}
                    onChange={handleInputChange}
                    error={errors.cafeName}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="番地・通り"
                      name="street"
                      placeholder="番地・通り"
                      value={formData.street}
                      onChange={handleInputChange}
                      onKeyDown={handleAddressKeyDown}
                      error={errors.street}
                    />
                    <FormInput
                      label="区・町"
                      name="ward"
                      placeholder="区・町"
                      value={formData.ward}
                      onChange={handleInputChange}
                      onKeyDown={handleAddressKeyDown}
                      error={errors.ward}
                    />
                  </div>

                  <div className="pt-2">
                    <FeatureTags
                      selectedTags={formData.tags}
                      onChange={handleTagsChange}
                    />
                  </div>
                </div>

                {/* Right Column: Sticky Map */}
                <div className="relative">
                  <div className="sticky top-24 h-full min-h-[400px] max-h-[calc(100vh-160px)]">
                    <LocationMap
                      ref={locationMapRef}
                      address={fullAddress}
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationSelect={handleLocationSelect}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Error for location */}
            {errors.location && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {errors.location}
              </div>
            )}

            {/* Logistics Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2 border-b border-[#e5e3df] pb-4">
                <span className="material-symbols-outlined text-[#614734]">
                  schedule
                </span>
                <h2 className="font-headline text-xl font-semibold text-[#614734]">
                  営業時間
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="開店時刻"
                  name="openTime"
                  placeholder="時刻（HH:MM AM/PM）"
                  value={formData.openTime}
                  onChange={handleInputChange}
                  error={errors.openTime}
                />
                <FormInput
                  label="閉店時刻"
                  name="closeTime"
                  placeholder="時刻（HH:MM AM/PM）"
                  value={formData.closeTime}
                  onChange={handleInputChange}
                  error={errors.closeTime}
                />
              </div>
            </section>

            {/* Media Upload Section */}
            <section className="space-y-8 pt-4 border-t border-[#e5e3df]">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-[#614734]">
                  photo_library
                </span>
                <h2 className="font-headline text-xl font-semibold text-[#614734]">
                  ビジュアルギャラリー
                </h2>
              </div>

              {/* Cover Image */}
              <ImageUploadArea
                label="メイン画像"
                onImageSelect={handleCoverImageSelect}
                description="クリックしてメイン写真を選択"
                size="推奨サイズ: 1920x800px"
              />

              {/* Menu Grid */}
              <MenuImageGrid
                label="メニュー画像をアップロード"
                images={formData.menuImages}
                onAddImage={handleAddMenuImage}
                onDeleteImage={handleDeleteMenuImage}
              />
            </section>

            {/* Actions */}
            <div className="pt-8 flex flex-col md:flex-row items-center justify-end gap-4 border-t border-[#e5e3df]">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full md:w-auto px-10 py-4 text-[#614734] font-semibold hover:bg-[#ebe8e3] rounded-full transition-all disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-12 py-4 bg-[#614734] text-white font-bold rounded-full shadow-lg shadow-[#614734]/20 hover:bg-[#4a3628] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "登録中..." : "カフェを作成"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default RegisterCafePage;
