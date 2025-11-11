import React from 'react';
import type { Feedback } from '../types';
import FeedbackCard from './FeedbackCard';

interface StoryTemplateProps {
  feedback: Feedback;
  id: string;
  profileName: string;
  profileHandle: string;
  profilePictureUrl: string | null;
  caption: string;
}

const StoryTemplate: React.FC<StoryTemplateProps> = ({ feedback, id, profileName, profileHandle, profilePictureUrl, caption }) => {
  return (
    <div
      id={id}
      className="w-full h-full bg-white flex items-center justify-center font-['Roboto'] p-12"
    >
      <div className="w-full bg-white p-8 flex flex-col gap-8 text-left">
        {/* Header */}
        <div className="flex items-center gap-8">
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
          )}
          <div>
            <h2 className="text-6xl font-bold text-black">{profileName}</h2>
            <p className="text-5xl text-gray-500">{profileHandle}</p>
          </div>
        </div>
        
        <p className="text-5xl text-black leading-tight">
          {caption}
        </p>

        <div className="rounded-3xl border-4 border-gray-200 overflow-hidden mt-4">
            <FeedbackCard feedback={feedback} isPreview={true} />
        </div>
      </div>
    </div>
  );
};

export default StoryTemplate;