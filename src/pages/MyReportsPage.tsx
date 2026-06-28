import { useApp, formatTimeAgo } from '../context/AppContext';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, MapPin, Clock, ShieldCheck, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyReportsPage() {
  const { issues, markAsFixed, theme } = useApp();

  // Filter issues to user created reports
  const myIssues = issues.filter((issue) => issue.isUserCreated);

  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold tracking-tight transition-colors ${isLight ? 'text-slate-900' : 'text-white'}`}>My Reports</h1>
          <p className={`text-xs md:text-sm mt-1 transition-colors ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Track, update, and close civic hazards you have flagged in your area.
          </p>
        </div>
        <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold">
          {myIssues.length} ACTIVE LOGS
        </span>
      </div>

      {/* Reports Grid/List */}
      {myIssues.length === 0 ? (
        <div className={`text-center py-20 border border-dashed rounded-3xl space-y-4 transition-all duration-250 ${
          isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-slate-950/20'
        }`}>
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <p className={`text-sm font-semibold transition-colors ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>You haven't submitted any reports yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Help make your community safer and cleaner by reporting local hazards today.
            </p>
          </div>
          <Link
            to="/report"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-full transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>File a Report</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {myIssues.map((issue) => (
            <motion.div
              key={issue.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`border p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all duration-250 ${
                isLight 
                  ? 'bg-white border-slate-200 shadow-md shadow-slate-100/65' 
                  : 'bg-slate-900/30 border-slate-800'
              }`}
            >
              {/* Left Column: Info details */}
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wide border ${
                    issue.status === 'Fixed'
                      ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-950/50 text-amber-400 border-amber-500/20'
                  }`}>
                    {issue.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">#{issue.id}</span>
                </div>

                <div className="space-y-1">
                  <h3 className={`text-base font-bold tracking-tight truncate transition-colors ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}>
                    {issue.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    <span className="truncate">{issue.location}</span>
                  </div>
                </div>

                <p className={`text-xs line-clamp-2 leading-relaxed transition-colors ${
                  isLight ? 'text-slate-650' : 'text-slate-400'
                }`}>
                  {issue.description}
                </p>

                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 pt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(issue.createdAt)}</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                  <span>CATEGORY: {issue.category.toUpperCase()}</span>
                </div>
              </div>

              {/* Right Column: Dynamic Action Toggle */}
              <div className={`w-full sm:w-auto flex sm:flex-col items-center justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 shrink-0 ${
                isLight ? 'border-slate-100' : 'border-slate-800/50'
              }`}>
                {issue.status === 'Fixed' ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider w-full sm:w-auto justify-center">
                    <ShieldCheck className="h-4 w-4 stroke-[2]" />
                    <span>Resolved</span>
                  </div>
                ) : (
                  <button
                    onClick={() => markAsFixed(issue.id)}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all border border-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mark as Fixed</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
