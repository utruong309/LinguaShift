from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import RobertaTokenizerFast, RobertaForTokenClassification
import os

app = Flask(__name__)
CORS(app)

# Global variables for model and tokenizer
jargon_model = None
jargon_tokenizer = None
device = None

def load_jargon_model():
    """Load the fine-tuned jargon detection model"""
    global jargon_model, jargon_tokenizer, device
    
    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Paths to your fine-tuned model
    model_path = os.environ.get('JARGON_MODEL_PATH', 'best_jargon_model.pt')
    tokenizer_path = os.environ.get('JARGON_TOKENIZER_PATH', './jargon_model')
    
    try:
        # Load tokenizer
        print(f"Loading tokenizer from {tokenizer_path}...")
        jargon_tokenizer = RobertaTokenizerFast.from_pretrained(tokenizer_path)
        
        # Load model
        print(f"Loading model from {model_path}...")
        jargon_model = RobertaForTokenClassification.from_pretrained(
            'roberta-base',
            num_labels=2  # 0: Non-jargon, 1: Jargon
        )
        
        # Load the fine-tuned weights
        state_dict = torch.load(model_path, map_location=device)
        jargon_model.load_state_dict(state_dict)
        
        # Move model to device and set to evaluation mode
        jargon_model.to(device)
        jargon_model.eval()
        
        print("Model loaded successfully!")
        return True
        
    except FileNotFoundError as e:
        print(f"Error: Model files not found - {e}")
        print("Please ensure you have:")
        print(f"  1. Model weights at: {model_path}")
        print(f"  2. Tokenizer files at: {tokenizer_path}")
        print("\nFalling back to rule-based detection...")
        return False
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Falling back to rule-based detection...")
        return False

# Try to load model on startup
MODEL_LOADED = load_jargon_model()

def detect_jargon_with_model(text, tokenizer, model, device):
    """Detect jargon using the fine-tuned model"""
    # Tokenize
    encoding = tokenizer(
        text,
        return_tensors='pt',
        return_offsets_mapping=True,
        padding=True,
        truncation=True,
        max_length=512
    )
    
    input_ids = encoding['input_ids'].to(device)
    attention_mask = encoding['attention_mask'].to(device)
    offset_mapping = encoding['offset_mapping'][0]
    
    # Get predictions
    with torch.no_grad():
        outputs = model(input_ids=input_ids, attention_mask=attention_mask)
        predictions = torch.argmax(outputs.logits, dim=-1)[0]
        probs = torch.softmax(outputs.logits, dim=-1)[0]
    
    # Extract jargon spans
    jargon_spans = []
    current_span = None
    
    for i, (pred, prob, (start, end)) in enumerate(zip(predictions, probs, offset_mapping)):
        # Skip special tokens
        if start == 0 and end == 0:
            continue
        
        if pred == 1:  # Jargon detected
            confidence = prob[1].item()
            
            if current_span is None:
                current_span = {
                    'start': int(start),
                    'end': int(end),
                    'confidence': confidence
                }
            else:
                # Extend current span
                current_span['end'] = int(end)
                current_span['confidence'] = max(current_span['confidence'], confidence)
        else:
            # End of jargon span
            if current_span is not None:
                term = text[current_span['start']:current_span['end']]
                jargon_spans.append({
                    'start': current_span['start'],
                    'end': current_span['end'],
                    'confidence': current_span['confidence'],
                    'term': term,
                    'suggestion': f'Consider simplifying "{term}"'
                })
                current_span = None
    
    # Don't forget the last span if it exists
    if current_span is not None:
        term = text[current_span['start']:current_span['end']]
        jargon_spans.append({
            'start': current_span['start'],
            'end': current_span['end'],
            'confidence': current_span['confidence'],
            'term': term,
            'suggestion': f'Consider simplifying "{term}"'
        })
    
    return jargon_spans

