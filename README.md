# 💬 LinguaShift - AI-Powered Corporate Messaging Platform

AI-powered team messaging platform that detects jargon in real-time and suggests clearer alternatives tailored to your audience, from engineers to executives.

## Main Features

### 1. Real-Time Jargon Detection 
<img width="1145" height="385" alt="Screenshot 2025-11-18 at 2 24 25 AM" src="https://github.com/user-attachments/assets/3cc68e4c-74fe-49d3-af6d-17be7b2bd586" />

**AI-Powered Detection**: As you type, LinguaShift uses a fine-tuned RoBERTa model to identify technical jargon, business buzzwords, and complex terminology in your messages.

- **Visual Highlighting**: Jargon terms are automatically highlighted with inline tooltips
- **Confidence Scores**: Each detected term includes a confidence score
- **Jargon Score Bar**: Overall message clarity displayed as "Clear", "Mixed", or "Heavy" jargon
- **Organization Glossary**: Custom terms from your organization's glossary are automatically flagged

### 2. AI-Powered Rewrite Suggestions 
<img width="1128" height="482" alt="Screenshot 2025-11-18 at 2 25 17 AM" src="https://github.com/user-attachments/assets/e98df765-7fac-4f00-a91d-816332a4f049" />

**GPT-4 Integration**: Get intelligent rewrite suggestions powered by OpenAI's GPT-4o-mini via LangChain.

- **Audience Adaptation**: Rewrite messages for Product Managers, Executives, Sales teams, or Non-technical stakeholders
- **Tone Presets**: Adjust tone to Neutral, Friendly, Formal, or Very Concise
- **Side-by-Side Comparison**: View original and rewritten versions side-by-side
- **Editable Rewrites**: Fine-tune AI suggestions before sending
- **Glossary-Aware**: Rewrites respect your organization's preferred plain-language terms

### 3. Team Messaging Platform 

<img width="1422" height="653" alt="Screenshot 2025-11-18 at 2 23 53 AM" src="https://github.com/user-attachments/assets/1fc3f568-9b30-4458-8059-6cea1d439847" />

**Slack-like Interface**: Full-featured messaging app with modern, aesthetic design.

- **Group Channels**: Create channels for team discussions
- **Direct Messages**: Private 1-on-1 conversations
- **User Search**: Find team members by name or email
- **Message Threading**: Organize conversations with replies
- **Real-time Updates**: Live message synchronization across users
- **Message Actions**: Edit, delete, and reply to messages

### 4. Organization Glossary Management 📚

<img width="1410" height="651" alt="Screenshot 2025-11-18 at 2 21 39 AM" src="https://github.com/user-attachments/assets/f632643e-17d6-49b1-bfb8-5de5786e211c" />

**Company-Specific Terminology**: Create and manage a shared glossary of organization-specific terms that the AI uses for both detection and rewriting.

- **Term Definition**: Add terms, acronyms, or jargon specific to your organization (e.g., "QBR", "OKR", "LTV", "MRR")
- **Plain Language Alternatives**: Define preferred plain-language versions for each term
- **Automatic Detection**: Glossary terms are automatically flagged as jargon in messages
- **AI Integration**: GPT-4 rewrites use glossary terms to ensure consistent, company-approved language
- **Team-Wide Access**: All members of your organization share the same glossary
- **CRUD Operations**: Add, edit, and delete glossary terms through the UI

**How It Works:**
1. Organization admins/members add terms to the glossary with:
   - **Term**: The jargon/acronym (e.g., "QBR")
   - **Explanation**: What it means in your organization (optional)
   - **Plain Language**: Preferred alternative (e.g., "Quarterly Business Review")
2. When users type messages containing glossary terms, they're automatically detected and highlighted
3. AI rewrites replace glossary terms with their plain-language versions
4. Glossary terms get high confidence scores (95%) in jargon detection

**Example Glossary Entry:**
```
Term: "QBR"
Explanation: "Quarterly Business Review - our monthly meeting to review metrics"
Plain Language: "Quarterly Business Review"
```

