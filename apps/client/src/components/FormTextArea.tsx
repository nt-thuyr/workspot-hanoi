import React from "react";

interface FormTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  placeholder?: string;
  error?: string;
}

export const FormTextArea: React.FC<FormTextAreaProps> = ({
  label,
  placeholder,
  error,
  rows = 5,
  ...props
}) => {
  return (
    <div className="group">
      <label className="block font-label text-[11px] uppercase tracking-widest font-bold text-[#81756d] mb-2 group-focus-within:text-[#614734] transition-colors">
        {label}
      </label>
      <textarea
        className="w-full bg-[#ffffff] border-none rounded-xl px-5 py-4 text-[#1c1c19] placeholder:text-[#81756d]/50 transition-all duration-300 resize-none focus:outline-none focus:shadow-[0_0_0_2px_rgba(97,71,52,0.1)] focus:bg-[#fdf9f4]"
        placeholder={placeholder}
        rows={rows}
        {...props}
      />
      {error && <p className="text-[#ba1a1a] text-sm mt-2">{error}</p>}
    </div>
  );
};
