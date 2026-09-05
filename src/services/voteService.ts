import { supabase } from '../supabaseClient';

export interface VoteResult {
  success: boolean;
  method?: 'rpc' | 'direct_update';
  rlsBlocked?: boolean;
  data?: any;
  error?: any;
}

const LOCAL_STORAGE_KEY = 'review_user_votes';

/**
 * Retrieve user's local votes from localStorage
 */
export function getStoredUserVotes(): Record<string, 'helpful' | 'not_helpful'> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read review_user_votes from localStorage', err);
    return {};
  }
}

/**
 * Persist user's vote state in localStorage
 */
export function saveUserVote(reviewId: string, vote: 'helpful' | 'not_helpful' | null): void {
  if (typeof window === 'undefined') return;
  try {
    const votes = getStoredUserVotes();
    if (vote) {
      votes[reviewId] = vote;
    } else {
      delete votes[reviewId];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(votes));
  } catch (err) {
    console.error('Failed to save review_user_votes to localStorage', err);
  }
}

/**
 * Calculate the new counts and state when clicking helpful or not_helpful
 */
export function computeVoteTransition(
  currentHelpful: number = 0,
  currentNotHelpful: number = 0,
  currentVote: 'helpful' | 'not_helpful' | null = null,
  clickedVote: 'helpful' | 'not_helpful'
): { helpful: number; not_helpful: number; nextVote: 'helpful' | 'not_helpful' | null } {
  let h = Math.max(0, currentHelpful);
  let nh = Math.max(0, currentNotHelpful);
  let nextVote: 'helpful' | 'not_helpful' | null = clickedVote;

  if (currentVote === clickedVote) {
    // Untoggle
    if (clickedVote === 'helpful') h = Math.max(0, h - 1);
    else nh = Math.max(0, nh - 1);
    nextVote = null;
  } else if (currentVote === 'helpful') {
    // Switch from helpful to not_helpful
    h = Math.max(0, h - 1);
    nh = nh + 1;
  } else if (currentVote === 'not_helpful') {
    // Switch from not_helpful to helpful
    nh = Math.max(0, nh - 1);
    h = h + 1;
  } else {
    // New vote
    if (clickedVote === 'helpful') h = h + 1;
    else nh = nh + 1;
  }

  return { helpful: h, not_helpful: nh, nextVote };
}

/**
 * Push vote counts to Supabase backend:
 * 1. Tries RPC function first (stored procedure with SECURITY DEFINER).
 * 2. Falls back to direct UPDATE query on the table with .select().
 * 3. Detects if RLS (Row Level Security) silently blocked the update.
 */
export async function pushReviewVoteToSupabase(
  table: 'institution_reviews' | 'professor_reviews',
  id: string,
  helpful: number,
  not_helpful: number
): Promise<VoteResult> {
  const rpcName = table === 'institution_reviews' ? 'vote_institution_review' : 'vote_professor_review';
  const cleanHelpful = Math.max(0, Math.round(helpful));
  const cleanNotHelpful = Math.max(0, Math.round(not_helpful));

  // Method 1: Try stored procedure (RPC)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(rpcName, {
      p_id: id,
      p_helpful: cleanHelpful,
      p_not_helpful: cleanNotHelpful,
    });

    if (!rpcError && rpcData) {
      return {
        success: true,
        method: 'rpc',
        data: rpcData,
      };
    }
  } catch (rpcErr) {
    // RPC function might not exist yet; fall through to direct update
  }

  // Method 2: Direct table update with RLS Policy
  try {
    const { data, error } = await supabase
      .from(table)
      .update({
        helpful: cleanHelpful,
        not_helpful: cleanNotHelpful,
      })
      .eq('id', id)
      .select('id, helpful, not_helpful');

    if (error) {
      console.error(`[Supabase Vote] Direct update error on ${table}:`, error);
      return { success: false, error };
    }

    // In Supabase, if RLS blocks UPDATE, PostgREST returns 200 OK with empty data: []
    if (!data || data.length === 0) {
      console.warn(
        `[Supabase Vote] RLS Policy is preventing updates on '${table}'. Please execute 'supabase_votes_setup.sql' in Supabase SQL Editor to allow updating helpful/not_helpful.`
      );
      return {
        success: false,
        rlsBlocked: true,
      };
    }

    return {
      success: true,
      method: 'direct_update',
      data: data[0],
    };
  } catch (err) {
    console.error(`[Supabase Vote] Exception updating ${table}:`, err);
    return { success: false, error: err };
  }
}
