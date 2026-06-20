import React from 'react';
import useAuthStore from '../store/authStore';

const Star = ({ style }) => (
    <div className="absolute rounded-full bg-white pointer-events-none"
        style={{ animation: 'twinkle 3s ease-in-out infinite', ...style }} />
);

const XPBubble = ({ value, style }) => (
    <div className="absolute pointer-events-none font-bold text-sm rounded-full px-3 py-1"
        style={{
            animation: 'floatUp 6s ease-in-out infinite',
            background: 'rgba(217,119,87,0.15)',
            border: '1px solid rgba(217,119,87,0.3)',
            color: '#F59E0B',
            backdropFilter: 'blur(8px)',
            ...style,
        }}>
        {value}
    </div>
);

const RoadmapNode = ({ x, y, color, icon, delay, size = 44 }) => (
    <g>
        <circle cx={x} cy={y} r={size / 2 + 10} fill={color} opacity="0.12"
            style={{ animation: `pulseGlow 2.5s ease-in-out ${delay}s infinite` }} />
        <circle cx={x} cy={y} r={size / 2} fill={color} opacity="0.85" />
        <text x={x} y={y + 6} textAnchor="middle" fontSize="16" fill="white">{icon}</text>
    </g>
);

const STARS = [
    { w: 2, h: 2, top: '12%', left: '8%',  delay: '0s'   },
    { w: 3, h: 3, top: '22%', left: '82%', delay: '1.2s' },
    { w: 2, h: 2, top: '58%', left: '13%', delay: '2.1s' },
    { w: 2, h: 2, top: '72%', left: '78%', delay: '0.6s' },
    { w: 3, h: 3, top: '8%',  left: '52%', delay: '1.7s' },
    { w: 2, h: 2, top: '88%', left: '38%', delay: '2.8s' },
    { w: 2, h: 2, top: '33%', left: '4%',  delay: '3.3s' },
    { w: 3, h: 3, top: '48%', left: '92%', delay: '0.9s' },
    { w: 2, h: 2, top: '80%', left: '22%', delay: '1.5s' },
    { w: 2, h: 2, top: '18%', left: '65%', delay: '2.4s' },
];

const CONNECTOR_DOTS = [
    { x: 310, y: 430 }, { x: 490, y: 320 },
    { x: 690, y: 248 }, { x: 885, y: 210 },
];

