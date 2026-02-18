import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Copy, Check } from 'lucide-react';
import type { InsuranceLang } from '../../lib/insurance-i18n';

const CONSOLE_SCRIPT = `(async()=>{var r=await fetch('/sso/Exports/ExportToExcel',{credentials:'include'});if(!r.ok)throw new Error('Failed ('+r.status+')');var buf=await r.arrayBuffer();var bytes=new Uint8Array(buf);var bin='';for(var i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]);var b64=btoa(bin);var w=window.open('https://yevgeniyo-ps.github.io/petek/#/insurances');var t=0;var iv=setInterval(()=>{t++;try{w.postMessage({type:'harb-import',data:b64},'https://yevgeniyo-ps.github.io')}catch(e){}if(t>15)clearInterval(iv)},1000)})()`;

const text = {
  he: {
    title: 'ייבוא ישיר מהר הביטוח',
    step1: 'היכנסו לאתר הר הביטוח והתחברו',
    step2: 'לחצו על "כל הביטוחים" כדי לראות את כל הפוליסות',
    step3: 'פתחו את כלי המפתחים (F12) ועברו ללשונית Console',
    step4: 'לחצו על הכפתור למטה כדי להעתיק את הסקריפט',
    step5: 'הדביקו בקונסולה ולחצו Enter — הנתונים יופיעו בפתק',
    copyScript: 'העתק סקריפט',
    copied: 'הועתק!',
    openHarb: 'פתח את הר הביטוח',
  },
  en: {
    title: 'Import directly from Har HaBituach',
    step1: 'Go to Har HaBituach and log in',
    step2: 'Click "כל הביטוחים" to see all policies',
    step3: 'Open Developer Tools (F12) and go to the Console tab',
    step4: 'Click the button below to copy the import script',
    step5: 'Paste in the console and press Enter — data will appear in Petek',
    copyScript: 'Copy script',
    copied: 'Copied!',
    openHarb: 'Open Har HaBituach',
  },
} as const;

interface HarbImportGuideProps {
  lang: InsuranceLang;
}

export default function HarbImportGuide({ lang }: HarbImportGuideProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const t = text[lang];
  const isHe = lang === 'he';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CONSOLE_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            {/* Copy script button */}
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
                copied
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-[#ec4899]/10 border border-[#ec4899]/30 text-[#ec4899] hover:bg-[#ec4899]/20'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t.copied : t.copyScript}
            </button>

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
