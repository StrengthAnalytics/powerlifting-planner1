import React from 'react';
import { getPlatesForDisplay } from '../utils/calculator';

interface PlateDisplayProps {
  weightKg: string;
  includeCollars: boolean;
}

const PlateDisplay: React.FC<PlateDisplayProps> = ({ weightKg, includeCollars }) => {
  const totalWeight = parseFloat(weightKg);
  
  if (isNaN(totalWeight) || totalWeight <= 0) {
    return <div className="h-10 flex items-center justify-start text-xs text-slate-400"></div>;
  }

  if (totalWeight > 0 && totalWeight < 20) {
     return <div className="h-10 flex items-center justify-start text-xs text-slate-400">Invalid</div>;
  }

  if (includeCollars && totalWeight > 20 && totalWeight < 25) {
    return <div className="h-10 flex items-center justify-start text-xs text-slate-400">Invalid</div>;
  }

  const plates = getPlatesForDisplay(totalWeight, includeCollars);
  const canLoadWithCollars = totalWeight >= 25;
  const showCollars = includeCollars && canLoadWithCollars;
  
  if (totalWeight === 20 || (totalWeight > 20 && plates.length === 0 && !canLoadWithCollars)) {
    return <div className="h-10 flex items-center justify-start text-xs text-slate-400">Bar Only</div>;
  }

  return (
    <div className="flex items-center h-10">
      {/* Bar sleeve */}
      <div className="h-2.5 w-4 bg-slate-300 rounded-r-sm z-10 shadow-inner"></div>
      {/* Plates */}
      <div className="flex items-center -space-x-px">
        {plates.map((plate, index) => (
          <div
            key={index}
            className={`rounded-md ${plate.size} ${plate.color} flex items-center justify-center shadow`}
            title={`${plate.weight}kg`}
          ></div>
        ))}
      </div>
       {/* Collar */}
      {showCollars &&
        <div className="h-5 w-2 bg-slate-500 border border-slate-600 ml-1 rounded-sm shadow-md" title="2.5kg Collar"></div>
      }
    </div>
  );
};

export default PlateDisplay;
