"use client";

import { useInstallPWA } from '@/hooks/useInstallPWA';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function InstallPWAButton() {
  const { canInstall, install } = useInstallPWA();
  const { t } = useLanguage();

  if (!canInstall) {
    return null;
  }

  return (
    <Button variant="outline" size="sm" onClick={install}>
      <Download className="mr-2 h-4 w-4" />
      {t.installApp}
    </Button>
  );
}
