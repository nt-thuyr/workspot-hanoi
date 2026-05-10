import React from "react";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  label,
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block font-label text-[11px] uppercase tracking-widest font-bold text-[#81756d]">
          {label}
        </label>
      )}
      <div className="flex bg-[#ebe8e3] p-1 rounded-full w-fit">
        {options.map((option) => (
          <label
            key={option.value}
            className="relative flex items-center cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="peer sr-only"
            />
            <span className="px-6 py-2 rounded-full text-sm font-medium transition-all peer-checked:bg-[#614734] peer-checked:text-white text-[#81756d]">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
