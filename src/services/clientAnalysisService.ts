import { InterviewAnalysisResult } from './interviewService';
import { performBertAnalysis, BertAnalysisResult } from './bertAnalysisService';

/**
 * Analyze an interview transcript directly in the browser
 * This is used when the API call fails or we want to perform analysis without a backend
 */
export const analyzeTranscript = async (
  transcript: string,
  question: string
): Promise<InterviewAnalysisResult> => {
  // Extract essential data for analysis
  const wordCount = transcript.split(/\s+/).length;
  const fillerWords = countFillerWords(transcript);
  const fillerWordsCount = Object.values(fillerWords).reduce((a, b) => a + b, 0);
  const averageWordsPerSentence = calculateAverageWordsPerSentence(transcript);
  const clarity = calculateClarity(transcript);
  
  // Calculate a rate score based on word count and estimated duration
  // Assuming an ideal speaking rate of about 150 words per minute
  const estimatedDuration = wordCount / 150 * 60; // Duration in seconds
  const paceScore = calculatePaceScore(wordCount, estimatedDuration);
  
  // Calculate relevance score based on keyword matching
  const relevanceData = await calculateRelevanceScore(transcript, question);
  
  // Generate content-based feedback
  const contentFeedback = await generateContentFeedback(transcript, relevanceData.keywords, relevanceData.missingKeywords);
  
  // Analyze sentiment (basic implementation)
  const sentimentScore = calculateSentiment(transcript);
  
  // Generate suggestions for improvement
  const suggestions = await generateSuggestions(transcript, relevanceData, clarity, fillerWordsCount);
  
  return {
    transcript: transcript,
    audio_analysis: {
      pace_score: paceScore,
      pace_feedback: generatePaceFeedback(paceScore, wordCount),
      volume_score: 75, // Default since we can't measure volume from text
      volume_feedback: "Voice volume analysis is based on your recorded audio. Focus on speaking clearly and consistently.",
      filler_words: fillerWords,
      filler_words_count: fillerWordsCount,
      duration: estimatedDuration,
      wpm: Math.round(wordCount / (estimatedDuration / 60))
    },
    content_analysis: {
      overall_score: Math.round((relevanceData.score + clarity.score) / 2),
      relevance_score: relevanceData.score,
      relevance_feedback: relevanceData.feedback,
      clarity_score: clarity.score,
      clarity_feedback: clarity.feedback,
      strengths: contentFeedback.strengths,
      improvement_areas: contentFeedback.improvementAreas,
      keywords: relevanceData.keywords,
      missing_keywords: relevanceData.missingKeywords,
      sentiment: {
        sentiment: sentimentScore > 0.6 ? "positive" : sentimentScore > 0.4 ? "neutral" : "negative",
        confidence: 0.7 // Default confidence value
      },
      key_phrases: extractKeyPhrases(transcript)
    },
    feedback: {
      general_feedback: generateGeneralFeedback(transcript, relevanceData.score, clarity.score, paceScore, fillerWordsCount),
      suggestions: suggestions,
      sample_answers: generateSampleAnswers(question)
    }
  };
};

// Helper functions for analysis

/**
 * Count filler words in the transcript
 */
const countFillerWords = (transcript: string): Record<string, number> => {
  const fillerWordsList = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'basically', 'actually', 'literally', 'i mean'];
  const fillerWords: Record<string, number> = {};
  
  // Convert to lowercase and clean up extra spaces
  const cleanTranscript = transcript.toLowerCase().replace(/\s+/g, ' ');
  
  fillerWordsList.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = cleanTranscript.match(regex);
    if (matches) {
      fillerWords[word] = matches.length;
    }
  });
  
  return fillerWords;
};

/**
 * Calculate average words per sentence
 */
const calculateAverageWordsPerSentence = (transcript: string): number => {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  
  const totalWords = sentences.reduce((count, sentence) => {
    return count + sentence.trim().split(/\s+/).length;
  }, 0);
  
  return totalWords / sentences.length;
};

/**
 * Calculate clarity score based on sentence structure
 */
