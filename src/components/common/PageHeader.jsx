import React from 'react';

const PageHeader = ({ title, subtitle, rightContent }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="page-header">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {rightContent && (
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 mt-1 sm:mt-0">
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
