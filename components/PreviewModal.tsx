import React, { useEffect } from 'react';
import StoryTemplate from './StoryTemplate';
import ScaledPreview from './ScaledPreview';
import { SpinnerIcon, XIcon } from './Icons';
import type { Feedback } from '../types';

interface StoryData {
  feedback: Feedback;
  caption: string;
}

interface PreviewModalProps {
  storyData: StoryData | null;
  isLoading: boolean;
  onClose: () => void;
  profileName: string;
  profileHandle: string;
  profilePictureUrl: string | null;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ storyData, isLoading, onClose, profileName, profileHandle, profilePictureUrl }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-transparent rounded-lg shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 text-white/70 hover:text-white z-10 p-2 bg-black/50 rounded-full transition-colors"
          aria-label="Fechar pré-visualização"
        >
          <XIcon className="h-6 w-6" />
        </button>

        <ScaledPreview
          aspectRatio="1080 / 1920"
          contentWidth={1080}
          contentHeight={1920}
          className="rounded-md"
        >
          {isLoading && (
              <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white">
                <SpinnerIcon className="h-24 w-24 mb-6" />
                <p className="text-4xl">Gerando Pré-visualização...</p>
              </div>
          )}
          {storyData && !isLoading && (
              <StoryTemplate 
                  id={`story-preview-${storyData.feedback.id}`}
                  feedback={storyData.feedback}
                  profileName={profileName}
                  profileHandle={profileHandle}
                  profilePictureUrl={profilePictureUrl}
                  caption={storyData.caption}
              />
          )}
        </ScaledPreview>
      </div>
       <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
      `}</style>
    </div>
  );
};

export default PreviewModal;