import { FaFacebook, FaGithub, FaLinkedin } from 'react-icons/fa';

export function CreditsFooter() {
  return (
    <footer className="w-full flex flex-col items-center justify-center py-4 bg-transparent text-xs text-white/70 gap-2">
      <div>
        © {new Date().getFullYear()} Mahir Mahmud Siam. All rights reserved.
      </div>
      <div className="flex gap-4 mt-1">
        <a href="https://github.com/MahirMsiam" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <FaGithub className="h-5 w-5 hover:text-[#1CA24C] transition-colors" />
        </a>
        <a href="https://www.facebook.com/mahirmahmudsiam" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <FaFacebook className="h-5 w-5 hover:text-[#1CA24C] transition-colors" />
        </a>
        <a href="https://www.linkedin.com/in/mahir-mahmud-siam" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <FaLinkedin className="h-5 w-5 hover:text-[#1CA24C] transition-colors" />
        </a>
      </div>
    </footer>
  );
} 