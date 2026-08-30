import React from 'react';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenApiStatus: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPrivacy,
  onOpenTerms,
  onOpenApiStatus,
}) => {
  return (
    <footer
      id="bottom-footer"
      className="w-full flex justify-between items-center px-6 py-2 z-30 bg-[#edeeef] border-t border-[#c4c6cd] shrink-0 text-xs select-none"
    >
      <div className="font-mono text-[11px] font-bold text-[#44474c] flex items-center gap-2">
        <span>© 2024 NetSage AI Precision Systems</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
        <span className="font-normal text-[10px] text-[#74777d]">TAC v4.2.8</span>
      </div>

      <nav className="flex space-x-6">
        <button
          onClick={onOpenPrivacy}
          className="font-mono text-[11px] text-[#44474c] opacity-70 hover:opacity-100 hover:text-[#041627] transition-colors"
        >
          Privacy Policy
        </button>
        <button
          onClick={onOpenTerms}
          className="font-mono text-[11px] text-[#44474c] opacity-70 hover:opacity-100 hover:text-[#041627] transition-colors"
        >
          Terms of Service
        </button>
        <button
          onClick={onOpenApiStatus}
          className="font-mono text-[11px] text-[#44474c] opacity-70 hover:opacity-100 hover:text-[#041627] transition-colors flex items-center gap-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
          API Status
        </button>
      </nav>
    </footer>
  );
};
