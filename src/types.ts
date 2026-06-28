export interface CivicIssue {
  id: string;
  title: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  category: string;
  status: 'Open' | 'Fixed' | 'Rejected';
  likesCount: number;
  likedByUser: boolean;
  notifiedAuthority: boolean;
  reporterName: string;
  reporterRank: string;
  reporterAvatar: string;
  reporterId?: string;
  imageUrl?: string;
  imageColor?: string; // fallback color if no image
  createdAt: string;
  aiVerified: boolean;
  isUserCreated?: boolean;
  fixedImage?: string;
  fixedTime?: string;
}

export interface UserStats {
  name: string;
  email: string;
  avatar: string;
  rank: string;
  reportsSubmitted: number;
  reportsFixed: number;
  rankScore: number;
}

export interface CivicComment {
  id: string;
  issueId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface GeneratedEmail {
  to: string;
  subject: string;
  body: string;
  issueId: string;
}


