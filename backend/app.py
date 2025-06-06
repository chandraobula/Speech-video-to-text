from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import whisper
import re
import language_tool_python
import numpy as np
import librosa
from noisereduce import reduce_noise
import soundfile as sf
import os
import subprocess
from pydub import AudioSegment
import base64
import google.generativeai as genai
from werkzeug.utils import secure_filename
import tempfile
import uuid
from datetime import datetime
import threading
import time

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'm4a', 'ogg', 'mp4', 'flac'}

# Create directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Gemini setup
GEMINI_API_KEY = "AIzaSyCzRlHcGEi-VQRaPkWLaK_pFP7XO5BWPfU"
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# Global variables for models
whisper_model = None
grammar_tool = None

# Store transcription jobs
transcription_jobs = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_models():
    """Load models in background"""
    global whisper_model, grammar_tool
    try:
        print("Loading Whisper model...")
        whisper_model = whisper.load_model("base")  # Using base for faster processing
        print("Loading grammar tool...")
        grammar_tool = language_tool_python.LanguageTool("en-US")
        print("Models loaded successfully!")
    except Exception as e:
        print(f"Error loading models: {e}")

def convert_to_wav(input_audio_path, output_audio_path):
    """Convert audio file to WAV format"""
    try:
        # Use pydub for better compatibility
        audio = AudioSegment.from_file(input_audio_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(output_audio_path, format="wav")
        return output_audio_path
    except Exception as e:
        print(f"Error during audio conversion: {e}")
        raise

def denoise_audio(input_audio_path, output_audio_path):
    """Reduce noise in audio file"""
    try:
        audio, sr = librosa.load(input_audio_path, sr=16000)
        # Use first 2 seconds as noise profile
        noise_profile = audio[:sr * 2] if len(audio) > sr * 2 else audio[:sr]
        reduced_noise_audio = reduce_noise(y=audio, sr=sr, y_noise=noise_profile)
        sf.write(output_audio_path, reduced_noise_audio, sr)
        return output_audio_path
    except Exception as e:
        print(f"Error during noise reduction: {e}")
        # If noise reduction fails, return original
        return input_audio_path

def split_audio(input_audio_path, segment_duration=300):
    """Split audio into smaller segments"""
    try:
        audio, sr = librosa.load(input_audio_path, sr=16000)
        total_duration = len(audio) / sr
        segments = []

        for start in range(0, int(total_duration), segment_duration):
            end = min(start + segment_duration, int(total_duration))
            segment = audio[start * sr:end * sr]
            
            segment_id = str(uuid.uuid4())
            segment_path = os.path.join(UPLOAD_FOLDER, f"segment_{segment_id}.wav")
            sf.write(segment_path, segment, sr)
            segments.append(segment_path)

        return segments
    except Exception as e:
        print(f"Error splitting audio: {e}")
        return [input_audio_path]

def process_transcription_commands(transcription):
    """Process voice commands in transcription"""
    commands = {
        r"\bfull stop\b": ".",
        r"\bpull stop\b": ".",
        r"\bnext para\b": "\n",
        r"\bnext paragraph\b": "\n",
        r"\bcomma\b": ",",
        r"\bsemicolon\b": ";",
        r"\bcolon\b": ":",
        r"\bquestion mark\b": "?",
        r"\bexclamation mark\b": "!",
        r"\bopen quote\b": '"',
        r"\bclose quote\b": '"',
        r"\bnew line\b": "\n"
    }
    
    for command, symbol in commands.items():
        transcription = re.sub(command, symbol, transcription, flags=re.IGNORECASE)
    
    return transcription

def correct_grammar(transcription):
    """Correct grammar using LanguageTool"""
    try:
        if grammar_tool:
            matches = grammar_tool.check(transcription)
            corrected_text = language_tool_python.utils.correct(transcription, matches)
            return corrected_text
        return transcription
    except Exception as e:
        print(f"Error in grammar correction: {e}")
        return transcription

def encode_audio_base64(path):
    """Encode audio file to base64"""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def transcribe_with_gemini(audio_path):
    """Transcribe using Gemini API"""
    try:
        audio_base64 = encode_audio_base64(audio_path)
        response = gemini_model.generate_content([
            {
                "mime_type": "audio/wav",
                "data": audio_base64
            },
            {
                "text": "Transcribe this audio segment accurately. Include proper punctuation and formatting."
            }
        ])
        return response.text.strip()
    except Exception as e:
        print(f"Error with Gemini transcription: {e}")
        raise

def transcribe_with_whisper(audio_path):
    """Transcribe using Whisper"""
    try:
        if whisper_model is None:
            raise Exception("Whisper model not loaded")
        
        result = whisper_model.transcribe(audio_path)
        return result["text"]
    except Exception as e:
        print(f"Error with Whisper transcription: {e}")
        raise

def process_transcription_job(job_id, audio_path, model_choice, apply_noise_reduction, apply_grammar_correction):
    """Process transcription in background"""
    try:
        transcription_jobs[job_id]['status'] = 'processing'
        transcription_jobs[job_id]['progress'] = 10
        
        # Convert to WAV
        wav_path = os.path.join(UPLOAD_FOLDER, f"converted_{job_id}.wav")
        convert_to_wav(audio_path, wav_path)
        transcription_jobs[job_id]['progress'] = 20
        
        # Apply noise reduction if requested
        if apply_noise_reduction:
            denoised_path = os.path.join(UPLOAD_FOLDER, f"denoised_{job_id}.wav")
            denoise_audio(wav_path, denoised_path)
            wav_path = denoised_path
        
        transcription_jobs[job_id]['progress'] = 30
        
        # Split audio into segments
        segments = split_audio(wav_path, segment_duration=300)
        transcription_jobs[job_id]['progress'] = 40
        
        combined_transcription = ""
        segment_progress = 40
        progress_per_segment = 40 / len(segments)
        
        # Process each segment
        for i, segment in enumerate(segments):
            try:
                if model_choice == "whisper":
                    transcription = transcribe_with_whisper(segment)
                else:  # gemini
                    transcription = transcribe_with_gemini(segment)
                
                # Process voice commands
                processed_transcription = process_transcription_commands(transcription)
                
                # Apply grammar correction if requested
                if apply_grammar_correction:
                    final_transcription = correct_grammar(processed_transcription)
                else:
                    final_transcription = processed_transcription
                
                combined_transcription += final_transcription + "\n"
                
                # Update progress
                segment_progress += progress_per_segment
                transcription_jobs[job_id]['progress'] = min(80, int(segment_progress))
                
                # Clean up segment file
                if os.path.exists(segment):
                    os.remove(segment)
                    
            except Exception as e:
                print(f"Error processing segment {i+1}: {e}")
                continue
        
        transcription_jobs[job_id]['progress'] = 90
        
        # Save final transcription
        output_file = os.path.join(OUTPUT_FOLDER, f"transcription_{job_id}.txt")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(combined_transcription.strip())
        
        # Update job status
        transcription_jobs[job_id].update({
            'status': 'completed',
            'progress': 100,
            'transcription': combined_transcription.strip(),
            'output_file': output_file,
            'completed_at': datetime.now().isoformat()
        })
        
        # Clean up temporary files
        for temp_file in [wav_path, audio_path]:
            if os.path.exists(temp_file):
                os.remove(temp_file)
                
    except Exception as e:
        transcription_jobs[job_id].update({
            'status': 'failed',
            'error': str(e),
            'progress': 0
        })
        print(f"Transcription job {job_id} failed: {e}")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'whisper_loaded': whisper_model is not None,
        'grammar_tool_loaded': grammar_tool is not None
    })

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    """Start transcription job"""
    try:
        # Check if file is present
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not supported'}), 400
        
        # Get options
        model_choice = request.form.get('model', 'whisper')
        apply_noise_reduction = request.form.get('noise_reduction', 'false').lower() == 'true'
        apply_grammar_correction = request.form.get('grammar_correction', 'true').lower() == 'true'
        
        # Validate model choice
        if model_choice not in ['whisper', 'gemini']:
            return jsonify({'error': 'Invalid model choice'}), 400
        
        # Check if models are loaded
        if model_choice == 'whisper' and whisper_model is None:
            return jsonify({'error': 'Whisper model not loaded yet. Please try again in a moment.'}), 503
        
        # Save uploaded file
        job_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"{job_id}_{filename}")
        file.save(file_path)
        
        # Create job entry
        transcription_jobs[job_id] = {
            'id': job_id,
            'status': 'queued',
            'progress': 0,
            'filename': filename,
            'model': model_choice,
            'noise_reduction': apply_noise_reduction,
            'grammar_correction': apply_grammar_correction,
            'created_at': datetime.now().isoformat()
        }
        
        # Start processing in background
        thread = threading.Thread(
            target=process_transcription_job,
            args=(job_id, file_path, model_choice, apply_noise_reduction, apply_grammar_correction)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'job_id': job_id,
            'status': 'queued',
            'message': 'Transcription job started'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/transcribe/<job_id>/status', methods=['GET'])
def get_transcription_status(job_id):
    """Get transcription job status"""
    if job_id not in transcription_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = transcription_jobs[job_id]
    return jsonify(job)

@app.route('/api/transcribe/<job_id>/download', methods=['GET'])
def download_transcription(job_id):
    """Download transcription file"""
    if job_id not in transcription_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = transcription_jobs[job_id]
    if job['status'] != 'completed':
        return jsonify({'error': 'Transcription not completed'}), 400
    
    if 'output_file' not in job or not os.path.exists(job['output_file']):
        return jsonify({'error': 'Output file not found'}), 404
    
    return send_file(
        job['output_file'],
        as_attachment=True,
        download_name=f"transcription_{job['filename']}.txt",
        mimetype='text/plain'
    )

@app.route('/api/models/status', methods=['GET'])
def get_models_status():
    """Get status of loaded models"""
    return jsonify({
        'whisper': {
            'loaded': whisper_model is not None,
            'model_size': 'base' if whisper_model else None
        },
        'grammar_tool': {
            'loaded': grammar_tool is not None
        },
        'gemini': {
            'available': bool(GEMINI_API_KEY)
        }
    })

if __name__ == '__main__':
    # Load models in background
    model_thread = threading.Thread(target=load_models)
    model_thread.daemon = True
    model_thread.start()
    
    # Start Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)
