import { useState, useMemo } from 'react';
import { Umbrella, Search, Upload } from 'lucide-react';
import { useInsurances } from '../context/InsurancesContext';
import InsuranceTable from '../components/insurances/InsuranceTable';
import InsuranceUpload from '../components/insurances/InsuranceUpload';
import Modal from '../components/ui/Modal';
import { translateCategory, type InsuranceLang } from '../lib/insurance-i18n';
import { formatDate } from '../lib/utils';

export default function InsurancesPage() {
  const { policies, loading, lastUploadDate } = useInsurances();
  const [lang, setLang] = useState<InsuranceLang>('he');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of policies) {
      if (p.category) cats.add(p.category);
    }
    return Array.from(cats);
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    let result = policies;

    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.main_branch.toLowerCase().includes(q) ||
        p.sub_branch.toLowerCase().includes(q) ||
        p.product_type.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        p.coverage_period.toLowerCase().includes(q) ||
        p.additional_details.toLowerCase().includes(q) ||
        p.premium_type.toLowerCase().includes(q) ||
        p.policy_number.toLowerCase().includes(q) ||
        p.plan_classification.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [policies, search, selectedCategory]);

  const totalMonthly = useMemo(() => {
    let sum = 0;
    for (const p of policies) {
      if (p.premium_nis == null) continue;
      if (p.premium_type === 'חודשית') {
        sum += p.premium_nis;
      } else if (p.premium_type === 'שנתית') {
        sum += p.premium_nis / 12;
      } else if (p.premium_type === 'רבעונית') {
        sum += p.premium_nis / 3;
      }
    }
    return sum;
  }, [policies]);

  if (loading) {
    return <div className="text-[#7a7890] text-[14px] text-center pt-40">Loading...</div>;
  }

  // Empty state — show upload directly
  if (policies.length === 0) {
    return (
      <div className="max-w-[1200px] px-12 py-10">
        <div className="flex items-center gap-3 mb-1">
          <Umbrella size={24} className="text-[#ec4899]" />
          <h1 className="text-[26px] font-bold text-white leading-tight">Insurances</h1>
        </div>
        <p className="text-[14px] text-[#7a7890] mt-2 mb-8">
          Upload your insurance file from Har HaBituach to get started.
        </p>
        <InsuranceUpload />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] px-12 py-10">
      {/* Header */}
      <div className="mb-1 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Umbrella size={24} className="text-[#ec4899]" />
          <div>
            <h1 className="text-[26px] font-bold text-white leading-tight">Insurances</h1>
            <p className="text-[14px] text-[#7a7890] mt-1">
              {policies.length} {policies.length === 1 ? 'policy' : 'policies'}
              {lastUploadDate && <> · Updated {formatDate(lastUploadDate)}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex rounded-lg border border-[#1c1928] overflow-hidden">
            <button
              onClick={() => setLang('he')}
              className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                lang === 'he'
                  ? 'bg-[#1a1730] text-white'
                  : 'text-[#7a7890] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              עב
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                lang === 'en'
                  ? 'bg-[#1a1730] text-white'
                  : 'text-[#7a7890] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              EN
            </button>
          </div>
          {/* Upload button */}
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] text-[#7a7890] hover:text-white border border-[#1c1928] hover:border-[#2d2a40] rounded-lg transition-all"
          >
            <Upload size={14} />
            Re-upload
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mt-8 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7890]" />
          <input
            type="text"
            placeholder="Search policies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-5 py-2 bg-transparent border border-[#1c1928] rounded-full text-[13px] text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors w-72"
          />
        </div>
      </div>

      {/* Category chips */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              !selectedCategory
                ? 'bg-[#ec4899] text-white'
                : 'bg-white/[0.04] text-[#7a7890] hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#ec4899] text-white'
                  : 'bg-white/[0.04] text-[#7a7890] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {translateCategory(cat, lang)}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <InsuranceTable policies={filteredPolicies} lang={lang} />

      {/* Summary */}
      {totalMonthly > 0 && (
        <div className="mt-4 text-right">
          <span className="text-[13px] text-[#7a7890]">
            Est. monthly total:{' '}
          </span>
          <span className="text-[14px] text-white font-medium tabular-nums">
            ₪ {totalMonthly.toLocaleString('en-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Upload modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)}>
        <div className="p-6">
          <h3 className="text-[15px] font-semibold text-white mb-2">Re-upload Insurance Data</h3>
          <p className="text-[13px] text-[#7a7890] mb-6">
            This will replace all existing insurance data with the new file.
          </p>
          <InsuranceUpload onDone={() => setUploadOpen(false)} />
        </div>
      </Modal>
    </div>
  );
}
