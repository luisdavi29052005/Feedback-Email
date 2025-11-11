import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateFeedbacks, generateStoryCaption } from './services/geminiService';
import FeedbackCard from './components/FeedbackCard';
import StoryTemplate from './components/StoryTemplate';
import PreviewModal from './components/PreviewModal';
import ScaledPreview from './components/ScaledPreview';
import { SpinnerIcon } from './components/Icons';
import type { Feedback, GeneratedFeedback, ImperfectionsPlan } from './types';

interface StoryData {
  feedback: Feedback;
  caption: string;
}

enum PreviewState {
  Idle,
  Loading,
  Visible,
}

const applyImperfections = (body: string, plan?: ImperfectionsPlan): string => {
  let processedBody = body;

  if (!plan) return processedBody;

  // 1. Apply space glitch
  if (plan.spaceGlitch?.apply) {
    const words = processedBody.split(' ');
    if (words.length > 2) {
      const mergeIndex = Math.floor(Math.random() * (words.length - 2)) + 1;
      words[mergeIndex] = words[mergeIndex] + words[mergeIndex + 1];
      words.splice(mergeIndex + 1, 1);
      processedBody = words.join(' ');
    }
  }

  // 2. Apply typos
  const typoCount = Math.min(plan.typos?.count ?? 0, 2);
  for (let i = 0; i < typoCount; i++) {
    const words = processedBody.split(' ');
    const eligibleWordIndices = words
      .map((word, index) => (word.length > 3 ? index : -1))
      .filter(index => index !== -1);
    
    if (eligibleWordIndices.length > 0) {
      const wordIndex = eligibleWordIndices[Math.floor(Math.random() * eligibleWordIndices.length)];
      const word = words[wordIndex];
      const chars = word.split('');
      
      const swapIndex = Math.floor(Math.random() * (word.length - 1));
      [chars[swapIndex], chars[swapIndex + 1]] = [chars[swapIndex + 1], chars[swapIndex]];
      
      words[wordIndex] = chars.join('');
      processedBody = words.join(' ');
    }
  }

  return processedBody;
};

const getPlaceholderTimestamp = (): string => {
  const now = new Date();
  // Go back 2 days and some random hours/minutes for realism
  now.setDate(now.getDate() - 2);
  now.setHours(now.getHours() - Math.floor(Math.random() * 5));
  now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 59));

  const month = now.toLocaleString('pt-BR', { month: 'short' });
  const day = now.getDate();
  const year = now.getFullYear();
  const time = now.toLocaleTimeString('pt-BR', { hour: 'numeric', minute: '2-digit', hour12: false });

  return `${day} de ${month} de ${year}, ${time} (há 2 dias)`;
};

const placeholderImageBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIbGNtcwIQAABtbnRyUkdCIFhZWiAH4gADABQACQAOAB1hY3NwTVNGVAAAAABzYXJhAAAAAAAAAAAAAAAAAAAAAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAEsAdoDASIAAhEBAxEB/8QAGwABAQACAwEAAAAAAAAAAAAAAAEGBwIDBAX/xABBEAABAwMBBAUJBQUGBwAAAAABAAIDBAUREgYhMRNBUWFxBxQiMoGRobHB0SThFRYjM0JScuHwJENTY4KSokOissL/xAAZAQEBAQEBAQAAAAAAAAAAAAAAAQIDBAX/xAAjEQEBAQEAAgICAwEBAQEAAAAAAQIRITERAzJBUQQiYUFx/9gAAMAwAAhEDEQA/APqUREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQERE... ";

