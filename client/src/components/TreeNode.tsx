import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface TreeNodeProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isException?: boolean;
  rightContent?: React.ReactNode;
  collapseToken?: number;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultExpanded = false, 
  isException = false, 
  rightContent = null, 
  collapseToken = 0 
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  React.useEffect(() => {
    if (collapseToken > 0) {
      setExpanded(false);
    }
  }, [collapseToken]);
  
  return (
    <div className="flex flex-col w-full">
      <div 
        className={`group flex items-center justify-between p-3 cursor-pointer transition-all duration-200 border-b last:border-b-0 ${
          isException 
            ? 'border-amber-200/50 hover:bg-amber-100/50 text-amber-900 bg-amber-50/30' 
            : 'border-slate-100 hover:bg-slate-50 text-slate-800'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''} ${isException ? 'text-amber-600' : 'text-slate-400 hover:text-indigo-600'}`}>
            <ChevronRight className="w-4 h-4" />
          </button>
          {Icon && <Icon className={`shrink-0 w-4 h-4 ${isException ? 'text-amber-600' : 'text-slate-500'}`} />}
          <span className="font-medium text-sm truncate">{title}</span>
        </div>
        {rightContent && (
          <div 
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 shrink-0" 
            onClick={e => e.stopPropagation()}
          >
            {rightContent}
          </div>
        )}
      </div>
      {expanded && (
        <div className={`ml-5 pl-4 border-l-2 my-1 ${isException ? 'border-amber-200' : 'border-slate-100'}`}>
          {children}
        </div>
      )}
    </div>
  );
};
