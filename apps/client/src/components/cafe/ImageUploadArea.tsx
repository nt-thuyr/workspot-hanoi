import React, { useRef, useState } from "react";

interface ImageUploadAreaProps {
  onImageSelect: (file: File) => void;
  label: string;
  description?: string;
  size?: string;
}

export const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({
  onImageSelect,
  label,
  description = "Click to select primary hero photo",
  size = "Recommended size: 1920x800px",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleClick = () => {
    console.log("[ImageUploadArea] Click to upload, opening file dialog");
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("[ImageUploadArea] File selected:", file);
    if (file) {
      console.log("[ImageUploadArea] File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        console.log("[ImageUploadArea] Preview created");
      };
      reader.readAsDataURL(file);
      
      onImageSelect(file);
      console.log("[ImageUploadArea] File passed to parent");
    } else {
      console.log("[ImageUploadArea] No file selected");
    }
  };

  return (
    <div className="space-y-3">
      <label className="block font-label text-[11px] uppercase tracking-widest font-bold text-[#81756d]">
        {label}
      </label>
      <div
        onClick={handleClick}
        className="relative group cursor-pointer overflow-hidden rounded-3xl aspect-[21/9] bg-[#ebe8e3] border-2 border-dashed border-[#d3c4bb]/30 flex flex-col items-center justify-center transition-all hover:bg-[#e6e2dd]"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <span className="material-symbols-outlined text-4xl text-[#81756d] mb-2 group-hover:scale-110 transition-transform">
              add_a_photo
            </span>
            <p className="text-sm text-[#4f453e] font-medium">{description}</p>
            <p className="text-xs text-[#81756d] mt-1">{size}</p>
          </>
        )}
      </div>
    </div>
  );
};
