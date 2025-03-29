import { useState, useEffect, useRef, ReactNode } from "react";
import { LANGUAGES } from "../languages";
import { useLocalization } from "../hooks/useLocalization";

interface LanguageSelectorProps {
  buttonContent?: ReactNode;
}

export function LanguageSelector({ buttonContent }: LanguageSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { setLanguage } = useLocalization();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className="relative inline-flex items-center"
      onClick={() => setShowDropdown(!showDropdown)}
      ref={dropdownRef}
    >
      <button className="flex items-center justify-center">
        {buttonContent || <span className="text-sm">Language</span>}
      </button>

      {showDropdown && (
        <div className="absolute overflow-y-auto max-h-[205px] py-2 w-40 right-0 top-full mt-1 bg-gray-900 rounded-md shadow-lg z-50">
          {LANGUAGES.sort((a,b) => a.id.localeCompare(b.id)).map((language) => (
            <button
              key={language.id}
              onClick={() => setLanguage(language.id)}
              className="w-full items-center flex gap-3 px-3 py-1 hover:bg-gray-800"
            >
              <img className="w-5" src={language.flag} alt={language.name} />
              <span className="text-xs">{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
