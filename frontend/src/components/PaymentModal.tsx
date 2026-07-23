import React, { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fee: string;
  type: 'club' | 'event';
  participationType?: string; // 'individual' | 'team'
  onConfirm: (paymentMethod: string, teamName?: string) => Promise<void>;
}

type PaymentMethodType = 'card' | 'mobile' | 'campus_wallet';

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
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('card');
  const [teamName, setTeamName] = useState('');
  const [cardNumber, setCardNumber] = useState('4532 8912 3456 7890');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [mobileNumber, setMobileNumber] = useState('01700-123456');
  const [mobilePin, setMobilePin] = useState('1234');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [txnId, setTxnId] = useState('');

  if (!isOpen) return null;

  const getPaymentMethodName = (): string => {
    if (isFree) return 'Free Registration';
    switch (selectedMethod) {
      case 'card':
        return 'Demo Credit/Debit Card';
      case 'mobile':
        return 'bKash / Mobile Banking (Demo)';
      case 'campus_wallet':
        return 'Campus Student Credits';
      default:
        return 'Demo Payment';
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (participationType === 'team' && !teamName.trim()) {
      setErrorMsg('Please enter a team name to continue.');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);

    try {
      // Simulate real-time gateway processing delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const generatedTxn = 'CF-' + Math.floor(100000 + Math.random() * 900000);
      setTxnId(generatedTxn);

      await onConfirm(getPaymentMethodName(), teamName.trim() || undefined);
      setIsProcessing(false);
      setIsSuccess(true);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Payment processing failed. Please try again.');
    }
  };

  const resetAndClose = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#121624] text-white shadow-2xl transition-all">
        {/* Header decoration */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="p-6 md:p-8">
          {/* Close Button */}
          <button
            onClick={resetAndClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
          >
            ✕
          </button>

          {isSuccess ? (
            /* SUCCESS STATE */
            <div className="text-center py-6 animate-scale-up">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Registration Confirmed!</h3>
              <p className="text-sm text-gray-300 mb-6">
                You have successfully registered for <span className="font-semibold text-blue-400">{title}</span>.
              </p>

              <div className="rounded-xl bg-white/5 p-4 border border-white/10 text-left text-xs space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="font-mono text-indigo-300 font-semibold">{txnId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Status:</span>
                  <span className="text-emerald-400 font-semibold uppercase">{isFree ? 'FREE ENTRY' : 'COMPLETED'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Method:</span>
                  <span className="text-gray-200">{getPaymentMethodName()}</span>
                </div>
                {teamName && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Team Name:</span>
                    <span className="text-purple-300 font-semibold">{teamName}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={resetAndClose}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white hover:from-blue-500 hover:to-indigo-500 transition shadow-lg shadow-blue-500/25"
              >
                Done & Return
              </button>
            </div>
          ) : (
            /* FORM STATE */
            <form onSubmit={handleCheckout} className="space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
                  {type === 'club' ? '🏛️ Club Membership' : '🗓️ Event Registration'}
                </span>
                <h3 className="text-xl font-bold text-white leading-tight">{title}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
              </div>

              {/* Team Registration Input if required */}
              {participationType === 'team' && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Team Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your team name (e.g. Code Knights)"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}

              {/* Price & Summary Box */}
              <div className="rounded-xl bg-white/5 p-4 border border-white/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{type === 'club' ? 'Membership Fee' : 'Entrance Fee'}</span>
                  <span className="font-semibold text-white">{isFree ? 'FREE' : fee}</span>
                </div>
                {!isFree && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Campus Processing Fee</span>
                    <span className="text-emerald-400 font-medium">$0.00 (Waived)</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10 flex justify-between text-base font-bold">
                  <span className="text-gray-200">Total Due</span>
                  <span className="text-blue-400">{isFree ? '$0.00' : fee}</span>
                </div>
              </div>

              {/* Payment Methods Selection if Paid */}
              {!isFree && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Select Demo Payment Method
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('card')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition ${
                        selectedMethod === 'card'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-md'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg mb-1">💳</span>
                      <span>Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('mobile')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition ${
                        selectedMethod === 'mobile'
                          ? 'border-pink-500 bg-pink-500/10 text-pink-400 shadow-md'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg mb-1">📱</span>
                      <span>bKash / Mobile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('campus_wallet')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition ${
                        selectedMethod === 'campus_wallet'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg mb-1">🪙</span>
                      <span>Campus Wallet</span>
                    </button>
                  </div>

                  {/* Dummy Method Inputs */}
                  <div className="pt-2">
                    {selectedMethod === 'card' && (
                      <div className="space-y-3 bg-white/5 p-3.5 rounded-xl border border-white/5">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Demo Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-gray-400 mb-1">Expiry</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-400 mb-1">CVC / PIN</label>
                            <input
                              type="password"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedMethod === 'mobile' && (
                      <div className="space-y-3 bg-white/5 p-3.5 rounded-xl border border-white/5">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Mobile Account Number</label>
                          <input
                            type="text"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">bKash / Wallet PIN</label>
                          <input
                            type="password"
                            value={mobilePin}
                            onChange={(e) => setMobilePin(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                          />
                        </div>
                      </div>
                    )}

                    {selectedMethod === 'campus_wallet' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between text-emerald-300 font-medium">
                          <span>Available Balance:</span>
                          <span>$150.00 Credits</span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Fee will be deducted automatically from your verified student wallet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 font-semibold text-gray-300 text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-white text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{isFree ? 'Confirm Free Registration' : `Pay ${fee} & Register`}</span>
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
