import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, User, Mail, Lock, BookOpen, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Robotics Engineering',
  'Data Science & Analytics',
  'Civil Engineering',
  'Business Administration',
  'Architecture',
  'Mathematics & Physics',
  'Other',
];

// ─── Field Component ──────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
  rightElement?: React.ReactNode;
  required?: boolean;
}

const Field: React.FC<FieldProps> = ({
  id, label, type = 'text', value, onChange, placeholder, icon, rightElement, required
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-semibold text-subText uppercase tracking-wider">
      {label}
    </label>
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-subText/60 pointer-events-none">
        {icon}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-footer border border-customBorder text-mainText rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder:text-subText/40 transition-colors"
      />
      {rightElement && (
        <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {rightElement}
        </span>
      )}
    </div>
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

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [bio, setBio] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
    setBio('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/');
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await register({ name, email, password, department, bio: bio || undefined });
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
      className="text-subText/60 hover:text-subText transition-colors cursor-pointer"
      tabIndex={-1}
    >
      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div className="min-h-screen bg-primary text-mainText flex transition-colors duration-200">
      
      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-card border-r border-customBorder p-12 relative overflow-hidden">
        {/* Ambient gradient blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-2 relative z-10">
          <Settings className="w-7 h-7 text-accent" />
          <span className="text-2xl font-black tracking-tight text-accent uppercase">
            Campus<span className="text-mainText">Forge</span>
          </span>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-black tracking-tight leading-tight">
            Build, connect,<br />
            <span className="text-accent">and deploy</span><br />
            your campus career.
          </h2>
          <p className="text-subText text-sm leading-relaxed max-w-xs">
            The unified engineering hub for students, clubs, projects, and events. 
            Real-time collaboration starts here.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['🔬 Research Projects', '🏛️ Club Networks', '📅 Campus Events', '👥 Peer Connect'].map((f) => (
              <span
                key={f}
                className="text-[11px] font-mono px-3 py-1.5 bg-footer border border-customBorder rounded-full text-subText"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom stat row */}
        <div className="relative z-10 flex gap-8 border-t border-customBorder pt-8">
          {[['500+', 'Students'], ['40+', 'Active Clubs'], ['200+', 'Projects']].map(([num, label]) => (
            <div key={label}>
              <p className="text-2xl font-black text-accent">{num}</p>
              <p className="text-xs text-subText mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <Settings className="w-6 h-6 text-accent" />
            <span className="text-xl font-black tracking-tight text-accent uppercase">
              Campus<span className="text-mainText">Forge</span>
            </span>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-subText text-sm mt-1">
              {mode === 'login'
                ? 'Sign in to access your campus hub.'
                : 'Join the CampusForge network today.'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-1 bg-footer border border-customBorder rounded-xl p-1">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer capitalize ${
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
            <div className="flex items-start gap-3 px-4 py-3 bg-red-900/20 border border-red-500/40 rounded-xl text-xs">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {mode === 'register' && (
              <Field
                id="name"
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="e.g. Alex Rivera"
                icon={<User size={15} />}
                required
              />
            )}

            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@campus.edu"
              icon={<Mail size={15} />}
              required
            />

            <Field
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              icon={<Lock size={15} />}
              rightElement={eyeBtn}
              required
            />

            {mode === 'register' && (
              <>
                <Field
                  id="confirmPassword"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                  icon={<Lock size={15} />}
                  required
                />

                {/* Department Select */}
                <div className="space-y-1.5">
                  <label htmlFor="department" className="block text-xs font-semibold text-subText uppercase tracking-wider">
                    Department
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-subText/60 pointer-events-none">
                      <BookOpen size={15} />
                    </span>
                    <select
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      className="w-full bg-footer border border-customBorder text-mainText rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors cursor-pointer appearance-none"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bio textarea */}
                <div className="space-y-1.5">
                  <label htmlFor="bio" className="block text-xs font-semibold text-subText uppercase tracking-wider">
                    Bio <span className="text-subText/40 normal-case font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute top-2.5 left-0 pl-3 flex items-start text-subText/60 pointer-events-none">
                      <FileText size={15} />
                    </span>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell the campus a bit about yourself..."
                      rows={2}
                      className="w-full bg-footer border border-customBorder text-mainText rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder:text-subText/40 resize-none transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-primary font-black text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2 shadow-lg shadow-accent/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Switch mode link */}
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
