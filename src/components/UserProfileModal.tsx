import { useState } from 'react';
import { useApp, getRankFromPosts } from '../context/AppContext';
import { X, List, ThumbsUp, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import DetailedReportModal from './DetailedReportModal';
import { CivicIssue } from '../types';

interface UserProfileModalProps {
  reporterId: string;
  name: string;
  avatar: string;
  rank: string;
  onClose: () => void;
}

export default function UserProfileModal({ reporterId, name, avatar, rank, onClose }: UserProfileModalProps) {
  const { issues, theme, setViewingDetailId } = useApp();
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);

  const isLight = theme === 'light';

  // Filter this specific reporter's created reports (excluding seeded admin if any)
  const reporterIssues = issues.filter(
    (issue) => issue.reporterId === reporterId && issue.reporterId !== 'seeded_admin_reporter_id'
  );

  // Calculate dynamic upvotes from their submitted reports
  const totalUpvotes = reporterIssues.reduce((sum, issue) => sum + (issue.likesCount || 0), 0);

  // Calculate dynamic rank
  const dynamicRank = getRankFromPosts(reporterIssues.length);

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-100/90 dark:bg-zinc-950/95 overflow-hidden justify-center transition-all duration-300">
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

          <span className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
            Citizen Profile
          </span>

          <div className="w-12"></div> {/* Spacer to center the title */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 scrollbar-thin pb-28">
          {/* Card 1: Profile details */}
          <div className={`p-6 rounded-[28px] border backdrop-blur-md flex items-center gap-5 transition-all duration-250 ${
            isLight
              ? 'bg-white border-slate-200 shadow-md shadow-slate-100/60'
              : 'bg-[#121214] border-zinc-900/60'
          }`}>
            <div className="relative shrink-0">
              <img
                src={avatar}
                alt={name}
                className={`h-20 w-20 rounded-full object-cover p-0.5 border-2 transition-all duration-250 ${
                  isLight ? 'border-blue-500 bg-white shadow-sm' : 'border-blue-500 bg-black'
                }`}
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1">
              <h2 className={`text-xl font-bold tracking-tight transition-colors duration-250 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {name}
              </h2>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold mt-2.5 w-fit border transition-colors duration-250 ${
                isLight
                  ? 'bg-blue-50/70 border-blue-100 text-blue-600'
                  : 'bg-[#0f2042]/70 border-blue-900/30 text-blue-400'
              }`}>
                <CheckCircle2 className="h-3.5 w-3.5 fill-current text-blue-500 stroke-none" />
                <span>Verified CiviLens User</span>
              </div>
            </div>
          </div>

          {/* Stats Bento Grid Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Reports Filed Stat */}
            <div className={`p-5 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3.5 transition-all duration-250 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121214] border-zinc-900/60'
            }`}>
              <div className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors duration-250 ${
                isLight ? 'bg-blue-500/10 text-blue-600' : 'bg-[#0f2042]/50 text-blue-400'
              }`}>
                <List className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-250 ${
                  isLight ? 'text-slate-500' : 'text-zinc-400'
                }`}>
                  Reports Filed
                </p>
                <p className={`text-xl font-extrabold transition-colors duration-250 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {reporterIssues.length}
                </p>
              </div>
            </div>

            {/* Total Upvotes Stat */}
            <div className={`p-5 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3.5 transition-all duration-250 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121214] border-zinc-900/60'
            }`}>
              <div className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors duration-250 ${
                isLight ? 'bg-blue-500/10 text-blue-600' : 'bg-[#0f2042]/50 text-blue-400'
              }`}>
                <ThumbsUp className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-250 ${
                  isLight ? 'text-slate-500' : 'text-zinc-400'
                }`}>
                  Total Upvotes
                </p>
                <p className={`text-xl font-extrabold transition-colors duration-250 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {totalUpvotes}
                </p>
              </div>
            </div>

            {/* Rank Badge Stat */}
            <div className={`p-5 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3.5 transition-all duration-250 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#121214] border-zinc-900/60'
            }`}>
              <div className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors duration-250 ${
                isLight ? 'bg-amber-500/10 text-amber-600' : 'bg-[#291e0a]/50 text-amber-500'
              }`}>
                <Award className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-250 ${
                  isLight ? 'text-slate-500' : 'text-zinc-400'
                }`}>
                  Rank Badge
                </p>
                <p className={`text-xs font-extrabold leading-tight mt-0.5 transition-colors duration-250 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {dynamicRank}
                </p>
              </div>
            </div>
          </div>

          {/* Submitted Reports List Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800/40">
            <h2 className={`text-base font-extrabold tracking-tight transition-colors duration-250 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Reports by {name} ({reporterIssues.length})
            </h2>

            {reporterIssues.length === 0 ? (
              <div className={`p-8 text-center rounded-[28px] border border-dashed transition-all duration-250 ${
                isLight ? 'border-slate-200 bg-white text-slate-400' : 'border-zinc-850 bg-zinc-950/20 text-zinc-500'
              }`}>
                <p className="text-xs font-medium">No reports submitted by this user yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reporterIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-[24px] border flex items-center justify-between gap-4 transition-all duration-250 ${
                      isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        : 'bg-[#121214] border-zinc-900/60 hover:border-zinc-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500">
                          #{issue.id}
                        </span>
                        {issue.status === 'Rejected' ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/10">
                            Rejected
                          </span>
                        ) : issue.status === 'Fixed' ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
                            Fixed
                          </span>
                        ) : issue.aiVerified ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/10">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/10">
                            Open
                          </span>
                        )}
                      </div>
                      <h3 className={`text-sm font-bold tracking-tight truncate ${
                        isLight ? 'text-slate-800' : 'text-zinc-200'
                      }`}>
                        {issue.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                        {issue.location}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedIssue(issue);
                        setViewingDetailId(issue.id);
                      }}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-sm hover:shadow-blue-500/10 shrink-0 flex items-center gap-1"
                    >
                      <span>View</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Modal of selected report */}
        {selectedIssue && (
          <DetailedReportModal
            issue={selectedIssue}
            onClose={() => {
              setSelectedIssue(null);
              // restore parent viewing state
              setViewingDetailId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