def detect_jargon_rule_based(text):
    """Fallback rule-based jargon detection"""
    # Common business jargon patterns
    jargon_terms = [
        'KPI', 'KPIs', 'OKR', 'OKRs', 'MRR', 'ARR', 'CAC', 'LTV',
        'synerg', 'leverage', 'bandwidth', 'circle back', 'touch base',
        'deep dive', 'drill down', 'move the needle', 'low-hanging fruit',
        'paradigm shift', 'core competenc', 'best practice', 'value-add',
        'deliverable', 'action item', 'stakeholder', 'think outside the box',
        'take it offline', 'boil the ocean', 'ballpark', 'ping',
        'deck', 'standup', 'sprint', 'velocity', 'north star metric',
        'unit economics', 'burn rate', 'runway'
    ]
    
    spans = []
    text_lower = text.lower()
    
    for term in jargon_terms:
        term_lower = term.lower()
        start = 0
        while True:
            idx = text_lower.find(term_lower, start)
            if idx == -1:
                break
            
            # Check word boundaries
            if (idx == 0 or not text[idx-1].isalnum()) and \
               (idx + len(term) >= len(text) or not text[idx + len(term)].isalnum()):
                spans.append({
                    'start': idx,
                    'end': idx + len(term),
                    'confidence': 0.7,
                    'term': text[idx:idx + len(term)],
                    'suggestion': f'Consider simplifying "{text[idx:idx + len(term)]}"'
                })
            
            start = idx + 1
    
    # Sort by start position and remove duplicates
    spans.sort(key=lambda x: x['start'])
    unique_spans = []
    for span in spans:
        if not any(s['start'] <= span['start'] < s['end'] for s in unique_spans):
            unique_spans.append(span)
    
    return unique_spans

@app.post("/detect-jargon")
def detect_jargon():
    data = request.json or {}
    text = data.get("text", "")
    glossary = data.get("glossary", [])

    if not text.strip():
        return jsonify({"jargon_spans": [], "jargon_score": 0})

    # Use model if loaded, otherwise use rule-based
    if MODEL_LOADED and jargon_model is not None:
        try:
            spans = detect_jargon_with_model(text, jargon_tokenizer, jargon_model, device)
        except Exception as e:
            print(f"Model inference error: {e}")
            spans = detect_jargon_rule_based(text)
    else:
        spans = detect_jargon_rule_based(text)
    
    # Add glossary terms
    for entry in glossary:
        term = entry.get("term", "")
        plain = entry.get("plainLanguage", "")
        
        if term and term.lower() in text.lower():
            idx = text.lower().index(term.lower())
            
            # Check for overlaps with existing spans
            overlaps = any(
                (s["start"] <= idx < s["end"]) or 
                (s["start"] < idx + len(term) <= s["end"])
                for s in spans
            )
            
            if not overlaps:
                spans.append({
                    "start": idx,
                    "end": idx + len(term),
                    "confidence": 0.95,
                    "term": text[idx:idx + len(term)],
                    "suggestion": plain if plain else "Provide a simpler explanation",
                    "from_glossary": True
                })
    
    # Calculate jargon score
    if spans:
        avg_confidence = sum(s["confidence"] for s in spans) / len(spans)
        word_count = len(text.split())
        jargon_score = min(1.0, (len(spans) / max(word_count, 1)) * avg_confidence * 2)
    else:
        jargon_score = 0
    
    return jsonify({
        "jargon_spans": spans,
        "jargon_score": jargon_score
    })

@app.post("/rewrite")
def rewrite():
    data = request.json or {}
    text = data.get("text", "")
    audience = data.get("audience", "PMs")
    tone = data.get("tone", "Neutral")
    glossary = data.get("glossary", [])

    glossary_text = "; ".join(
        f'{item["term"]}: {item["plainLanguage"]}' 
        for item in glossary
    ) if glossary else "None"
    
    rewritten = f"[Rewrite for {audience} in {tone} tone | Glossary: {glossary_text}]\n{text}"
    
    return jsonify({"rewrittenText": rewritten})

@app.get("/health")
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": MODEL_LOADED,
        "device": str(device) if device else "unknown"
    })

if __name__ == "__main__":
    app.run(port=5001, debug=True)