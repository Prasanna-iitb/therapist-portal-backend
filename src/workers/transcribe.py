import whisper
import sys
import json
import os

def transcribe_audio(audio_path, model_name="tiny", language="en"):
    """
    Transcribe audio file using OpenAI Whisper model
    
    Args:
        audio_path: Path to the audio file
        model_name: Whisper model to use (tiny, base, small, medium, large)
        language: Language code (e.g., 'en' for English)
    
    Returns:
        dict: Transcription result with text, language, and duration
    """
    try:
        print(f"Loading Whisper {model_name} model...", file=sys.stderr)
        model = whisper.load_model(model_name)
        
        print(f"Transcribing: {audio_path}", file=sys.stderr)
        result = model.transcribe(audio_path, language=language)
        
        # Extract relevant information
        output = {
            "text": result["text"],
            "language": result.get("language", language),
            "duration": result.get("duration", 0),
            "segments": result.get("segments", [])
        }
        
        print(f"Transcription completed successfully", file=sys.stderr)
        return output
        
    except Exception as e:
        print(f"Error during transcription: {str(e)}", file=sys.stderr)
        raise

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <audio_file_path> [model_name] [language]", file=sys.stderr)
        sys.exit(1)
    
    audio_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "tiny"
    language = sys.argv[3] if len(sys.argv) > 3 else "en"
    
    if not os.path.exists(audio_path):
        print(f"Error: Audio file not found: {audio_path}", file=sys.stderr)
        sys.exit(1)
    
    result = transcribe_audio(audio_path, model_name, language)
    
    # Output JSON to stdout
    print(json.dumps(result, indent=2))