const placeholderFeedback: Feedback = {
  id: 'preview-1',
  senderName: 'eleanor',
  timestamp: getPlaceholderTimestamp(),
  subject: "Re: A restauração da sua foto está completa!",
  body: "Minha avó literalmente chorou quando viu a foto do casamento dela restaurada! Ela ficava dizendo que parecia exatamente como no dia em que se casou, Davi. Já está em uma moldura nova na lareira dela.",
  quotedMessage: {
    sender: "Ferrer Studio",
    date: "Seg, 9 de nov de 2025 às 11:02",
    body: "Oi Eleanor, fico feliz em informar que terminei de restaurar a foto da sua avó. Você pode encontrar o arquivo em anexo."
  }
};

const placeholderFeedbackWithAttachment: Feedback = {
  id: 'preview-2',
  senderName: 'siegeld',
  timestamp: 'Qui, 6 de nov de 2025, 16:37 (há 4 dias)',
  subject: "Edições do conjunto de fotos de 1950",
  body: "Na #8 Deixe minha barba mais branca.\nNa #10 O rosto da esposa não está bom. Talvez o anexo seja melhor?\nNa #9 Deixe os dois rostos mais claros. Muito sombreados.\n\nEnviado do meu dispositivo 5G da T-Mobile",
  attachments: [{ url: placeholderImageBase64, name: 'anexo.jpg' }],
  profilePictureUrl: 'data:image/png;base64,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'
};

const placeholders = [placeholderFeedback, placeholderFeedbackWithAttachment];

