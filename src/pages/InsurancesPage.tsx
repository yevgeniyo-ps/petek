import { useState, useMemo, useCallback } from 'react';
import { Umbrella, Search, Upload, Trash2 } from 'lucide-react';
import { useInsurances } from '../context/InsurancesContext';
import InsuranceTable from '../components/insurances/InsuranceTable';
import InsuranceUpload from '../components/insurances/InsuranceUpload';
import InsuranceDashboard from '../components/insurances/InsuranceDashboard';
import InsuranceRecommendations, { type Severity } from '../components/insurances/InsuranceRecommendations';
import HarbImportGuide from '../components/insurances/HarbImportGuide';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { translateCategory, translateValue, type InsuranceLang } from '../lib/insurance-i18n';
import { formatDate } from '../lib/utils';

export default function InsurancesPage() {
  const { policies, loading, lastUploadDate, clearAll } = useInsurances();
  const [lang, setLang] = useState<InsuranceLang>('he');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [activeRecIndex, setActiveRecIndex] = useState<number | null>(null);
  const [highlightedPolicies, setHighlightedPolicies] = useState<Set<string>>(new Set());
  const [highlightSeverity, setHighlightSeverity] = useState<Severity | null>(null);

  const handleRecSelect = useCallback((index: number | null, policyNumbers: string[], severity: Severity) => {
    if (index === null) {
      setActiveRecIndex(null);
      setHighlightedPolicies(new Set());
      setHighlightSeverity(null);
    } else {
      setActiveRecIndex(index);
      setHighlightedPolicies(new Set(policyNumbers));
      setHighlightSeverity(severity);
    }
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of policies) {
      if (p.category) cats.add(p.category);
    }
    return Array.from(cats);
  }, [policies]);

  const companies = useMemo(() => {
    const set = new Set<string>();
    for (const p of policies) {
      if (p.company) set.add(p.company);
    }
    return Array.from(set);
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    let result = policies;

    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (selectedCompany) {
      result = result.filter(p => p.company === selectedCompany);
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
  }, [policies, search, selectedCategory, selectedCompany]);

  if (loading) {
    return <div className="text-[#7a7890] text-[14px] text-center pt-40">Loading...</div>;
  }

  // Empty state — show upload directly
  if (policies.length === 0) {
    return (
      <div className="max-w-[1200px] px-4 py-6 md:px-12 md:py-10">
        <div className="flex items-center gap-3 mb-1">
          <Umbrella size={24} className="text-[#ec4899]" />
          <h1 className="text-[26px] font-bold text-white leading-tight">Insurances</h1>
        </div>
        <p className="text-[14px] text-[#7a7890] mt-2 mb-8">
          Upload your insurance file from Har HaBituach to get started.
        </p>
        <InsuranceUpload />
        <HarbImportGuide lang="en" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] px-4 py-6 md:px-12 md:py-10">
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
          {/* Clear all button */}
          <button
            onClick={() => setClearOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] text-[#7a7890] hover:text-red-400 border border-[#1c1928] hover:border-red-500/30 rounded-lg transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Dashboard */}
      <InsuranceDashboard policies={policies} lang={lang} />

      {/* Recommendations */}
      <InsuranceRecommendations policies={policies} lang={lang} activeRecIndex={activeRecIndex} onSelect={handleRecSelect} />

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7890]" />
          <input
            type="text"
            placeholder="Search policies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-5 py-2 bg-transparent border border-[#1c1928] rounded-full text-[13px] text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors w-full md:w-72"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-6 mb-6 flex-wrap">
        {/* Category */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-[#ec4899] text-white'
                  : 'bg-white/[0.04] text-[#7a7890] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {lang === 'he' ? 'הכל' : 'All'}
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
        {/* Company */}
        {companies.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-[#4a4660] uppercase tracking-wider">{lang === 'he' ? 'חברה' : 'Company'}</span>
            {companies.map(co => (
              <button
                key={co}
                onClick={() => setSelectedCompany(selectedCompany === co ? null : co)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                  selectedCompany === co
                    ? 'bg-[#ec4899] text-white'
                    : 'bg-white/[0.04] text-[#7a7890] hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {translateValue(co, lang)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <InsuranceTable policies={filteredPolicies} lang={lang} highlightedPolicies={highlightedPolicies} highlightSeverity={highlightSeverity} />

      {/* Clear all confirmation */}
      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={clearAll}
        title="Delete all insurance data?"
        message="This will permanently remove all your insurance policies. You can re-upload anytime."
        confirmLabel="Delete all"
      />

      {/* Upload modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)}>
        <div className="p-6">
          <h3 className="text-[15px] font-semibold text-white mb-2">Re-upload Insurance Data</h3>
          <p className="text-[13px] text-[#7a7890] mb-6">
            This will replace all existing insurance data with the new file.
          </p>
          <InsuranceUpload onDone={() => setUploadOpen(false)} />
          <HarbImportGuide lang={lang} />
        </div>
      </Modal>
    </div>
  );
}
