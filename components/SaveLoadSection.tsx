import React from 'react';
import type { AppState } from '../types';

interface SaveLoadSectionProps {
  planName: string;
  setPlanName: (name: string) => void;
  handleSavePlan: () => void;
  savedPlans: Record<string, AppState>;
  selectedPlan: string;
  setSelectedPlan: (name: string) => void;
  handleLoadPlan: () => void;
  handleDeletePlan: () => void;
  feedbackMessage: string;
}

const SaveLoadSection: React.FC<SaveLoadSectionProps> = ({
  planName,
  setPlanName,
  handleSavePlan,
  savedPlans,
  selectedPlan,
  setSelectedPlan,
  handleLoadPlan,
  handleDeletePlan,
  feedbackMessage,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex justify-between items-center mb-4 border-b pb-2 border-slate-200">
        <h3 className="text-xl font-bold text-slate-700">
          Save & Load Plans
        </h3>
      </div>
      <div className="flex flex-col gap-6">
        {/* Save Plan */}
        <div className="flex flex-col gap-2">
          <label htmlFor="planName" className="text-sm font-medium text-slate-700 text-center">Save Current Plan</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="planName"
              type="text"
              placeholder="Enter plan name (e.g., Nationals Prep)"
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              className="flex-grow text-center sm:text-left p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50"
            />
            <button
              onClick={handleSavePlan}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-md shadow-sm transition-colors"
            >
              Save Plan
            </button>
          </div>
        </div>

        {/* Load/Delete Plan */}
        <div className="flex flex-col gap-2">
          <label htmlFor="selectPlan" className="text-sm font-medium text-slate-700 text-center">Load or Delete a Saved Plan</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              id="selectPlan"
              value={selectedPlan}
              onChange={e => setSelectedPlan(e.target.value)}
              className="flex-grow p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50"
              disabled={Object.keys(savedPlans).length === 0}
            >
              {Object.keys(savedPlans).length > 0 ? (
                Object.keys(savedPlans).map(name => <option key={name} value={name}>{name}</option>)
              ) : (
                <option>No saved plans found</option>
              )}
            </select>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleLoadPlan}
                className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md shadow-sm transition-colors disabled:bg-slate-400"
                disabled={!selectedPlan}
              >
                Load
              </button>
              <button
                onClick={handleDeletePlan}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-sm transition-colors disabled:bg-slate-400"
                disabled={!selectedPlan}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMessage &&
          <div className="text-center text-green-700 font-semibold transition-opacity duration-300">
            {feedbackMessage}
          </div>
        }
      </div>
    </div>
  );
};

export default SaveLoadSection;
