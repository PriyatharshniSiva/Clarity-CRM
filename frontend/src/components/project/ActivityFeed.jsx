import React from 'react';
import { ActivityItem } from './ActivityItem';

export const ActivityFeed = ({ items = [] }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-xs italic">
        No recent activity logged yet.
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
      {items.map((item, index) => (
        <ActivityItem key={item.id || index} item={item} />
      ))}
    </div>
  );
};
