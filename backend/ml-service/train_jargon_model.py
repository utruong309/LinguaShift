import torch
from torch.utils.data import Dataset, DataLoader
from transformers import (
    RobertaTokenizerFast, 
    RobertaForTokenClassification,
    get_linear_schedule_with_warmup
)
from torch.optim import AdamW
from sklearn.model_selection import train_test_split  
from tqdm import tqdm

def create_training_data():
    training_examples = [
        (
            "We need to sync on the KPIs for Q4 and discuss our MRR growth.",
            [(23, 27, "JARGON"), (32, 34, "JARGON"), (50, 53, "JARGON")]
        ),
        (
            "The OKRs should align with our north star metric.",
            [(4, 8, "JARGON"), (32, 49, "JARGON")]
        ),
        (
            "Let's circle back after the standup to discuss the sprint velocity.",
            [(6, 17, "JARGON"), (28, 35, "JARGON"), (54, 69, "JARGON")]
        ),
        (
            "Our CAC is too high and LTV needs improvement for better unit economics.",
            [(4, 7, "JARGON"), (20, 23, "JARGON"), (55, 70, "JARGON")]
        ),
        (
            "Please prepare the deck for the board meeting.",
            [(19, 23, "JARGON")]
        ),
        (
            "We should leverage our core competencies to drive synergies.",
            [(10, 18, "JARGON"), (23, 41, "JARGON"), (51, 59, "JARGON")]
        ),
        (
            "The meeting is scheduled for tomorrow at 3 PM.",
            []
        ),
        (
            "Please review the document and send me your feedback.",
            []
        ),
        (
            "I will be out of office next week for vacation.",
            []
        ),
    ]
    return training_examples


def tokenize_and_align_labels(text, char_labels, tokenizer, max_length=128):
    char_to_label = [0] * len(text) 
    for start, end, label in char_labels:
        for i in range(start, min(end, len(text))):
            char_to_label[i] = 1 # 1 is jargon
    
    encoding = tokenizer(
        text,
        max_length=max_length,
        padding='max_length',
        truncation=True,
        return_offsets_mapping=True,
        return_tensors='pt'
    )
    
    offset_mapping = encoding['offset_mapping'][0]
    labels = []
    
    for i, (start, end) in enumerate(offset_mapping):
        if start == 0 and end == 0:
            labels.append(-100)
        else:
            # Check if majority of characters in token span are jargon
            token_chars = char_to_label[start:end]
            if token_chars and sum(token_chars) > len(token_chars) / 2:
                labels.append(1)  
            else:
                labels.append(0)  
    
    return {
        'input_ids': encoding['input_ids'][0],
        'attention_mask': encoding['attention_mask'][0],
        'labels': torch.tensor(labels)
    }


class JargonDataset(Dataset):
    def __init__(self, texts_and_labels, tokenizer, max_length=128):
        self.encodings = []
        for text, labels in texts_and_labels:
            encoding = tokenize_and_align_labels(text, labels, tokenizer, max_length)
            self.encodings.append(encoding)
    
    def __len__(self):
        return len(self.encodings)
    
    def __getitem__(self, idx):
        return self.encodings[idx]

def train_model(train_loader, val_loader, model, device, epochs=3, lr=5e-5):
    """
    Train the RoBERTa model for jargon detection.
    
    Args:
        train_loader: Training data loader
        val_loader: Validation data loader
        model: RoBERTa model
        device: cuda or cpu
        epochs: Number of training epochs
        lr: Learning rate
    """
    optimizer = AdamW(model.parameters(), lr=lr)
    
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(0.1 * total_steps),
        num_training_steps=total_steps
    )
    
    best_val_loss = float('inf')
    
    for epoch in range(epochs):
        # Training
        model.train()
        train_loss = 0
        train_bar = tqdm(train_loader, desc=f'Epoch {epoch+1}/{epochs} [Train]')
        
        for batch in train_bar:
            optimizer.zero_grad()
            
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)
            
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )
            
            loss = outputs.loss
            loss.backward()
            
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            
            optimizer.step()
            scheduler.step()
            
            train_loss += loss.item()
            train_bar.set_postfix({'loss': loss.item()})
        
        avg_train_loss = train_loss / len(train_loader)
        
        # Validation
        model.eval()
        val_loss = 0
        
        with torch.no_grad():
            for batch in tqdm(val_loader, desc=f'Epoch {epoch+1}/{epochs} [Val]'):
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                labels = batch['labels'].to(device)
                
                outputs = model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )
                
                val_loss += outputs.loss.item()
        
        avg_val_loss = val_loss / len(val_loader)
        
        print(f'\nEpoch {epoch+1}:')
        print(f'  Train Loss: {avg_train_loss:.4f}')
        print(f'  Val Loss: {avg_val_loss:.4f}')
        
        # Save best model
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save(model.state_dict(), 'best_jargon_model.pt')
            print('Saved best model!')

