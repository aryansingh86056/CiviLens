# Security Specification: Civilens Firestore Rules

This document specifies the security posture, data invariants, and access control model for Civilens.

## 1. Data Invariants

- **Users**: Users can only create or update their own profile document (`/users/{userId}`). No user can elevate their own or other users' ranks or scores arbitrarily.
- **Issues**: Any logged-in and verified user can submit a civic issue. They cannot spoof the `reporterId` or reporter details (they must match their own profile). Only the reporter or an authorized entity can delete or update specific fields.
- **Likes**: A user can like any issue, but they can only create/delete their own like document under `/issues/{issueId}/likes/{userId}`. The issue's `likesCount` must reflect this.
- **Comments**: Any verified user can add comments. The `userId` and author details on a comment must strictly match the authenticated user.

## 2. The "Dirty Dozen" Malicious Payloads

We define 12 adversarial payloads designed to test our ruleset limits:

1. **Identity Spoofing in Profiles**: Writing to `/users/another_user_id` to edit their score or rank.
2. **Arbitrary Rank Promotion**: Creating or updating one's profile with `rank: "Civic Guardian"` or `rankScore: 1000000`.
3. **Ghost Fields on Profile**: Adding `isAdmin: true` or `role: "Admin"` on `/users/{userId}`.
4. **Reporter ID Spoofing**: Submitting an issue with `reporterId: "another_user"` to blame them or impersonate them.
5. **Issue Creation with Negative Likes**: Creating a new issue with `likesCount: -100` or `likesCount: 999999`.
6. **Malicious Issue ID Poisoning**: Trying to write an issue with a 1.5KB long ID containing junk characters.
7. **Arbitrary Status Change**: Modifying an open issue's status directly to `Fixed` without proper authority or field change constraints.
8. **Double Liking**: Trying to write a like document under `/issues/{issueId}/likes/{anotherUserId}`.
9. **Comment Spoofing**: Posting a comment under `/comments/{commentId}` with `userId: "another_user"`.
10. **Unbounded List Injection**: Writing large arrays in the comment document to trigger memory exhaustion.
11. **Timestamp Manipulation**: Providing client-side dates in `createdAt` instead of a server-provided timestamp.
12. **Post-Terminal State Update**: Modifying a finished or resolved issue's core fields after it has been closed.

## 3. Rules Implementation Strategy

We implement Attribute-Based Access Control (ABAC):
- `users/{userId}`: `read` by any authenticated user; `write` only by the user themselves. The write validation checks fields strictly.
- `issues/{issueId}`: `read` by anyone; `create` by any verified user matching `reporterId`; `update` only allowed via specific actions (liking, status updates, or details modification).
- `issues/{issueId}/likes/{userId}`: `read` by anyone; `write` only if `request.auth.uid == userId`.
- `comments/{commentId}`: `read` by anyone; `create` by verified user matching `userId`.
