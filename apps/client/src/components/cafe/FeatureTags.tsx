import React, { useState } from "react";

interface FeatureTagsProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

const RECOMMENDED_TAGS = [
  "高速Wi-Fi", "静か", "エアコン", "ペット可", "駐車場", "テラス席", "飲食可", 
  "プロジェクター", "会議室", "24時間営業", "コンセント"
];

export const FeatureTags: React.FC<FeatureTagsProps> = ({ selectedTags, onChange }) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      onChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddTag(inputValue.trim());
        setInputValue("");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#4f453e] mb-2">
          特徴タグ
        </label>
        
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="flex items-center gap-1 px-3 py-1 bg-[#614734] text-white rounded-full text-sm hover:bg-[#4a3628] transition-colors"
              >
                {tag}
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            ))}
          </div>
        )}

        {/* Tag Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="タグを入力しEnterで追加..."
          className="w-full px-4 py-3 bg-white border border-[#d6cfc7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#614734] focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#4f453e] mb-2">
          おすすめ
        </label>
        <div className="flex flex-wrap gap-2">
          {RECOMMENDED_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddTag(tag)}
              disabled={selectedTags.includes(tag)}
              className="px-3 py-1 bg-white border border-[#d6cfc7] text-[#4f453e] rounded-full text-sm hover:border-[#614734] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
