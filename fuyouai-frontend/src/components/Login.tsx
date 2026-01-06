
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, CheckCircle, Loader2, ArrowRight, AlertCircle, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Error state
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setError(null);
    setIsLoading(true);

    // Simulate API network request with potential failure
    try {
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          // 模拟：如果有 "fail" 字样则报错 (用于测试)
          if (email.includes('fail')) {
            reject(new Error('无法连接到验证服务器，请稍后重试。'));
          } else {
            resolve();
          }
        }, 1500);
      });

      setStep('otp');
      setCountdown(60); 
    } catch (err: any) {
      setError(err.message || "发送失败，请检查网络。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setError(null);
    setIsLoading(true);

    try {
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (otp === '000000') { // 模拟错误的验证码
             reject(new Error('验证码无效或已过期。'));
          } else {
             resolve();
          }
        }, 1500);
      });
      navigate('/modules/core'); // Redirect to the main app layout
    } catch (err: any) {
      setError(err.message || "验证失败");
    } finally {
      setIsLoading(false);
    }
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

        {/* Global Error Message UI */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
            <span className="text-xs text-red-600 font-medium">{error}</span>
          </div>
        )}

        {/* Demo Hint */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
          <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-blue-600">
            <span className="font-bold">演示模式：</span> 这是一个前端演示环境。系统不会真的发送邮件。
            {step === 'otp' && <span className="block mt-1">请输入任意 6 位数字（如 123456）即可登录。</span>}
          </div>
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
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
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
                  模拟发送中...
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
                  onChange={(e) => { setOtp(e.target.value); setError(null); }}
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
                {countdown > 0 ? `${countdown}秒后重新模拟发送` : '重新获取验证码'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-[10px] text-center text-slate-300">
            登录即表示你同意《用户协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
};
