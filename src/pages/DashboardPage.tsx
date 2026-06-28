import { useState } from 'react';
import { useApp, formatTimeAgo } from '../context/AppContext';
import { Heart, Mail, MapPin, CheckCircle, ShieldAlert, Sparkles, Image, MessageSquare, ArrowRight, ArrowUp, Loader2 } from 'lucide-react';
import { CivicIssue } from '../types';
import DetailedReportModal from '../components/DetailedReportModal';
import UserProfileModal from '../components/UserProfileModal';

export default function DashboardPage() {
  const { issues, likeIssue, notifyAuthority, searchQuery, theme, comments, addComment, setViewingDetailId, userStats, setActiveEmail } = useApp();
  const [activeFilter, setActiveFilter] = useState<string>('All Reports');
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [selectedReporter, setSelectedReporter] = useState<{ id: string; name: string; avatar: string; rank: string } | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [loadingNotifiedIds, setLoadingNotifiedIds] = useState<Record<string, boolean>>({});

  const handleSelectIssue = (issue: CivicIssue | null) => {
    setSelectedIssue(issue);
    setViewingDetailId(issue ? issue.id : null);
  };

  const handleNotifyAuthority = async (issueId: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    setLoadingNotifiedIds((prev) => ({ ...prev, [issueId]: true }));
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
          issueId,
        });
      } else {
        throw new Error('Incomplete email data generated');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating complaint email');
    } finally {
      setLoadingNotifiedIds((prev) => ({ ...prev, [issueId]: false }));
    }
  };

  const filters = ['All Reports', 'Verified', 'Fixed Issue'];

  const isLight = theme === 'light';

  const filteredIssues = issues.filter((issue) => {
    // 1. Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        issue.title.toLowerCase().includes(query) ||
        issue.location.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // 2. Tab filter
    if (activeFilter === 'Verified') {
      return issue.aiVerified === true && issue.status !== 'Rejected';
    }
    if (activeFilter === 'Rejected') {
      return issue.status === 'Rejected';
    }
    if (activeFilter === 'Fixed Issue') {
      return issue.status === 'Fixed';
    }
    // 'All Reports'
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Roads & Sidewalks': return '🚧';
      case 'Water & Utilities': return '💧';
      case 'Sanitation': return '♻️';
      case 'Streetlighting': return '💡';
      default: return '📍';
    }
  };

  const getCommentCount = (issueId: string) => {
    return comments.filter((c) => c.issueId === issueId).length;
  };

  return (
    <div className="space-y-6">
      {/* Simplified Dashboard Card with subtle Graph Design */}
      <div className={`relative overflow-hidden border p-6 rounded-3xl backdrop-blur-xl transition-all duration-250 ${
        isLight 
          ? 'bg-white border-slate-200/85 shadow-lg shadow-slate-100' 
          : 'bg-[#121214] border-zinc-900/60'
      }`}>
        {/* SVG Sparkline/Graph background decoration */}
        <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none opacity-[0.05] md:opacity-[0.08] text-blue-500">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="dashboard-chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 0 85 Q 15 55 35 78 T 70 38 T 100 55 L 100 100 L 0 100 Z"
              fill="url(#dashboard-chart-grad)"
            />
            <path
              d="M 0 85 Q 15 55 35 78 T 70 38 T 100 55"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className={`text-3xl font-extrabold tracking-tight flex items-center gap-2 transition-colors duration-250 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Dashboard
            </h1>
            <p className={`text-sm max-w-md transition-colors duration-250 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Tracking live reports in real time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:gap-12 shrink-0">
            <div className="space-y-0.5">
              <div className="text-2xl font-bold text-blue-500 font-mono tracking-tight">
                {issues.filter((i) => i.aiVerified).length}
              </div>
              <div className={`text-[10px] font-bold tracking-wider uppercase font-mono transition-colors duration-250 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Total Reports
              </div>
            </div>
            
            <div className="space-y-0.5">
              <div className="text-2xl font-bold text-emerald-500 font-mono tracking-tight">
                {issues.filter((i) => i.status === 'Fixed').length}
              </div>
              <div className={`text-[10px] font-bold tracking-wider uppercase font-mono transition-colors duration-250 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Fixed Issues
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Main Filters (No filter text prefix) */}
      <div className="flex items-center gap-2.5 pb-2 overflow-x-auto scrollbar-none">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all shrink-0 ${
              activeFilter === filter
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800/60'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Issues Feed (Minimal Instagram-style Layout matching mockup) */}
      <div className="max-w-xl mx-auto space-y-6">
        {filteredIssues.length === 0 ? (() => {
          const getEmptyState = () => {
            switch (activeFilter) {
              case 'Verified':
                return {
                  icon: Sparkles,
                  iconColor: 'text-amber-500 dark:text-amber-400',
                  title: 'No Verified Reports Available',
                  subtitle: 'Our civic AI is actively reviewing community flags. Verified safety issues will appear here shortly.'
                };
              case 'Rejected':
                return {
                  icon: CheckCircle,
                  iconColor: 'text-emerald-500 dark:text-emerald-400',
                  title: 'No Rejected Reports Available',
                  subtitle: 'Fantastic news! All submitted community hazard flags are credible or pending review.'
                };
              case 'Fixed Issue':
                return {
                  icon: CheckCircle,
                  iconColor: 'text-emerald-500 dark:text-emerald-400',
                  title: 'No Resolved Reports Yet',
                  subtitle: 'All civic hazards are currently active. Once issues are verified as repaired, they will be logged here.'
                };
              case 'All Reports':
              default:
                return {
                  icon: ShieldAlert,
                  iconColor: 'text-blue-500 dark:text-blue-400',
                  title: 'No Active Reports Logged',
                  subtitle: 'CiviLens is clear. Be the first citizen leader to flag an active civic hazard in your area.'
                };
            }
          };

          const emptyState = getEmptyState();
          const EmptyIcon = emptyState.icon;

          return (
            <div className={`text-center py-16 px-6 border border-dashed rounded-[32px] transition-colors duration-250 ${
              isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-zinc-850 bg-[#121214]'
            }`}>
              <EmptyIcon className={`h-11 w-11 ${emptyState.iconColor} mx-auto mb-3.5`} />
              <p className={`text-base font-extrabold tracking-tight transition-colors duration-250 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {emptyState.title}
              </p>
              <p className={`text-xs max-w-sm mx-auto mt-1.5 leading-relaxed ${isLight ? 'text-slate-450' : 'text-zinc-500'}`}>
                {emptyState.subtitle}
              </p>
            </div>
          );
        })() : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className={`border rounded-[32px] overflow-hidden p-6 flex flex-col transition-all duration-250 ${
                isLight 
                  ? 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-slate-850' 
                  : 'bg-[#121214] border-zinc-900/65 text-zinc-200 shadow-xl'
              }`}
            >
              {/* 1. Header Row */}
              <div className="flex items-center justify-between">
                <div 
                  onClick={() => issue.reporterId && setSelectedReporter({
                    id: issue.reporterId,
                    name: issue.reporterName,
                    avatar: issue.reporterAvatar,
                    rank: issue.reporterRank
                  })}
                  className="flex items-center gap-3 cursor-pointer group/reporter"
                >
                  <img
                    src={issue.reporterAvatar}
                    alt={issue.reporterName}
                    className="h-11 w-11 rounded-full object-cover border border-slate-100/55 dark:border-zinc-800/30 group-hover/reporter:opacity-85 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className={`text-sm font-bold tracking-tight leading-snug group-hover/reporter:text-blue-500 transition-colors ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {issue.reporterName}
                    </h4>
                    <span className={`text-xs block leading-none mt-1 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                      {formatTimeAgo(issue.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
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

              {/* 2. Photo of incident / Evidence (Visual Box matching mockup) */}
              <div className={`aspect-video md:aspect-[16/10] relative overflow-hidden flex flex-col items-center justify-center gap-2 my-5 rounded-2xl border transition-colors ${
                isLight 
                  ? 'bg-slate-50/70 border-slate-100 text-slate-400' 
                  : 'bg-zinc-950/45 border-zinc-900/70 text-zinc-500'
              }`}>
                {issue.imageUrl ? (
                  <img
                    src={issue.imageUrl}
                    alt={issue.title}
                    className="w-full h-full object-cover absolute inset-0"
                    referrerPolicy="no-referrer"
                  />
                ) : issue.imageColor ? (
                  <div className={`absolute inset-0 bg-gradient-to-br ${issue.imageColor} opacity-75`} />
                ) : null}
                
                {!issue.imageUrl && (
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <Image className="h-11 w-11 text-slate-300 dark:text-zinc-600 stroke-[1.25]" />
                    <span className="text-[10px] font-black tracking-widest font-mono text-slate-400/80 dark:text-zinc-500 uppercase">
                      EVIDENCE
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Location Area */}
              <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-500">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium tracking-tight">
                  {issue.location}
                </span>
              </div>

              {/* 4. Title & Description */}
              <div className="mt-2.5">
                <h3 className={`text-base font-extrabold tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {issue.title}
                </h3>
                <p className={`text-sm mt-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                  {issue.description}
                </p>
              </div>

              {/* 5. Separator line */}
              <div className={`border-t my-4.5 ${isLight ? 'border-slate-100' : 'border-zinc-900/50'}`}></div>

              {/* 6. Footer section (Likes & Comments counts and buttons matching mockup style) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Like Button */}
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

                  {/* Comment Button */}
                  <button
                    onClick={() => handleSelectIssue(issue)}
                    className={`flex items-center gap-1.5 text-sm font-semibold cursor-pointer transition-colors ${
                      isLight ? 'text-slate-400 hover:text-slate-700' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>{getCommentCount(issue.id)}</span>
                  </button>
                </div>
                
                {/* View Button */}
                <button
                  onClick={() => handleSelectIssue(issue)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:border-zinc-750 shadow-md'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>View</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              </div>

              {/* 7. Authority Action Button */}
              <div className="mt-4.5 pt-4 border-t border-slate-100/60 dark:border-zinc-900/40">
                <button
                  onClick={() => handleNotifyAuthority(issue.id)}
                  disabled={loadingNotifiedIds[issue.id]}
                  className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold tracking-wide uppercase transition-all duration-200 cursor-pointer shadow-sm ${
                    isLight
                      ? 'bg-blue-50 hover:bg-blue-100 border-blue-200/60 text-blue-700 hover:text-blue-800'
                      : 'bg-[#121214] hover:bg-blue-950/15 border-zinc-800 hover:border-blue-900/40 text-zinc-300 hover:text-blue-400'
                  }`}
                >
                  {loadingNotifiedIds[issue.id] ? (
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 text-blue-500" />
                  )}
                  <span>Inform Authority</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Interactive Detail and Live Comments Dialog (Fullscreen Panel) */}
      {selectedIssue && (
        <DetailedReportModal
          issue={selectedIssue}
          onClose={() => handleSelectIssue(null)}
        />
      )}

      {/* Another User's Profile Modal (Fullscreen Panel) */}
      {selectedReporter && (
        <UserProfileModal
          reporterId={selectedReporter.id}
          name={selectedReporter.name}
          avatar={selectedReporter.avatar}
          rank={selectedReporter.rank}
          onClose={() => setSelectedReporter(null)}
        />
      )}
    </div>
  );
}
