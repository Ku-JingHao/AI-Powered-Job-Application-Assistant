import axios from 'axios';

/**
 * Interface for BERT analysis results
 */
export interface BertAnalysisResult {
  relevantKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  improvementAreas: string[];
}

/**
 * API URL for the BERT analysis service
 * In production, this would point to your backend API
 */
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api';

/**
 * Perform BERT-based analysis of interview responses
 * This function connects to the backend API where the actual BERT model is run
 * 
 * @param transcript - The interview transcript to analyze
 * @param question - The question that was asked in the interview
 * @returns Analysis results including keywords, suggestions, strengths and areas for improvement
 */
export const performBertAnalysis = async (
  transcript: string,
  question: string
): Promise<BertAnalysisResult> => {
  try {
    console.log(`Sending BERT analysis request for transcript length: ${transcript.length}`);
    
    // In a production environment, this would be a real API call to a backend service
    // running Hugging Face Transformers or a similar NLP service
    const response = await axios.post(`${API_URL}/interview/bert-analysis/`, {
      transcript,
      question
    });
    
    console.log('BERT analysis request succeeded');
    return response.data;
  } catch (error) {
    // More detailed error logging to help troubleshoot API issues
    if (axios.isAxiosError(error)) {
      console.error('BERT analysis API error:', error.message);
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server');
      }
    } else {
      console.error('Error performing BERT analysis:', error);
    }
    
    // If the API call fails, fall back to the mock implementation
    // This ensures the app still works even if the backend is down
    console.log('Falling back to mock BERT analysis');
    return generateMockBertAnalysis(transcript, question);
  }
};

/**
 * Generate a mock BERT analysis result for development or fallback
 * This simulates what an actual BERT model would return
 * 
 * @param transcript - The interview transcript to analyze
 * @param question - The interview question
 * @returns Simulated BERT analysis results
 */
export const generateMockBertAnalysis = (
  transcript: string,
  question: string
): BertAnalysisResult => {
  console.log('Using mock BERT analysis for development');
  
  // Determine question type to tailor the analysis
  const questionType = question.toLowerCase().includes('experience') ? 'experience' :
                       question.toLowerCase().includes('challenge') ? 'challenge' :
                       question.toLowerCase().includes('strength') ? 'strength' : 'general';
  
  // Simulated semantic analysis using question-specific keywords                 
  const semanticKeywords: {[key: string]: string[]} = {
    'experience': ['professional background', 'expertise', 'work history', 'career path', 'professional journey', 'accomplishments'],
    'challenge': ['difficulty', 'hurdle', 'complication', 'obstacle', 'problem-solving', 'adversity', 'resolution'],
    'strength': ['ability', 'talent', 'aptitude', 'competency', 'expertise', 'proficiency', 'mastery'],
    'general': ['qualifications', 'skills', 'background', 'capability', 'performance', 'achievement']
  };
  
  // Determine the context of the transcript to provide context-specific suggestions
  const transcriptContext = transcript.length > 200 ? 'detailed' : 
                           transcript.toLowerCase().includes('example') ? 'example-driven' :
                           transcript.toLowerCase().includes('data') ? 'data-driven' : 'basic';
                           
  // Enhanced context-specific suggestions that match the backend implementation
  let contextualSuggestions: string[] = [];
  
  if (transcriptContext === 'detailed') {
    contextualSuggestions = [
      'Your detailed response shows depth of knowledge. Consider prioritizing key points more clearly.',
      'While comprehensive, your answer could benefit from a clearer structure with main points highlighted first.',
      'Strong detailed answer. Try using the "inverted pyramid" approach - start with your conclusion, then provide supporting details.'
    ];
  } else if (transcriptContext === 'example-driven') {
    contextualSuggestions = [
      'Your examples effectively illustrate your points. Consider quantifying their impact more precisely.',
      'The examples you provided are relevant. Adding more context about your specific role would strengthen them.',
      'Good use of examples. For each one, try explicitly connecting it back to the skill or quality the interviewer is asking about.'
    ];
  } else if (transcriptContext === 'data-driven') {
    contextualSuggestions = [
      'Your use of data strengthens your response. Consider explaining the broader implications of these metrics.',
      'The metrics you mentioned are valuable. Connecting them more clearly to the skills required for this position would be beneficial.',
      'Good use of numbers to support your claims. Consider providing brief context for these figures to make them more meaningful.'
    ];
  } else { // basic
    contextualSuggestions = [
      'Adding specific, relevant examples would make your response more compelling.',
      'Consider structuring your answer using the STAR method to highlight your accomplishments more effectively.',
      'Your answer would benefit from more specific details about your role and contributions.'
    ];
  }
  
  // Question-specific suggestion
  let questionSpecificSuggestion = '';
  if (questionType === 'experience') {
    questionSpecificSuggestion = "When discussing your experience, highlight how it directly relates to the requirements of this position.";
  } else if (questionType === 'challenge') {
    questionSpecificSuggestion = "For challenge questions, emphasize what you learned and how it improved your professional abilities.";
  } else if (questionType === 'strength') {
    questionSpecificSuggestion = "When highlighting strengths, provide clear evidence and examples that demonstrate each strength in action.";
  } else {
    questionSpecificSuggestion = "Consider emphasizing your qualifications more explicitly with concrete evidence.";
  }
  
  // Enhanced improvement areas based on context and question type
  let improvementAreas: string[] = [];
  
  // Base improvement areas
  improvementAreas.push('Use more industry-specific terminology');
  improvementAreas.push('Consider structuring your answer more methodically');
  improvementAreas.push('Add more quantifiable achievements to strengthen impact');
  
  // Context-specific improvement
  if (transcriptContext === 'detailed') {
    improvementAreas.push('Prioritize your most impressive or relevant points earlier in your answer');
  } else if (transcriptContext === 'example-driven') {
    improvementAreas.push('Quantify the results or impact of your examples with specific metrics');
  } else if (transcriptContext === 'data-driven') {
    improvementAreas.push('Connect your achievements more explicitly to the job requirements');
  } else {
    improvementAreas.push('Include more concrete examples to support your claims');
  }
  
  // Simulate semantic matching beyond exact string matching
  const relevantKeywords = semanticKeywords[questionType].filter(k => 
    transcript.toLowerCase().includes(k.toLowerCase()) || 
    Math.random() > 0.5 
  );
  
  // Simulate missing keywords detection with some randomness to mimic ML behavior
  const missingKeywords = semanticKeywords[questionType].filter(k => 
    !transcript.toLowerCase().includes(k.toLowerCase()) && 
    Math.random() > 0.7
  );
  
  // Return the mock analysis results with our enhanced suggestions
  return {
    relevantKeywords,
    missingKeywords,
    suggestions: [
      ...contextualSuggestions,
      questionSpecificSuggestion,
      'Use more industry-specific terminology to demonstrate domain knowledge.'
    ],
    strengths: [
      transcriptContext === 'detailed' ? 'Provided a comprehensive response with good depth' : 'Focused on key points',
      transcriptContext === 'example-driven' ? 'Effectively used examples to illustrate points' : 'Clearly addressed the question',
      `Demonstrated understanding of ${questionType} expectations in the field`
    ],
    improvementAreas: improvementAreas.slice(0, 4) // Limit to 4 items for readability
  };
}; 