import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate('/', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setErrorMessage(String(err.response.data.message));
      } else {
        setErrorMessage('Unable to sign in. Please verify your email and password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200/80">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Sign in to AgileFlow AI</h1>
            <p className="text-xs text-slate-500">Smart Agile workspace with AI Story Point estimation</p>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="auth-field">
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <span id="login-email-hint" className="mb-1 block text-xs text-slate-500">
              Format: you@example.com
            </span>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              enterKeyHint="next"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailInvalid) setEmailInvalid(!e.target.validity.valid);
              }}
              onBlur={(e) => setEmailInvalid(e.target.matches(':user-invalid'))}
              onInvalid={() => setEmailInvalid(true)}
              aria-invalid={emailInvalid ? 'true' : 'false'}
              aria-describedby={emailInvalid ? 'login-email-hint login-email-error' : 'login-email-hint'}
              className="auth-input w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
            <p id="login-email-error" className="auth-field-error mt-1 items-center gap-1 text-xs text-red-600">
              <span role="img" aria-label="Error">⚠</span> Enter a valid email address (e.g. you@example.com).
            </p>
          </div>

          <div className="auth-field">
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                enterKeyHint="done"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordInvalid) setPasswordInvalid(!e.target.validity.valid);
                }}
                onBlur={(e) => setPasswordInvalid(e.target.matches(':user-invalid'))}
                onInvalid={() => setPasswordInvalid(true)}
                aria-invalid={passwordInvalid ? 'true' : 'false'}
                aria-describedby={passwordInvalid ? 'login-password-error' : undefined}
                className="auth-input w-full rounded-lg border border-slate-300 py-2.5 pl-3.5 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p id="login-password-error" className="auth-field-error mt-1 items-center gap-1 text-xs text-red-600">
              <span role="img" aria-label="Error">⚠</span> Please enter your password.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to AgileFlow AI?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
