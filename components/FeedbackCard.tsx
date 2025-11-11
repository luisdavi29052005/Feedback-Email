import React, { useState } from 'react';
import type { Feedback } from '../types';
import { 
  SmileyIcon, 
  ReplyIcon, 
  MoreIcon, 
  MoreHorizontalIcon, 
  DownloadIcon, 
  EyeIcon, 
  SpinnerIcon, 
  StarIcon,
  AttachmentIcon,
  InfoIcon,
  DriveIcon
} from './Icons';

interface FeedbackCardProps {
  feedback: Feedback;
  isPreview?: boolean;
  onPreview?: (feedback: Feedback) => void;
  onDownload?: (feedback: Feedback) => void;
  isDownloading?: boolean;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ 
  feedback, 
  isPreview = false, 
  onPreview, 
  onDownload, 
  isDownloading = false,
}) => {
  const [isQuotedMessageVisible, setIsQuotedMessageVisible] = useState(false);
  const senderInitial = feedback.senderName ? feedback.senderName.charAt(0).toUpperCase() : '?';
  const senderUsername = feedback.senderName.split(' ')[0].toLowerCase() || 'sender';
  const bodyParagraphs = feedback.body.split('\n').filter(p => p.trim() !== '');

  const isActionDisabled = isDownloading;
  const hasAttachments = feedback.attachments && feedback.attachments.length > 0;
  const hasQuotedMessage = !!feedback.quotedMessage;

  return (
    <div
      data-feedback-id={feedback.id}
      className={`feedback-card w-full font-['Roboto'] flex flex-col bg-white text-gray-800 ${!isPreview ? 'max-w-4xl mx-auto border border-gray-200 p-4 rounded-lg shadow-sm' : 'p-6'}`}
    >
      <div className="flex-grow flex">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={`rounded-full flex items-center justify-center font-medium text-white bg-teal-700 overflow-hidden ${isPreview ? 'w-16 h-16 text-3xl' : 'w-10 h-10 text-xl'}`}
          >
            {feedback.profilePictureUrl ? (
              <img src={feedback.profilePictureUrl} alt={feedback.senderName} className="w-full h-full object-cover" />
            ) : (
              senderInitial
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow pl-3">
          {/* Header Row 1 */}
          <div className="flex justify-between items-start">
            <div className={`text-gray-900 font-bold ${isPreview ? 'text-2xl' : 'text-base'}`}>{senderUsername}</div>
            
            <div className={`flex items-center text-gray-500 ${isPreview ? 'gap-6' : 'gap-4'}`}>
              <div className={`whitespace-nowrap flex items-center ${isPreview ? 'text-xl' : 'text-xs'}`}>
                {hasAttachments && <AttachmentIcon className={`mr-2 stroke-current ${isPreview ? 'h-6 w-6' : 'h-4 w-4'}`} />}
                {feedback.timestamp}
              </div>
              <StarIcon className={`cursor-pointer stroke-current hover:text-gray-900 ${isPreview ? 'h-7 w-7' : 'h-5 w-5'}`} />
              <SmileyIcon className={`cursor-pointer fill-current hover:text-gray-900 ${isPreview ? 'h-7 w-7' : 'h-5 w-5'}`} />
              <ReplyIcon className={`cursor-pointer fill-current hover:text-gray-900 transform -scale-x-100 ${isPreview ? 'h-7 w-7' : 'h-5 w-5'}`} />
              <MoreIcon className={`cursor-pointer fill-current hover:text-gray-900 ${isPreview ? 'h-7 w-7' : 'h-5 w-5'}`} />
            </div>
          </div>
          
          {/* Header Row 2 */}
          <div className={`text-gray-600 ${isPreview ? 'text-xl' : 'text-sm'}`}>para mim &#9662;</div>
          
          {/* Subject */}
          <h3 className={`font-semibold text-gray-900 mt-4 ${isPreview ? 'text-3xl' : 'text-lg'}`}>
            {feedback.subject}
          </h3>

          {/* Body */}
          <div className={`flex-grow space-y-2 mt-2 ${isPreview ? 'text-2xl leading-snug' : 'text-sm leading-relaxed'}`}>
            {bodyParagraphs.map((line, i) => <p key={i}>{line}</p>)}
          </div>
          
          {/* Trimmed content indicator */}
          {hasQuotedMessage && (
            <div className="mt-6">
              <div 
                onClick={() => setIsQuotedMessageVisible(!isQuotedMessageVisible)}
                className={`rounded-full border border-gray-300 inline-flex items-center justify-center cursor-pointer ${isPreview ? 'px-4 py-2' : 'px-3 py-1'}`}
              >
                <MoreHorizontalIcon className={`text-gray-600 ${isPreview ? 'h-6 w-6' : 'h-5 w-5'}`} />
              </div>
              {isQuotedMessageVisible && (
                <div className={`mt-4 p-4 border-l-2 border-gray-300 text-gray-600 bg-gray-50/80 rounded-r-lg ${isPreview ? 'text-xl' : 'text-xs'}`}>
                  <p className="font-medium text-gray-700">Em {feedback.quotedMessage.date}, {feedback.quotedMessage.sender} escreveu:</p>
                  <blockquote className="mt-2 text-gray-500">
                    {feedback.quotedMessage.body.split('\n').map((line, i) => <p key={i} className="italic">{line}</p>)}
                  </blockquote>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {hasAttachments && (
            <div className={`mt-6 pt-4 border-t border-dotted border-gray-300`}>
              <div className={`flex justify-between items-center mb-3 ${isPreview ? 'text-xl' : 'text-sm'}`}>
                <div className="font-bold flex items-center">
                  {feedback.attachments.length} anexo{feedback.attachments.length > 1 ? 's' : ''}
                  <span className="font-normal text-gray-500 ml-2">&bull; Verificado pelo Gmail</span>
                  <InfoIcon className="inline-block h-4 w-4 ml-1 text-gray-500" />
                </div>
                <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                  <DriveIcon className={`fill-current ${isPreview ? 'h-6 w-6' : 'h-5 w-5'}`} />
                  <span>Adicionar ao Drive</span>
                </button>
              </div>
              <div className="flex gap-2">
                {feedback.attachments.map((att, index) => (
                  <div key={index} className={`border border-gray-300 rounded overflow-hidden ${isPreview ? 'w-48 h-40' : 'w-40 h-32'}`}>
                    <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* App-specific Actions */}
      {!isPreview && (
         <div className="border-t border-gray-200 mt-4 pt-3 flex justify-end items-center gap-2">
           <button
             onClick={() => onPreview?.(feedback)}
             disabled={isActionDisabled}
             className="flex items-center gap-2 text-blue-600 hover:text-blue-500 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             aria-label="Pré-visualizar Post"
           >
             <EyeIcon className="h-5 w-5" />
             <span className="text-sm font-medium">Pré-visualizar Post</span>
           </button>
           <button
             onClick={() => onDownload?.(feedback)}
             disabled={isActionDisabled}
             className="flex items-center justify-center w-36 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             aria-label="Baixar Post"
           >
             {isDownloading ? (
               <>
                 <SpinnerIcon className="h-5 w-5 mr-2" />
                 <span>Preparando...</span>
               </>
             ) : (
                <>
                  <DownloadIcon className="h-5 w-5 mr-2" />
                  <span>Baixar</span>
                </>
             )}
           </button>
         </div>
      )}
    </div>
  );
};

export default FeedbackCard;