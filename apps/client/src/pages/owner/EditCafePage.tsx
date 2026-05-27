import React, { useState, useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

interface MenuImage {
  id: string;
  src: string;
  alt: string;
  file?: File;
}

interface CafeFormData {
  cafeName: string;
  ward: string;
  street: string;
  tags: string[];
  openTime: string;
  closeTime: string;
  coverImage: File | null;
  menuImages: MenuImage[];
  latitude: number | null;
  longitude: number | null;
}

export const EditCafePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: urlCafeId } = useParams<{ id: string }>();
  const locationMapRef = useRef<LocationMapHandle>(null);
  const [cafeId, setCafeId] = useState<string | null>(urlCafeId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialCoverImagePreview, setInitialCoverImagePreview] = useState<
    string | null
  >(null);
  const [deletedMenuImageIds, setDeletedMenuImageIds] = useState<string[]>([]);

  const [formData, setFormData] = useState<CafeFormData>({
    cafeName: "",
    ward: "",
    street: "",
    tags: [],
    openTime: "",
    closeTime: "",
    coverImage: null,
    menuImages: [],
    latitude: null,
    longitude: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    const ownerId = localStorage.getItem("user_id");
    const userRole = localStorage.getItem("user_role");
    if (!ownerId || userRole !== "cafe_owner") {
      navigate("/");
      return;
    }

    const fetchCafe = async () => {
      try {
        let targetCafeId = urlCafeId;

        if (!targetCafeId) {
          // Step 1: Lấy list cafes của owner để lấy cafeId
          const ownerResponse = await fetch(
            `http://localhost:3000/api/cafes/owner/${ownerId}`,
          );
          const ownerResult = await ownerResponse.json();

          if (
            ownerResult.success &&
            ownerResult.data &&
            ownerResult.data.length > 0
          ) {
            targetCafeId = ownerResult.data[0].id;
          }
        }

        if (targetCafeId) {
          setCafeId(targetCafeId);
          // Step 2: Fetch chi tiết quán bằng ID để lấy amenities & images
          const detailResponse = await fetch(
            `http://localhost:3000/api/cafes/${targetCafeId}`,
          );
          const detailResult = await detailResponse.json();

          if (detailResult.success && detailResult.data) {
            const cafe = detailResult.data;
            setCafeId(cafe.id);

            // Parse address into street and ward using same logic as Register page
            const rawAddress = cafe.address || "";
            const addressParts = rawAddress
              .split(",")
              .map((p: string) => p.trim())
              .filter(Boolean);

            let parsedStreet = "";
            let parsedWard = "";

            if (addressParts.length >= 2) {
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

              const wardIndex = addressParts.findIndex((part: string) =>
                wardPatterns.some((pattern) =>
                  part.toLowerCase().includes(pattern),
                ),
              );

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
            } else if (addressParts.length === 1) {
              parsedStreet = addressParts[0];
              parsedWard = "";
            }

            // Map amenities sang tags
            const standardTags = cafe.amenities
              ? cafe.amenities
                  .map((a: any) => {
                    switch (a.amenity_id) {
                      case 1:
                        return "Fast Wi-Fi";
                      case 2:
                        return "コンセント";
                      case 3:
                        return "Quiet";
                      case 4:
                        return "禁煙";
                      case 5:
                        return "エアコン";
                      case 6:
                        return "ペット可";
                      case 7:
                        return "駐車場";
                      case 8:
                        return "テラス席";
                      case 9:
                        return "飲食可";
                      case 10:
                        return "プロジェクター";
                      case 11:
                        return "会議室";
                      case 12:
                        return "24時間営業";
                      default:
                        return "";
                    }
                  })
                  .filter(Boolean)
              : [];

            const tags = [...standardTags, ...(cafe.custom_tags || [])];

            // Map images
            let initialCoverUrl = null;
            const mappedMenuImages: MenuImage[] = [];

            if (cafe.images) {
              const coverImg = cafe.images.find(
                (img: any) => img.image_type === "INTERIOR",
              );
              if (coverImg) {
                initialCoverUrl = coverImg.image_url;
                setInitialCoverImagePreview(initialCoverUrl);
              }

              const menuImgs = cafe.images.filter(
                (img: any) => img.image_type === "MENU",
              );
              menuImgs.forEach((img: any) => {
                mappedMenuImages.push({
                  id: img.id.toString(),
                  src: img.image_url,
                  alt: "Menu Image",
                });
              });
            }

            setFormData({
              cafeName: cafe.name || "",
              ward: parsedWard,
              street: parsedStreet || cafe.address || "",
              tags: tags,
              openTime: cafe.open_time ? cafe.open_time.substring(0, 5) : "",
              closeTime: cafe.close_time ? cafe.close_time.substring(0, 5) : "",
              coverImage: null,
              menuImages: mappedMenuImages,
              latitude: cafe.lat || null,
              longitude: cafe.lng || null,
            });
          } else {
            console.error("Không tìm thấy quán với ID này");
          }
        } else {
          console.error("Owner không có quán nào để sửa");
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu quán:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCafe();
  }, [navigate, urlCafeId]);

  const fullAddress = useMemo(() => {
    return [formData.street, formData.ward].filter(Boolean).join(", ");
  }, [formData.ward, formData.street]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Trigger immediate geocoding when Enter is pressed
      if (locationMapRef.current && fullAddress.trim()) {
        locationMapRef.current.geocodeAndSearch(fullAddress);
      }
    }
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

  // Auto-geocode when address changes (with debounce to avoid excessive API calls)
  React.useEffect(() => {
    if (!fullAddress.trim()) {
      return; // Don't geocode empty addresses
    }

    // Debounce the geocoding request by 800ms
    const timeoutId = setTimeout(() => {
      if (locationMapRef.current && fullAddress.trim()) {
        locationMapRef.current.geocodeAndSearch(fullAddress);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [fullAddress]);

  const handleTagsChange = (tags: string[]) => {
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleCoverImageSelect = (file: File) => {
    setFormData((prev) => ({ ...prev, coverImage: file }));
  };

  const handleAddMenuImage = (file: File) => {
    const newImage: MenuImage = {
      id: "new-" + Date.now().toString(),
      src: URL.createObjectURL(file),
      alt: file.name,
      file: file,
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
    if (!id.startsWith("new-")) {
      setDeletedMenuImageIds((prev) => [...prev, id]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.cafeName.trim()) newErrors.cafeName = "カフェ名は必須です";
    if (!formData.ward.trim()) newErrors.ward = "区・町名は必須です";
    if (!formData.street.trim()) newErrors.street = "番地・通り名は必須です";
    if (!formData.openTime.trim()) newErrors.openTime = "開店時間は必須です";
    if (!formData.closeTime.trim()) newErrors.closeTime = "閉店時間は必須です";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm() || !cafeId) return;

    setIsSaving(true);

    try {
      const ownerId = localStorage.getItem("user_id");
      if (!ownerId) {
        throw new Error("Vui lòng đăng nhập lại để tiếp tục");
      }

      const formDataToSend = new FormData();
      formDataToSend.append("cafeName", formData.cafeName);
      formDataToSend.append("ward", formData.ward);
      formDataToSend.append("street", formData.street);
      formDataToSend.append("openTime", formData.openTime);
      formDataToSend.append("closeTime", formData.closeTime);
      formDataToSend.append("lat", formData.latitude?.toString() || "");
      formDataToSend.append("lng", formData.longitude?.toString() || "");
      formDataToSend.append("tags", JSON.stringify(formData.tags));
      formDataToSend.append("owner_id", ownerId);
      formDataToSend.append(
        "deletedMenuImageIds",
        JSON.stringify(deletedMenuImageIds),
      );

      // Add cover image if changed
      if (formData.coverImage) {
        formDataToSend.append("coverImage", formData.coverImage);
      }

      // Add new menu images
      formData.menuImages.forEach((img) => {
        if (img.file) {
          formDataToSend.append("menuImages", img.file);
        }
      });

      const response = await fetch(
        `http://localhost:3000/api/cafes/${cafeId}`,
        {
          method: "PUT",
          body: formDataToSend,
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update");

      toast.success("Cập nhật thông tin quán thành công!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Đã xảy ra lỗi khi lưu thông tin");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdf9f4] flex items-center justify-center">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf9f4] text-[#1c1c19] pb-24 md:pb-0">
      <TopNavBar mode="owner" activeTab="cafes" />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-[#614734] tracking-tight mb-4">
            カフェ情報を編集
          </h1>
          <p className="text-[#4f453e] max-w-lg mx-auto font-body text-base">
            カフェの詳細情報、営業時間、または写真を更新します。
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
                  label="開店時間"
                  name="openTime"
                  placeholder="時刻（HH:MM AM/PM）"
                  value={formData.openTime}
                  onChange={handleInputChange}
                  error={errors.openTime}
                />
                <FormInput
                  label="閉店時間"
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
                initialPreview={initialCoverImagePreview}
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
              <Link
                to="/cafes"
                className="w-full md:w-auto px-10 py-4 text-[#614734] font-semibold hover:bg-[#ebe8e3] rounded-full transition-all text-center"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full md:w-auto px-12 py-4 bg-[#614734] text-white font-bold rounded-full shadow-lg shadow-[#614734]/20 hover:bg-[#4a3628] active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? "保存中..." : "変更を保存"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditCafePage;
