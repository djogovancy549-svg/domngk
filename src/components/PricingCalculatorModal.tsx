import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  Calculator, 
  TrendingUp, 
  ShieldCheck, 
  Briefcase, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '../types/business';

interface PricingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlanForNewClient: (tier: SubscriptionTier, billingCycle: 'monthly' | 'annual_paid_monthly' | 'annual_upfront') => void;
}

export const PricingCalculatorModal: React.FC<PricingCalculatorModalProps> = ({
  isOpen,
  onClose,
  onSelectPlanForNewClient,
}) => {
  const [selectedCycle, setSelectedCycle] = useState<'annual_paid_monthly' | 'monthly' | 'annual_upfront'>('annual_paid_monthly');
  const [clientCountEstimate, setClientCountEstimate] = useState(15);

  if (!isOpen) return null;

  // Monthly Recurring Revenue Estimate (assuming average Pro package at 75k/month)
  const estimatedMrr = clientCountEstimate * 75000;
  const estimatedArr = estimatedMrr * 12;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Skema Bisnis & Paket Berlangganan (Hingga 1 Tahun Bayar Bulanan)
              </h3>
              <p className="text-xs text-slate-400">
                Model bisnis jasa penyamaran URL domain virtual untuk UMKM, instansi lokal, dan profesional.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Billing Cycle Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-xs font-medium text-slate-400 pl-2">
              Pilih Opsi Pembayaran Klien:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedCycle('monthly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedCycle === 'monthly'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bulanan Biasa
              </button>

              <button
                onClick={() => setSelectedCycle('annual_paid_monthly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCycle === 'annual_paid_monthly'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1 Tahun (Bayar Bulanan) — Disukai UMKM</span>
              </button>

              <button
                onClick={() => setSelectedCycle('annual_upfront')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedCycle === 'annual_upfront'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1 Tahun Lunas di Awal
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['starter', 'pro', 'agency'] as SubscriptionTier[]).map((tierKey) => {
              const plan = SUBSCRIPTION_PLANS[tierKey];
              const isPopular = tierKey === 'pro';

              let displayPrice = plan.monthlyPrice;
              let cadenceLabel = '/ bulan';
              let savingNote = '';

              if (selectedCycle === 'annual_paid_monthly') {
                displayPrice = plan.annualCommitmentMonthlyPrice;
                cadenceLabel = '/ bulan (kontrak 12 bln)';
                savingNote = `Hemat 25% (Rp ${((plan.monthlyPrice - plan.annualCommitmentMonthlyPrice) * 12).toLocaleString('id-ID')}/thn)`;
              } else if (selectedCycle === 'annual_upfront') {
                displayPrice = plan.annualUpfrontPrice;
                cadenceLabel = '/ tahun (sekali bayar)';
                savingNote = 'Bonus 2 bulan gratis';
              }

              return (
                <div
                  key={tierKey}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all relative ${
                    isPopular
                      ? 'bg-gradient-to-b from-indigo-950/40 to-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-500/10'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {isPopular && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded-full inline-block w-fit mb-2">
                      Paling Laris Untuk UMKM
                    </div>
                  )}

                  <div>
                    <h4 className="text-base font-bold text-white">{plan.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{plan.description}</p>

                    <div className="my-4 pt-3 border-t border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-slate-400 font-mono">Rp</span>
                        <span className="text-2xl font-bold font-mono text-white tracking-tight">
                          {displayPrice.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] text-slate-400">{cadenceLabel}</span>
                      </div>
                      {savingNote && (
                        <span className="text-[11px] font-medium text-emerald-400 block mt-1">
                          ✓ {savingNote}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300 mb-6">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      onSelectPlanForNewClient(tierKey, selectedCycle);
                      onClose();
                    }}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      isPopular
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <span>Daftarkan Klien dengan Paket Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Revenue Opportunity Calculator for Local Business */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-white">
                Simulasi Keuntungan Bisnis Lokal Anda (Recurring Monthly Revenue)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Estimasi Jumlah Klien UMKM Lokal:</span>
                  <span className="font-mono font-bold text-white text-sm">{clientCountEstimate} Klien</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={100}
                  step={1}
                  value={clientCountEstimate}
                  onChange={(e) => setClientCountEstimate(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Dengan kontrak 1 tahun bayar bulanan rata-rata Rp 75.000/bln per klien (Paket Pro), Anda mendapatkan arus kas bulanan stabil tanpa biaya server/reseller domain.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-center space-y-1">
                <span className="text-[11px] text-slate-400 block">Pendapatan Bulanan Tetap:</span>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  Rp {estimatedMrr.toLocaleString('id-ID')}
                  <span className="text-xs text-slate-500 font-sans font-normal">/bln</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Total Rp {estimatedArr.toLocaleString('id-ID')} per tahun
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
