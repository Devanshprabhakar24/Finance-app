import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, CheckCircle, Shield, Lock, TrendingUp, Users, BarChart3, FileText, Zap, Globe } from 'lucide-react';
import { APP_CONFIG } from '@/config/app.config';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0F1E] via-slate-900 to-[#0A0F1E]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0F1E]/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                {APP_CONFIG.NAME}
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#solutions" className="text-slate-300 hover:text-white transition-colors">
                Solutions
              </a>
              <a href="#industries" className="text-slate-300 hover:text-white transition-colors">
                Industries
              </a>
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-300"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-6 border-t border-slate-800">
              <div className="flex flex-col space-y-4">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">
                  Features
                </a>
                <a href="#solutions" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">
                  Solutions
                </a>
                <a href="#industries" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">
                  Industries
                </a>
                <button
                  onClick={() => navigate('/login')}
                  className="text-left text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-lg text-center"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20">
              <Shield className="w-4 h-4 text-sky-400 mr-2" />
              <span className="text-sm text-sky-300">Enterprise-Grade Financial Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-white">Secure, Compliant &</span>
              <br />
              <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                Intelligent Financial Systems
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              {APP_CONFIG.NAME} delivers cutting-edge financial technology solutions with bank-grade security, 
              real-time analytics, and seamless compliance for modern enterprises.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/register')}
                className="group px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-sky-500/40 transition-all duration-300 flex items-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all duration-300 border border-slate-700"
              >
                Sign In
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-3xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-white">99.99%</div>
                <div className="text-sm text-slate-400 mt-1">Uptime SLA</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">SOC 2</div>
                <div className="text-sm text-slate-400 mt-1">Certified</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">256-bit</div>
                <div className="text-sm text-slate-400 mt-1">Encryption</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Enterprise-Ready Features
            </h2>
            <p className="text-xl text-slate-400">
              Built for scale, security, and compliance from day one
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-sky-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Bank-Grade Security
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Multi-layer encryption, SOC 2 compliance, and advanced threat detection to protect your financial data.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-sky-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Real-Time Analytics
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Instant insights with AI-powered analytics, predictive modeling, and customizable dashboards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-sky-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Automated Compliance
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Stay compliant with GDPR, PCI-DSS, and industry regulations through automated monitoring and reporting.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-sky-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Role-Based Access
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Granular permissions and multi-level access controls to ensure data security across your organization.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-sky-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Advanced Reporting
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Generate comprehensive financial reports with customizable templates and automated scheduling.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-sky-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                API Integration
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Seamlessly integrate with your existing systems through our robust RESTful API and webhooks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20 px-6 bg-slate-900/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tailored Solutions
            </h2>
            <p className="text-xl text-slate-400">
              Purpose-built for your industry's unique challenges
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <FileText className="w-10 h-10 text-sky-400 mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-3">Transaction Management</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Track, categorize, and analyze all financial transactions with intelligent automation and real-time reconciliation.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-slate-300">
                  <CheckCircle className="w-5 h-5 text-sky-400 mr-2" />
                  Automated categorization
                </li>
                <li className="flex items-center text-slate-300">
                  <CheckCircle className="w-5 h-5 text-sky-400 mr-2" />
                  Receipt management
                </li>
                <li className="flex items-center text-slate-300">
                  <CheckCircle className="w-5 h-5 text-sky-400 mr-2" />
                  Multi-currency support
                </li>
              </ul>
            </div>

            <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <Globe className="w-10 h-10 text-indigo-400 mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-3">Global Operations</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Manage financial operations across multiple regions with localized compliance and multi-currency capabilities.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-slate-300">
                  <CheckCircle className="w-5 h-5 text-indigo-400 mr-2" />
                  Multi-region deployment
                </li>
                <li className="flex items-center text-slate-300">
                  <CheckCircle className="w-5 h-5 text-indigo-400 mr-2" />
                  Localized compliance
                </li>
                <li className="flex items-center text-slate-300">
                  <CheckCircle className="w-5 h-5 text-indigo-400 mr-2" />
                  24/7 global support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Trusted Across Industries
            </h2>
            <p className="text-xl text-slate-400">
              Powering financial operations for leading organizations
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['FinTech', 'Healthcare', 'E-Commerce', 'Manufacturing', 'Real Estate', 'Technology', 'Retail', 'Consulting'].map((industry) => (
              <div key={industry} className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center hover:border-sky-500/50 transition-all duration-300">
                <p className="text-white font-semibold">{industry}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl p-12 text-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Financial Operations?
              </h2>
              <p className="text-xl text-sky-100 mb-8 max-w-2xl mx-auto">
                Join leading enterprises who trust {APP_CONFIG.NAME} for secure, compliant, and intelligent financial management.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-white text-sky-600 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 inline-flex items-center space-x-2"
              >
                <span>Start Your Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                {APP_CONFIG.NAME}
              </span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2024 {APP_CONFIG.NAME}. All rights reserved. | {APP_CONFIG.DESCRIPTION}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
