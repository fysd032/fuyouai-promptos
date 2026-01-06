import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, CheckCircle, Loader2, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // Simulate API network request
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      setCountdown(60); // Start 60s cooldown
    }, 1500);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsLoading(true);
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      navigate('/app/framework/cot');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0B0F15_0%,#0F141C_40%,#111827_100%)] flex items-center justify-center px-4 font-sans relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="absolute top-6 left-6 z-20">
        <button 
          onClick={() => navigate('/')} 
          className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors group text-sm font-medium"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          返回首页
        </button>
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-8 md:p-10 relative z-10 transition-all duration-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-brand-500/30">
            P
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 'email' ? '欢迎来到 Prompt OS' : '输入验证码'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {step === 'email' 
              ? '登录以开始 30 天免费试用，无需密码' 
              : <span>验证码已发送至 <span className="text-slate-800 font-medium">{email}</span></span>
            }
          </p>
        </div>

        {/* Step 1: Email Form */}
        {step === 'email' && (
          <form className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300" onSubmit={handleSendCode}>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400" 
                  placeholder="name@company.com" 
                  autoFocus
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  获取验证码 <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Form */}
        {step === 'otp' && (
          <form className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300" onSubmit={handleVerify}>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Verification Code</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 tracking-widest font-mono text-lg" 
                  placeholder="123456" 
                  maxLength={6}
                  autoFocus
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || otp.length < 4}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  进入 Prompt OS <CheckCircle size={18} />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-sm mt-4">
              <button 
                type="button"
                onClick={() => setStep('email')}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                更换邮箱
              </button>
              <button 
                type="button"
                disabled={countdown > 0}
                onClick={handleSendCode}
                className={`font-medium transition-colors ${countdown > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-brand-600 hover:text-brand-700'}`}
              >
                {countdown > 0 ? `${countdown}秒后重新发送` : '重新发送验证码'}
              </button>
            </div>
          </form>
        )}

        {/* Trial Details Footer */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <details className="group text-sm text-slate-500 cursor-pointer">
            <summary className="text-center text-slate-400 hover:text-brand-600 font-medium list-none flex items-center justify-center gap-1 transition-colors select-none">
              查看 30 天试用特权
              <span className="group-open:rotate-180 transition-transform text-xs">▼</span>
            </summary>
            <div className="mt-4 space-y-2 bg-slate-50/80 p-4 rounded-xl text-slate-600 text-xs leading-relaxed border border-slate-100 animate-in fade-in slide-in-from-top-2">
              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span> 访问全部 7 套框架、30 个模块</p>
              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span> Prompt Optimizer 全功能开放</p>
              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span> 试用结束后自动降级为 Free 版</p>
              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span> 无需绑定信用卡，不自动扣费</p>
            </div>
          </details>
        </div>

        <p className="text-[10px] text-center mt-8 text-slate-300">
          登录即表示你同意《用户协议》和《隐私政策》
        </p>

      </div>
    </div>
  );
};
