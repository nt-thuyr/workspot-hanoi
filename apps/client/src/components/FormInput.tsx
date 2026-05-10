import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder?: string;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder,
  error,
  ...props
}) => {
  return (
    <div className="group">
      <label className="block font-label text-[11px] uppercase tracking-widest font-bold text-[#81756d] mb-2 group-focus-within:text-[#614734] transition-colors">
        {label}
      </label>
      <input
        className="w-full bg-[#ffffff] border-none rounded-xl px-5 py-4 text-[#1c1c19] placeholder:text-[#81756d]/50 transition-all duration-300 focus:outline-none focus:shadow-[0_0_0_2px_rgba(97,71,52,0.1)] focus:bg-[#fdf9f4]"
        placeholder={placeholder}
        {...props}
      />
      {error && <p className="text-[#ba1a1a] text-sm mt-2">{error}</p>}
    </div>
  );
};
