import React from 'react';
import useAuthStore from '../store/authStore';

/* ── Animated floating orbs for background ── */
const Orb = ({ style }) => (
    <div
        className="absolute rounded-full pointer-events-none"
        style={{
            filter: 'blur(60px)',
            animation: 'float 8s ease-in-out infinite',
            ...style,
        }}
    />
);

/* ── Feature highlight chip ── */
const Feature = ({ emoji, text }) => (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm font-medium border border-white/15">
        <span>{emoji}</span>
        <span>{text}</span>
    </div>
);

/* ── Stat badge ── */
const Stat = ({ value, label }) => (
    <div className="text-center">
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-xs text-white/60 font-medium mt-0.5">{label}</div>
    </div>
);

const LoginPage = () => {
    const loginWithGoogle = useAuthStore(state => state.loginWithGoogle);

    return (
        <div className="min-h-screen flex font-sans overflow-hidden">

            {/* ── Left Hero Panel ─────────────────────────── */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden p-12"
                style={{ background: 'linear-gradient(145deg, #1A0F0A 0%, #2D1810 45%, #4A2010 100%)' }}>

                {/* Animated background orbs */}
                <Orb style={{ width: 400, height: 400, top: '-10%', left: '-10%', background: 'rgba(217,119,87,0.25)' }} />
                <Orb style={{ width: 350, height: 350, bottom: '5%', right: '-5%', background: 'rgba(124,58,237,0.2)', animationDelay: '3s' }} />
                <Orb style={{ width: 200, height: 200, top: '40%', left: '40%', background: 'rgba(245,158,11,0.15)', animationDelay: '1.5s' }} />

                {/* Dot grid overlay */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #D97757, #C4613D)', boxShadow: '0 0 20px rgba(217,119,87,0.5)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-display font-bold text-xl text-white">StudyLabs</span>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
                            Learn Smarter.<br />
                            <span style={{ background: 'linear-gradient(90deg, #F59E0B, #D97757)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Level Up Faster.
                            </span>
                        </h1>
                        <p className="text-white/60 text-lg leading-relaxed max-w-sm">
                            AI-powered learning roadmaps that turn your study materials into interactive journeys.
                        </p>
                    </div>

                    {/* Feature chips */}
                    <div className="flex flex-wrap gap-3">
                        <Feature emoji="🗺️" text="Visual Roadmaps" />
                        <Feature emoji="🤖" text="AI-Generated Content" />
                        <Feature emoji="⚡" text="XP & Achievements" />
                        <Feature emoji="📊" text="Progress Analytics" />
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 pt-4 border-t border-white/10">
                        <Stat value="10K+" label="Students" />
                        <Stat value="500+" label="Courses" />
                        <Stat value="98%" label="Satisfaction" />
                    </div>
                </div>

                {/* Floating map nodes decoration */}
                <div className="absolute top-1/2 right-8 transform -translate-y-1/2 space-y-6 opacity-30 pointer-events-none">
                    {[
                        { color: '#D97757', label: 'Chapter 1', done: true },
                        { color: '#7C3AED', label: 'Quiz', done: true },
                        { color: '#10B981', label: 'Project', done: false },
                    ].map((node, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold"
                                style={{ background: node.color }}>
                                {node.done ? '✓' : i + 1}
                            </div>
                            <span className="text-white/60 text-xs font-medium">{node.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right Login Panel ─────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative"
                style={{ background: 'linear-gradient(160deg, #FFFCF9 0%, #F8F5F1 50%, #F5F0EB 100%)' }}>

                {/* Background blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-40 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.18), transparent)', filter: 'blur(40px)', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-40 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12), transparent)', filter: 'blur(40px)', transform: 'translate(-30%, 30%)' }} />

                <div className="w-full max-w-sm mx-4 relative z-10 page-enter">

                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #D97757, #C4613D)', boxShadow: '0 0 20px rgba(217,119,87,0.4)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-display font-bold text-2xl text-gray-900">StudyLabs</span>
                    </div>

                    {/* Card */}
                    <div className="glass-card rounded-3xl p-5 sm:p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Welcome Back 👋</h2>
                            <p className="text-gray-500 text-sm">Sign in to continue your learning journey</p>
                        </div>

                        {/* Google Button */}
                        <button
                            id="google-login-btn"
                            onClick={loginWithGoogle}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-2xl font-semibold hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 group relative overflow-hidden"
                        >
                            {/* Ripple bg on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                            <svg className="w-5 h-5 relative z-10 flex-shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="relative z-10">Continue with Google</span>
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400 font-medium">Secure sign-in</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Trust badges */}
                        <div className="flex justify-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">🔒 SSL Secured</span>
                            <span className="flex items-center gap-1">✅ No spam</span>
                            <span className="flex items-center gap-1">🚀 Free forever</span>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        By continuing, you agree to our{' '}
                        <span className="underline cursor-pointer hover:text-gray-600">Terms</span>
                        {' '}and{' '}
                        <span className="underline cursor-pointer hover:text-gray-600">Privacy Policy</span>
                    </p>
                </div>
            </div>

            {/* Float animation keyframe */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
