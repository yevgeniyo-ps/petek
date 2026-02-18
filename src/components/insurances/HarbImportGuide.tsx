import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, GripHorizontal } from 'lucide-react';
import type { InsuranceLang } from '../../lib/insurance-i18n';

const BOOKMARKLET_CODE = `javascript:void(${encodeURIComponent(
  `(async function(){var w=window.open('https://yevgeniyo-ps.github.io/petek/#/insurances');if(!w){alert('Petek: Popup blocked. Please allow popups for this site.');return}try{var r=await fetch('/sso/Exports/ExportToExcel',{credentials:'include'});if(!r.ok)throw new Error('Download failed ('+r.status+')');var buf=await r.arrayBuffer();var bytes=new Uint8Array(buf);var bin='';for(var i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]);var b64=btoa(bin);var tries=0;var iv=setInterval(function(){tries++;try{w.postMessage({type:'harb-import',data:b64},'https://yevgeniyo-ps.github.io')}catch(x){}if(tries>15)clearInterval(iv)},1000)}catch(e){alert('Petek: '+e.message)}})()`
)})`;

const text = {
  he: {
    title: 'ייבוא ישיר מהר הביטוח',
    step1: 'גררו את הכפתור למטה לסרגל הסימניות שלכם',
    step2: 'היכנסו לאתר הר הביטוח והתחברו',
    step3: 'לחצו על "כל הביטוחים" כדי לראות את כל הפוליסות',
    step4: 'לחצו על הסימנייה בסרגל הסימניות',
    step5: 'הנתונים יופיעו בפתק אוטומטית',
    bookmarklet: 'ייבוא לפתק',
    openHarb: 'פתח את הר הביטוח',
  },
  en: {
    title: 'Import directly from Har HaBituach',
    step1: 'Drag the button below to your bookmarks bar',
    step2: 'Go to Har HaBituach and log in',
    step3: 'Click "כל הביטוחים" to see all policies',
    step4: 'Click the bookmarklet in your bookmarks bar',
    step5: 'Your data will appear in Petek automatically',
    bookmarklet: 'Import to Petek',
    openHarb: 'Open Har HaBituach',
  },
} as const;

interface HarbImportGuideProps {
  lang: InsuranceLang;
}

export default function HarbImportGuide({ lang }: HarbImportGuideProps) {
  const [open, setOpen] = useState(false);
  const t = text[lang];
  const isHe = lang === 'he';

  return (
    <div className="mt-6 rounded-xl border border-[#1c1928] bg-[#13111c]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-5 py-3.5 text-[13px] text-[#7a7890] hover:text-white transition-colors"
        dir={isHe ? 'rtl' : 'ltr'}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="font-medium">{t.title}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[#1c1928]" dir={isHe ? 'rtl' : 'ltr'}>
          <ol className="mt-4 space-y-2 text-[13px] text-[#7a7890] list-decimal ps-5">
            <li>{t.step1}</li>
            <li>{t.step2}</li>
            <li>{t.step3}</li>
            <li>{t.step4}</li>
            <li>{t.step5}</li>
          </ol>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            {/* Bookmarklet — draggable link */}
            <a
              href={BOOKMARKLET_CODE}
              onClick={e => e.preventDefault()}
              draggable
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ec4899]/10 border border-[#ec4899]/30 text-[#ec4899] text-[13px] font-medium hover:bg-[#ec4899]/20 transition-colors cursor-grab active:cursor-grabbing"
            >
              <GripHorizontal size={14} />
              {t.bookmarklet}
            </a>

            {/* Link to Har HaBituach */}
            <a
              href="https://harb.cma.gov.il"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-[#7a7890] hover:text-white transition-colors"
            >
              {t.openHarb}
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
