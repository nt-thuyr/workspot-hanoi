import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopNavBar } from "../../components/TopNavBar";
import { FormInput } from "../../components/FormInput";
import { ImageUploadArea } from "../../components/cafe/ImageUploadArea";
import { MenuImageGrid } from "../../components/cafe/MenuImageGrid";
import { FeatureTags } from "../../components/cafe/FeatureTags";
import { LocationMap } from "../../components/cafe/LocationMap";

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
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
    if (!ownerId) {
      navigate("/login");
      return;
    }

    const fetchCafe = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/cafes/owner/${ownerId}`);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          const cafe = result.data[0];
          setCafeId(cafe.id);
          setFormData({
            cafeName: cafe.name || "",
            ward: (cafe.address || "").split(",").reverse()[0]?.trim() || "",
            street: (cafe.address || "").split(",").reverse()[1]?.trim() || cafe.address || "",
            tags: cafe.tags || [],
            openTime: cafe.open_time || "",
            closeTime: cafe.close_time || "",
            coverImage: null,
            menuImages: [],
            latitude: cafe.lat || null,
            longitude: cafe.lng || null,
          });
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu quán:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCafe();
  }, [navigate]);

  const fullAddress = useMemo(() => {
    return [formData.ward, formData.street].filter(Boolean).join(" ");
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

  const handleTagsChange = (tags: string[]) => {
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleCoverImageSelect = (file: File) => {
    setFormData((prev) => ({ ...prev, coverImage: file }));
  };

  const handleAddMenuImage = (file: File) => {
    const newImage: MenuImage = {
      id: Date.now().toString(),
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
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.cafeName.trim()) newErrors.cafeName = "カフェ名は必須です";
    if (!formData.ward.trim()) newErrors.ward = "区・町名は必須です";
    if (!formData.street.trim()) newErrors.street = "番地・通り名は必須です";
    if (!formData.openTime.trim()) newErrors.openTime = "開店時間は必須です";
    if (!formData.closeTime.trim()) newErrors.closeTime = "閉店時間は必須です";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm() || !cafeId) return;

    setIsSaving(true);
    setSubmitError("");

    try {
      const ownerId = localStorage.getItem("user_id");
      const address = [formData.street, formData.ward].filter(Boolean).join(", ");
      
      const response = await fetch(`http://localhost:3000/api/cafes/${cafeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: ownerId,
          name: formData.cafeName,
          address: address,
          open_time: formData.openTime,
          close_time: formData.closeTime,
          tags: formData.tags,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update");

      alert("カフェ情報を正常に更新しました！");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      setSubmitError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#fdf9f4] flex items-center justify-center">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="min-h-screen bg-[#fdf9f4] text-[#1c1c19] pb-24 md:pb-0">
      <TopNavBar mode="owner" activeTab="cafes" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
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
                      label="番地・通り名"
                      name="street"
                      placeholder="番地・通り名"
                      value={formData.street}
                      onChange={handleInputChange}
                      error={errors.street}
                    />
                    <FormInput
                      label="区・町"
                      name="ward"
                      placeholder="区・町名"
                      value={formData.ward}
                      onChange={handleInputChange}
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
                    <LocationMap address={fullAddress} />
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
