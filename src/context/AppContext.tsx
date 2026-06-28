import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CivicIssue, UserStats, CivicComment, GeneratedEmail } from '../types';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  increment,
  collectionGroup
} from 'firebase/firestore';

interface AppContextType {
  isLoggedIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  issues: CivicIssue[];
  addIssue: (issue: Omit<CivicIssue, 'id' | 'createdAt' | 'likesCount' | 'likedByUser' | 'notifiedAuthority' | 'isUserCreated' | 'aiVerified'>) => void;
  likeIssue: (id: string) => void;
  notifyAuthority: (id: string) => void;
  markAsFixed: (id: string, fixedImage?: string, fixedTime?: string) => void;
  deleteIssue: (id: string) => void;
  userStats: UserStats;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  comments: CivicComment[];
  addComment: (issueId: string, text: string) => void;
  viewingDetailId: string | null;
  setViewingDetailId: (id: string | null) => void;
  activeEmail: GeneratedEmail | null;
  setActiveEmail: (email: GeneratedEmail | null) => void;
  authLoading: boolean;
  currentUser: User | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_ISSUES: CivicIssue[] = [];

export const getRankFromPosts = (postCount: number): string => {
  if (postCount <= 10) return 'Observer 👀';
  if (postCount <= 20) return 'Reporter 📝';
  if (postCount <= 30) return 'Verifier ✅';
  if (postCount <= 40) return 'Contributer 🤝';
  if (postCount <= 50) return 'Inspector 🔍';
  if (postCount <= 60) return 'Champian 🏆';
  return 'Guardian 🛡️';
};

export const formatTimeAgo = (dateStr: string): string => {
  if (!dateStr) return '';
  
  if (
    dateStr === 'Just now' || 
    dateStr.includes('ago') || 
    dateStr.includes('yesterday') || 
    dateStr.includes('min') || 
    dateStr.includes('hr') || 
    dateStr.includes('day') ||
    dateStr.includes('week') ||
    dateStr.includes('month') ||
    dateStr.includes('year')
  ) {
    return dateStr;
  }
  
  const parsed = Date.parse(dateStr);
  if (isNaN(parsed)) {
    return dateStr;
  }
  
  const now = Date.now();
  const diffMs = now - parsed;
  if (diffMs < 0) {
    return 'Just now';
  }
  
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    return 'Just now';
  }
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} min ago`;
  }
  
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) {
    return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
  }
  
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  }
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
};

const DEFAULT_USER_STATS: UserStats = {
  name: 'Aryan Singh',
  email: 'aryansingh86056@gmail.com',
  avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><circle cx='60' cy='60' r='58' fill='black' stroke='%233b82f6' stroke-width='3'/><path d='M35 75 L50 75 L60 40 L70 75 L85 75 L60 85 Z' fill='none' stroke='white' stroke-width='2.5' stroke-linejoin='round'/><circle cx='60' cy='66' r='6' fill='%232563eb'/><circle cx='60' cy='66' r='2' fill='white'/><path d='M45 70 L60 50 L75 70' fill='none' stroke='%232563eb' stroke-width='2'/></svg>",
  rank: 'Observer 👀',
  reportsSubmitted: 0,
  reportsFixed: 0,
  rankScore: 0,
};

const DEFAULT_COMMENTS: CivicComment[] = [];

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_USER_STATS);
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [comments, setComments] = useState<CivicComment[]>([]);
  const [likedIssueIds, setLikedIssueIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewingDetailId, setViewingDetailId] = useState<string | null>(null);
  const [activeEmail, setActiveEmail] = useState<GeneratedEmail | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('civilens_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  });

  const isLoggedIn = !!currentUser;

  // Track Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Load user profile from Firestore or create one
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserStats(userDocSnap.data() as UserStats);
          } else {
            const initialStats: UserStats = {
              name: user.displayName || 'Active Citizen',
              email: user.email || '',
              avatar: user.photoURL || DEFAULT_USER_STATS.avatar,
              rank: 'Observer 👀',
              reportsSubmitted: 0,
              reportsFixed: 0,
              rankScore: 0,
            };
            await setDoc(userDocRef, initialStats);
            setUserStats(initialStats);
          }
        } catch (error) {
          console.error('Error loading user profile: ', error);
        }
      } else {
        setCurrentUser(null);
        setUserStats(DEFAULT_USER_STATS);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Live Sync Issues from Firestore when logged in
  useEffect(() => {
    if (!currentUser) {
      setIssues([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'issues'), (snapshot) => {
      const items: CivicIssue[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.reporterId !== 'seeded_admin_reporter_id') {
          items.push({ id: doc.id, ...data } as CivicIssue);
        }
      });
      setIssues(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'issues');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Live Sync Comments from Firestore when logged in
  useEffect(() => {
    if (!currentUser) {
      setComments([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'comments'), (snapshot) => {
      const items: CivicComment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId !== 'seeded_admin_reporter_id') {
          items.push({ id: doc.id, ...data } as CivicComment);
        }
      });
      setComments(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'comments');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Live Sync Liked Issue IDs for currently logged in user using subcollection
  useEffect(() => {
    if (!currentUser) {
      setLikedIssueIds([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'users', currentUser.uid, 'likes'), (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((doc) => {
        ids.push(doc.id);
      });
      setLikedIssueIds(ids);
    }, (error) => {
      console.error('Error listening to user likes: ', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('civilens_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Setup or load profile
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        const initialStats: UserStats = {
          name: user.displayName || 'Active Citizen',
          email: user.email || '',
          avatar: user.photoURL || DEFAULT_USER_STATS.avatar,
          rank: 'Observer 👀',
          reportsSubmitted: 0,
          reportsFixed: 0,
          rankScore: 0,
        };
        await setDoc(userDocRef, initialStats);
        setUserStats(initialStats);
      } else {
        setUserStats(userDocSnap.data() as UserStats);
      }
    } catch (error) {
      console.error('Error logging in with Google: ', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  const addIssue = async (newIssueData: Omit<CivicIssue, 'id' | 'createdAt' | 'likesCount' | 'likedByUser' | 'notifiedAuthority' | 'isUserCreated' | 'aiVerified' | 'status'>) => {
    if (!currentUser) return;
    const issueId = Math.random().toString(36).substring(2, 9);
    const nextSubmitted = userStats.reportsSubmitted + 1;
    const nextRank = getRankFromPosts(nextSubmitted);
    const newIssue = {
      ...newIssueData,
      status: 'Open' as const,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      notifiedAuthority: false,
      isUserCreated: true,
      aiVerified: true,
      reporterName: userStats.name,
      reporterRank: nextRank,
      reporterAvatar: userStats.avatar,
      reporterId: currentUser.uid,
    };

    // Filter out undefined values to prevent Firestore error: Unsupported field value: undefined
    const cleanedIssue = Object.fromEntries(
      Object.entries(newIssue).filter(([_, v]) => v !== undefined)
    );

    try {
      await setDoc(doc(db, 'issues', issueId), cleanedIssue);

      // Increment reportsSubmitted and points
      const userDocRef = doc(db, 'users', currentUser.uid);
      const nextScore = userStats.rankScore + 50; // 50 points for submitting
      const updatedStats = {
        ...userStats,
        reportsSubmitted: nextSubmitted,
        rankScore: nextScore,
        rank: nextRank,
      };
      await setDoc(userDocRef, updatedStats);
      setUserStats(updatedStats);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `issues/${issueId}`);
    }
  };

  const likeIssue = async (id: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const likeDocRef = doc(db, 'users', uid, 'likes', id);
    const isLiked = likedIssueIds.includes(id);

    try {
      if (isLiked) {
        await deleteDoc(likeDocRef);
        await updateDoc(doc(db, 'issues', id), {
          likesCount: increment(-1)
        });
      } else {
        await setDoc(likeDocRef, {
          likedAt: new Date().toISOString()
        });
        await updateDoc(doc(db, 'issues', id), {
          likesCount: increment(1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/likes/${id}`);
    }
  };

  const notifyAuthority = async (id: string) => {
    if (!currentUser) return;
    try {
      const issueRef = doc(db, 'issues', id);
      const issueSnap = await getDoc(issueRef);
      if (issueSnap.exists()) {
        const data = issueSnap.data();
        if (!data.notifiedAuthority) {
          await updateDoc(issueRef, { notifiedAuthority: true });

          // Award 15 points
          const userDocRef = doc(db, 'users', currentUser.uid);
          const nextScore = userStats.rankScore + 15;
          const nextRank = getRankFromPosts(userStats.reportsSubmitted);
          const updatedStats = {
            ...userStats,
            rankScore: nextScore,
            rank: nextRank,
          };
          await setDoc(userDocRef, updatedStats);
          setUserStats(updatedStats);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `issues/${id}`);
    }
  };

  const markAsFixed = async (id: string, fixedImage?: string, fixedTime?: string) => {
    if (!currentUser) return;
    try {
      const issueRef = doc(db, 'issues', id);
      const issueSnap = await getDoc(issueRef);
      if (issueSnap.exists()) {
        const data = issueSnap.data();
        if (data.status !== 'Fixed') {
          await updateDoc(issueRef, {
            status: 'Fixed',
            fixedImage: fixedImage || '',
            fixedTime: fixedTime || 'Just now'
          });

          // Award 100 points
          const userDocRef = doc(db, 'users', currentUser.uid);
          const nextFixed = userStats.reportsFixed + 1;
          const nextScore = userStats.rankScore + 100;
          const nextRank = getRankFromPosts(userStats.reportsSubmitted);
          const updatedStats = {
            ...userStats,
            reportsFixed: nextFixed,
            rankScore: nextScore,
            rank: nextRank,
          };
          await setDoc(userDocRef, updatedStats);
          setUserStats(updatedStats);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `issues/${id}`);
    }
  };

  const deleteIssue = async (id: string) => {
    if (!currentUser) return;
    try {
      const issueRef = doc(db, 'issues', id);
      const issueSnap = await getDoc(issueRef);
      if (issueSnap.exists()) {
        const data = issueSnap.data();
        await deleteDoc(issueRef);

        // Decrement submitted and score if reporter was user
        if (data.reporterId === currentUser.uid) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const nextSubmitted = Math.max(0, userStats.reportsSubmitted - 1);
          const nextFixed = data.status === 'Fixed' ? Math.max(0, userStats.reportsFixed - 1) : userStats.reportsFixed;
          const scoreDelta = data.status === 'Fixed' ? 150 : 50;
          const nextScore = Math.max(0, userStats.rankScore - scoreDelta);
          const nextRank = getRankFromPosts(nextSubmitted);
          const updatedStats = {
            ...userStats,
            reportsSubmitted: nextSubmitted,
            reportsFixed: nextFixed,
            rankScore: nextScore,
            rank: nextRank,
          };
          await setDoc(userDocRef, updatedStats);
          setUserStats(updatedStats);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `issues/${id}`);
    }
  };

  const addComment = async (issueId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const commentId = String(Date.now());
    const newComment: CivicComment & { userId: string } = {
      id: commentId,
      issueId,
      userName: userStats.name,
      userAvatar: userStats.avatar,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      userId: currentUser.uid
    };
    try {
      await setDoc(doc(db, 'comments', commentId), newComment);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `comments/${commentId}`);
    }
  };

  const getRankFromScore = (score: number): 'Civic Guardian' | 'Community Sentinel' | 'Active Citizen' => {
    if (score >= 900) return 'Civic Guardian';
    if (score >= 500) return 'Community Sentinel';
    return 'Active Citizen';
  };

  // Resolve dynamic likedByUser, isUserCreated, and reporterRank on issues for the active session
  const mappedIssues = issues.map((issue) => {
    const authorIssuesCount = issues.filter((i) => i.reporterId === issue.reporterId).length;
    return {
      ...issue,
      likedByUser: likedIssueIds.includes(issue.id),
      isUserCreated: currentUser ? issue.reporterId === currentUser.uid : false,
      reporterRank: getRankFromPosts(authorIssuesCount),
    };
  });

  const myIssuesCount = mappedIssues.filter((issue) => issue.reporterId === currentUser?.uid).length;
  const dynamicUserStats = {
    ...userStats,
    reportsSubmitted: myIssuesCount,
    rank: getRankFromPosts(myIssuesCount),
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        issues: mappedIssues,
        addIssue,
        likeIssue,
        notifyAuthority,
        markAsFixed,
        deleteIssue,
        userStats: dynamicUserStats,
        searchQuery,
        setSearchQuery,
        theme,
        toggleTheme,
        comments,
        addComment,
        viewingDetailId,
        setViewingDetailId,
        activeEmail,
        setActiveEmail,
        authLoading,
        currentUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