def main():
    print("Starting RoBERTa fine-tuning for jargon detection...")
    
    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Load tokenizer and model
    print("\nLoading tokenizer and model...")
    tokenizer = RobertaTokenizerFast.from_pretrained('roberta-base')
    
    # THE model x
    model = RobertaForTokenClassification.from_pretrained(
        'roberta-base',
        num_labels=2  # 0: Non-jargon, 1: Jargon
    )
    model.to(device)
    
    # Prepare data
    print("\nPreparing training data...")
    training_data = create_training_data()
    
    training_data = training_data * 10  # Simulate more data
    
    # split into training and validation data 
    train_data, val_data = train_test_split(
        training_data, 
        test_size=0.2, 
        random_state=42
    )
    
    print(f"Train examples: {len(train_data)}")
    print(f"Val examples: {len(val_data)}")
    
    # Create datasets
    train_dataset = JargonDataset(train_data, tokenizer)
    val_dataset = JargonDataset(val_data, tokenizer)
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=8, shuffle=False)
    
    # Train model
    print("\nStarting training...")
    train_model(train_loader, val_loader, model, device, epochs=5, lr=5e-5)
    
    print("\nTraining complete! Best model saved as 'best_jargon_model.pt'")
    
    # Save tokenizer
    tokenizer.save_pretrained('./jargon_model')
    print("Tokenizer saved to './jargon_model'")

def load_trained_model(model_path='best_jargon_model.pt'):
    """Load the fine-tuned model for inference."""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    tokenizer = RobertaTokenizerFast.from_pretrained('./jargon_model')
    model = RobertaForTokenClassification.from_pretrained(
        'roberta-base',
        num_labels=2
    )
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    
    return tokenizer, model, device


def detect_jargon(text, tokenizer, model, device, glossary=None):
    """
    Detect jargon in text using the fine-tuned model.
    
    Args:
        text: Input text
        tokenizer: RoBERTa tokenizer
        model: Fine-tuned model
        device: cuda or cpu
        glossary: Optional list of organization-specific terms
    
    Returns:
        Dictionary with jargon_spans and jargon_score
    """
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
        if start == 0 and end == 0:  # Special token
            continue
        
        if pred == 1:  # Jargon
            confidence = prob[1].item()
            
            if current_span is None:
                current_span = {
                    'start': start.item(),
                    'end': end.item(),
                    'confidence': confidence
                }
            else:
                # Extend span
                current_span['end'] = end.item()
                current_span['confidence'] = max(current_span['confidence'], confidence)
        else:
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
    
    if current_span is not None:
        term = text[current_span['start']:current_span['end']]
        jargon_spans.append({
            'start': current_span['start'],
            'end': current_span['end'],
            'confidence': current_span['confidence'],
            'term': term,
            'suggestion': f'Consider simplifying "{term}"'
        })
    
    # Add glossary terms
    if glossary:
        for entry in glossary:
            term = entry.get('term', '')
            plain = entry.get('plainLanguage', '')
            
            if term and term.lower() in text.lower():
                idx = text.lower().index(term.lower())
                
                # Check for overlaps
                overlaps = any(
                    (s['start'] <= idx < s['end']) or 
                    (s['start'] < idx + len(term) <= s['end'])
                    for s in jargon_spans
                )
                
                if not overlaps:
                    jargon_spans.append({
                        'start': idx,
                        'end': idx + len(term),
                        'confidence': 0.95,
                        'term': text[idx:idx + len(term)],
                        'suggestion': plain if plain else 'Provide simpler explanation',
                        'from_glossary': True
                    })
    
    # Calculate jargon score
    jargon_score = (
        len(jargon_spans) / max(len(text.split()), 1) 
        if jargon_spans else 0
    )
    
    return {
        'jargon_spans': jargon_spans,
        'jargon_score': min(1.0, jargon_score * 2)
    }


if __name__ == '__main__':
    # Run training
    main()
    
    # Test inference
    print("\n" + "="*60)
    print("Testing inference with trained model...")
    print("="*60)
    
    tokenizer, model, device = load_trained_model()
    
    test_text = "Let's sync on the KPIs and discuss our MRR growth for Q4."
    result = detect_jargon(test_text, tokenizer, model, device)
    
    print(f"\nTest text: {test_text}")
    print("\nDetected jargon:")
    for span in result['jargon_spans']:
        print(f"  - {span['term']} (confidence: {span['confidence']:.2f})")
    print(f"\nJargon score: {result['jargon_score']:.2f}")