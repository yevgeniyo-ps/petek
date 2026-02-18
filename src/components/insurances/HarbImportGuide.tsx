import { ExternalLink } from 'lucide-react';
import type { InsuranceLang } from '../../lib/insurance-i18n';

const text = {
  he: {
    line1: 'היכנסו ל',
    harb: 'הר הביטוח',
    line2: ', לחצו "כל הביטוחים" ואז על כפתור הייצוא לאקסל.',
    line3: 'גררו את הקובץ שהורד לכאן.',
  },
  en: {
    line1: 'Go to ',
    harb: 'Har HaBituach',
    line2: ', click "כל הביטוחים" then the Export to Excel button.',
    line3: 'Drag the downloaded file here.',
  },
} as const;

interface HarbImportGuideProps {
  lang: InsuranceLang;
}

export default function HarbImportGuide({ lang }: HarbImportGuideProps) {
  const t = text[lang];

  return (
    <p className="mt-4 text-[13px] text-[#7a7890]" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {t.line1}
      <a
        href="https://harb.cma.gov.il"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[#ec4899] hover:text-[#db2777] transition-colors"
      >
        {t.harb}
        <ExternalLink size={11} />
      </a>
      {t.line2}
      <br />
      {t.line3}
    </p>
  );
}
