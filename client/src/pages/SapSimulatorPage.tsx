import React from 'react';
import { SapSimulator } from '../components/SapSimulator';

export const SapSimulatorPage: React.FC<{ onInspectionCreated?: () => void }> = ({ onInspectionCreated }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <SapSimulator onInspectionCreated={onInspectionCreated} />
    </div>
  );
};

