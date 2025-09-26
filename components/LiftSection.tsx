import React, { useMemo, useState } from 'react';
import { LiftType, LiftState } from '../types';
import IconButton from './IconButton';
import PlateDisplay from './PlateDisplay';
import { getPlateBreakdown } from '../utils/calculator';

interface AttemptInputProps {
  attempt: '1' | '2' | '3';
  value: string;
  showError: boolean;
  onChange: (attempt: '1' | '2' | '3', value: string) => void;
}

const AttemptInput: React.FC<AttemptInputProps> = ({ attempt, value, showError, onChange }) => (
  <div className="flex flex-col items-center">
    <label className="text-sm font-medium text-slate-600 mb-1">{attempt}{attempt === '1' ? 'st' : attempt === '2' ? 'nd' : 'rd'} Attempt</label>
    <input
      type="number"
      step="2.5"
      placeholder="kg"
      value={value}
      onChange={(e) => onChange(attempt, e.target.value)}
      className={`w-full text-center p-2 border rounded-md shadow-sm transition-colors bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-50 ${showError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-slate-700 focus:border-slate-500 focus:ring-slate-500'}`}
    />
  </div>
);


interface LiftSectionProps {
  liftType: LiftType;
  liftState: LiftState;
  onAttemptChange: (lift: LiftType, attempt: '1' | '2' | '3', value: string) => void;
  onWarmupChange: (lift: LiftType, index: number, field: 'weight' | 'reps', value: string) => void;
  onCueChange: (lift: LiftType, index: number, value: string) => void;
  onCalculateAttempts: (lift: LiftType) => void;
  onGenerateWarmups: (lift: LiftType) => void;
  onReset: (lift: LiftType) => void;
  onCollarToggle: (lift: LiftType) => void;
}