const calculateClarity = (transcript: string): { score: number; feedback: string; } => {
  const avgWordsPerSentence = calculateAverageWordsPerSentence(transcript);
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Count sentences that are too short (less than 5 words) or too long (more than 25 words)
  const shortSentences = sentences.filter(s => s.trim().split(/\s+/).length < 5).length;
  const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 25).length;
  
  const problemSentencePercentage = (shortSentences + longSentences) / Math.max(sentences.length, 1);
  
  let clarityScore = 0;
  let clarityFeedback = '';
  
  if (avgWordsPerSentence < 8) {
    clarityScore = 60;
    clarityFeedback = "Your responses use very short sentences, which may make your answer seem choppy or incomplete. Try connecting ideas with more detail.";
  } else if (avgWordsPerSentence > 20) {
    clarityScore = 65;
    clarityFeedback = "Your responses contain several long sentences that may be difficult to follow. Consider breaking them into shorter, clearer statements.";
  } else if (avgWordsPerSentence >= 12 && avgWordsPerSentence <= 18) {
    clarityScore = 90;
    clarityFeedback = "Your sentence structure is excellent, with a good mix of lengths that makes your response easy to follow.";
  } else {
    clarityScore = 80;
    clarityFeedback = "Your sentence structure is generally good. Your ideas flow well from one to the next.";
  }
  
  // Adjust score based on problematic sentences
  if (problemSentencePercentage > 0.3) {
    clarityScore -= 15;
    clarityFeedback += " There's a significant variation in your sentence lengths, which can affect clarity.";
  }
  
  return {
    score: Math.max(0, Math.min(100, clarityScore)),
    feedback: clarityFeedback
  };
};

/**
 * Calculate pace score based on word count and duration
 */
const calculatePaceScore = (wordCount: number, durationSeconds: number): number => {
  // Ideal speaking rate is around 150 words per minute or 2.5 words per second
  const wps = wordCount / Math.max(durationSeconds, 1);
  
  if (wps < 1.5) {
    // Too slow
    return 60 + Math.round((wps / 1.5) * 20);
  } else if (wps > 3.5) {
    // Too fast
    return 80 - Math.min(20, Math.round((wps - 3.5) * 10));
  } else if (wps >= 2 && wps <= 3) {
    // Ideal pace
    return 90;
  } else {
    // Good pace
    return 80;
  }
};

/**
 * Calculate relevance score based on keyword matching
 */
