import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children, headerAction }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex justify-between items-center mb-4 border-b pb-2 border-slate-200">
        <h3 className="text-xl font-bold text-slate-700">
          {title}
        </h3>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
};

export default Section;