const App: React.FC = () => {
  const [profileName, setProfileName] = useState<string>('Duda Ferrer');
  const [profileHandle, setProfileHandle] = useState<string>('@_duda_ferrer_');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'generating' | 'zipping'>('idle');
  const [storiesToZip, setStoriesToZip] = useState<StoryData[] | null>(null);
  const [singleStoryToDownload, setSingleStoryToDownload] = useState<StoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackCount, setFeedbackCount] = useState<number>(10);
  const [downloadingCardId, setDownloadingCardId] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState>(PreviewState.Idle);
  const [storyForPreview, setStoryForPreview] = useState<StoryData | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [livePreviewCaption, setLivePreviewCaption] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(true);
  
  const [b2bPercentage, setB2bPercentage] = useState(40);
  const [requestPercentage, setRequestPercentage] = useState(20);
  const [attachmentPercentage, setAttachmentPercentage] = useState(20);

  useEffect(() => {
    const generatePreviewCaption = async () => {
        try {
            setIsPreviewLoading(true);
            const caption = await generateStoryCaption(placeholders[currentPlaceholderIndex]);
            setLivePreviewCaption(caption);
        } catch (err) {
            console.error("Failed to generate live preview caption:", err);
            setLivePreviewCaption("É uma honra ajudar a trazer memórias queridas de volta à vida.");
        } finally {
            setIsPreviewLoading(false);
        }
    };
    generatePreviewCaption();
  }, [currentPlaceholderIndex]);

  useEffect(() => {
    const intervalId = setInterval(() => {
        setCurrentPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 7000); // Change every 7 seconds
    return () => clearInterval(intervalId);
  }, []);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePicture(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateFeedbacks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFeedbacks([]);
    try {
      const generated = await generateFeedbacks(
        feedbackCount,
        b2bPercentage,
        requestPercentage,
        attachmentPercentage
      );
      const newFeedbacks: Feedback[] = generated.map((fb: GeneratedFeedback, index: number) => ({
        id: `${Date.now()}-${index}`,
        senderName: fb.senderName,
        timestamp: fb.timestamp,
        body: applyImperfections(fb.body, fb.imperfectionsPlan),
        profilePictureUrl: fb.profilePictureUrl,
        attachments: fb.attachments,
        subject: fb.subject,
        quotedMessage: fb.quotedMessage,
      }));
      setFeedbacks(newFeedbacks);
    } catch (e: any) {
      setError(e.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  }, [feedbackCount, b2bPercentage, requestPercentage, attachmentPercentage]);

  const handleDownloadSingleStory = async (feedback: Feedback) => {
    if (downloadingCardId || downloadStatus !== 'idle') return;
    setDownloadingCardId(feedback.id);
    setError(null);
    try {
        const caption = await generateStoryCaption(feedback);
        setSingleStoryToDownload({ feedback, caption });
    } catch (e: any) {
        setError(e.message || "Falha ao gerar legenda de IA para download.");
        setDownloadingCardId(null);
    }
  };

  const handlePreviewStory = async (feedback: Feedback) => {
    if (previewState !== PreviewState.Idle) return;
    setPreviewState(PreviewState.Loading);
    setError(null);
    try {
        const caption = await generateStoryCaption(feedback);
        setStoryForPreview({ feedback, caption });
        setPreviewState(PreviewState.Visible);
    } catch (e: any) {
        setError(e.message || "Falha ao gerar legenda de IA para pré-visualização.");
        setPreviewState(PreviewState.Idle);
    }
  };

  const closePreview = () => {
    setPreviewState(PreviewState.Idle);
    setStoryForPreview(null);
  };

  useEffect(() => {
    if (!singleStoryToDownload) return;

    const renderAndDownload = async () => {
      const html2canvas = (window as any).html2canvas;
      if (!html2canvas) {
          setError("Biblioteca necessária (html2canvas) não encontrada.");
          setDownloadingCardId(null);
          setSingleStoryToDownload(null);
          return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));

      try {
        const storyElement = document.getElementById(`story-render-target-${singleStoryToDownload.feedback.id}`);
        if (storyElement) {
            const canvas = await html2canvas(storyElement, {
                width: 1080,
                height: 1920,
                scale: 1,
            });
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if(blob) {
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `post-${singleStoryToDownload.feedback.senderName.replace(/\s/g, '_')}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(link.href);
            }
        } else {
          throw new Error("Não foi possível encontrar o elemento da história renderizada.");
        }
      } catch(e: any) {
        setError(e.message || "Falha ao criar a imagem da história.");
      } finally {
        setSingleStoryToDownload(null);
        setDownloadingCardId(null);
      }
    };
    renderAndDownload();
  }, [singleStoryToDownload]);
  
  useEffect(() => {
    if (!storiesToZip) return;

    const renderAndZipStories = async () => {
      const html2canvas = (window as any).html2canvas;
      const JSZip = (window as any).JSZip;

      if (!html2canvas || !JSZip) {
          setError("Biblioteca necessária (html2canvas/JSZip) não encontrada.");
          setDownloadStatus('idle');
          setStoriesToZip(null);
          return;
      }
      
      setDownloadStatus('zipping');
      await new Promise(resolve => setTimeout(resolve, 200));
      const zip = new JSZip();

      try {
        for (const storyData of storiesToZip) {
          const storyElement = document.getElementById(`story-render-target-${storyData.feedback.id}`);
          if (storyElement) {
              const canvas = await html2canvas(storyElement, { width: 1080, height: 1920, scale: 1 });
              const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
              if(blob) zip.file(`post-${storyData.feedback.senderName.replace(/\s/g, '_')}.png`, blob);
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'feedback_posts.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

      } catch (e: any) {
          setError(e.message || "Falha ao criar o ZIP das imagens das histórias.");
      } finally {
          setStoriesToZip(null);
          setDownloadStatus('idle');
      }
    };

    renderAndZipStories();
  }, [storiesToZip]);

  const handleDownloadAllStories = async () => {
    if (feedbacks.length === 0 || downloadStatus !== 'idle' || downloadingCardId) return;
    setDownloadStatus('generating');
    setError(null);
    setDownloadProgress('');
    try {
      const storiesData: StoryData[] = [];
      for (let i = 0; i < feedbacks.length; i++) {
        const fb = feedbacks[i];
        setDownloadProgress(`(${i + 1}/${feedbacks.length})`);
        const caption = await generateStoryCaption(fb);
        storiesData.push({ feedback: fb, caption });
      }
      setStoriesToZip(storiesData);
      setDownloadProgress('');
    } catch (e: any) {
        setError(e.message || "Falha ao gerar legendas de IA para o ZIP.");
        setDownloadStatus('idle');
        setDownloadProgress('');
    }
  };

  const isProcessing = isLoading || downloadStatus !== 'idle' || !!downloadingCardId;

  const downloadButtonText = {
      idle: 'Baixar Todos os Posts (.zip)',
      generating: `Gerando Legendas... ${downloadProgress}`,
      zipping: 'Compactando Arquivos...',
  };

  return (
    <div className="min-h-screen container mx-auto p-4 sm:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
          Gerador de Feedback com IA
        </h1>
        <p className="mt-2 text-lg text-gray-400 max-w-2xl mx-auto">
          Crie postagens realistas para redes sociais a partir de feedbacks de e-mail. Gere até 100 de uma vez e baixe-os como PNGs.
        </p>
      </header>

      <main className="space-y-12">
        {/* Step 1: Customization */}
        <section>
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-300">Passo 1: Personalize Seu Modelo de Postagem</h2>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#202124] p-6 rounded-lg shadow-lg">
            {/* Left: Controls */}
            <div className="space-y-6">
              <div>
                <label htmlFor="profileName" className="block text-sm font-medium text-gray-300 mb-2">Nome do Perfil</label>
                <input
                  id="profileName"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="profileHandle" className="block text-sm font-medium text-gray-300 mb-2">Usuário do Perfil</label>
                <input
                  id="profileHandle"
                  type="text"
                  value={profileHandle}
                  onChange={(e) => setProfileHandle(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-300 mb-2">Foto do Perfil</span>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full group bg-gray-700 flex-shrink-0">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile Preview" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </div>
                    )}
                    <label htmlFor="profile-picture-upload" className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      Alterar
                    </label>
                    <input id="profile-picture-upload" type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />
                  </div>
                  <p className="text-sm text-gray-400">Envie uma imagem quadrada para o melhor resultado. Isso será usado em todas as postagens geradas.</p>
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="w-full">
              <p className="text-sm font-medium text-gray-300 mb-2 text-center">Pré-visualização ao Vivo</p>
               <ScaledPreview
                  aspectRatio="1080 / 1920"
                  contentWidth={1080}
                  contentHeight={1920}
                  className="rounded-md bg-black/20 ring-1 ring-white/10"
                >
                {isPreviewLoading ? (
                    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white">
                      <SpinnerIcon className="h-24 w-24 mb-6" />
                      <p className="text-4xl">Carregando Pré-visualização...</p>
                    </div>
                  ) : (
                    <StoryTemplate
                      id="live-preview-story"
                      feedback={placeholders[currentPlaceholderIndex]}
                      profileName={profileName}
                      profileHandle={profileHandle}
                      profilePictureUrl={profilePicture}
                      caption={livePreviewCaption || ''}
                    />
                  )
                }
              </ScaledPreview>
            </div>
          </div>
        </section>
        
        {/* Step 2: Generation */}
        <section>
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-300">Passo 2: Gerar Feedbacks</h2>
           <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm py-4">
              <div className="max-w-3xl mx-auto bg-[#202124] p-4 rounded-lg shadow-lg space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-gray-300">
                    <div>
                        <label htmlFor="b2bPercentage" className="text-sm font-medium">Clientes B2B ({b2bPercentage}%)</label>
                        <input id="b2bPercentage" type="range" min="0" max="100" value={b2bPercentage} onChange={e => setB2bPercentage(Number(e.target.value))} className="w-full" />
                    </div>
                    <div>
                        <label htmlFor="requestPercentage" className="text-sm font-medium">Pedidos de Edição ({requestPercentage}%)</label>
                        <input id="requestPercentage" type="range" min="0" max="100" value={requestPercentage} onChange={e => setRequestPercentage(Number(e.target.value))} className="w-full" />
                    </div>
                    <div>
                        <label htmlFor="attachmentPercentage" className="text-sm font-medium">Com Anexos ({attachmentPercentage}%)</label>
                        <input id="attachmentPercentage" type="range" min="0" max="100" value={attachmentPercentage} onChange={e => setAttachmentPercentage(Number(e.target.value))} className="w-full" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label htmlFor="feedbackCount" className="font-semibold text-gray-300 whitespace-nowrap">Gerar:</label>
                      <input
                        id="feedbackCount"
                        type="number"
                        min="1"
                        max="100"
                        value={feedbackCount}
                        onChange={(e) => setFeedbackCount(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                        className="bg-gray-700 text-white rounded-md p-2 w-20 text-center focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                      <span className="font-semibold text-gray-300 whitespace-nowrap">feedbacks</span>
                    </div>
                  
                    <button
                      onClick={handleGenerateFeedbacks}
                      disabled={isProcessing}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <><SpinnerIcon className="h-5 w-5"/> Gerando...</> : '✨ Gerar'}
                    </button>
                    <button
                      onClick={handleDownloadAllStories}
                      disabled={isProcessing || feedbacks.length === 0}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadStatus !== 'idle' && <SpinnerIcon className="h-5 w-5"/>}
                      {downloadButtonText[downloadStatus]}
                    </button>
                </div>
            </div>
          </div>
        </section>
        
        {error && (
          <div className="max-w-3xl mx-auto bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg text-center">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {/* Step 3: Results */}
        <section>
          {isLoading && (
            <div className="text-center text-gray-400 flex flex-col items-center gap-4 py-16">
              <SpinnerIcon className="h-12 w-12"/>
              <p className="text-xl">Gerando feedbacks incríveis com a IA...</p>
            </div>
          )}
          {!isLoading && feedbacks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <h2 className="text-2xl font-semibold text-gray-300 mb-4">Seus Feedbacks Gerados Aparecerão Aqui</h2>
              <p className="text-gray-400">Após personalizar seu modelo, use o gerador acima para criar suas mensagens de feedback.</p>
            </div>
          )}
          {feedbacks.length > 0 && (
             <div className="space-y-4">
               <h2 className="text-2xl font-bold text-center text-gray-300">Passo 3: Seus Feedbacks</h2>
                {feedbacks.map((feedback) => (
                  <FeedbackCard 
                    key={feedback.id} 
                    feedback={feedback}
                    onPreview={handlePreviewStory}
                    onDownload={handleDownloadSingleStory}
                    isDownloading={downloadingCardId === feedback.id}
                  />
                ))}
            </div>
          )}
        </section>
      </main>
      
      {(storiesToZip || singleStoryToDownload) && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
          {storiesToZip?.map(storyData => (
            <div key={storyData.feedback.id} style={{ width: 1080, height: 1920 }}>
              <StoryTemplate
                id={`story-render-target-${storyData.feedback.id}`}
                feedback={storyData.feedback}
                profileName={profileName}
                profileHandle={profileHandle}
                profilePictureUrl={profilePicture}
                caption={storyData.caption}
              />
            </div>
          ))}
          {singleStoryToDownload && (
            <div style={{ width: 1080, height: 1920 }}>
               <StoryTemplate
                key={singleStoryToDownload.feedback.id}
                id={`story-render-target-${singleStoryToDownload.feedback.id}`}
                feedback={singleStoryToDownload.feedback}
                profileName={profileName}
                profileHandle={profileHandle}
                profilePictureUrl={profilePicture}
                caption={singleStoryToDownload.caption}
              />
            </div>
          )}
        </div>
      )}

      {previewState !== PreviewState.Idle && (
        <PreviewModal
            isLoading={previewState === PreviewState.Loading}
            storyData={storyForPreview}
            onClose={closePreview}
            profileName={profileName}
            profileHandle={profileHandle}
            profilePictureUrl={profilePicture}
        />
      )}
    </div>
  );
};

export default App;