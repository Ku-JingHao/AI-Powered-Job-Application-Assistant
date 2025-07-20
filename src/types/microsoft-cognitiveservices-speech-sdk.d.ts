declare module 'microsoft-cognitiveservices-speech-sdk' {
  export class SpeechConfig {
    static fromAuthorizationToken(token: string, region: string): SpeechConfig;
    speechRecognitionLanguage: string;
  }

  export class AudioConfig {
    static fromDefaultMicrophoneInput(): AudioConfig;
  }

  export class SpeechRecognizer {
    constructor(speechConfig: SpeechConfig, audioConfig: AudioConfig);
    recognizing: (sender: any, event: SpeechRecognitionEventArgs) => void;
    recognized: (sender: any, event: SpeechRecognitionEventArgs) => void;
    canceled: (sender: any, event: SpeechRecognitionCanceledEventArgs) => void;
    sessionStopped: () => void;
    startContinuousRecognitionAsync(): void;
    stopContinuousRecognitionAsync(): void;
  }

  export interface SpeechRecognitionEventArgs {
    result: {
      text: string;
    };
  }

  export interface SpeechRecognitionCanceledEventArgs {
    errorCode: number;
    errorDetails: string;
  }
} 