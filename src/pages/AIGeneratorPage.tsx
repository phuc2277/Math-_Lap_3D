import React from 'react';
import { AIGeneratorPanel } from '../components/ai/AIGeneratorPanel';
import { GeneratedExperiment } from '../models/AIGenerator';

interface AIGeneratorPageProps {
  onPublishExperiment?: (experiment: GeneratedExperiment) => void;
}

export const AIGeneratorPage: React.FC<AIGeneratorPageProps> = ({
  onPublishExperiment,
}) => {
  return (
    <div className="pb-12">
      <AIGeneratorPanel onPublishExperiment={onPublishExperiment} />
    </div>
  );
};

export default AIGeneratorPage;
