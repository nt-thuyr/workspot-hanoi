import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder,
  error,
  required: isRequired,
  ...props
}) => {
  return (
    <div className="group">
      <label className="block font-label text-[11px] uppercase tracking-widest font-bold text-[#81756d] mb-2 group-focus-within:text-[#614734] transition-colors">
        {label}
        {isRequired && <span className="text-[#ba1a1a] ml-1">*</span>}
      </label>
      <input
        className={`w-full bg-[#ffffff] rounded-xl px-5 py-4 text-[#1c1c19] placeholder:text-[#81756d]/50 transition-all duration-300 focus:outline-none focus:bg-[#fdf9f4] ${
          error
            ? 'border border-[#ba1a1a] focus:shadow-[0_0_0_2px_rgba(186,26,26,0.15)]'
            : 'border-none focus:shadow-[0_0_0_2px_rgba(97,71,52,0.1)]'
        }`}
        placeholder={placeholder}
        {...props}
      />
      {error && (
        <p className="flex items-center gap-1 text-[#ba1a1a] text-sm mt-2">
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style={{flexShrink:0}}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
