import { LiftType, Attempt, WarmupSet, Plate } from '../types';
import { 
    ATTEMPT_PERCENTAGES, 
    SQUAT_WARMUPS, BENCH_WARMUPS, DEADLIFT_WARMUPS,
    SQUAT_REP_SCHEMES, BENCH_REP_SCHEMES, DEADLIFT_REP_SCHEMES 
} from '../constants';

export const roundToNearest2point5 = (value: number): number => {
  return Math.round(value / 2.5) * 2.5;
};

export const calculateAttempts = (liftType: LiftType, attempts: Attempt): Attempt | null => {
  const opener = parseFloat(attempts['1']);
  const third = parseFloat(attempts['3']);
  const percentages = ATTEMPT_PERCENTAGES[liftType];

  if (!opener && !third) {
    return null;
  }

  const newAttempts: Attempt = { ...attempts };

  if (third && !opener) {
    newAttempts['1'] = roundToNearest2point5(third * percentages.fromThird.first).toString();
    newAttempts['2'] = roundToNearest2point5(third * percentages.fromThird.second).toString();
  } else if (opener) {
    newAttempts['2'] = roundToNearest2point5(opener * percentages.fromOpener.second).toString();
    newAttempts['3'] = roundToNearest2point5(opener * percentages.fromOpener.third).toString();
  }

  return newAttempts;
};

export const generateWarmups = (liftType: LiftType, opener: string): WarmupSet[] | null => {
    const openerValue = parseFloat(opener);
    if (isNaN(openerValue)) {
        return null;
    }

    const roundedOpener = roundToNearest2point5(openerValue);

    const lookup: Record<number, number[]> = {
        squat: SQUAT_WARMUPS,
        bench: BENCH_WARMUPS,
        deadlift: DEADLIFT_WARMUPS
    }[liftType];

    const repSchemes: Record<number, number[]> = {
        squat: SQUAT_REP_SCHEMES,
        bench: BENCH_REP_SCHEMES,
        deadlift: DEADLIFT_REP_SCHEMES
    }[liftType];

    const warmups = lookup[roundedOpener];
    if (!warmups) {
        return [];
    }

    const reps = repSchemes[warmups.length] || [];

    const result: WarmupSet[] = [];
    for(let i=0; i<8; i++){
        if(i < warmups.length) {
            result.push({
                weight: warmups[i].toString(),
                reps: (reps[i] || '').toString()
            });
        } else {
             result.push({ weight: '', reps: '' });
        }
    }
    return result;
};


export const getPlateBreakdown = (totalKg: number, includeCollars: boolean): string => {
  const barWeight = 20;
  const collarWeight = includeCollars ? 5 : 0; // 2.5kg per side
  const baseText = `Bar only (${barWeight}kg)${includeCollars ? ' + 5kg Collars' : ''}`;
  
  const plateSet = [25, 20, 15, 10, 5, 2.5, 1.25];
  
  const totalWeightIncludingBar = barWeight + collarWeight;
  if (isNaN(totalKg) || totalKg < totalWeightIncludingBar) {
      if (totalKg === barWeight) return `Bar only (${barWeight}kg)`;
      return baseText;
  }
  
  let weightPerSide = (totalKg - barWeight) / 2;
  if(includeCollars) {
      weightPerSide -= 2.5;
  }

  const breakdown: string[] = [];

  for (const plate of plateSet) {
    const count = Math.floor(weightPerSide / plate);
    if (count > 0) {
      breakdown.push(`${count}×${plate}kg`);
      weightPerSide -= count * plate;
    }
  }

  return breakdown.length ? breakdown.join(' + ') : `Bar only (${barWeight}kg)`;
};

export const PLATE_COLORS: Record<number, string> = {
    25: 'bg-red-500',
    20: 'bg-blue-600',
    15: 'bg-yellow-400',
    10: 'bg-green-500',
    5: 'bg-slate-100 border-2 border-slate-400',
    2.5: 'bg-slate-800',
    1.25: 'bg-slate-400',
    0.5: 'bg-slate-300',
    0.25: 'bg-slate-200',
};

export const PLATE_SIZES: Record<number, string> = {
    25: 'h-10 w-3',
    20: 'h-10 w-2.5',
    15: 'h-9 w-2.5',
    10: 'h-9 w-2',
    5: 'h-8 w-2',
    2.5: 'h-7 w-1.5',
    1.25: 'h-6 w-1',
    0.5: 'h-5 w-1',
    0.25: 'h-4 w-1',
};

export const getPlatesForDisplay = (totalKg: number, includeCollars: boolean): Plate[] => {
    const barWeight = 20;
    
    if (isNaN(totalKg) || totalKg < barWeight) {
        return [];
    }

    let weightPerSide = (totalKg - barWeight) / 2;

    if (includeCollars) {
        weightPerSide -= 2.5; // Account for one collar on one side
    }

    if (weightPerSide < 0) {
        return []; // Not possible to load this with collars
    }
    
    const plateSet = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25];
    const plates: Plate[] = [];

    for (const plateWeight of plateSet) {
        // Use a tolerance for floating point issues
        const count = Math.floor(weightPerSide / plateWeight + 1e-9);
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                plates.push({
                    weight: plateWeight,
                    color: PLATE_COLORS[plateWeight],
                    size: PLATE_SIZES[plateWeight],
                });
            }
            weightPerSide -= count * plateWeight;
        }
    }
    return plates;
};