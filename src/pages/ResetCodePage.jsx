import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import AuthCard from '@/components/auth/AuthCard';
import AuthPageShell, {
  AUTH_PAGE_DEFAULT_BACKGROUND,
} from '@/components/auth/AuthPageShell';
import AuthBrandIntro from '@/components/auth/AuthBrandIntro';
import authService from '@/api/services/authService';

const DIGIT_COUNT = 6;

const maskEmail = (value = '') => {
  const [name = '', domain = ''] = value.split('@');
  if (!domain) return value;
  if (name.length <= 2) return `${name.slice(0, 1)}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

const ResetCodePage = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const alertRef = useRef(null);
  const inputRefs = useRef(Array(DIGIT_COUNT).fill(null));
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(() => Array(DIGIT_COUNT).fill(''));
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const lastSubmittedRef = useRef('');

  useEffect(() => {
    const params = new URLSearchParams(search);
    const fromQuery = params.get('email') || '';
    let resolved = fromQuery;
    try {
      if (!resolved) {
        resolved = sessionStorage.getItem('reset_email') || '';
      }
    } catch {}
    setEmail(resolved);
  }, [search]);

  useEffect(() => {
    if ((error || success) && alertRef.current) {
      alertRef.current.focus();
    }
  }, [error, success]);

  const code = useMemo(() => digits.join(''), [digits]);

  const moveFocus = useCallback((index) => {
    const target = inputRefs.current?.[index];
    if (!target) return;
    try {
      target.focus({ preventScroll: true });
    } catch {
      target.focus();
    }
    target.select?.();
  }, []);

  const handleDigitInput = useCallback(
    (index, value) => {
      if (pending || resendPending) return;
      const sanitized = value.replace(/\D/g, '');
      setDigits((prev) => {
        const next = [...prev];
        next[index] = sanitized ? sanitized.slice(-1) : '';
        return next;
      });
      if (sanitized) {
        moveFocus(Math.min(DIGIT_COUNT - 1, index + 1));
      }
    },
    [moveFocus, pending, resendPending]
  );

  const handleKeyDown = useCallback(
    (index, event) => {
      if (event.key === 'Backspace' && !digits[index]) {
        event.preventDefault();
        handleDigitInput(index, '');
        moveFocus(Math.max(0, index - 1));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveFocus(Math.max(0, index - 1));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveFocus(Math.min(DIGIT_COUNT - 1, index + 1));
      }
    },
    [digits, handleDigitInput, moveFocus]
  );

  const handlePaste = useCallback(
    (event) => {
      event.preventDefault();
      if (pending || resendPending) return;
      const pasted = event.clipboardData?.getData('text') ?? '';
      if (!pasted) return;
      const numeric = pasted.replace(/\D/g, '').slice(0, DIGIT_COUNT).split('');
      if (!numeric.length) return;
      setDigits((prev) => {
        const next = [...prev];
        numeric.forEach((digit, idx) => {
          next[idx] = digit;
        });
        return next;
      });
      moveFocus(Math.min(DIGIT_COUNT - 1, numeric.length));
    },
    [moveFocus, pending, resendPending]
  );

  const verifyCode = useCallback(async () => {
    if (pending || resendPending) return;
    setError('');
    setSuccess('');
    if (!email) {
      setError(
        'We could not determine your email. Please restart the reset process.'
      );
      return;
    }
    if (code.length !== DIGIT_COUNT) return;
    if (code === lastSubmittedRef.current) return;
    setPending(true);
    lastSubmittedRef.current = code;
    try {
      const res = await authService.verifyPasswordReset(email, code);
      if (!res?.success || !res?.resetToken) {
        setError(res?.message || 'Invalid or expired code.');
        return;
      }
      try {
        sessionStorage.setItem('reset_token', res.resetToken);
      } catch {}
      navigate(`/set-new-password?token=${encodeURIComponent(res.resetToken)}`);
    } catch (err) {
      setError('Could not verify code.');
      lastSubmittedRef.current = '';
    } finally {
      setPending(false);
    }
  }, [code, email, navigate, pending, resendPending]);

  useEffect(() => {
    if (code.length !== DIGIT_COUNT) return undefined;
    if (pending || resendPending) return undefined;
    if (code === lastSubmittedRef.current) return undefined;

    const id = window.setTimeout(() => {
      verifyCode();
    }, 150);

    return () => window.clearTimeout(id);
  }, [code, pending, resendPending, verifyCode]);

  const onResend = useCallback(async () => {
    setError('');
    setSuccess('');
    lastSubmittedRef.current = '';
    if (!email) {
      setError(
        'We could not determine your email. Please restart the reset process.'
      );
      return;
    }
    setResendPending(true);
    try {
      await authService.requestPasswordReset(email);
      setSuccess('If an account exists, a new code has been sent.');
      setDigits(Array(DIGIT_COUNT).fill(''));
      moveFocus(0);
    } catch (err) {
      setError('Could not resend code.');
    } finally {
      setResendPending(false);
    }
  }, [email, moveFocus]);

  const codeCard = (
    <AuthCard
      title="Enter Verification Code"
      compact
      className="mx-auto"
      cardClassName="shadow-2xl"
    >
      <p className="text-sm text-gray-600 mb-4">
        We sent a 6-digit reset code to{' '}
        <span className="font-medium">{maskEmail(email)}</span>. Enter it below
        to continue.
      </p>

      {(error || success) && (
        <div
          className={`p-3 mb-4 rounded-lg text-sm ${
            success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
          role="alert"
          tabIndex={-1}
          ref={alertRef}
        >
          {success || error}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          verifyCode();
        }}
        className="space-y-3"
        noValidate
        aria-busy={pending || resendPending || undefined}
      >
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${index + 1}`}
              value={digit}
              onChange={(event) => handleDigitInput(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              disabled={pending || resendPending}
              maxLength={1}
              className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
            />
          ))}
        </div>
        {pending && (
          <p className="text-xs text-gray-500 text-center">Verifying...</p>
        )}
        {resendPending && (
          <p className="text-xs text-gray-500 text-center">
            Sending new code...
          </p>
        )}
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/login" className="text-primary underline underline-offset-2">
          Back to Login
        </Link>
        <button
          type="button"
          onClick={onResend}
          disabled={pending || resendPending || !email}
          className="text-primary hover:text-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Resend code
        </button>
      </div>
    </AuthCard>
  );

  const introContent = (
    <AuthBrandIntro
      title="Check your inbox"
      description="Enter the verification code we emailed you so we can confirm the password reset request."
    />
  );

  return (
    <PageTransition>
      <AuthPageShell
        backgroundImage={AUTH_PAGE_DEFAULT_BACKGROUND}
        waveImage="/images/b1bc6b54-fe3f-45eb-8a39-005cc575deef.png"
        formWrapperClassName="max-w-md mr-auto md:mr-[min(8rem,14vw)] md:ml-0"
        formSlot={codeCard}
        asideSlot={introContent}
      />
    </PageTransition>
  );
};

export default ResetCodePage;
