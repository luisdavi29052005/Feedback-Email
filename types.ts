export interface ImperfectionsPlan {
  typos?: { count: number };
  spaceGlitch?: { apply: boolean };
}

export interface QuotedMessage {
  sender: string;
  date: string;
  body: string;
}

export interface GeneratedFeedback {
  senderName: string;
  body: string;
  timestamp: string;
  subject: string;
  imperfectionsPlan?: ImperfectionsPlan;
  profilePictureUrl?: string;
  attachmentCount?: { count: number };
  attachments?: { url: string; name: string; }[];
  quotedMessage?: QuotedMessage;
}

export interface Feedback {
  id: string;
  senderName: string;
  body: string;
  timestamp: string;
  subject: string;
  profilePictureUrl?: string;
  attachments?: { url: string; name: string; }[];
  quotedMessage?: QuotedMessage;
}