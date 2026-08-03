import React from 'react';
import UserAvatar from '../common/UserAvatar';

export const MemberAvatarGroup = ({ members = [], limit = 4 }) => {
  if (!members || members.length === 0) {
    return <span className="text-[11px] text-muted-foreground italic">No members assigned</span>;
  }

  const visibleMembers = members.slice(0, limit);
  const overflowCount = members.length - limit;

  return (
    <div className="flex items-center -space-x-2 overflow-hidden py-1">
      {visibleMembers.map((m, index) => {
        const u = m.user || m;

        return (
          <UserAvatar
            key={m.id || u.id || index}
            user={u}
            className="inline-block h-7 w-7 rounded-full ring-2 ring-background shadow-xs transition-transform hover:scale-110 hover:z-10"
          />
        );
      })}

      {overflowCount > 0 && (
        <div
          title={`${overflowCount} more member(s)`}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-bold text-[10px] text-muted-foreground ring-2 ring-background border shadow-xs"
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
};

export default MemberAvatarGroup;
