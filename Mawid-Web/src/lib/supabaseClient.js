import { createClient } from '@supabase/supabase-js'

const cleanKey = (key) => {
    if (!key) return '';
    return key.replace(/['"\s]/g, '').trim();
};

// سحب البيانات من ملف الـ .env
const SUPABASE_URL = cleanKey(import.meta.env.VITE_SUPABASE_URL);
const SUPABASE_KEY = cleanKey(import.meta.env.VITE_SUPABASE_ANON_KEY);

/**
 * التأكد من وجود المفاتيح قبل تشغيل المشروع (Validation Layer)
 */
const validateConfig = () => {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        const errorMsg = 'خطأ في الإعدادات: تأكد من إضافة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env';
        console.error(errorMsg);
        
        // في بيئة التطوير، بنرمي Error عشان المبرمج ياخد باله فوراً
        if (import.meta.env.DEV) {
            throw new Error(errorMsg);
        }
        return false;
    }
    return true;
};

// تشغيل التحقق
validateConfig();

// إنشاء العميل وتصديره
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);