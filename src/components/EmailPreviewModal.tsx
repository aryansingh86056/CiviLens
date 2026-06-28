import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Mail, Copy, Check, ExternalLink } from 'lucide-react';

export default function EmailPreviewModal() {
  const { activeEmail, setActiveEmail, notifyAuthority, theme } = useApp();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!activeEmail) return null;

  const { to, subject, body, issueId } = activeEmail;
  const isLight = theme === 'light';

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const mailtoLink = `mailto:${encodeURIComponent(to || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const handleLaunchMailApp = () => {
    notifyAuthority(issueId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 transition-opacity">
      <div 
        className={`w-full max-w-xl rounded-2xl shadow-2xl border flex flex-col max-h-[85vh] overflow-hidden transition-all duration-300 ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50' 
            : 'bg-zinc-950 border-zinc-800/80 text-zinc-200 shadow-black'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-zinc-900 bg-zinc-900/20'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Authority Email Prepared
              </h3>
              <p className="text-xs text-slate-400">
                Simple, human-written complaint is ready to send.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveEmail(null)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-400 hover:text-slate-600' : 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Info Banner */}
          <div className={`p-4.5 rounded-xl border text-sm leading-relaxed ${
            isLight 
              ? 'bg-blue-50/50 border-blue-100/80 text-blue-800' 
              : 'bg-blue-950/15 border-blue-900/30 text-blue-300'
          }`}>
            💡 <strong>Sandbox Tip:</strong> Since CiviLens runs in a preview iframe, your browser might block your default email app from launching automatically. If clicking the launch button below doesn't work, you can copy each section instantly using the copy buttons.
          </div>

          {/* Recipient Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                To / Recipient
              </label>
              {to && (
                <button
                  onClick={() => copyToClipboard(to, 'to')}
                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
                >
                  {copiedField === 'to' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>
              )}
            </div>
            {to ? (
              <div className={`px-3.5 py-2.5 rounded-lg border font-mono text-sm break-all ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-zinc-900/50 border-zinc-800/60 text-zinc-300'
              }`}>
                {to}
              </div>
            ) : (
              <div className={`px-3.5 py-2.5 rounded-lg border text-sm italic ${
                isLight ? 'bg-amber-50/40 border-amber-100/50 text-amber-700/85' : 'bg-amber-950/10 border-amber-900/20 text-amber-400/80'
              }`}>
                No specific email mapped for this location's city. Please search/input your local authority's contact address in your email client.
              </div>
            )}
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Subject
              </label>
              <button
                onClick={() => copyToClipboard(subject, 'subject')}
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
              >
                {copiedField === 'subject' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Subject</span>
                  </>
                )}
              </button>
            </div>
            <div className={`px-3.5 py-2.5 rounded-lg border text-sm font-medium ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-zinc-900/50 border-zinc-800/60 text-white'
            }`}>
              {subject}
            </div>
          </div>

          {/* Body Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Message Body
              </label>
              <button
                onClick={() => copyToClipboard(body, 'body')}
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
              >
                {copiedField === 'body' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-bold text-xs">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-xs">Copy Entire Message</span>
                  </>
                )}
              </button>
            </div>
            <div className={`px-4 py-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-sans ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-zinc-900/50 border-zinc-800/60 text-zinc-300'
            }`}>
              {body}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className={`p-5 border-t flex flex-col sm:flex-row gap-3 items-center justify-between ${
          isLight ? 'border-slate-100 bg-slate-50/50' : 'border-zinc-900 bg-zinc-900/20'
        }`}>
          <button
            onClick={() => setActiveEmail(null)}
            className={`w-full sm:w-auto px-4.5 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer text-center ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/60'
            }`}
          >
            Close Preview
          </button>

          <a
            href={mailtoLink}
            onClick={handleLaunchMailApp}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <span>Open Email Client</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
