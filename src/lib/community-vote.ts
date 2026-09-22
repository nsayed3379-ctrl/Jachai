import type { CommunityPostVoteType } from "./types";

interface Votable {
  myVote: CommunityPostVoteType | null;
  upvoteCount: number;
  downvoteCount: number;
  score: number;
}

/**
 * Mirrors CommunityPostService#vote's exact toggle/swap/remove semantics
 * client-side, so a vote can update its post/comment locally right after
 * the server call succeeds instead of re-fetching the whole post or
 * (for comments, which have no single-item GET) the whole comment list.
 */
export function applyVoteDelta<T extends Votable>(item: T, type: CommunityPostVoteType): T {
  let { myVote, upvoteCount, downvoteCount } = item;
  if (myVote === type) {
    if (type === "UPVOTE") upvoteCount -= 1;
    else downvoteCount -= 1;
    myVote = null;
  } else {
    if (myVote === "UPVOTE") upvoteCount -= 1;
    if (myVote === "DOWNVOTE") downvoteCount -= 1;
    if (type === "UPVOTE") upvoteCount += 1;
    else downvoteCount += 1;
    myVote = type;
  }
  return { ...item, myVote, upvoteCount, downvoteCount, score: upvoteCount - downvoteCount };
}
