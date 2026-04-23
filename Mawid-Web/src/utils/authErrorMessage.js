/**
 * معالجة أخطاء المصادقة والشبكة
 * - تطبع تفاصيل تقنية في الـ Console للمبرمج
 * - ترجع رسالة عربية بسيطة للمستخدم
 *
 * @param {unknown} error
 * @returns {string} رسالة خطأ عربية للعرض على الشاشة
 */
export function formatAuthOrNetworkError(error) {
  const rawMessage = typeof error?.message === 'string'
    ? error.message
    : String(error ?? '');

  // ─── Debug: تفاصيل للمبرمج فقط ────────────────────────────────────────────
  if (import.meta.env.DEV) {
    console.group('🛠️ Auth Debug Info');
    console.error('Raw Error:', error);
    console.warn('Message:', rawMessage);
    console.groupEnd();
  }

  const lower = rawMessage.toLowerCase();

  // ─── أخطاء الشبكة ──────────────────────────────────────────────────────────
  const isNetworkError = [
    'failed to fetch', 'networkerror', 'load failed',
    'net::err', 'err_name_not_resolved', 'getaddrinfo', 'enotfound',
  ].some(pattern => lower.includes(pattern));

  if (isNetworkError) {
    if (import.meta.env.DEV) {
      console.info(
        '💡 Network Hint: تحقق من .env و VITE_SUPABASE_URL و VPN.',
        '\nلو شايف example.supabase.co في الـ Network tab → أعد البناء بدون --mode test'
      );
    }
    return 'تعذّر الاتصال بالسيرفر، يرجى التحقق من اتصال الإنترنت.';
  }

  // ─── أخطاء Supabase الشائعة ─────────────────────────────────────────────────
  const SUPABASE_ERRORS = [
    { match: 'invalid login credentials',   message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'            },
    { match: 'password should be at least', message: 'كلمة المرور ضعيفة، يجب أن تكون ٦ أحرف على الأقل.'      },
    { match: 'email not confirmed',         message: 'يرجى تأكيد بريدك الإلكتروني من خلال الرابط المرسل إليك.' },
    { match: 'rate limit',                  message: 'محاولات كثيرة جداً، يرجى المحاولة بعد دقائق.'            },
    { match: 'user already registered',     message: 'هذا البريد الإلكتروني مسجّل مسبقاً.'                     },
    { match: 'invalid email',               message: 'صيغة البريد الإلكتروني غير صحيحة.'                       },
  ];

  const matched = SUPABASE_ERRORS.find(({ match }) => lower.includes(match));
  if (matched) return matched.message;

  // ─── رسالة افتراضية ────────────────────────────────────────────────────────
  return 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.';
}