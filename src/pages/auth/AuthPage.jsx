import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const AuthPage = ({ type = 'login' }) => {
  const [showPassword, setShowPassword] = React.useState(false);
  //  Track local role and conditional form text values inside this component layout
  const [role, setRole] = React.useState('vendor'); 
  const [faydaNumber, setFaydaNumber] = React.useState('');
  const [licenseNumber, setLicenseNumber] = React.useState('');

  return (
    <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">
        
        {/* Left Side: Branding/Illustration */}
        <div className="w-full md:w-1/2 bg-[#f3f4f6] p-12 flex flex-col justify-center items-center text-center">
          <div className="mb-8">
            <img 
              src="https://illustrations.popsy.co/gray/data-analysis.svg" 
              alt="GebeyaPlus Auth" 
              className="w-64 h-64 object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 leading-tight">
            Manage sales, inventory <br /> and other transactions
          </h2>
          <div className="flex gap-2 mt-4">
            <span className="w-8 h-2 bg-ncGold rounded-full"></span>
            <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
            <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-sm mx-auto w-full">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {type === 'login' ? 'Welcome Back!' : 'Create Account'}
            </h1>
            <p className="text-slate-500 text-sm mb-8">Please sign {type === 'login' ? 'in' : 'up'} to continue</p>

            <form className="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Sales ID or Email" 
                  className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-ncGold outline-none transition-all"
                />
              </div>

              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-ncGold outline-none transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Show Fayda & License parameters conditionally during registration if Vendor */}
              {type === 'register' && role === 'vendor' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
                  <div>
                    <input 
                      type="text" 
                      placeholder="National Fayda ID Number" 
                      value={faydaNumber}
                      onChange={(e) => setFaydaNumber(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-ncGold outline-none transition-all"
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Trade License Number" 
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-ncGold outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <button className="w-full py-4 bg-ncGold text-white font-bold rounded-2xl shadow-lg hover:bg-opacity-90 transition-all mt-6">
                {type === 'login' ? 'Sign in' : 'Register'}
              </button>

              <div className="relative flex items-center justify-center py-4">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-4 text-slate-400 text-xs uppercase">or</span>
                <div className="border-t border-slate-200 w-full"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 border border-slate-200 py-3 rounded-xl text-xs font-semibold hover:bg-slate-50">
                  <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-4 h-4" alt="fb"/>
                  Add Facebook
                </button>
                <button type="button" className="flex items-center justify-center gap-2 border border-slate-200 py-3 rounded-xl text-xs font-semibold hover:bg-slate-50">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="google"/>
                  Add Google
                </button>
              </div>

              <div className="text-center mt-8">
                <a href="#" className="text-sky-500 text-xs font-medium hover:underline block mb-2">Forgot password?</a>
                <p className="text-slate-500 text-xs">
                  {type === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                  <a href="#" className="text-ncGold font-bold hover:underline">
                    {type === 'login' ? 'Go to Registration' : 'Go to Login'}
                  </a>
                </p>
              </div>
            </form>

            <p className="text-center text-[10px] text-slate-400 mt-12 tracking-widest uppercase">
              @ 2026 GebeyaPlus Setup
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;