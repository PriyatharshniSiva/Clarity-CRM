import React from 'react';

export const KanbanColumn = ({ title, count, color = 'bg-muted', onDrop, onDragOver, children }) => {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver && onDragOver(e);
      }}
      onDrop={(e) => onDrop && onDrop(e)}
      className="flex flex-col bg-muted/20 border border-border/30 rounded-2xl p-3.5 space-y-3 min-h-[500px] shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
          <h3 className="text-xs font-black tracking-wider uppercase text-foreground">
            {title}
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
          {count}
        </span>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[700px] pr-0.5">
        {children}
      </div>
    </div>
  );
};
