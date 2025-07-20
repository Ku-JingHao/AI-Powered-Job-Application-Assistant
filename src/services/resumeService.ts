import axios from 'axios';

const API_URL = 'http://localhost:8000/api/resume/';

/**
 * Interface for resume analysis results
 */
export interface ResumeAnalysisResult {
  keywordsToAdd: string[];
  keywordsToRemove: string[];
  formatSuggestions?: string[];
  contentSuggestions: string[];
  matchScore: number;
  technicalSkillsMatch?: {
    inJob: string[];
    inResume: string[];
    missing: string[];
  };
  softSkillsMatch?: {
    inJob: string[];
    inResume: string[];
    missing: string[];
  };
  sentimentAnalysis?: {
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

/**
 * Uploads resume and job description files to the API for analysis
 */
export const analyzeResume = async (
  resumeFile: File, 
  jobDescFile: File
): Promise<ResumeAnalysisResult> => {
  const formData = new FormData();
  formData.append('resume_file', resumeFile);
  formData.append('job_desc_file', jobDescFile);

  try {
    const response = await axios.post<ResumeAnalysisResult>(
      `${API_URL}analyze/`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    // Add debug logging
    console.log("Full API response:", response.data);
    console.log("Sentiment Analysis in response:", response.data.sentimentAnalysis);
    
    return response.data;
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
};

/**
 * Get all resumes for the authenticated user
 */
export const getUserResumes = async () => {
  try {
    const response = await axios.get(`${API_URL}resumes/`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user resumes:', error);
    throw error;
  }
};

/**
 * Get all job descriptions for the authenticated user
 */
export const getUserJobDescriptions = async () => {
  try {
    const response = await axios.get(`${API_URL}job-descriptions/`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
    throw error;
  }
};

/**
 * Get all resume analyses for the authenticated user
 */
export const getUserAnalyses = async () => {
  try {
    const response = await axios.get(`${API_URL}analyses/`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching resume analyses:', error);
    throw error;
  }
};

/**
 * Send a message to the interview chatbot and get a response
 */
export interface ChatResponse {
  message: string;
  session_id: string;
}

export const sendChatMessage = async (
  message: string, 
  sessionId?: string
): Promise<ChatResponse> => {
  try {
    const response = await axios.post<ChatResponse>(
      `${API_URL}interview/chat/`, 
      {
        message,
        session_id: sessionId || ''
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

/**
 * Get chatbot FAQ topics
 */
export interface FAQTopicsResponse {
  topics: string[];
}

export const getChatbotFAQTopics = async (): Promise<FAQTopicsResponse> => {
  try {
    const response = await axios.get<FAQTopicsResponse>(
      `${API_URL}interview/faq-topics/`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching FAQ topics:', error);
    throw error;
  }
};

/**
 * Get chat history for a specific session
 */
export interface ChatMessage {
  id: number;
  user: number;
  message: string;
  is_user: boolean;
  timestamp: string;
  session_id: string;
}

export const getChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const response = await axios.get<ChatMessage[]>(
      `${API_URL}interview/history/?session_id=${sessionId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

/**
 * Get all chat sessions for the authenticated user
 */
export interface ChatSession {
  session_id: string;
  title: string;
  last_updated: string;
}

export const getChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await axios.get<ChatSession[]>(
      `${API_URL}interview/sessions/`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    throw error;
  }
}; 