import React from "react";

interface TimePickerProps {
  label: string;
  value: string; // Expected format HH:mm
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  error,
  required: isRequired,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="group">
      <label className="block font-label text-[11px] uppercase tracking-widest font-bold text-[#81756d] mb-2 group-focus-within:text-[#614734] transition-colors">
        {label}
        {isRequired && <span className="text-[#ba1a1a] ml-1">*</span>}
      </label>
      <input
        type="time"
        className="w-full bg-[#ffffff] border-none rounded-xl px-5 py-4 text-[#1c1c19] placeholder:text-[#81756d]/50 transition-all duration-300 focus:outline-none focus:shadow-[0_0_0_2px_rgba(97,71,52,0.1)] focus:bg-[#fdf9f4]"
        value={value}
        onChange={handleChange}
      />
      {error && <p className="text-[#ba1a1a] text-sm mt-2">{error}</p>}
    </div>
  );
};
