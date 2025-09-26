import React, { useState, useEffect, useCallback } from 'react';
import Section from './components/Section';
import LiftSection from './components/LiftSection';
import { calculateAttempts, generateWarmups } from './utils/calculator';
import { exportToCSV, exportToPDF, exportToMobilePDF } from './utils/exportHandler';
import type { AppState, LiftType, CompetitionDetails, EquipmentSettings } from './types';

const initialAppState: AppState = {
  details: {
    eventName: '', lifterName: '', weightClass: '', competitionDate: '', weighInTime: '',
  },
  equipment: {
    squatRackHeight: '', squatStands: '', benchRackHeight: '', handOut: '', benchSafetyHeight: '',
  },
  lifts: {
    squat: { attempts: { '1': '', '2': '', '3': '' }, warmups: Array(8).fill({ weight: '', reps: '' }), cues: ['', '', ''], error: false, includeCollars: false },
    bench: { attempts: { '1': '', '2': '', '3': '' }, warmups: Array(8).fill({ weight: '', reps: '' }), cues: ['', '', ''], error: false, includeCollars: false },
    deadlift: { attempts: { '1': '', '2': '', '3': '' }, warmups: Array(8).fill({ weight: '', reps: '' }), cues: ['', '', ''], error: false, includeCollars: false },
  },
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  useEffect(() => {
    try {
      const savedDetails = localStorage.getItem('plp_details');
      const savedEquipment = localStorage.getItem('plp_equipment');
      
      const details = savedDetails ? JSON.parse(savedDetails) : initialAppState.details;
      const equipment = savedEquipment ? JSON.parse(savedEquipment) : initialAppState.equipment;

      setAppState(prev => ({ ...prev, details, equipment }));

    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  const handleDetailChange = (field: keyof CompetitionDetails, value: string) => {
    setAppState(prev => {
      const newDetails = { ...prev.details, [field]: value };
      localStorage.setItem('plp_details', JSON.stringify(newDetails));
      return { ...prev, details: newDetails };
    });
  };
  
  const handleEquipmentChange = (field: keyof EquipmentSettings, value: string) => {
    setAppState(prev => {
      const newEquipment = { ...prev.equipment, [field]: value };
      localStorage.setItem('plp_equipment', JSON.stringify(newEquipment));
      return { ...prev, equipment: newEquipment };
    });
  };

  const handleAttemptChange = (lift: LiftType, attempt: '1' | '2' | '3', value: string) => {
    setAppState(prev => ({
      ...prev,
      lifts: {
        ...prev.lifts,
        [lift]: {
          ...prev.lifts[lift],
          attempts: { ...prev.lifts[lift].attempts, [attempt]: value },
          error: false,
        },
      },
    }));
  };
  
  const handleWarmupChange = (lift: LiftType, index: number, field: 'weight' | 'reps', value: string) => {
    setAppState(prev => {
        const newWarmups = [...prev.lifts[lift].warmups];
        newWarmups[index] = {...newWarmups[index], [field]: value};
        return {
            ...prev,
            lifts: {
                ...prev.lifts,
                [lift]: {
                    ...prev.lifts[lift],
                    warmups: newWarmups
                }
            }
        };
    });
  };

  const handleCueChange = (lift: LiftType, index: number, value: string) => {
    setAppState(prev => {
        const newCues = [...prev.lifts[lift].cues];
        newCues[index] = value;
        return {
            ...prev,
            lifts: {
                ...prev.lifts,
                [lift]: {
                    ...prev.lifts[lift],
                    cues: newCues
                }
            }
        };
    });
  };

  const handleCollarToggle = (lift: LiftType) => {
    setAppState(prev => ({
        ...prev,
        lifts: {
            ...prev.lifts,
            [lift]: {
                ...prev.lifts[lift],
                includeCollars: !prev.lifts[lift].includeCollars,
            }
        }
    }));
};

  const handleCalculateAttempts = useCallback((lift: LiftType) => {
    setAppState(prev => {
      const currentAttempts = prev.lifts[lift].attempts;
      const newAttempts = calculateAttempts(lift, currentAttempts);
      if (newAttempts) {
        return { ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], attempts: newAttempts, error: false } } };
      }
      return { ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], error: true } } };
    });
  }, []);

  const handleGenerateWarmups = useCallback((lift: LiftType) => {
    setAppState(prev => {
      const opener = prev.lifts[lift].attempts['1'];
      if (!opener) {
        return { ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], error: true } } };
      }
      const newWarmups = generateWarmups(lift, opener);
      if (newWarmups) {
        return { ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], warmups: newWarmups, error: false } } };
      }
      return prev;
    });
  }, []);

  const handleReset = useCallback((lift: LiftType) => {
    setAppState(prev => ({
      ...prev,
      lifts: {
        ...prev.lifts,
        [lift]: {
          ...initialAppState.lifts[lift],
          cues: ['', '', ''], // Explicitly reset cues
        }
      }
    }));
  }, []);
  

  const handleFullReset = useCallback(() => {
    setAppState(initialAppState);
    localStorage.removeItem('plp_details');
    localStorage.removeItem('plp_equipment');
    setIsResetModalOpen(false);
  }, []);

  const renderFormGroup = (label: string, id: keyof CompetitionDetails | keyof EquipmentSettings, placeholder: string, type: string = "text") => {
    const value = id in appState.details ? appState.details[id as keyof CompetitionDetails] : appState.equipment[id as keyof EquipmentSettings];
    
    return (
        <div className="flex flex-col">
            <label htmlFor={id} className="mb-1 text-sm font-medium text-slate-700 text-center">{label}</label>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={e => {
                  if (id in appState.details) {
                    handleDetailChange(id as keyof CompetitionDetails, e.target.value);
                  } else {
                    handleEquipmentChange(id as keyof EquipmentSettings, e.target.value);
                  }
                }}
                className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400"
            />
        </div>
    );
  };
  
    const renderSelectGroup = (label: string, id: keyof EquipmentSettings, options: string[]) => {
      return (
        <div className="flex flex-col">
          <label htmlFor={id} className="mb-1 text-sm font-medium text-slate-700 text-center">{label}</label>
          <select
            id={id}
            value={appState.equipment[id]}
            onChange={e => handleEquipmentChange(id, e.target.value)}
            className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-600"
          >
            <option value="">Select option</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    };

  return (
    <div className="font-sans max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="bg-slate-900 text-white p-6 rounded-lg shadow-xl mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">POWERLIFTING MEET PLANNER</h1>
        <p className="text-slate-300 mt-1">Strategize Your Game Day Performance</p>
      </header>

      <main>
        <Section 
          title="Competition Details"
          headerAction={
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-sm transition-colors"
              aria-label="Reset the entire form"
            >
              Reset Form
            </button>
          }
        >
          {renderFormGroup("Event Name", "eventName", "e.g., National Championship")}
          {renderFormGroup("Lifter Name", "lifterName", "Enter your name")}
          {renderFormGroup("Weight Class", "weightClass", "e.g., 83kg")}
          {renderFormGroup("Competition Date", "competitionDate", "", "date")}
          {renderFormGroup("Weigh-in Time", "weighInTime", "", "time")}
        </Section>

        <Section title="Equipment Settings">
          {renderFormGroup("Squat Rack Height", "squatRackHeight", "e.g., 5")}
          {renderSelectGroup("Squat Stands", "squatStands", ["IN", "OUT", "LEFT IN", "RIGHT IN"])}
          {renderFormGroup("Bench Rack Height", "benchRackHeight", "e.g., 3")}
          {renderSelectGroup("Hand Out", "handOut", ["Yes", "Self"])}
          {renderFormGroup("Bench Safety Height", "benchSafetyHeight", "e.g., 2")}
        </Section>

        {(Object.keys(appState.lifts) as LiftType[]).map(liftKey => (
            <LiftSection
                key={liftKey}
                liftType={liftKey}
                liftState={appState.lifts[liftKey]}
                onAttemptChange={handleAttemptChange}
                onWarmupChange={handleWarmupChange}
                onCueChange={handleCueChange}
                onCalculateAttempts={handleCalculateAttempts}
                onGenerateWarmups={handleGenerateWarmups}
                onReset={handleReset}
                onCollarToggle={handleCollarToggle}
            />
        ))}

        <div className="bg-white p-6 rounded-lg shadow-md mt-8 flex flex-wrap justify-center gap-4">
            <button onClick={() => exportToPDF(appState)} className="flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">
                <span role="img" aria-label="pdf">🧾</span> Export PDF
            </button>
             <button onClick={() => exportToMobilePDF(appState)} className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">
                <span role="img" aria-label="mobile">📱</span> Export Mobile PDF
            </button>
            <button onClick={() => exportToCSV(appState)} className="flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">
                <span role="img" aria-label="csv">📥</span> Export CSV
            </button>
        </div>
      </main>

      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center transform transition-all duration-300 scale-100">
            <h2 id="reset-modal-title" className="text-2xl font-bold text-slate-800 mb-4">Confirm Reset</h2>
            <p className="text-slate-600 mb-6">Are you sure? This will clear all current entries in the form.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFullReset}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;