const calculateRelevanceScore = async (
  transcript: string, 
  question: string
): Promise<{
  score: number;
  feedback: string;
  keywords: string[];
  missingKeywords: string[];
}> => {
  try {
    // Try using advanced BERT analysis if available
    const bertAnalysis = await performBertAnalysis(transcript, question);
    
    // Calculate a more sophisticated score based on BERT results
    const relevanceScore = Math.min(100, Math.round(
      (bertAnalysis.relevantKeywords.length / 
      Math.max(bertAnalysis.relevantKeywords.length + bertAnalysis.missingKeywords.length, 1)) * 100
    ));
    
    // Generate contextualized feedback using BERT insights
    let feedback = '';
    if (relevanceScore >= 80) {
      feedback = `Your answer demonstrates strong relevance to the question with effective use of context-appropriate terminology and examples.`;
    } else if (relevanceScore >= 60) {
      feedback = `Your answer addresses the question with moderate relevance. Consider incorporating more specific industry terminology and focused examples.`;
    } else {
      feedback = `Your answer could be more clearly aligned with what the question is asking. Try to incorporate more relevant terminology and specific examples.`;
    }
    
    return {
      score: relevanceScore,
      feedback,
      keywords: bertAnalysis.relevantKeywords,
      missingKeywords: bertAnalysis.missingKeywords
    };
  } catch (error) {
    console.warn('Advanced BERT analysis unavailable, falling back to basic analysis:', error);
    
    // Fall back to the original implementation
    // Generate keywords based on job title and question
    const jobKeywords = getJobKeywords();
    const questionKeywords = extractQuestionKeywords(question);
    
    // Combine all keywords - fix Set iteration issue
    const allKeywords = Array.from(new Set([...jobKeywords, ...questionKeywords]));
    
    // Check which keywords appear in the transcript
    const lowerTranscript = transcript.toLowerCase();
    const foundKeywords: string[] = [];
    const missingKeywords: string[] = [];
    
    allKeywords.forEach(keyword => {
      if (lowerTranscript.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });
    
    // Calculate score based on keyword matches
    const keywordScore = Math.round((foundKeywords.length / Math.max(allKeywords.length, 1)) * 100);
    
    // Generate feedback based on keyword score
    let feedback = '';
    if (keywordScore >= 80) {
      feedback = `Your answer is highly relevant to the question and the position. You addressed most of the key points expected in your response.`;
    } else if (keywordScore >= 60) {
      feedback = `Your answer is relevant to the question, but you could include more specific details related to the position.`;
    } else {
      feedback = `Your answer could be more focused on the specific requirements of the position and the question asked.`;
    }
    
    return {
      score: keywordScore,
      feedback,
      keywords: foundKeywords,
      missingKeywords: missingKeywords.slice(0, 5) // Limit to 5 missing keywords
    };
  }
};

/**
 * Get keywords based on the common interview aspects
 */
const getJobKeywords = (): string[] => {
  return [
    "experience", "skills", "teamwork", "communication", "problem-solving",
    "leadership", "project", "development", "analysis", "design",
    "implementation", "testing", "deployment", "methodology", "process",
    "collaboration", "initiative", "results", "solution", "innovation"
  ];
};

/**
 * Extract keywords from the question
 */
const extractQuestionKeywords = (question: string): string[] => {
  if (!question || question.trim().length === 0) {
    return [];
  }
  
  // Simple keyword extraction from the question
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('experience')) {
    return ['experience', 'worked on', 'background', 'projects', 'roles'];
  } else if (questionLower.includes('challenge') || questionLower.includes('difficult')) {
    return ['challenge', 'obstacle', 'problem', 'solution', 'overcome',
            'resolved', 'approach', 'learned', 'outcome'];
  } else if (questionLower.includes('strength') || questionLower.includes('skill')) {
    return ['strength', 'skill', 'capable', 'proficient', 'expertise',
            'qualified', 'competent', 'excel', 'strong suit'];
  } else if (questionLower.includes('weak') || questionLower.includes('improve')) {
    return ['improve', 'learning', 'development', 'progress', 'growth',
            'challenge', 'overcome', 'addressed'];
  } else if (questionLower.includes('team') || questionLower.includes('conflict')) {
    return ['team', 'collaboration', 'communication', 'resolved', 'conflict',
            'colleagues', 'together', 'contributed', 'cooperate'];
  } else {
    // Extract significant nouns and verbs as keywords
    return question.split(/\s+/)
      .filter(word => word.length > 4) // Only keep longer words as likely keywords
      .map(word => word.replace(/[^\w]/g, '').toLowerCase())
      .filter(word => !['about', 'would', 'could', 'should', 'their', 'there', 'where', 'which'].includes(word));
  }
};

/**
 * Generate content-based feedback using advanced NLP when available
 */
