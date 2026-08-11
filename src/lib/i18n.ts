import type { PreferredLanguage } from "./types";

// Flat key -> translated string. Add new keys here (both languages) as more
// of the UI gets translated; unknown keys just fall back to English, then
// to the raw key itself, so a missing translation never breaks rendering.
// {placeholders} inside a string are substituted from the `params` object
// passed to translate()/t() — e.g. "Resend in {n}s" + { n: 30 }.
const dictionary: Record<PreferredLanguage, Record<string, string>> = {
  en: {
    // Navbar
    "nav.my_businesses": "My businesses",
    "nav.inbox": "Inbox",
    "nav.admin": "Admin",
    "nav.account": "Account",
    "nav.account_settings": "Account Settings",
    "nav.my_reviews": "My Reviews",
    "nav.bookmarks": "Bookmarks",
    "nav.messages": "Messages",
    "nav.log_out": "Log out",
    "nav.log_in": "Log in",
    "nav.sign_up": "Sign up",
    "nav.theme": "Theme",

    // Account settings page
    "account.title": "Account settings",
    "account.mobile_number": "Mobile number",
    "account.name": "Name",
    "account.name_placeholder": "Your name",
    "account.profile_picture": "Profile picture",
    "account.uploading": "Uploading…",
    "account.language": "Language",
    "account.language.en": "English",
    "account.language.bn": "বাংলা",
    "account.appearance": "Appearance",
    "account.theme.light": "Light",
    "account.theme.dark": "Dark",
    "account.save": "Save",
    "account.toast.updated": "Profile updated",

    // Login / signup / forgot-password modal (shared)
    "modal.login.heading": "Welcome back",
    "modal.login.description": "Continue to your account.",
    "modal.signup.heading": "Create your account",
    "modal.signup.description": "Join the trusted local business community.",
    "modal.forgot_password.heading": "Reset your password",
    "modal.forgot_password.description": "We'll text you a one-time code to confirm it's you.",
    "modal.illustration.title": "Find a business you can actually trust",
    "modal.illustration.subtitle":
      "NID-verified local businesses, real reviews, and a platform built for Bangladesh.",

    // Shared auth fields/labels
    "auth.mobile_number": "Mobile number",
    "auth.password": "Password",
    "auth.confirm_password": "Confirm password",
    "auth.new_password": "New password",
    "auth.confirm_new_password": "Confirm new password",
    "auth.otp_code_label": "6-digit code",
    "auth.sent_to": "Sent to {phone}",
    "auth.hint.min_8_chars": "At least 8 characters.",
    "auth.hint.one_account_type": "One phone number can hold only one account type.",

    // Login form
    "auth.forgot_password": "Forgot password?",
    "auth.no_account": "Don't have an account?",

    // Signup form
    "auth.account_type": "Account type",
    "auth.customer": "Customer",
    "auth.business_owner": "Business Owner",
    "auth.have_account": "Already have an account?",
    "auth.verify_create_account": "Verify & create account",
    "auth.back": "← Back",
    "auth.resend_in": "Resend in {n}s",
    "auth.resend_code": "Resend code",

    // Forgot-password form
    "auth.change_number": "← Change number",
    "auth.reset_password_button": "Reset password",
    "auth.send_code": "Send code",
    "auth.remembered_password": "Remembered your password?",

    // Validation errors
    "auth.error.invalid_phone": "Enter a valid Bangladeshi mobile number (e.g. 01712345678).",
    "auth.error.enter_password": "Enter your password.",
    "auth.error.password_min": "Password must be at least 8 characters.",
    "auth.error.passwords_mismatch": "Passwords do not match.",
    "auth.error.enter_code": "Enter the code you received.",
    "auth.error.too_many_otp": "Too many OTP requests — please wait before trying again.",
    "auth.error.enter_name": "Enter your name.",

    // Toasts
    "auth.toast.logged_in": "Logged in",
    "auth.toast.otp_sent": "OTP sent — it expires in 5 minutes.",
    "auth.toast.account_created": "Account created",
    "auth.toast.password_reset": "Password reset",

    "button.create_account": "Create account",
  },
  bn: {
    // Navbar
    "nav.my_businesses": "আমার ব্যবসা",
    "nav.inbox": "ইনবক্স",
    "nav.admin": "অ্যাডমিন",
    "nav.account": "অ্যাকাউন্ট",
    "nav.account_settings": "অ্যাকাউন্ট সেটিংস",
    "nav.my_reviews": "আমার রিভিউ",
    "nav.bookmarks": "বুকমার্ক",
    "nav.messages": "মেসেজ",
    "nav.log_out": "লগ আউট",
    "nav.log_in": "লগ ইন",
    "nav.sign_up": "সাইন আপ",
    "nav.theme": "থিম",

    // Account settings page
    "account.title": "অ্যাকাউন্ট সেটিংস",
    "account.mobile_number": "মোবাইল নম্বর",
    "account.name": "নাম",
    "account.name_placeholder": "আপনার নাম",
    "account.profile_picture": "প্রোফাইল ছবি",
    "account.uploading": "আপলোড হচ্ছে…",
    "account.language": "ভাষা",
    "account.language.en": "English",
    "account.language.bn": "বাংলা",
    "account.appearance": "থিম",
    "account.theme.light": "হালকা",
    "account.theme.dark": "গাঢ়",
    "account.save": "সংরক্ষণ করুন",
    "account.toast.updated": "প্রোফাইল আপডেট হয়েছে",

    // Login / signup / forgot-password modal (shared)
    "modal.login.heading": "স্বাগতম",
    "modal.login.description": "আপনার অ্যাকাউন্টে যান।",
    "modal.signup.heading": "আপনার অ্যাকাউন্ট তৈরি করুন",
    "modal.signup.description": "বিশ্বস্ত স্থানীয় ব্যবসায়ী কমিউনিটিতে যোগ দিন।",
    "modal.forgot_password.heading": "পাসওয়ার্ড রিসেট করুন",
    "modal.forgot_password.description": "আপনার পরিচয় নিশ্চিত করতে আমরা একটি ওটিপি কোড পাঠাব।",
    "modal.illustration.title": "এমন ব্যবসা খুঁজুন যাকে সত্যিই বিশ্বাস করা যায়",
    "modal.illustration.subtitle":
      "এনআইডি-ভেরিফাইড স্থানীয় ব্যবসা, প্রকৃত রিভিউ, এবং বাংলাদেশের জন্য তৈরি একটি প্ল্যাটফর্ম।",

    // Shared auth fields/labels
    "auth.mobile_number": "মোবাইল নম্বর",
    "auth.password": "পাসওয়ার্ড",
    "auth.confirm_password": "পাসওয়ার্ড নিশ্চিত করুন",
    "auth.new_password": "নতুন পাসওয়ার্ড",
    "auth.confirm_new_password": "নতুন পাসওয়ার্ড নিশ্চিত করুন",
    "auth.otp_code_label": "৬-সংখ্যার কোড",
    "auth.sent_to": "পাঠানো হয়েছে {phone}",
    "auth.hint.min_8_chars": "কমপক্ষে ৮ অক্ষর।",
    "auth.hint.one_account_type": "একটি ফোন নম্বরে শুধু একটি অ্যাকাউন্ট টাইপ থাকতে পারে।",

    // Login form
    "auth.forgot_password": "পাসওয়ার্ড ভুলে গেছেন?",
    "auth.no_account": "অ্যাকাউন্ট নেই?",

    // Signup form
    "auth.account_type": "অ্যাকাউন্টের ধরন",
    "auth.customer": "গ্রাহক",
    "auth.business_owner": "ব্যবসার মালিক",
    "auth.have_account": "ইতিমধ্যে অ্যাকাউন্ট আছে?",
    "auth.verify_create_account": "যাচাই করুন ও অ্যাকাউন্ট তৈরি করুন",
    "auth.back": "← পেছনে",
    "auth.resend_in": "{n} সেকেন্ডে আবার পাঠান",
    "auth.resend_code": "আবার কোড পাঠান",

    // Forgot-password form
    "auth.change_number": "← নম্বর পরিবর্তন করুন",
    "auth.reset_password_button": "পাসওয়ার্ড রিসেট করুন",
    "auth.send_code": "কোড পাঠান",
    "auth.remembered_password": "পাসওয়ার্ড মনে পড়েছে?",

    // Validation errors
    "auth.error.invalid_phone": "সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)।",
    "auth.error.enter_password": "আপনার পাসওয়ার্ড দিন।",
    "auth.error.password_min": "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।",
    "auth.error.passwords_mismatch": "পাসওয়ার্ড মিলছে না।",
    "auth.error.enter_code": "প্রাপ্ত কোডটি দিন।",
    "auth.error.enter_name": "আপনার নাম লিখুন।",
    "auth.error.too_many_otp": "অনেকবার ওটিপি চাওয়া হয়েছে — একটু পর আবার চেষ্টা করুন।",

    // Toasts
    "auth.toast.logged_in": "লগইন সফল হয়েছে",
    "auth.toast.otp_sent": "ওটিপি পাঠানো হয়েছে — এটি ৫ মিনিটে মেয়াদ শেষ হবে।",
    "auth.toast.account_created": "অ্যাকাউন্ট তৈরি হয়েছে",
    "auth.toast.password_reset": "পাসওয়ার্ড রিসেট হয়েছে",

    "button.create_account": "অ্যাকাউন্ট তৈরি করুন",
  },
};

export function translate(
  lang: PreferredLanguage,
  key: string,
  params?: Record<string, string | number>
): string {
  let text = dictionary[lang]?.[key] ?? dictionary.en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(`{${name}}`, String(value));
    }
  }
  return text;
}