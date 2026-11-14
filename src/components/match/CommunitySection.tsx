import { memo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import type { MatchComment } from '@/data/mock/matchExtras';
import { ar } from '@/i18n/ar';
import { useAuth } from '@/services/auth/AuthProvider';
import { useComments, type Vote } from '@/services/comments/CommentsProvider';
import { colors, radius, spacing } from '@/theme';
import { formatRelative } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { useRequireAuth } from './AuthGate';

const t = ar.community;

const AVATAR_COLORS = ['#7C4DFF', '#0EA5E9', '#F97316', '#EC4899', '#14B8A6', '#EAB308', '#6366F1', '#22C55E'];

function UserAvatar({ name, size = 36 }: { name: string; size?: number }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: AVATAR_COLORS[h % AVATAR_COLORS.length] },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{name.trim().charAt(0)}</Text>
    </View>
  );
}

/** Guest version of the composer: looks like the field, opens the sign-in sheet on tap. */
function LockedComposer({ placeholder }: { placeholder: string }) {
  const requireAuth = useRequireAuth();
  return (
    <HapticPressable
      onPress={() => requireAuth()}
      style={[styles.composer, styles.locked]}
      accessibilityRole="button"
      accessibilityLabel={placeholder}
      accessibilityHint={ar.authGate.message}
    >
      <Text style={[styles.input, styles.lockedText]} numberOfLines={1}>
        {placeholder}
      </Text>
      <View style={[styles.send, styles.sendLocked]}>
        <Icon name="lock" active size={16} color={colors.textSecondary} />
      </View>
    </HapticPressable>
  );
}

/** Text box with the mint send button. */
function Composer({
  placeholder,
  onSend,
  compact,
  autoFocus,
}: {
  placeholder: string;
  onSend: (text: string) => void;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;
  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };
  return (
    <View style={[styles.composer, compact && styles.composerCompact]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        multiline
        maxLength={500}
        autoFocus={autoFocus}
        selectionColor={colors.primary}
      />
      <HapticPressable
        feedback="none"
        onPress={() => {
          haptics.success();
          send();
        }}
        disabled={!canSend}
        style={[styles.send, compact && styles.sendCompact]}
        accessibilityRole="button"
        accessibilityLabel={t.send}
      >
        {/* Ionicons "send" points right; mirror it so it points "forward" in RTL. */}
        <View style={styles.flip}>
          <Icon name="send" size={compact ? 16 : 18} color={colors.background} />
        </View>
      </HapticPressable>
    </View>
  );
}

function VoteButton({
  kind,
  count,
  active,
  onPress,
}: {
  kind: 'like' | 'dislike';
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? (kind === 'like' ? colors.primary : colors.live) : colors.textSecondary;
  return (
    <HapticPressable
      feedback="impact"
      onPress={onPress}
      hitSlop={6}
      style={styles.action}
      accessibilityRole="button"
      accessibilityLabel={kind === 'like' ? t.like : t.dislike}
      accessibilityState={{ selected: active }}
    >
      <Icon name={kind} active={active} size={16} color={color} />
      <Text style={[styles.actionText, { color }]}>{count}</Text>
    </HapticPressable>
  );
}

const CommentItem = memo(function CommentItem({
  matchId,
  comment,
  vote,
  userName,
}: {
  matchId: number;
  comment: MatchComment;
  vote: Vote;
  userName: string;
}) {
  const { vote: castVote, addReply } = useComments();
  const requireAuth = useRequireAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);

  return (
    <View style={styles.comment}>
      <UserAvatar name={comment.user} />
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.user}>{comment.user}</Text>
          <Text style={styles.time}>{formatRelative(comment.createdAt)}</Text>
        </View>
        <Text style={styles.text}>{comment.text}</Text>

        <View style={styles.actions}>
          <VoteButton
            kind="like"
            count={comment.likes}
            active={vote === 'like'}
            onPress={() => requireAuth(() => castVote(matchId, comment.id, 'like'))}
          />
          <VoteButton
            kind="dislike"
            count={comment.dislikes}
            active={vote === 'dislike'}
            onPress={() => requireAuth(() => castVote(matchId, comment.id, 'dislike'))}
          />
          <HapticPressable
            onPress={() =>
              requireAuth(() => {
                setReplying((r) => !r);
                setShowReplies(true);
              })
            }
            hitSlop={6}
            style={styles.action}
            accessibilityRole="button"
          >
            <Icon name="reply" active={replying} size={16} color={replying ? colors.primary : colors.textSecondary} />
            <Text style={[styles.actionText, replying && { color: colors.primary }]}>{t.reply}</Text>
          </HapticPressable>
        </View>

        {comment.replies.length > 0 && (
          <HapticPressable
            onPress={() => setShowReplies((s) => !s)}
            style={styles.repliesToggle}
            accessibilityRole="button"
          >
            <View style={styles.repliesLine} />
            <Text style={styles.repliesToggleText}>
              {showReplies ? t.hideReplies : t.replies(comment.replies.length)}
            </Text>
          </HapticPressable>
        )}

        {showReplies &&
          comment.replies.map((r) => (
            <View key={r.id} style={styles.reply}>
              <UserAvatar name={r.user} size={26} />
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={styles.user}>{r.user}</Text>
                  <Text style={styles.time}>{formatRelative(r.createdAt)}</Text>
                </View>
                <Text style={styles.text}>{r.text}</Text>
              </View>
            </View>
          ))}

        {replying && (
          <Composer
            compact
            autoFocus
            placeholder={t.replyPlaceholder(comment.user)}
            onSend={(text) => {
              addReply(matchId, comment.id, userName, text);
              setReplying(false);
              setShowReplies(true);
            }}
          />
        )}
      </View>
    </View>
  );
});

/** Comment composer + list sorted by most liked. */
export function CommunitySection({ matchId }: { matchId: number }) {
  const { getComments, votes, addComment } = useComments();
  const { user } = useAuth();
  const userName = user?.name ?? t.guest;
  const comments = getComments(matchId);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.sortPill}>
          <Icon name="like" active size={12} />
          <Text style={styles.sortText}>{t.sortedBy}</Text>
        </View>
        <View style={styles.flex} />
        <Text style={styles.count}>{t.count(comments.length)}</Text>
      </View>

      <View style={styles.composerRow}>
        <UserAvatar name={userName} />
        <View style={styles.flex}>
          {user ? (
            <Composer placeholder={t.placeholder} onSend={(text) => addComment(matchId, userName, text)} />
          ) : (
            <LockedComposer placeholder={t.placeholder} />
          )}
        </View>
      </View>

      <View style={styles.list}>
        {comments.map((c) => (
          <CommentItem key={c.id} matchId={matchId} comment={c} vote={votes[c.id] ?? null} userName={userName} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  sortText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  count: {
    color: colors.textMuted,
    fontSize: 12,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: 6,
    paddingStart: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locked: {
    alignItems: 'center',
  },
  lockedText: {
    color: colors.textMuted,
    textAlignVertical: 'center',
  },
  sendLocked: {
    backgroundColor: colors.surfaceElevated,
  },
  composerCompact: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 8,
    writingDirection: 'rtl',
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  list: {
    gap: spacing.sm,
  },
  comment: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  commentBody: {
    flex: 1,
    gap: 4,
    alignItems: 'flex-start',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  user: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
  },
  text: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    writingDirection: 'rtl',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  repliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  repliesLine: {
    width: 20,
    height: 1,
    backgroundColor: colors.textMuted,
  },
  repliesToggleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  reply: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
});
