import os
import re
import time
import json
from . import azure_language_client
from . import azure_speech_client

class InterviewAnalyzer:
    """Class for analyzing mock interviews using Azure AI services"""
    
    def __init__(self):
        self.interview_data = {
            "transcript": "",
            "audio_analysis": {},
            "content_analysis": {},
            "feedback": {}
        }
    
    def analyze_interview(self, audio_data, job_description=""):
        """
        Analyze a mock interview recording
        
        Args:
            audio_data (bytes): The recorded audio data
            job_description (str, optional): Job description for relevance analysis
            
        Returns:
            dict: Complete interview analysis with feedback
        """
        if not audio_data:
            return {"error": "No audio data provided for analysis"}
        
        try:
            # Step 1: Transcribe the audio
            transcription = azure_speech_client.transcribe_audio(audio_data)
            if "error" in transcription:
                return {"error": f"Transcription error: {transcription['error']}"}
                
            self.interview_data["transcript"] = transcription["text"]
            
            # Step 2: Analyze audio characteristics (speech rate, volume, pitch, pauses)
            audio_analyzer = azure_speech_client.AudioAnalyzer(audio_data)
            audio_analysis = audio_analyzer.analyze_audio()
            
            if "error" in audio_analysis:
                return {"error": f"Audio analysis error: {audio_analysis['error']}"}
                
            self.interview_data["audio_analysis"] = audio_analysis
            
            # Step 3: Detect filler words
            filler_analysis = azure_speech_client.detect_filler_words(transcription["text"])
            self.interview_data["audio_analysis"]["filler_words"] = filler_analysis
            
            # Step 4: Analyze content using Language services
            content_analysis = self._analyze_content(transcription["text"], job_description)
            self.interview_data["content_analysis"] = content_analysis
            
            # Step 5: Generate comprehensive feedback
            feedback = self._generate_feedback()
            self.interview_data["feedback"] = feedback
            
            return self.interview_data
            
        except Exception as e:
            print(f"Error in interview analysis: {str(e)}")
            return {"error": f"Interview analysis failed: {str(e)}"}
    
    def _analyze_content(self, transcript, job_description=""):
        """
        Analyze interview content using Azure Language services
        
        Args:
            transcript (str): The transcribed interview text
            job_description (str, optional): Job description for relevance analysis
            
        Returns:
            dict: Content analysis results
        """
        content_analysis = {}
        
        # Analyze sentiment
        sentiment_analysis = azure_language_client.analyze_sentiment(transcript)
        content_analysis["sentiment"] = sentiment_analysis
        
        # Extract key phrases
        key_phrases = azure_language_client.extract_key_phrases(transcript)
        content_analysis["key_phrases"] = key_phrases
        
        # If job description provided, analyze relevance
        if job_description:
            relevance_score = self._analyze_relevance(transcript, job_description)
            content_analysis["relevance_score"] = relevance_score
        
        # Analyze clarity
        clarity_analysis = self._analyze_clarity(transcript)
        content_analysis["clarity"] = clarity_analysis
        
        return content_analysis
    
    def _analyze_relevance(self, transcript, job_description):
        """
        Analyze how relevant the interview responses are to the job description
        
        Args:
            transcript (str): The transcribed interview text
            job_description (str): The job description
            
        Returns:
            dict: Relevance analysis results
        """
        # Extract key phrases from both texts
        interview_phrases = azure_language_client.extract_key_phrases(transcript)
        job_phrases = azure_language_client.extract_key_phrases(job_description)
        
        # Calculate semantic similarity
        similarity = azure_language_client.calculate_text_similarity(transcript, job_description)
        
        # Find matching keywords
        matching_keywords = []
        
        for phrase in interview_phrases:
            for job_phrase in job_phrases:
                # Check for exact or partial matches
                if phrase.lower() in job_phrase.lower() or job_phrase.lower() in phrase.lower():
                    matching_keywords.append(phrase)
                    break
                
                # Check for semantic similarity between phrases
                phrase_similarity = azure_language_client.calculate_text_similarity(phrase, job_phrase)
                if phrase_similarity > 0.8:  # High similarity threshold
                    matching_keywords.append(phrase)
                    break
        
        # Calculate match percentage
        match_percentage = (len(matching_keywords) / max(1, len(job_phrases))) * 100
        
        # Determine relevance category
        category = "low"
        if match_percentage > 70:
            category = "high"
        elif match_percentage > 40:
            category = "moderate"
        
        return {
            "similarity_score": similarity,
            "matching_keywords": matching_keywords,
            "match_percentage": match_percentage,
            "category": category
        }
    
    def _analyze_clarity(self, transcript):
        """
        Analyze the clarity of the interview responses
        
        Args:
            transcript (str): The transcribed interview text
            
        Returns:
            dict: Clarity analysis results
        """
        # Split into sentences
        sentences = re.split(r'[.!?]+', transcript)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return {"category": "poor", "score": 0.0}
        
        # Calculate average sentence length
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences)
        
        # Count very short (<3 words) and very long (>25 words) sentences
        short_sentences = sum(1 for s in sentences if len(s.split()) < 3)
        long_sentences = sum(1 for s in sentences if len(s.split()) > 25)
        
        # Calculate percentage of problematic sentences
        problem_percentage = ((short_sentences + long_sentences) / len(sentences)) * 100
        
        # Calculate clarity score (0-1 scale)
        length_score = 0.0
        
        # Optimal average sentence length is between 12-18 words
        if 12 <= avg_sentence_length <= 18:
            length_score = 1.0
        elif avg_sentence_length < 8 or avg_sentence_length > 25:
            length_score = 0.3
        else:
            length_score = 0.7
        
        # Problem percentage penalty
        problem_penalty = min(0.7, (problem_percentage / 100))
        
        # Final clarity score
        clarity_score = length_score * (1 - problem_penalty)
        
        # Determine clarity category
        category = "poor"
        if clarity_score > 0.7:
            category = "excellent"
        elif clarity_score > 0.4:
            category = "good"
        
        return {
            "avg_sentence_length": avg_sentence_length,
            "short_sentences_count": short_sentences,
            "long_sentences_count": long_sentences,
            "problem_percentage": problem_percentage,
            "score": clarity_score,
            "category": category
        }
    
    def _generate_feedback(self):
        """
        Generate comprehensive feedback based on all analysis results
        
        Returns:
            dict: Structured feedback with specific points
        """
        if not self.interview_data.get("audio_analysis") or not self.interview_data.get("content_analysis"):
            return {"error": "Insufficient data for generating feedback"}
        
        feedback = {
            "confidence": self._generate_confidence_feedback(),
            "clarity": self._generate_clarity_feedback(),
            "content": self._generate_content_feedback(),
            "overall_score": self._calculate_overall_score(),
            "improvement_points": []
        }
        
        # Generate specific improvement points
        improvement_points = []
        
        # Add audio-related improvements
        audio_analysis = self.interview_data["audio_analysis"]
        
        if audio_analysis["speech_rate"]["category"] != "moderate":
            if audio_analysis["speech_rate"]["category"] == "fast":
                improvement_points.append("Try to slow down your speech rate for better clarity.")
            else:
                improvement_points.append("Try to speak a bit faster to maintain the interviewer's engagement.")
        
        if audio_analysis["volume"]["category"] != "moderate":
            if audio_analysis["volume"]["category"] == "too quiet":
                improvement_points.append("Speak more loudly to project confidence.")
            else:
                improvement_points.append("Moderate your volume to avoid sounding too aggressive.")
        
        if audio_analysis["pitch_variation"]["category"] == "monotone":
            improvement_points.append("Vary your pitch more to sound more engaging and enthusiastic.")
        
        if audio_analysis["pause_analysis"]["category"] == "frequent":
            improvement_points.append("Try to reduce the number of pauses in your speech.")
        elif audio_analysis["pause_analysis"]["category"] == "few":
            improvement_points.append("Include strategic pauses to emphasize important points.")
        
        if audio_analysis.get("filler_words", {}).get("category") in ["moderate", "high"]:
            filler_examples = ', '.join(list(audio_analysis['filler_words'].get('filler_words', {}).keys())[:3])
            improvement_points.append(f"Reduce filler words (like '{filler_examples}') to sound more confident.")
        
        # Add content-related improvements
        content_analysis = self.interview_data["content_analysis"]
        
        if content_analysis["clarity"]["category"] != "excellent":
            if content_analysis["clarity"]["avg_sentence_length"] > 20:
                improvement_points.append("Use shorter, more concise sentences for better clarity.")
            elif content_analysis["clarity"]["avg_sentence_length"] < 8:
                improvement_points.append("Elaborate more on your answers with more detailed sentences.")
        
        if content_analysis.get("relevance_score", {}).get("category") != "high":
            improvement_points.append("Focus more on using keywords and phrases relevant to the job description.")
        
        if content_analysis["sentiment"]["sentiment"] == "negative":
            improvement_points.append("Use more positive language to convey enthusiasm and confidence.")
        
        # Limit to the top 5 most important improvements
        feedback["improvement_points"] = improvement_points[:5]
        
        return feedback
    
    def _generate_confidence_feedback(self):
        """Generate feedback about confidence level"""
        audio_analysis = self.interview_data["audio_analysis"]
        confidence_score = audio_analysis.get("confidence_score", 0.5)
        
        # Determine confidence category
        category = "moderate"
        if confidence_score > 0.7:
            category = "high"
        elif confidence_score < 0.4:
            category = "low"
        
        # Generate feedback text based on confidence category
        feedback_text = ""
        if category == "high":
            feedback_text = "You demonstrated strong confidence in your interview responses. Your steady pace, appropriate volume, and varied pitch conveyed assurance and engagement."
        elif category == "moderate":
            feedback_text = "You showed reasonable confidence in your interview responses. With a few adjustments to your speech patterns, you could further enhance your confidence level."
        else:
            feedback_text = "You appeared somewhat hesitant in your interview responses. Working on your speech rate, volume, and reducing pauses could help you convey more confidence."
        
        return {
            "score": confidence_score,
            "category": category,
            "feedback_text": feedback_text
        }
    
    def _generate_clarity_feedback(self):
        """Generate feedback about clarity of responses"""
        content_analysis = self.interview_data["content_analysis"]
        clarity_data = content_analysis["clarity"]
        clarity_score = clarity_data.get("score", 0.5)
        
        # Generate feedback text based on clarity category
        feedback_text = ""
        if clarity_data["category"] == "excellent":
            feedback_text = "Your responses were very clear and well-structured. You used an ideal sentence length and maintained good organization throughout."
        elif clarity_data["category"] == "good":
            feedback_text = "Your responses were generally clear, though there's room for improvement in sentence structure and organization."
        else:
            feedback_text = "Your responses could benefit from improved clarity. Consider structuring your answers with better sentence length and more organized thoughts."
        
        return {
            "score": clarity_score,
            "category": clarity_data["category"],
            "feedback_text": feedback_text
        }
    
    def _generate_content_feedback(self):
        """Generate feedback about content relevance and quality"""
        content_analysis = self.interview_data["content_analysis"]
        
        # Get relevance score if available
        relevance_score = content_analysis.get("relevance_score", {})
        relevance_value = relevance_score.get("similarity_score", 0.5) 
        relevance_category = relevance_score.get("category", "moderate")
        
        # Get sentiment
        sentiment = content_analysis["sentiment"]["sentiment"]
        
        # Generate feedback text
        feedback_text = ""
        if relevance_category == "high":
            feedback_text = "Your responses were highly relevant to the job requirements. "
        elif relevance_category == "moderate":
            feedback_text = "Your responses were moderately relevant to the job requirements. Consider incorporating more specific terminology and examples. "
        else:
            feedback_text = "Your responses could be more targeted to the job requirements. Try to use more industry-specific terms and address key skills mentioned in the job. "
        
        # Add sentiment feedback
        if sentiment == "positive":
            feedback_text += "You maintained a positive tone that demonstrated enthusiasm for the position."
        elif sentiment == "neutral":
            feedback_text += "Your tone was largely neutral. Adding more enthusiasm could better convey your interest in the position."
        else:
            feedback_text += "Your tone came across as somewhat negative. Try to use more positive language to demonstrate your enthusiasm."
        
        return {
            "relevance": {
                "score": relevance_value,
                "category": relevance_category
            },
            "sentiment": sentiment,
            "feedback_text": feedback_text
        }
    
    def _calculate_overall_score(self):
        """Calculate an overall interview performance score"""
        scores = []
        
        # Add confidence score (40% weight)
        confidence_score = self.interview_data["audio_analysis"].get("confidence_score", 0.5)
        scores.append(confidence_score * 0.4)
        
        # Add clarity score (30% weight)
        clarity_score = self.interview_data["content_analysis"]["clarity"].get("score", 0.5)
        scores.append(clarity_score * 0.3)
        
        # Add relevance score if available (30% weight)
        if "relevance_score" in self.interview_data["content_analysis"]:
            relevance_score = self.interview_data["content_analysis"]["relevance_score"].get("similarity_score", 0.5)
            scores.append(relevance_score * 0.3)
        else:
            # If no relevance score (no job description provided), distribute weight to others
            scores[0] += 0.15  # Add to confidence
            scores[1] += 0.15  # Add to clarity
        
        # Calculate final score (0-100 scale)
        overall_score = sum(scores) * 100
        
        # Determine category
        category = "needs_improvement"
        if overall_score >= 80:
            category = "excellent"
        elif overall_score >= 65:
            category = "good"
        elif overall_score >= 50:
            category = "average"
        
        return {
            "score": int(overall_score),
            "category": category
        } 