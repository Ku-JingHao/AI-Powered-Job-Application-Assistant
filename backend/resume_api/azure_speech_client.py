import os
import time
import json
import wave
import pyaudio
import numpy as np
import statistics
from io import BytesIO
from dotenv import load_dotenv
import azure.cognitiveservices.speech as speechsdk

# Load environment variables
load_dotenv()

# Get Azure Speech service credentials
SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY", "")
SPEECH_ENDPOINT = os.getenv("AZURE_SPEECH_ENDPOINT", "")
SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "")

class AudioAnalyzer:
    """Class for analyzing audio features from a recorded interview"""
    
    def __init__(self, audio_data=None, sample_rate=16000):
        self.audio_data = audio_data  # Raw audio data as bytes
        self.sample_rate = sample_rate
        self.audio_features = {}
        
    def set_audio_data(self, audio_data):
        """Set audio data for analysis"""
        self.audio_data = audio_data
        
    def analyze_audio(self):
        """Analyze audio for speech rate, volume, pitch, and pauses"""
        if not self.audio_data:
            return {
                "error": "No audio data provided for analysis"
            }
            
        try:
            # Convert byte data to numpy array (assuming 16-bit PCM)
            audio_np = np.frombuffer(self.audio_data, dtype=np.int16).astype(np.float32)
            audio_np /= 32768.0  # Normalize to [-1.0, 1.0]
            
            # Calculate audio features
            self.audio_features = {
                "speech_rate": self._calculate_speech_rate(audio_np),
                "volume": self._calculate_volume(audio_np),
                "pitch_variation": self._calculate_pitch_variation(audio_np),
                "pause_analysis": self._analyze_pauses(audio_np),
                "duration": len(audio_np) / self.sample_rate
            }
            
            # Add confidence score based on features
            self.audio_features["confidence_score"] = self._calculate_confidence_score()
            
            return self.audio_features
            
        except Exception as e:
            print(f"Error analyzing audio: {str(e)}")
            return {
                "error": f"Failed to analyze audio: {str(e)}"
            }
    
    def _calculate_speech_rate(self, audio_data):
        """
        Calculate approximate speech rate (words per minute)
        This is a simplified estimation based on audio energy patterns
        """
        # Create audio segments based on energy levels
        is_silence = self._detect_silence(audio_data)
        segments = self._count_segments(is_silence)
        
        # Approximate words from segments (a rough estimate)
        estimated_words = max(1, int(segments * 0.7))  # Each segment might contain ~0.7 words on average
        
        # Calculate duration in minutes
        duration_minutes = len(audio_data) / self.sample_rate / 60
        if duration_minutes < 0.001:  # Avoid division by zero
            duration_minutes = 0.001
            
        # Calculate words per minute
        wpm = estimated_words / duration_minutes
        
        # Categorize speech rate
        category = "moderate"
        if wpm < 130:
            category = "slow"
        elif wpm > 170:
            category = "fast"
            
        return {
            "wpm": wpm,
            "category": category
        }
    
    def _calculate_volume(self, audio_data):
        """Calculate volume statistics"""
        # Calculate RMS (Root Mean Square) volume
        rms = np.sqrt(np.mean(np.square(audio_data)))
        
        # Calculate volume variance (for inconsistent volume)
        chunk_size = int(self.sample_rate * 0.1)  # 100ms chunks
        chunks = [audio_data[i:i+chunk_size] for i in range(0, len(audio_data), chunk_size)]
        chunk_volumes = [np.sqrt(np.mean(np.square(chunk))) for chunk in chunks if len(chunk) > 0]
        
        volume_variance = statistics.variance(chunk_volumes) if len(chunk_volumes) > 1 else 0
        
        # Categorize volume
        category = "moderate"
        if rms < 0.05:
            category = "too quiet"
        elif rms > 0.25:
            category = "too loud"
            
        return {
            "average": float(rms),
            "variance": float(volume_variance),
            "category": category
        }
    
    def _calculate_pitch_variation(self, audio_data):
        """
        Estimate pitch variation from audio data
        This is a simplified approach using zero-crossing rate as a proxy
        """
        # Calculate zero-crossing rate in chunks
        chunk_size = int(self.sample_rate * 0.02)  # 20ms chunks
        chunks = [audio_data[i:i+chunk_size] for i in range(0, len(audio_data), chunk_size)]
        
        # Calculate zero crossing rate for each chunk
        zcr_values = []
        for chunk in chunks:
            if len(chunk) > 1:
                zcr = sum(abs(np.diff(np.signbit(chunk)))) / (2 * len(chunk))
                zcr_values.append(zcr)
        
        if not zcr_values:
            return {"variation": 0, "category": "monotone"}
            
        # Calculate statistics
        zcr_mean = statistics.mean(zcr_values)
        zcr_std = statistics.stdev(zcr_values) if len(zcr_values) > 1 else 0
        
        # Normalize for a 0-1 scale
        pitch_variation = min(1.0, zcr_std / max(zcr_mean, 0.001))
        
        # Categorize pitch variation
        category = "moderate"
        if pitch_variation < 0.3:
            category = "monotone"
        elif pitch_variation > 0.7:
            category = "highly varied"
            
        return {
            "variation": float(pitch_variation),
            "category": category
        }
    
    def _analyze_pauses(self, audio_data):
        """Analyze pauses in speech"""
        is_silence = self._detect_silence(audio_data)
        
        # Count silence segments longer than 500ms (0.5 seconds)
        min_pause_samples = int(self.sample_rate * 0.5)
        pause_count = 0
        current_pause = 0
        
        # Track all pauses for calculating statistics
        all_pauses = []
        
        for is_silent in is_silence:
            if is_silent:
                current_pause += 1
            else:
                if current_pause >= min_pause_samples:
                    pause_count += 1
                    all_pauses.append(current_pause / self.sample_rate)  # Convert to seconds
                current_pause = 0
        
        # Check if the audio ends with a pause
        if current_pause >= min_pause_samples:
            pause_count += 1
            all_pauses.append(current_pause / self.sample_rate)
        
        # Calculate pause rate (pauses per minute)
        duration_minutes = len(audio_data) / self.sample_rate / 60
        if duration_minutes < 0.001:  # Avoid division by zero
            duration_minutes = 0.001
        
        pause_rate = pause_count / duration_minutes
        
        # Calculate average pause duration
        avg_pause_duration = statistics.mean(all_pauses) if all_pauses else 0
        
        # Categorize pause frequency
        category = "moderate"
        if pause_rate < 4:
            category = "few"
        elif pause_rate > 12:
            category = "frequent"
            
        return {
            "count": pause_count,
            "rate_per_minute": float(pause_rate),
            "avg_duration": float(avg_pause_duration),
            "category": category
        }
    
    def _detect_silence(self, audio_data, threshold=0.02):
        """Detect silent parts in audio data"""
        # Calculate short-term energy
        frame_length = int(self.sample_rate * 0.02)  # 20ms frame
        energies = []
        
        for i in range(0, len(audio_data), frame_length):
            frame = audio_data[i:i+frame_length]
            if len(frame) > 0:
                energies.append(np.mean(np.square(frame)))
        
        # Label frames as silence or speech
        is_silence = [energy < threshold for energy in energies]
        
        # Expand labels to match original audio length
        expanded_labels = []
        for label in is_silence:
            expanded_labels.extend([label] * frame_length)
        
        # Trim to original length
        expanded_labels = expanded_labels[:len(audio_data)]
        
        # Fill if needed
        if len(expanded_labels) < len(audio_data):
            expanded_labels.extend([is_silence[-1] if is_silence else False] * (len(audio_data) - len(expanded_labels)))
            
        return expanded_labels
    
    def _count_segments(self, is_silence):
        """Count speech segments based on silence detection"""
        segments = 0
        in_segment = False
        
        for is_silent in is_silence:
            if not is_silent and not in_segment:
                in_segment = True
                segments += 1
            elif is_silent:
                in_segment = False
                
        return segments
    
    def _calculate_confidence_score(self):
        """Calculate an overall confidence score based on audio features"""
        if not self.audio_features:
            return 0.5  # Default middle score
        
        scores = []
        
        # Speech rate factor
        if "speech_rate" in self.audio_features:
            rate = self.audio_features["speech_rate"].get("wpm", 150)
            # Score highest for 130-170 WPM (optimal range)
            if 130 <= rate <= 170:
                scores.append(1.0)
            else:
                # Penalize for being too fast or too slow
                deviation = min(abs(rate - 150), 100) / 100  # Normalize to 0-1
                scores.append(1.0 - deviation)
        
        # Volume factor
        if "volume" in self.audio_features:
            volume = self.audio_features["volume"].get("average", 0.15)
            # Score highest for 0.05-0.25 volume (optimal range)
            if 0.05 <= volume <= 0.25:
                scores.append(1.0)
            else:
                # Penalize for being too quiet or too loud
                if volume < 0.05:
                    deviation = 1 - (volume / 0.05)  # Normalize to 0-1
                else:  # volume > 0.25
                    deviation = min((volume - 0.25) / 0.25, 1.0)  # Normalize to 0-1
                scores.append(1.0 - deviation)
        
        # Pitch variation factor
        if "pitch_variation" in self.audio_features:
            variation = self.audio_features["pitch_variation"].get("variation", 0.5)
            # Score highest for 0.3-0.7 variation (optimal range)
            if 0.3 <= variation <= 0.7:
                scores.append(1.0)
            else:
                # Penalize for being too monotone or too varied
                if variation < 0.3:
                    deviation = 1 - (variation / 0.3)  # Normalize to 0-1
                else:  # variation > 0.7
                    deviation = min((variation - 0.7) / 0.3, 1.0)  # Normalize to 0-1
                scores.append(1.0 - deviation)
        
        # Pause factor
        if "pause_analysis" in self.audio_features:
            pause_rate = self.audio_features["pause_analysis"].get("rate_per_minute", 8)
            # Score highest for 4-12 pauses per minute (optimal range)
            if 4 <= pause_rate <= 12:
                scores.append(1.0)
            else:
                # Penalize for too few or too many pauses
                if pause_rate < 4:
                    deviation = 1 - (pause_rate / 4)  # Normalize to 0-1
                else:  # pause_rate > 12
                    deviation = min((pause_rate - 12) / 8, 1.0)  # Normalize to 0-1
                scores.append(1.0 - deviation)
        
        # Calculate overall score
        if scores:
            return float(sum(scores) / len(scores))
        else:
            return 0.5  # Default middle score