const generateContentFeedback = async (
  transcript: string,
  keywords: string[],
  missingKeywords: string[]
): Promise<{ strengths: string[]; improvementAreas: string[] }> => {
  try {
    // Try using advanced BERT analysis
    const bertAnalysis = await performBertAnalysis(transcript, '');
    
    return {
      strengths: bertAnalysis.strengths,
      improvementAreas: bertAnalysis.improvementAreas
    };
  } catch (error) {
    console.warn('Advanced content analysis unavailable, falling back to basic analysis:', error);
    
    // Fall back to the original implementation
    const strengths: string[] = [];
    const improvementAreas: string[] = [];
    
    // Analyze transcript length
    const wordCount = transcript.split(/\s+/).length;
    if (wordCount > 200) {
      strengths.push('Provided a detailed and comprehensive response');
    } else if (wordCount < 50) {
      improvementAreas.push('Response is brief - consider expanding with more details and examples');
    }
    
    // Analyze keyword usage
    if (keywords.length > 6) {
      strengths.push('Used relevant terminology and keywords appropriate for the position');
    } else if (keywords.length < 3) {
      improvementAreas.push('Include more industry-specific and role-relevant terminology');
    }
    
    // Check for specific examples
    if (transcript.toLowerCase().includes('example') || transcript.toLowerCase().includes('instance') || 
        transcript.toLowerCase().includes('case') || transcript.toLowerCase().includes('project') || 
        transcript.toLowerCase().includes('situation')) {
      strengths.push('Provided specific examples to illustrate points');
    } else {
      improvementAreas.push('Include specific examples to strengthen your response');
    }
    
    // Check for structure
    if (transcript.toLowerCase().includes('first') || transcript.toLowerCase().includes('second') || 
        transcript.toLowerCase().includes('finally') || transcript.toLowerCase().includes('additionally') || 
        transcript.toLowerCase().includes('moreover') || transcript.toLowerCase().includes('conclusion')) {
      strengths.push('Structured response with clear organization of ideas');
    } else {
      improvementAreas.push('Consider structuring your response with a clearer beginning, middle, and end');
    }
    
    // Check for quantification
    const hasNumbers = /\d+%|\d+ percent|increased by|\d+ years|\d+ months|\d+ projects/i.test(transcript);
    if (hasNumbers) {
      strengths.push('Used specific metrics and numbers to quantify achievements');
    } else {
      improvementAreas.push('Try to quantify your achievements with specific metrics where possible');
    }
    
    // Add feedback based on missing keywords
    if (missingKeywords.length > 0) {
      improvementAreas.push(`Consider addressing these relevant topics: ${missingKeywords.slice(0, 3).join(', ')}`);
    }
    
    return {
      strengths: strengths.slice(0, 4), // Limit to 4 strengths
      improvementAreas: improvementAreas.slice(0, 4) // Limit to 4 improvement areas
    };
  }
};

/**
 * Generate pace feedback
 */
const generatePaceFeedback = (paceScore: number, wordCount: number): string => {
  if (paceScore >= 85) {
    return "Your speaking pace was excellent - neither too fast nor too slow, making it easy for the interviewer to follow your response.";
  } else if (paceScore >= 70) {
    return "Your speaking pace was generally good, though there were moments where you could adjust slightly for optimal delivery.";
  } else if (wordCount < 100) {
    return "Your response was quite brief. Consider elaborating more to fully address the question.";
  } else {
    return "Try to maintain a more consistent pace throughout your response - some portions were either too quick or too slow.";
  }
};

/**
 * Calculate a basic sentiment score
 */
const calculateSentiment = (text: string): number => {
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'best', 'positive', 'success', 'successful',
    'achieve', 'achievement', 'benefit', 'beneficial', 'better', 'collaborative', 'confident',
    'effective', 'efficient', 'enjoy', 'excellent', 'exceptional', 'excited', 'fantastic',
    'favorable', 'glad', 'happy', 'impressive', 'improved', 'outstanding', 'perfect',
    'pleased', 'pleasure', 'productive', 'progress', 'satisfied', 'smooth', 'superior',
    'valuable', 'delighted', 'enthusiastic'
  ];
  
  const negativeWords = [
    'bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'negative', 'fail', 'failure',
    'problem', 'difficult', 'challenge', 'hard', 'trouble', 'worry', 'concerned', 'concern',
    'unfortunately', 'unsuccessful', 'disappointing', 'disappointed', 'struggle', 'painful',
    'severe', 'serious', 'unfortunately', 'unhappy', 'unpleasant', 'unsatisfactory'
  ];
  
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  const total = positiveCount + negativeCount;
  if (total === 0) return 0.5; // Neutral if no sentiment words found
  
  return positiveCount / (positiveCount + negativeCount);
};

/**
 * Extract key phrases from text
 */
const extractKeyPhrases = (text: string): string[] => {
  // This is a simplified version - in a real app, you would use NLP
  const phrases: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  for (const sentence of sentences) {
    // Look for phrases with adjectives followed by nouns
    const potentialPhrases = sentence.match(/\b[A-Za-z]+\s+[A-Za-z]+\b/g) || [];
    
    for (const phrase of potentialPhrases) {
      if (phrase.length > 7 && !phrases.includes(phrase) && phrases.length < 10) {
        phrases.push(phrase);
      }
    }
  }
  
  return phrases;
};

