import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Wallet, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fee: string;
  type: 'club' | 'event';
  participationType?: string;
  onConfirm: (teamName?: string) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  fee,
  type,
  participationType,
  onConfirm,
}) => {
  const isFree = !fee || fee.toLowerCase() === 'free' || fee === '$0' || fee === '0';

  const [selectedMethod, setSelectedMethod] = useState<'card' | 'mobile' | 'wallet'>('card');
  const [teamName, setTeamName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [txnId, setTxnId] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (participationType === 'team' && !teamName.trim()) {
      setErrorMsg('Please enter a team name to continue.');
      return;
    }
    setErrorMsg('');
    setIsProcessing(true);
    try {
      
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setTxnId('CF-' + Math.floor(100000 + Math.random() * 900000));
      
      await onConfirm(teamName.trim() || undefined);
      setIsProcessing(false);
      setIsSuccess(true);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    }
  };

  const resetAndClose = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    setErrorMsg('');
    setTeamName('');
    onClose();
  };

  const methods = [
    { key: 'card' as const, label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'mobile' as const, label: 'bKash', icon: <Smartphone className="w-4 h-4" /> },
    { key: 'wallet' as const, label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-2xl overflow-hidden shadow-2xl animate-scale-up">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />

        <div className="p-6">
          <button
            onClick={resetAndClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-subText hover:text-mainText hover:bg-footer transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {isSuccess ? (
            <div className="text-center py-4 animate-scale-up">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-extrabold text-mainText mb-2">You're in!</h3>
              <p className="text-sm text-subText mb-5">
                Successfully registered for <span className="font-semibold text-accent">{title}</span>
              </p>

              <div className="glass-panel rounded-xl p-4 text-left text-xs space-y-2 mb-5">
                <div className="flex justify-between">
                  <span className="text-subText">Transaction ID</span>
                  <span className="font-mono text-accent font-semibold">{txnId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subText">Status</span>
                  <span className="text-emerald-400 font-semibold uppercase">Confirmed</span>
                </div>
                {teamName && (
                  <div className="flex justify-between">
                    <span className="text-subText">Team</span>
                    <span className="text-violet-400 font-semibold">{teamName}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-subText/60 mb-4">
                <ShieldCheck className="w-3 h-3" />
                <span>Demo environment — no real transaction processed</span>
              </div>

              <button type="button" onClick={resetAndClose} className="btn-primary w-full">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckout} className="space-y-5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 mb-2">
                  {type === 'club' ? '🏛 Club Membership' : '📅 Event Registration'}
                </span>
                <h3 className="text-lg font-extrabold text-mainText leading-tight pr-8">{title}</h3>
                {subtitle && <p className="text-xs text-subText mt-1">{subtitle}</p>}
              </div>

              {participationType === 'team' && (
                <div>
                  <label className="block text-xs font-semibold text-subText mb-1.5">
                    Team Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Code Knights"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="input-field text-sm w-full bg-primary border border-customBorder text-mainText rounded-xl p-3 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              {}
              <div className="glass-panel rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-subText">{type === 'club' ? 'Membership Fee' : 'Entrance Fee'}</span>
                  <span className="font-bold text-mainText">{isFree ? 'FREE' : fee}</span>
                </div>
                {!isFree && (
                  <div className="flex justify-between text-xs">
                    <span className="text-subText">Processing Fee</span>
                    <span className="text-emerald-400 font-medium">Waived</span>
                  </div>
                )}
                <div className="pt-2 border-t border-customBorder flex justify-between font-bold">
                  <span className="text-mainText">Total</span>
                  <span className="text-accent">{isFree ? '$0.00' : fee}</span>
                </div>
              </div>

              {}
              {!isFree && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-subText uppercase tracking-wider">
                    Demo Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {methods.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setSelectedMethod(m.key)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                          selectedMethod === m.key
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-customBorder text-subText hover:bg-footer'
                        }`}
                      >
                        {m.icon}
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>This is a <strong>demo environment</strong>. No real payment is processed or stored.</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetAndClose} disabled={isProcessing} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isProcessing} className="btn-primary flex-[2]">
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    isFree ? 'Confirm Registration' : `Pay ${fee} & Confirm`
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
