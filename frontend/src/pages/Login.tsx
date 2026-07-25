import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, User, Mail, Lock, Hash, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

// ─── Shared Input Field ───────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
  rightElement?: React.ReactNode;
  hint?: string;
  required?: boolean;
}

const Field: React.FC<FieldProps> = ({
  id, label, type = 'text', value, onChange, placeholder, icon, rightElement, hint, required
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-semibold text-subText uppercase tracking-wider">
      {label}
    </label>
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-subText/50 pointer-events-none">
        {icon}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-footer border border-customBorder text-mainText rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent placeholder:text-subText/30 transition-all duration-150"
      />
      {rightElement && (
        <span className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightElement}</span>
      )}
    </div>
    {hint && <p className="text-[10px] font-mono text-subText/60 leading-relaxed">{hint}</p>}
  </div>
);

// ─── Main Login Page ──────────────────────────────────────────────────────────

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Shared
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');

  // Register-only
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setStudentId('');
    setPassword('');
    setName('');
    setEmail('');
    setBio('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        if (!studentId.trim() || studentId.trim().length !== 7 || !/^\d{7}$/.test(studentId.trim())) {
          throw new Error('Student ID must be exactly 7 digits (e.g. 2604001)');
        }
        if (!email.trim()) {
          throw new Error('Email address is required');
        }
        await login(studentId.trim(), email.trim(), password);
        navigate('/');
      } else {
        if (!studentId.trim() || studentId.trim().length !== 7 || !/^\d{7}$/.test(studentId.trim())) {
          throw new Error('Student ID must be exactly 7 digits (e.g. 2604001: 26=Batch, 04=CSE)');
        }
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        await register({ student_id: studentId.trim(), name, email, password, bio: bio || undefined });
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eyeBtn = (
    <button
      type="button"
      onClick={() => setShowPassword((p) => !p)}
      className="text-subText/50 hover:text-subText transition-colors cursor-pointer"
      tabIndex={-1}
    >
      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );

  return (
    <div className="min-h-screen bg-primary text-mainText flex">

      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-card border-r border-customBorder p-12 relative overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-accent/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-accent" />
          </div>
          <span className="text-xl font-black tracking-tight">
            Campus<span className="text-accent">Forge</span>
          </span>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-5">
          <div className="space-y-1">
            <p className="text-[11px] font-mono text-accent/70 uppercase tracking-widest">Engineering Campus Hub</p>
            <h2 className="text-4xl font-black tracking-tight leading-[1.15]">
              Build, connect,<br />
              <span className="text-accent">and ship</span><br />
              together.
            </h2>
          </div>
          <p className="text-subText text-sm leading-relaxed max-w-xs">
            One platform for students, clubs, events, and projects. Everything your campus life needs.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {['🔬 Projects', '🏛️ Clubs', '📅 Events', '👥 Students'].map((f) => (
              <span key={f} className="text-[10px] font-mono px-3 py-1.5 bg-primary border border-customBorder rounded-full text-subText">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex gap-8 border-t border-customBorder pt-6">
          {[['500+', 'Students'], ['40+', 'Active Clubs'], ['200+', 'Projects']].map(([num, label]) => (
            <div key={label}>
              <p className="text-xl font-black text-accent">{num}</p>
              <p className="text-[11px] text-subText mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm space-y-7">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-accent" />
            </div>
            <span className="text-lg font-black">Campus<span className="text-accent">Forge</span></span>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Join the hub'}
            </h1>
            <p className="text-subText text-sm mt-1">
              {mode === 'login'
                ? 'Sign in with your Student ID, Email, and Password.'
                : 'Create your campus identity today.'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-1 bg-footer border border-customBorder rounded-xl p-1">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer capitalize ${
                  mode === m
                    ? 'bg-card text-accent shadow-sm'
                    : 'text-subText hover:text-mainText'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 bg-rose-900/15 border border-rose-500/30 rounded-xl text-xs">
              <AlertCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
              <span className="text-rose-300 leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Register: Name first */}
            {mode === 'register' && (
              <Field
                id="name"
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="e.g. Alex Rivera"
                icon={<User size={14} />}
                required
              />
            )}

            {/* Student ID — always shown */}
            <Field
              id="studentId"
              label="Student ID"
              value={studentId}
              onChange={setStudentId}
              placeholder="e.g. 2604001"
              icon={<Hash size={14} />}
              hint={
                mode === 'register'
                  ? 'Format: 7 digits — YY = Batch, PP = Dept, NNN = Roll (e.g. 2604001 = Batch 26, CSE)'
                  : 'Your 7-digit campus student ID'
              }
              required
            />

            {/* Email — required for both login & register */}
            <Field
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@campus.edu"
              icon={<Mail size={14} />}
              required
            />

            {/* Password */}
            <Field
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              icon={<Lock size={14} />}
              rightElement={eyeBtn}
              required
            />

            {/* Register: Confirm password + bio */}
            {mode === 'register' && (
              <>
                <Field
                  id="confirmPassword"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                  icon={<Lock size={14} />}
                  required
                />

                <div className="space-y-1.5">
                  <label htmlFor="bio" className="block text-xs font-semibold text-subText uppercase tracking-wider">
                    Bio <span className="text-subText/40 normal-case font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute top-2.5 left-3 text-subText/50 pointer-events-none">
                      <FileText size={14} />
                    </span>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell the campus about yourself..."
                      rows={2}
                      className="w-full bg-footer border border-customBorder text-mainText rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent placeholder:text-subText/30 resize-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-white font-black text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2 shadow-lg shadow-accent/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-xs text-subText">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-accent font-bold hover:underline cursor-pointer"
            >
              {mode === 'login' ? 'Register now' : 'Sign in'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;