/**
 * Generate general feedback
 */
const generateGeneralFeedback = (
  transcript: string,
  relevanceScore: number,
  clarityScore: number,
  paceScore: number,
  fillerWordsCount: number
): string => {
  const overallScore = (relevanceScore + clarityScore + paceScore) / 3;
  
  let feedback = '';
  
  if (overallScore >= 85) {
    feedback = "Overall, your interview response was excellent. You delivered a well-structured answer that directly addressed the question with relevant content and good delivery.";
  } else if (overallScore >= 70) {
    feedback = "You provided a good interview response that addressed the question effectively. There are a few areas where you could enhance your delivery and content for an even stronger impression.";
  } else {
    feedback = "Your response addressed the basic elements of the question, but there's room for improvement in both content and delivery to make a stronger impression in an interview setting.";
  }
  
  // Add specific notes based on metrics
  if (fillerWordsCount > 10) {
    feedback += " Your response contained several filler words which can distract from your message.";
  }
  
  if (relevanceScore < 70) {
    feedback += " Try to more directly address the specific question and include relevant terminology for the position.";
  }
  
  return feedback;
};

/**
 * Generate suggestions for improvement using advanced NLP when available
 */
const generateSuggestions = async (
  transcript: string,
  relevanceData: { score: number; keywords: string[]; missingKeywords: string[] },
  clarity: { score: number; feedback: string },
  fillerWordsCount: number
): Promise<string[]> => {
  try {
    // Try using advanced BERT analysis
    const bertAnalysis = await performBertAnalysis(transcript, '');
    
    return bertAnalysis.suggestions;
  } catch (error) {
    console.warn('Advanced suggestion generation unavailable, falling back to basic analysis:', error);
    
    // Fall back to the original implementation
    const suggestions: string[] = [];
    
    // Suggest improvements based on metrics
    if (fillerWordsCount > 10) {
      suggestions.push(`Reduce the use of filler words (like "um," "uh," "you know") to sound more confident and polished.`);
    }
    
    if (relevanceData.score < 70) {
      suggestions.push(`Focus more directly on addressing the specific question asked and include industry-relevant terminology.`);
    }
    
    if (clarity.score < 75) {
      suggestions.push(clarity.feedback);
    }
    
    // Check for specific examples
    if (!transcript.toLowerCase().includes('example') && !transcript.toLowerCase().includes('instance') && 
        !transcript.toLowerCase().includes('case') && !transcript.toLowerCase().includes('project') && 
        !transcript.toLowerCase().includes('situation')) {
      suggestions.push("Include specific examples from your experience to make your answers more compelling and credible.");
    }
    
    // Check for quantification
    const hasNumbers = /\d+%|\d+ percent|increased by|\d+ years|\d+ months|\d+ projects/i.test(transcript);
    if (!hasNumbers) {
      suggestions.push("Quantify your achievements with specific numbers or percentages to add credibility (e.g., 'improved efficiency by 20%').");
    }
    
    // Add suggestion for missing keywords if relevant
    if (relevanceData.missingKeywords.length > 0) {
      const keyTopics = relevanceData.missingKeywords.slice(0, 3).join(', ');
      suggestions.push(`Consider addressing these relevant topics in your answer: ${keyTopics}.`);
    }
    
    // General improvement suggestions
    suggestions.push("Practice delivering your responses with a confident tone and natural pace.");
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }
};

/**
 * Generate sample answers based on the question
 */
const generateSampleAnswers = (question: string): string[] => {
  if (!question || question.trim().length === 0) {
    return [
      "I've gained significant experience in team environments where effective communication was essential.",
      "My approach to problem-solving involves analyzing requirements, considering alternatives, and implementing optimal solutions."
    ];
  }
  
  // Generic sample answers based on common interview questions
  return [
    "In my previous role, I successfully handled a similar situation by prioritizing tasks and communicating clearly with stakeholders.",
    "I believe my experience with relevant technologies and methodologies would be valuable for addressing these challenges.",
    "I approach these types of problems by breaking them down into manageable components and systematically addressing each part."
  ];
}; 