const LiftSection: React.FC<LiftSectionProps> = ({
  liftType,
  liftState,
  onAttemptChange,
  onWarmupChange,
  onCueChange,
  onCalculateAttempts,
  onGenerateWarmups,
  onReset,
  onCollarToggle,
}) => {
  const { attempts, warmups, cues, error, includeCollars } = liftState;
  const [showCues, setShowCues] = useState(false);

  // Find the index of the last warmup set with any data.
  let lastPopulatedIndex = -1;
  for (let i = warmups.length - 1; i >= 0; i--) {
      if (warmups[i].weight || warmups[i].reps) {
          lastPopulatedIndex = i;
          break;
      }
  }

  // Determine how many rows to show.
  // Show all if none are populated.
  // Otherwise, show all populated rows + 1 extra for adding a new set, up to a max of 8.
  const numRowsToShow = lastPopulatedIndex === -1 
      ? warmups.length 
      : Math.min(lastPopulatedIndex + 2, warmups.length);

  const plateInfo = useMemo(() => {
    const opener = attempts['1'];
    if (!opener || isNaN(parseFloat(opener))) return '';
    
    const lastWarmup = [...warmups].reverse().find(w => w.weight && !isNaN(parseFloat(w.weight)));
    if (!lastWarmup) return '';

    const openerValue = parseFloat(opener);
    const lastWarmupValue = parseFloat(lastWarmup.weight);

    const openerPlates = getPlateBreakdown(openerValue, includeCollars);
    const lastWUPlates = getPlateBreakdown(lastWarmupValue, includeCollars);
    
    return `Opener (${opener}kg): ${openerPlates} | Last WU (${lastWarmupValue}kg): ${lastWUPlates}`;
  }, [attempts, warmups, includeCollars]);

  const handleAttemptChange = (attempt: '1' | '2' | '3', value: string) => {
    onAttemptChange(liftType, attempt, value);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-2xl font-bold text-white bg-slate-800 -m-6 mb-6 p-4 rounded-t-lg text-center capitalize">
        {liftType}
      </h3>
      
      <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
        <h4 className="text-lg font-semibold text-slate-700 mb-3 text-center">Competition Attempts</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <AttemptInput attempt="1" value={attempts['1']} showError={error} onChange={handleAttemptChange} />
          <AttemptInput attempt="2" value={attempts['2']} showError={false} onChange={handleAttemptChange} />
          <AttemptInput attempt="3" value={attempts['3']} showError={false} onChange={handleAttemptChange} />
        </div>
        {error && <p className="text-red-600 text-xs text-center -mt-2 mb-4">Enter 1st attempt to generate warm-ups, or 1st/3rd to calculate.</p>}
        <div className="flex flex-wrap justify-center gap-3">
            <IconButton onClick={() => onCalculateAttempts(liftType)} icon={<span role="img" aria-label="calculate">📊</span>}>Calculate</IconButton>
            <IconButton onClick={() => onGenerateWarmups(liftType)} icon={<span role="img" aria-label="fire">🔥</span>}>Warm-ups</IconButton>
            <IconButton onClick={() => onReset(liftType)} variant="secondary" icon={<span role="img" aria-label="reset">↩️</span>}>Reset</IconButton>
            <IconButton onClick={() => setShowCues(!showCues)} variant="secondary" icon={<span role="img" aria-label="add cues">📝</span>}>
              {showCues ? 'Hide Cues' : 'Add Cues'}
            </IconButton>
        </div>
      </div>

      <div>
        <div className="mb-3 text-center">
          <h4 className="text-lg font-semibold text-slate-700">Warm-ups</h4>
        </div>

        {showCues && (
            <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200 transition-all duration-300">
                <h5 className="text-md font-semibold text-slate-600 mb-3 text-center">Technical Cues</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {cues.map((cue, index) => (
                        <input
                            key={index}
                            type="text"
                            placeholder={`Cue ${index + 1}`}
                            value={cue}
                            onChange={(e) => onCueChange(liftType, index, e.target.value)}
                            className="w-full text-center p-2 border rounded-md shadow-sm text-sm bg-white text-slate-900 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                        />
                    ))}
                </div>
            </div>
        )}

        <div className="flex items-center justify-center gap-2 mb-4">
            <input
            type="checkbox"
            id={`${liftType}-collars`}
            checked={includeCollars}
            onChange={() => onCollarToggle(liftType)}
            className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
            />
            <label htmlFor={`${liftType}-collars`} className="text-sm text-slate-600">
            Include 2.5kg Collars in Loading
            </label>
        </div>

        <div className="grid grid-cols-[30px_90px_60px_1fr] gap-x-3 gap-y-2 items-center text-center text-sm font-medium text-slate-600 mb-2">
            <div className="text-xs">Set</div>
            <div className="text-xs">Weight (kg)</div>
            <div className="text-xs">Reps</div>
            <div className="text-xs">Plate Loading (one side)</div>
        </div>
         {warmups.slice(0, numRowsToShow).map((set, index) => (
          <div key={index} className="grid grid-cols-[30px_90px_60px_1fr] gap-x-3 gap-y-2 items-center mb-1">
            <div className="text-slate-500 font-semibold text-center text-sm">{index + 1}</div>
            <input 
                type="number" 
                step="2.5" 
                placeholder="kg"
                value={set.weight}
                onChange={(e) => onWarmupChange(liftType, index, 'weight', e.target.value)}
                className="w-full text-center p-2 border rounded-md shadow-sm text-sm bg-slate-50 text-slate-900 border-slate-300 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-700" />
            <input 
                type="text" 
                placeholder="reps" 
                value={set.reps}
                onChange={(e) => onWarmupChange(liftType, index, 'reps', e.target.value)}
                className="w-full text-center p-2 border rounded-md shadow-sm text-sm bg-slate-50 text-slate-900 border-slate-300 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-700" />
            <div className="flex justify-start items-center pl-2">
                <PlateDisplay weightKg={set.weight} includeCollars={includeCollars} />
            </div>
          </div>
        ))}
        {plateInfo && <p className="text-xs text-slate-500 mt-3 text-center">{plateInfo}</p>}
      </div>
    </div>
  );
};

export default LiftSection;