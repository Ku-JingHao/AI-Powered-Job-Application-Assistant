import axios from 'axios';

// Define interfaces for type safety
interface SpeechRecognitionCallbacks {
  onRecognizing: (text: string) => void;
  onRecognized: (text: string) => void;
  onError: (error: string) => void;
}

interface SpeechRecognitionControls {
  startRecognition: () => void;
  stopRecognition: () => void;
}

// Define interfaces for Speech SDK types to avoid compilation errors
interface SpeechRecognitionEventArgs {
  result: {
    text: string;
  };
}

interface SpeechRecognitionCanceledEventArgs {
  errorCode: number;
  errorDetails: string;
}

// Azure Speech Services configuration
const AZURE_SPEECH_KEY = "";
const AZURE_SPEECH_ENDPOINT = "";
const SPEECH_TO_TEXT_URL = `${AZURE_SPEECH_ENDPOINT}sts/v1.0/issuetoken`;

/**
 * Get an access token for Azure Speech Services
 */
export const getSpeechToken = async (): Promise<string> => {
  try {
    const response = await axios.post(SPEECH_TO_TEXT_URL, null, {
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting Azure Speech token:', error);
    throw new Error('Failed to get speech token. Please check Azure credentials.');
  }
};

/**
 * Initialize Speech SDK for browser use
 * This must be called from a component
 */
export const initSpeechRecognition = async (
  onRecognizing: (text: string) => void,
  onRecognized: (text: string) => void,
  onError: (error: string) => void
): Promise<SpeechRecognitionControls> => {
  // Try using the browser's native SpeechRecognition first if available
  try {
    // Check if browser supports the Web Speech API
    const webSpeechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    if (webSpeechSupported) {
      return initBrowserSpeechRecognition(onRecognizing, onRecognized, onError);
    }
  } catch (webSpeechError) {
    console.warn('Browser speech recognition not available:', webSpeechError);
  }
  
  // Fall back to Azure Speech SDK if Web Speech API isn't available
  try {
    // Dynamically load the SDK to avoid import errors
    // @ts-ignore - Ignoring the type error for the dynamic import
    const SpeechSDK = await import('microsoft-cognitiveservices-speech-sdk');
    
    const token = await getSpeechToken();
    
    // Extract region from endpoint
    const region = AZURE_SPEECH_ENDPOINT
      .replace('https://', '')
      .split('.')[0];
    
    // Create speech configuration
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
    speechConfig.speechRecognitionLanguage = 'en-US';
    
    // Create audio configuration for the microphone
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    
    // Create speech recognizer
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    
    // Set up event handlers
    recognizer.recognizing = (_sender: unknown, event: any) => {
      if (event.result && event.result.text) {
        onRecognizing(event.result.text);
      }
    };
    
    recognizer.recognized = (_sender: unknown, event: any) => {
      if (event.result && event.result.text) {
        onRecognized(event.result.text);
      }
    };
    
    recognizer.canceled = (_sender: unknown, event: any) => {
      if (event.errorCode !== 0) {
        onError(`Speech recognition canceled: ${event.errorDetails}`);
      }
    };
    
    recognizer.sessionStopped = () => {
      try {
        recognizer.stopContinuousRecognitionAsync();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    };
    
    // Return functions to start and stop recognition
    return {
      startRecognition: () => {
        try {
          recognizer.startContinuousRecognitionAsync();
        } catch (error) {
          console.error('Error starting recognition:', error);
          onError(`Failed to start speech recognition: ${error}`);
        }
      },
      stopRecognition: () => {
        try {
          recognizer.stopContinuousRecognitionAsync();
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
      }
    };
  } catch (error) {
    console.error('Failed to initialize Azure speech recognition:', error);
    
    // If both Azure SDK and Web Speech API fail, return mock controls
    onError(`Speech recognition unavailable. Fallback to text-only mode.`);
    return createMockSpeechControls(onRecognized);
  }
};

/**
 * Initialize browser's native SpeechRecognition API (if available)
 */
function initBrowserSpeechRecognition(
  onRecognizing: (text: string) => void,
  onRecognized: (text: string) => void,
  onError: (error: string) => void
): SpeechRecognitionControls {
  // @ts-ignore - Using browser APIs that TypeScript might not recognize
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  let finalTranscript = '';
  
  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
        onRecognized(event.results[i][0].transcript);
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    if (interimTranscript) {
      onRecognizing(interimTranscript);
    }
  };
  
  recognition.onerror = (event: any) => {
    console.error('Browser speech recognition error:', event.error);
    onError(`Browser speech recognition error: ${event.error}`);
  };
  
  return {
    startRecognition: () => {
      try {
        finalTranscript = '';
        recognition.start();
      } catch (error) {
        console.error('Error starting browser speech recognition:', error);
        onError(`Failed to start browser speech recognition: ${error}`);
      }
    },
    stopRecognition: () => {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping browser speech recognition:', error);
      }
    }
  };
}

/**
 * Create mock speech recognition controls for when both Azure and browser speech APIs fail
 */
function createMockSpeechControls(onRecognized: (text: string) => void): SpeechRecognitionControls {
  return {
    startRecognition: () => {
      console.warn('Using mock speech recognition - no real transcription will occur');
    },
    stopRecognition: () => {
      // Generate a mock transcription when stopping
      const mockTranscripts = [
        "I have extensive experience with React and TypeScript, having worked on several enterprise-scale applications over the past few years.",
        "I approach debugging by first reproducing the issue, then using browser dev tools and logging to trace the problem. I also isolate components when needed for more complex issues.",
        "My strengths include technical problem-solving, clear communication, and adaptability to new technologies and situations."
      ];
      const randomIndex = Math.floor(Math.random() * mockTranscripts.length);
      onRecognized(mockTranscripts[randomIndex]);
    }
  };
}

/**
 * Send audio to backend for full analysis with Azure services
 * This is used when direct browser integration is not available
 */
export const analyzeAudioWithAzure = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    
    const response = await axios.post(`${AZURE_SPEECH_ENDPOINT}speechtotext/v3.0/transcriptions`, formData, {
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.recognizedPhrases?.[0]?.nBest?.[0]?.display || "";
  } catch (error) {
    console.error('Error analyzing audio with Azure:', error);
    throw new Error('Failed to analyze audio with Azure services');
  }
}; 
