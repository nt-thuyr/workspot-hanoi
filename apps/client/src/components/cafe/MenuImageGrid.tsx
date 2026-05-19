import React, { useRef } from "react";

interface MenuImage {
  id: string;
  src: string;
  alt: string;
}

interface MenuImageGridProps {
  images: MenuImage[];
  onAddImage: (file: File) => void;
  onDeleteImage: (id: string) => void;
  label: string;
}

export const MenuImageGrid: React.FC<MenuImageGridProps> = ({
  images,
  onAddImage,
  onDeleteImage,
  label,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddClick = () => {
    console.log("[MenuImageGrid] Click to add menu image");
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("[MenuImageGrid] File selected:", file);
    if (file) {
      console.log("[MenuImageGrid] File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      onAddImage(file);
      console.log("[MenuImageGrid] File passed to parent");
    } else {
      console.log("[MenuImageGrid] No file selected");
    }
  };

  return (
    <div className="space-y-3">
      <label className="block font-label text-[11px] uppercase tracking-widest font-bold text-[#81756d]">
        {label}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Add Button */}
        <div
          onClick={handleAddClick}
          className="aspect-square bg-[#ebe8e3] rounded-xl flex items-center justify-center border-2 border-dashed border-[#d3c4bb]/30 group hover:bg-[#e6e2dd] cursor-pointer transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="material-symbols-outlined text-[#81756d] group-hover:scale-110 transition-transform">
            add
          </span>
        </div>

        {/* Image Items */}
        {images.map((image) => (
          <div
            key={image.id}
            className="aspect-square bg-[#e6e2dd] rounded-xl overflow-hidden relative group"
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
            <div
              onClick={() => onDeleteImage(image.id)}
              className="absolute inset-0 bg-[#614734]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-white">
                delete
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