def get_speech_config():
    """Get Azure Speech SDK configuration"""
    try:
        speech_config = speechsdk.SpeechConfig(
            subscription=SPEECH_KEY, 
            region=SPEECH_REGION
        )
        speech_config.speech_recognition_language = "en-US"
        return speech_config
    except Exception as e:
        print(f"Error creating speech config: {str(e)}")
        return None

def transcribe_audio(audio_data):
    """
    Transcribe audio data using Azure Speech-to-Text
    
    Args:
        audio_data (bytes): The audio data to transcribe
        
    Returns:
        dict: Transcription results with text and confidence
    """
    speech_config = get_speech_config()
    if not speech_config:
        return {"error": "Failed to initialize speech config"}
    
    try:
        # Create an audio stream from the audio data
        audio_stream = speechsdk.audio.PushAudioInputStream()
        audio_stream.write(audio_data)
        audio_stream.close()
        
        # Create audio config from the stream
        audio_config = speechsdk.audio.AudioConfig(stream=audio_stream)
        
        # Create speech recognizer
        speech_recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config,
            audio_config=audio_config
        )
        
        # Perform one-shot recognition
        result = speech_recognizer.recognize_once_async().get()
        
        # Process the recognition result
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return {
                "text": result.text,
                "confidence": 0.9  # Azure doesn't directly provide confidence for recognize_once
            }
        elif result.reason == speechsdk.ResultReason.NoMatch:
            return {"error": "No speech could be recognized"}
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation = speechsdk.CancellationDetails.from_result(result)
            if cancellation.reason == speechsdk.CancellationReason.Error:
                return {"error": f"Speech recognition error: {cancellation.error_details}"}
            else:
                return {"error": "Speech recognition canceled"}
    except Exception as e:
        print(f"Error transcribing audio: {str(e)}")
        return {"error": f"Transcription failed: {str(e)}"}
    
    return {"error": "Unknown transcription error"}

