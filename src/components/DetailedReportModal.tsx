import { useState, useRef, ChangeEvent } from 'react';
import { useApp, formatTimeAgo } from '../context/AppContext';
import { X, Heart, MapPin, MessageSquare, ArrowUp, Trash2, CheckCircle, Clock, Sparkles, Upload, Image as ImageIcon, Megaphone, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { CivicIssue } from '../types';

interface DetailedReportModalProps {
  issue: CivicIssue;
  onClose: () => void;
}

export default function DetailedReportModal({ issue: initialIssue, onClose }: DetailedReportModalProps) {
  const { 
    issues, 
    likeIssue, 
    comments, 
    addComment, 
    deleteIssue, 
    markAsFixed, 
    notifyAuthority,
    theme,
    userStats,
    setActiveEmail
  } = useApp();

  // Always fetch latest state of the issue in case it was modified
  const issue = issues.find(i => i.id === initialIssue.id) || initialIssue;

  const [commentText, setCommentText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFixDialog, setShowFixDialog] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  
  // States for marking issue as fixed
  const [fixedTime, setFixedTime] = useState('Just now');
  const [fixedImage, setFixedImage] = useState<string>('');
  const [fixedImagePreview, setFixedImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVerifyingFix, setIsVerifyingFix] = useState(false);
  const [fixValidationError, setFixValidationError] = useState<string | null>(null);

  const handleNotifyAuthority = async () => {
    setIsNotifying(true);
    try {
      const response = await fetch('/api/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issue.title,
          location: issue.location,
          description: issue.description,
          senderName: userStats?.name,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate authority complaint email');
      }
      const data = await response.json();
      if (data.subject && data.body) {
        setActiveEmail({
          to: data.to || '',
          subject: data.subject,
          body: data.body,
          issueId: issue.id,
        });
        // Close the details modal so that the email preview modal gets the primary focus
        onClose();
      } else {
        throw new Error('Incomplete email data generated');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating complaint email');
    } finally {
      setIsNotifying(false);
    }
  };

  const isLight = theme === 'light';

  const issueComments = comments.filter(c => c.issueId === issue.id);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFixedImage(result);
        setFixedImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    deleteIssue(issue.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleConfirmFixed = async () => {
    if (!fixedImage) return;
    const finalImage = fixedImage;
    
    setIsVerifyingFix(true);
    setFixValidationError(null);
    try {
      const originalImage = issue.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600';
      
      const response = await fetch('/api/ai/verify-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalImage: originalImage,
          fixImage: finalImage,
          issueType: issue.category || issue.title,
        }),
      });

      if (!response.ok) {
        throw new Error('AI Verification request failed.');
      }

      const data = await response.json();
      
      if (!data.match) {
        throw new Error(`Location Mismatch: ${data.matchReason}`);
      }
      if (!data.fixed) {
        throw new Error(`Issue Not Resolved: ${data.fixedReason}`);
      }

      markAsFixed(issue.id, finalImage, fixedTime);
      setShowFixDialog(false);
    } catch (err: any) {
      setFixValidationError(err.message || 'Error verifying fix photo.');
    } finally {
      setIsVerifyingFix(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-100/90 dark:bg-zinc-950/95 overflow-hidden justify-center transition-all duration-300">
      {/* Container simulating a phone screen for the precise Instagram/Mockup vibe */}
      <div
        className={`w-full max-w-xl h-full flex flex-col overflow-hidden relative shadow-2xl transition-colors duration-250 border-x ${
          isLight ? 'bg-white text-slate-850 border-slate-200' : 'bg-[#0a0a0c] text-zinc-200 border-zinc-900/60'
        }`}
      >
        {/* Header Row */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b shrink-0 ${
          isLight ? 'border-slate-100 bg-white/95' : 'border-zinc-900/65 bg-[#0a0a0c]/95'
        } backdrop-blur-md`}>
          <button
            onClick={onClose}
            className={`flex items-center gap-1.5 font-semibold text-sm cursor-pointer transition-colors ${
              isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            <span>Back</span>
          </button>

          <span className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>Report</span>

          <div>
            {issue.status === 'Rejected' ? (
              <span className="text-xs bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 border border-red-100/60 dark:border-red-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Rejected
              </span>
            ) : issue.status === 'Fixed' ? (
              <span className="text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 border border-emerald-100/60 dark:border-emerald-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Fixed
              </span>
            ) : issue.aiVerified ? (
              <span className="text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 border border-emerald-100/60 dark:border-emerald-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Verified
              </span>
            ) : (
              <span className="text-xs bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 border border-slate-200/60 dark:border-zinc-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Open
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 scrollbar-thin pb-28">
          
          {/* Evidence/Fix Photo Container */}
          <div className="space-y-2">
            <div className={`aspect-video w-full flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all overflow-hidden relative ${
              isLight 
                ? 'bg-slate-50/70 border-slate-100 text-slate-400' 
                : 'bg-zinc-950/45 border-zinc-900/70 text-zinc-500'
            }`}>
              {issue.status === 'Fixed' && issue.fixedImage ? (
                <img src={issue.fixedImage} alt="Fixed evidence" className="w-full h-full object-cover" />
              ) : issue.imageUrl ? (
                <img src={issue.imageUrl} alt="Evidence" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-6">
                  <ImageIcon className="h-11 w-11 text-slate-300 dark:text-zinc-600 stroke-[1.25]" />
                  <span className="text-[10px] font-black tracking-widest font-mono text-slate-400/80 dark:text-zinc-500 uppercase">
                    EVIDENCE PHOTO
                  </span>
                </div>
              )}
            </div>
            {issue.status === 'Fixed' && issue.fixedTime && (
              <p className={`text-[11px] font-mono font-medium flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                <span>REPAIRED EVIDENCE UPLOADED ({issue.fixedTime.toUpperCase()})</span>
              </p>
            )}
          </div>

          {/* Reporter Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={issue.reporterAvatar}
                alt={issue.reporterName}
                className="h-11 w-11 rounded-full object-cover border border-slate-100 dark:border-zinc-800/30"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className={`text-sm font-bold tracking-tight leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {issue.reporterName}
                </h4>
                <span className={`text-xs block leading-none mt-1.5 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                  Posted {formatTimeAgo(issue.createdAt)}
                </span>
              </div>
            </div>

            {/* Likes and verification counts */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => likeIssue(issue.id)}
                className={`flex items-center gap-1.5 text-sm font-semibold cursor-pointer transition-colors ${
                  issue.likedByUser
                    ? 'text-rose-500'
                    : isLight
                      ? 'text-slate-400 hover:text-slate-700'
                      : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Heart className={`h-5 w-5 ${issue.likedByUser ? 'fill-rose-500 stroke-rose-500' : ''}`} />
                <span>{issue.likesCount}</span>
              </button>
            </div>
          </div>

          {/* Location Pill */}
          <div className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl border transition-colors ${
            isLight 
              ? 'bg-blue-50/50 border-blue-100/40 text-blue-600' 
              : 'bg-blue-950/15 border-blue-900/20 text-blue-400'
          }`}>
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold tracking-tight">
              {issue.location}
            </span>
          </div>

          {/* Title & Description Box */}
          <div className="space-y-3">
            <h3 className={`text-base font-extrabold tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {issue.title}
            </h3>
            <div className={`pl-4 border-l-4 p-4 rounded-r-2xl ${
              isLight 
                ? 'border-slate-200 bg-slate-50/55' 
                : 'border-zinc-800 bg-zinc-900/25'
            }`}>
              <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-650' : 'text-zinc-350'}`}>
                {issue.description}
              </p>
            </div>
          </div>

          {/* Author Actions Bar (Delete and Issue Fixed buttons) */}
          {issue.isUserCreated && (
            <div className={`p-4 border rounded-3xl space-y-3 transition-colors ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-zinc-950/50 border-zinc-900/80'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Creator Controls</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Report</span>
                </button>
                {issue.status !== 'Fixed' ? (
                  <button
                    onClick={() => setShowFixDialog(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Issue Fixed</span>
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 border border-slate-200 dark:border-zinc-800">
                    <CheckCircle className="h-4 w-4" />
                    <span>Already Resolved</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Authority Notification Section */}
          <div className={`p-4 border rounded-[24px] space-y-3 transition-colors ${
            isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-zinc-950/50 border-zinc-900/80'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Mail className="h-4 w-4 text-blue-500" />
              <span>Authority Notification</span>
            </div>
            <button
              onClick={handleNotifyAuthority}
              disabled={isNotifying}
              className={`w-full py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold tracking-wide uppercase transition-all duration-200 cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-blue-50 hover:bg-blue-100 border-blue-200/60 text-blue-700 hover:text-blue-800'
                  : 'bg-zinc-900 hover:bg-blue-950/15 border-zinc-800 hover:border-blue-900/40 text-zinc-300 hover:text-blue-400'
              }`}
            >
              {isNotifying ? (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 text-blue-500" />
              )}
              <span>Inform Authority</span>
            </button>
          </div>

          {/* Comments Section Header */}
          <div className={`flex items-center justify-between pt-4 border-t ${
            isLight ? 'border-slate-100' : 'border-zinc-900/45'
          }`}>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              COMMENTS
            </span>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold font-mono">
              {issueComments.length} replies
            </span>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {issueComments.length === 0 ? (
              <div className={`text-center py-10 border border-dashed rounded-2xl ${
                isLight ? 'border-slate-200 text-slate-400' : 'border-zinc-850 text-zinc-500'
              }`}>
                <p className="text-xs italic">No comments yet on this report. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {issueComments.map((c) => (
                  <div key={c.id} className="flex items-start gap-3.5 text-sm py-2">
                    <img
                      src={c.userAvatar}
                      alt={c.userName}
                      className={`h-9 w-9 rounded-full object-cover border shrink-0 ${
                        isLight ? 'border-slate-100' : 'border-zinc-800/40'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>{c.userName}</span>
                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>{formatTimeAgo(c.createdAt)}</span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-650' : 'text-zinc-350'}`}>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sticky Comment Input */}
        <div className={`absolute bottom-0 left-0 right-0 border-t p-4 flex items-center gap-3 shrink-0 ${
          isLight ? 'border-slate-100 bg-white' : 'border-zinc-900/65 bg-[#0a0a0c]'
        }`}>
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
            alt="User avatar"
            className={`h-9 w-9 rounded-full object-cover border ${
              isLight ? 'border-slate-100' : 'border-slate-800/20'
            }`}
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!commentText.trim()) return;
              addComment(issue.id, commentText);
              setCommentText('');
            }}
            className="flex-1 flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className={`flex-1 px-4 py-2.5 text-xs rounded-full border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                isLight
                  ? 'bg-slate-50/50 border-slate-200 text-slate-850 placeholder-slate-400'
                  : 'bg-[#18181b] border-zinc-900/60 text-zinc-100 placeholder-zinc-500'
              }`}
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:opacity-40 shadow-sm ${
                isLight 
                  ? 'bg-[#0f172a] text-white hover:bg-slate-800' 
                  : 'bg-zinc-100 text-black hover:bg-zinc-200'
              }`}
              title="Send Comment"
            >
              <ArrowUp className="h-4.5 w-4.5 stroke-[3]" />
            </button>
          </form>
        </div>

        {/* ==================== DELETE DISCLAIMER DIALOG ==================== */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5">
            <div className={`w-full max-w-sm rounded-[32px] p-6 border transition-all ${
              isLight ? 'bg-white border-slate-100 text-slate-800' : 'bg-zinc-950 border-zinc-900 text-zinc-200'
            }`}>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/45 flex items-center justify-center text-red-600">
                  <Trash2 className="h-6 w-6 stroke-[2]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold tracking-tight">Delete Report?</h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed">
                    This action is final. Your submitted hazard report, all related dynamic verification statuses, upvotes, and community discussions will be permanently deleted from CiviLens.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full pt-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      isLight 
                        ? 'border-slate-200 hover:bg-slate-50 text-slate-600' 
                        : 'border-zinc-800 hover:bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ISSUE FIXED DIALOG ==================== */}
        {showFixDialog && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5 overflow-y-auto">
            <div className={`w-full max-w-md rounded-[32px] p-6 border transition-all my-auto ${
              isLight ? 'bg-white border-slate-100 text-slate-800' : 'bg-zinc-950 border-zinc-900 text-zinc-200'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/45 flex items-center justify-center text-emerald-600">
                      <CheckCircle className="h-4.5 w-4.5 stroke-[2.5]" />
                    </div>
                    <h3 className="text-sm font-extrabold tracking-tight">Mark Issue as Fixed</h3>
                  </div>
                  <button
                    onClick={() => setShowFixDialog(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed">
                  Provide evidence of the resolved issue. You can drag & drop, select a local photo, or use one of our high-quality preset repair photos for quick demonstration.
                </p>

                {/* File Upload Field */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Upload Fixed Image
                  </span>
                  
                  {fixedImagePreview ? (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-emerald-500/20 bg-black">
                      <img src={fixedImagePreview} alt="Fixed issue preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          setFixedImage('');
                          setFixedImagePreview('');
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white cursor-pointer"
                        title="Remove Photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all text-center ${
                        isLight ? 'border-slate-200 bg-slate-50/50 text-slate-400' : 'border-zinc-800 bg-zinc-950/40 text-zinc-500'
                      }`}
                    >
                      <Upload className="h-8 w-8 text-slate-300 dark:text-zinc-700 stroke-[1.5]" />
                      <div>
                        <p className="text-xs font-bold text-blue-500">Click to upload photo</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Drag and drop also supported</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Timing of Fix */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Timing of Fix
                  </label>
                  <input
                    type="text"
                    value={fixedTime}
                    onChange={(e) => setFixedTime(e.target.value)}
                    placeholder="e.g. Just now, Today afternoon, Yesterday"
                    className={`w-full px-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                        : 'bg-[#121214] border-zinc-900 text-zinc-100 placeholder-zinc-500'
                    }`}
                  />
                </div>

                {/* Error Banner */}
                {fixValidationError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-[11px] text-rose-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{fixValidationError}</span>
                  </div>
                )}

                {/* Confirm buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowFixDialog(false)}
                    disabled={isVerifyingFix}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                      isLight 
                        ? 'border-slate-200 hover:bg-slate-50 text-slate-600' 
                        : 'border-zinc-800 hover:bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmFixed}
                    disabled={isVerifyingFix || !fixedImage}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isVerifyingFix ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying with AI...</span>
                      </>
                    ) : (
                      <span>Confirm Issue Fixed</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