const LoginPage = () => {
    const loginWithGoogle = useAuthStore(state => state.loginWithGoogle);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans"
            style={{ background: 'linear-gradient(135deg, #0F0A14 0%, #1A0F1E 50%, #0A0F1A 100%)' }}>

            {/* Background orbs */}
            <div className="absolute pointer-events-none" style={{ width: 650, height: 650, top: '-15%', left: '-10%', borderRadius: '50%', background: 'rgba(217,119,87,0.12)', filter: 'blur(90px)' }} />
            <div className="absolute pointer-events-none" style={{ width: 550, height: 550, bottom: '-12%', right: '-8%', borderRadius: '50%', background: 'rgba(124,58,237,0.14)', filter: 'blur(90px)' }} />
            <div className="absolute pointer-events-none" style={{ width: 320, height: 320, top: '38%', right: '22%', borderRadius: '50%', background: 'rgba(245,158,11,0.07)', filter: 'blur(70px)' }} />

            {/* Stars */}
            {STARS.map((s, i) => (
                <Star key={i} style={{ width: s.w, height: s.h, top: s.top, left: s.left, animationDelay: s.delay }} />
            ))}

            {/* Floating XP bubbles */}
            <XPBubble value="+50 XP"       style={{ bottom: '28%', left: '7%',   animationDelay: '0s'   }} />
            <XPBubble value="+100 XP"      style={{ top: '28%',   right: '6%',   animationDelay: '2s'   }} />
            <XPBubble value="Level Up! 🚀" style={{ top: '14%',   left: '11%',   animationDelay: '4s'   }} />
            <XPBubble value="+25 XP"       style={{ bottom: '14%', right: '11%', animationDelay: '1.5s' }} />

            {/* Roadmap SVG decoration */}
            <svg className="absolute pointer-events-none opacity-25" width="100%" height="100%"
                viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
                <path
                    d="M 130 520 Q 280 420 400 360 Q 510 305 610 258 Q 715 210 810 225 Q 900 242 995 185"
                    stroke="rgba(217,119,87,0.55)" strokeWidth="2.5" strokeDasharray="10 7" fill="none"
                    style={{ animation: 'dashMove 24s linear infinite' }} />

                <RoadmapNode x={130}  y={520} color="#D97757" icon="📖" delay={0}   />
                <RoadmapNode x={400}  y={360} color="#7C3AED" icon="⚡" delay={0.5} />
                <RoadmapNode x={610}  y={258} color="#10B981" icon="🏆" delay={1.0} />
                <RoadmapNode x={810}  y={225} color="#F59E0B" icon="🎯" delay={1.5} />
                <RoadmapNode x={995}  y={185} color="#D97757" icon="🌟" delay={2.0} size={52} />

                {CONNECTOR_DOTS.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgba(245,158,11,0.65)"
                        style={{ animation: `twinkleSvg 2.2s ease-in-out ${i * 0.55}s infinite` }} />
                ))}
            </svg>

            {/* Login card */}
            <div className="relative z-10 w-full max-w-md mx-4 page-enter">
                <div className="rounded-3xl p-8 sm:p-10"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(28px)',
                        WebkitBackdropFilter: 'blur(28px)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        boxShadow: '0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}>

                    {/* Player badge */}
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
                            style={{ background: 'rgba(217,119,87,0.15)', border: '1px solid rgba(217,119,87,0.3)', color: '#F59E0B' }}>
                            🎮 Join 10K+ Learners
                        </div>
                    </div>

                    {/* Logo + title */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: 'linear-gradient(135deg, #D97757, #C4613D)', boxShadow: '0 0 30px rgba(217,119,87,0.55), 0 0 70px rgba(217,119,87,0.2)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-display font-black text-2xl text-white mb-2">StudyLabs</span>
                        <h2 className="text-xl font-black"
                            style={{ background: 'linear-gradient(90deg, #F59E0B, #D97757, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Your Quest Begins Here
                        </h2>
                        <p className="text-white/35 text-sm mt-2 text-center leading-relaxed">
                            Level up your learning with AI-powered roadmaps
                        </p>
                    </div>

                    {/* Mini feature icons */}
                    <div className="flex justify-center gap-8 mb-8">
                        {[
                            { icon: '⚡', label: 'XP System' },
                            { icon: '🗺️', label: 'Roadmaps'  },
                            { icon: '🏆', label: 'Achievements' },
                        ].map((f, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {f.icon}
                                </div>
                                <span className="text-white/35 text-xs font-medium">{f.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="h-px mb-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

                    {/* Google button */}
                    <button
                        id="google-login-btn"
                        onClick={loginWithGoogle}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold text-white transition-all duration-200"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.14)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.13)';
                            e.currentTarget.style.borderColor = 'rgba(217,119,87,0.55)';
                            e.currentTarget.style.boxShadow = '0 0 24px rgba(217,119,87,0.22)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    {/* Trust badges */}
                    <div className="flex justify-center gap-5 mt-5 text-xs text-white/28">
                        <span>🔒 SSL Secured</span>
                        <span>✅ Free Forever</span>
                        <span>⚡ Earn XP</span>
                    </div>
                </div>

                <p className="text-center text-xs text-white/25 mt-5">
                    By continuing, you agree to our{' '}
                    <span className="underline cursor-pointer hover:text-white/50 transition-colors">Terms</span>
                    {' '}and{' '}
                    <span className="underline cursor-pointer hover:text-white/50 transition-colors">Privacy Policy</span>
                </p>
            </div>

            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50%       { opacity: 1;    transform: scale(2); }
                }
                @keyframes twinkleSvg {
                    0%, 100% { opacity: 0.2; }
                    50%       { opacity: 0.9; }
                }
                @keyframes floatUp {
                    0%   { opacity: 0; transform: translateY(18px); }
                    18%  { opacity: 1; }
                    80%  { opacity: 1; }
                    100% { opacity: 0; transform: translateY(-44px); }
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.12; }
                    50%       { opacity: 0.38; }
                }
                @keyframes dashMove {
                    from { stroke-dashoffset: 0;    }
                    to   { stroke-dashoffset: -120; }
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