def transcribe_audio_continuous(audio_stream_callback, result_callback, error_callback, stop_callback):
    """
    Continuously transcribe audio in real-time
    
    Args:
        audio_stream_callback: Callback to get audio chunks
        result_callback: Callback to process transcription results
        error_callback: Callback to handle errors
        stop_callback: Callback to check if transcription should stop
    """
    speech_config = get_speech_config()
    if not speech_config:
        error_callback("Failed to initialize speech config")
        return
    
    try:
        # Configure for continuous recognition
        speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000")
        speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "1000")
        
        # Create push stream for audio
        push_stream = speechsdk.audio.PushAudioInputStream()
        audio_config = speechsdk.audio.AudioConfig(stream=push_stream)
        
        # Create speech recognizer
        speech_recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config,
            audio_config=audio_config
        )
        
        # Connect callbacks
        speech_recognizer.recognized.connect(
            lambda evt: result_callback({
                "text": evt.result.text,
                "confidence": 0.9,  # Azure doesn't directly provide confidence for continuous recognition
                "is_final": True
            })
        )
        
        speech_recognizer.recognizing.connect(
            lambda evt: result_callback({
                "text": evt.result.text,
                "confidence": 0.7,  # Lower confidence for interim results
                "is_final": False
            })
        )
        
        speech_recognizer.canceled.connect(
            lambda evt: error_callback(f"Recognition canceled: {evt.error_details if evt.reason == speechsdk.CancellationReason.Error else 'Unknown'}")
        )
        
        # Start continuous recognition
        speech_recognizer.start_continuous_recognition_async()
        
        # Process audio in a loop
        try:
            chunk_size = 4096  # Audio chunk size
            while not stop_callback():
                audio_chunk = audio_stream_callback(chunk_size)
                if not audio_chunk:
                    break
                push_stream.write(audio_chunk)
                time.sleep(0.1)  # Small delay to prevent CPU overuse
        finally:
            # Stop recognition and close stream
            push_stream.close()
            speech_recognizer.stop_continuous_recognition_async()
    
    except Exception as e:
        error_msg = f"Error in continuous transcription: {str(e)}"
        print(error_msg)
        error_callback(error_msg)