### 5. Personalization & Organization Settings 

**Customizable Profiles**: Tailor jargon detection and rewrites to your needs.

- **Audience Presets**: Set default audience for your messages (PMs, Execs, Sales, etc.)
- **Tone Preferences**: Choose your preferred communication style
- **Department & Role**: Organize users by department and role

## Technologies Used

**Frontend**: React 19.2.0, Vite, TipTap (Rich Text Editor), Modern CSS, Socket.io Client

**Backend**: Node.js, Express.js, MongoDB with Mongoose ODM, JWT Authentication, bcrypt

**Database**: MongoDB Atlas for scalable cloud storage

**AI & ML**: 
- Python 3.11+, Flask (ML Microservice)
- PyTorch, Transformers (Hugging Face)
- RoBERTa-base model for jargon detection
- OpenAI GPT-4o-mini via LangChain for rewrites

**Authentication**: JWT tokens, bcrypt password hashing

**Real-time**: Socket.io for live message updates

## How to Run the Code

Follow these steps to get LinguaShift up and running on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or above)
- **Python 3.11+** (for ML service)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning the repository)
- **MongoDB Atlas account** (or local MongoDB)
- **OpenAI API key** (for rewrite suggestions)

### 1. Clone the Repository

If you haven't already cloned the repository, run the following command:

```bash
git clone https://github.com/yourusername/linguashift.git
```

Then navigate into the project directory:

```bash
cd linguashift
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key_here
ML_SERVICE_URL=http://localhost:5001
OPENAI_API_KEY=sk-your_openai_api_key_here
PORT=4000
```

### 3. ML Service Setup (Python)

```bash
cd backend/ml-service
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**Optional - Train the Jargon Model:**

If you want to use a fine-tuned model instead of rule-based detection:

```bash
python train_jargon_model.py
```

This will create `best_jargon_model.pt` and `./jargon_model/` directory.

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory (if needed):

```env
VITE_API_URL=http://localhost:4000
```

### 5. Start the Development Servers

You need to run **three services** simultaneously:

#### **Start the ML Service (Flask):**

```bash
cd backend/ml-service
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
python app.py
```

The ML service will run on `http://localhost:5001`

#### **Start the Backend Server (Node.js):**

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:4000`

#### **Start the Frontend Development Server:**

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

### 6. Access the Application

Open your browser and navigate to:

```
http://localhost:5173
```

## Quick Start Checklist

- [ ] MongoDB Atlas connection string in `backend/.env`
- [ ] OpenAI API key in `backend/.env`
- [ ] JWT secret key in `backend/.env`
- [ ] ML service running on port 5001
- [ ] Backend server running on port 4000
- [ ] Frontend dev server running on port 5173

## Usage

1. **Register/Login**: Create an account or sign in
2. **Set Up Glossary** (Optional but Recommended): Add organization-specific terms to your glossary for better detection and rewrites
3. **Create Channels**: Set up group channels or start direct messages
4. **Type Messages**: As you type, jargon is automatically detected and highlighted (including glossary terms)
5. **Get Rewrites**: Click "Rewrite" to get AI-powered suggestions that respect your glossary
6. **Customize**: Adjust audience and tone settings
7. **Send**: Share clear, jargon-free messages with your team

### Managing Your Glossary

To add or manage glossary terms:

1. Navigate to the Glossary Manager (accessible from your organization settings)
2. Click "+ Add Term" to create a new entry
3. Fill in:
   - **Term**: The jargon or acronym (e.g., "QBR")
   - **Explanation**: What it means (optional)
   - **Plain Language**: Preferred alternative (e.g., "Quarterly Business Review")
4. Save - the term is now active for all organization members
5. Edit or delete terms as needed

Glossary terms are automatically:
- Detected in messages (with 95% confidence)
- Used in AI rewrites to ensure consistent language
- Shared across all members of your organization

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
