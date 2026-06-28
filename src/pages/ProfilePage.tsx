import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { LogOut, Sun, List, ThumbsUp, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DetailedReportModal from '../components/DetailedReportModal';
import { CivicIssue } from '../types';

export default function ProfilePage() {
  const { userStats, issues, logout, theme, toggleTheme, setViewingDetailId, currentUser } = useApp();
  const navigate = useNavigate();
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);

  const isLight = theme === 'light';

  // Filter user's created reports
  const myIssues = issues.filter((issue) => issue.reporterId === currentUser?.uid);

  // Calculate dynamic upvotes from user's created reports
  const totalUpvotes = myIssues.reduce((sum, issue) => sum + (issue.likesCount || 0), 0);

  // Parse rank name and emoji
  const parts = userStats.rank.split(' ');
  const userEmoji = parts[parts.length - 1] || '👀';
  const userRankName = parts.slice(0, parts.length - 1).join(' ') || 'Observer';

  const getProgressDetails = (postsCount: number) => {
    if (postsCount <= 10) {
      const min = 0;
      const max = 10;
      const nextRank = 'Reporter 📝';
      const remaining = 11 - postsCount;
      const progress = ((postsCount - min) / (max - min)) * 100;
      return { min, max, nextRank, remaining, progress };
    } else if (postsCount <= 20) {
      const min = 10;
      const max = 20;
      const nextRank = 'Verifier ✅';
      const remaining = 21 - postsCount;
      const progress = ((postsCount - min) / (max - min)) * 100;
      return { min, max, nextRank, remaining, progress };
    } else if (postsCount <= 30) {
      const min = 20;
      const max = 30;
      const nextRank = 'Contributer 🤝';
      const remaining = 31 - postsCount;
      const progress = ((postsCount - min) / (max - min)) * 100;
      return { min, max, nextRank, remaining, progress };
    } else if (postsCount <= 40) {
      const min = 30;
      const max = 40;
      const nextRank = 'Inspector 🔍';
      const remaining = 41 - postsCount;
      const progress = ((postsCount - min) / (max - min)) * 100;
      return { min, max, nextRank, remaining, progress };
    } else if (postsCount <= 50) {
      const min = 40;
      const max = 50;
      const nextRank = 'Champian 🏆';
      const remaining = 51 - postsCount;
      const progress = ((postsCount - min) / (max - min)) * 100;
      return { min, max, nextRank, remaining, progress };
    } else if (postsCount <= 60) {
      const min = 50;
      const max = 60;
      const nextRank = 'Guardian 🛡️';
      const remaining = 61 - postsCount;
      const progress = ((postsCount - min) / (max - min)) * 100;
      return { min, max, nextRank, remaining, progress };
    } else {
      return { min: 60, max: 100, nextRank: 'Max Rank reached!', remaining: 0, progress: 100 };
    }
  };

  const progressDetails = getProgressDetails(myIssues.length);

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-zinc-800/40">
        <h1 className={`text-xl font-extrabold tracking-tight transition-colors duration-250 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          My Profile
        </h1>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="flex items-center gap-2 text-red-500 hover:text-red-400 font-bold text-sm cursor-pointer transition-colors duration-200"
        >
          <LogOut className="h-4.5 w-4.5 stroke-[2.5]" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Card 1: User Profile Details */}
      <div className={`p-6 rounded-[28px] border backdrop-blur-md flex items-center gap-5 transition-all duration-250 ${
        isLight
          ? 'bg-white border-slate-200 shadow-md shadow-slate-100/60'
          : 'bg-[#121214] border-zinc-900/60'
      }`}>
        {/* Profile Avatar with dynamic ring */}
        <div className="relative shrink-0">
          <img
            src={userStats.avatar}
            alt={userStats.name}
            className={`h-20 w-20 rounded-full object-cover p-0.5 border-2 transition-all duration-250 ${
              isLight
                ? 'border-blue-500 bg-white shadow-sm'
                : 'border-blue-500 bg-black'
            }`}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* User Info Details */}
        <div className="space-y-1">
          <h2 className={`text-xl font-bold tracking-tight transition-colors duration-250 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {userStats.name}
          </h2>
          <p className={`text-xs font-medium transition-colors duration-250 ${
            isLight ? 'text-slate-550' : 'text-zinc-400'
          }`}>
            {userStats.email}
          </p>

          {/* Verified Google Account Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold mt-2.5 w-fit border transition-colors duration-250 ${
            isLight
              ? 'bg-blue-50/70 border-blue-100 text-blue-600'
              : 'bg-[#0f2042]/70 border-blue-900/30 text-blue-400'
          }`}>
            <CheckCircle2 className="h-3.5 w-3.5 fill-current text-blue-500 stroke-none" />
            <span>Verified Google Account</span>
          </div>
        </div>
      </div>

      {/* Card 2: Dark Mode Toggle Card */}
      <div className={`p-6 rounded-[28px] border backdrop-blur-md flex items-center justify-between transition-all duration-250 ${
        isLight
          ? 'bg-white border-slate-200 shadow-md shadow-slate-100/60'
          : 'bg-[#121214] border-zinc-900/60'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-colors duration-250 ${
            isLight ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-500/5 text-amber-400'
          }`}>
            <Sun className="h-5.5 w-5.5 fill-current" />
          </div>
          <div className="space-y-0.5">
            <h3 className={`text-sm font-bold transition-colors duration-250 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Dark Mode
            </h3>
            <p className={`text-xs transition-colors duration-250 ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              Switch to eye-safe black theme
            </p>
          </div>
        </div>

        {/* Polished custom toggle switch widget */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark Mode"
          className={`w-13 h-7.5 flex items-center rounded-full p-1 transition-colors duration-250 cursor-pointer outline-none ${
            !isLight ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <motion.div
            layout
            className="bg-white w-5.5 h-5.5 rounded-full shadow-md"
            animate={{ x: !isLight ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Card 3: Rank Progress Card */}
      <div className={`p-6 rounded-[28px] border backdrop-blur-md space-y-4 transition-all duration-250 ${
        isLight
          ? 'bg-white border-slate-200 shadow-md shadow-slate-100/60'
          : 'bg-[#121214] border-zinc-900/60'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-xl transition-colors duration-250 ${
              isLight ? 'bg-blue-500/10 text-blue-600' : 'bg-[#0f2042]/50 text-blue-400'
            }`}>
              {userEmoji}
            </div>
            <div className="space-y-0.5">
              <h3 className={`text-sm font-bold transition-colors duration-250 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Rank Progress
              </h3>
              <p className={`text-xs transition-colors duration-250 ${
                isLight ? 'text-slate-500' : 'text-zinc-400'
              }`}>
                Current Rank: <span className="font-semibold">{userRankName}</span>
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isLight ? 'bg-slate-100 text-slate-600' : 'bg-zinc-800 text-zinc-300'
          }`}>
            {myIssues.length} / {progressDetails.max} Posts
          </span>
        </div>

        {/* Linear Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressDetails.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className={`text-[11px] font-medium transition-colors duration-250 ${
            isLight ? 'text-slate-500' : 'text-zinc-400'
          }`}>
            {progressDetails.remaining > 0 ? (
              <>
                Submit <span className="font-bold text-blue-600 dark:text-blue-400">{progressDetails.remaining}</span> more report{progressDetails.remaining > 1 ? 's' : ''} to reach to the <span className="font-semibold">{progressDetails.nextRank}</span>
              </>
            ) : (
              "You have reached the ultimate rank: Guardian 🛡️"
            )}
          </p>
        </div>
      </div>

      {/* Stats Bento Grid Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Reports Filed Stat */}
        <div className={`p-5 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3.5 transition-all duration-250 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#121214] border-zinc-900/60'
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
              {myIssues.length}
            </p>
          </div>
        </div>

        {/* Total Upvotes Stat */}
        <div className={`p-5 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3.5 transition-all duration-250 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#121214] border-zinc-900/60'
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
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#121214] border-zinc-900/60'
        }`}>
          <div className={`h-11 w-11 rounded-full flex items-center justify-center text-xl transition-colors duration-250 ${
            isLight ? 'bg-amber-500/10' : 'bg-[#291e0a]/50'
          }`}>
            {userEmoji}
          </div>
          <div className="space-y-1">
            <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-250 ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              Rank
            </p>
            <p className={`text-xs font-extrabold leading-tight mt-0.5 transition-colors duration-250 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {userRankName}
            </p>
          </div>
        </div>
      </div>

      {/* Your Reports Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800/40">
        <div className="flex items-center justify-between">
          <h2 className={`text-base font-extrabold tracking-tight transition-colors duration-250 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Your Reports ({myIssues.length})
          </h2>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
            CIVIC LOGS
          </span>
        </div>

        {myIssues.length === 0 ? (
          <div className={`p-8 text-center rounded-[28px] border border-dashed transition-all duration-250 ${
            isLight ? 'border-slate-200 bg-white text-slate-400' : 'border-zinc-850 bg-zinc-950/20 text-zinc-500'
          }`}>
            <p className="text-xs font-medium">You haven't submitted any reports yet.</p>
            <p className="text-[10px] mt-1 text-slate-400/80 dark:text-zinc-500/80">Submit an issue from the report page to help your community!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myIssues.map((issue) => (
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

        {/* Detailed Modal */}
        {selectedIssue && (
          <DetailedReportModal
            issue={selectedIssue}
            onClose={() => {
              setSelectedIssue(null);
              setViewingDetailId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