def detect_filler_words(transcript):
    """
    Detect filler words in transcript
    
    Args:
        transcript (str): The transcribed text
        
    Returns:
        dict: Statistics about filler words
    """
    # Common filler words to detect
    filler_words = [
        "um", "uh", "ah", "er", "like", "you know", "so", "actually", 
        "basically", "literally", "kind of", "sort of", "i mean"
    ]
    
    # Normalize transcript
    normalized = transcript.lower()
    
    # Find all occurrences of filler words
    filler_counts = {}
    total_count = 0
    
    for word in filler_words:
        # Count non-overlapping occurrences
        count = 0
        start = 0
        while True:
            start = normalized.find(f" {word} ", start)
            if start == -1:
                break
            count += 1
            start += len(word) + 1
        
        # Add boundary cases (start/end of text)
        if normalized.startswith(f"{word} "):
            count += 1
        if normalized.endswith(f" {word}"):
            count += 1
            
        # Store count if any found
        if count > 0:
            filler_counts[word] = count
            total_count += count
    
    # Calculate word count (rough approximation)
    words = transcript.split()
    word_count = len(words)
    
    # Calculate filler word percentage
    filler_percentage = (total_count / max(1, word_count)) * 100
    
    # Determine category
    category = "low"
    if filler_percentage > 10:
        category = "high"
    elif filler_percentage > 5:
        category = "moderate"
    
    return {
        "filler_words": filler_counts,
        "total_count": total_count,
        "percentage": filler_percentage,
        "category": category
    } 
