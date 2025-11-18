# 💬 LinguaShift - AI-Powered Corporate Messaging Platform

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)

[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)

[![Python](https://img.shields.io/badge/Python-3.11+-yellow.svg)](https://python.org/)

[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://mongodb.com/)

[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-purple.svg)](https://openai.com/)

[![LangChain](https://img.shields.io/badge/LangChain-AI%20Framework-purple.svg)](https://langchain.com/)

[![RoBERTa](https://img.shields.io/badge/RoBERTa-ML%20Model-orange.svg)](https://huggingface.co/roberta-base)

[![Flask](https://img.shields.io/badge/Flask-ML%20Service-red.svg)](https://flask.palletsprojects.com/)

[![Vite](https://img.shields.io/badge/Vite-Build%20Tool-yellow.svg)](https://vitejs.dev/)

[![TipTap](https://img.shields.io/badge/TipTap-Rich%20Text%20Editor-blue.svg)](https://tiptap.dev/)

AI-powered team messaging platform that detects jargon in real-time and suggests clearer alternatives tailored to your audience—from engineers to executives.

## 🚀 Main Features

### 1. Real-Time Jargon Detection 🔍

**AI-Powered Detection**: As you type, LinguaShift uses a fine-tuned RoBERTa model to identify technical jargon, business buzzwords, and complex terminology in your messages.

- **Visual Highlighting**: Jargon terms are automatically highlighted with inline tooltips
- **Confidence Scores**: Each detected term includes a confidence score
- **Jargon Score Bar**: Overall message clarity displayed as "Clear", "Mixed", or "Heavy" jargon
- **Organization Glossary**: Custom terms from your organization's glossary are automatically flagged

### 2. AI-Powered Rewrite Suggestions ✨

**GPT-4 Integration**: Get intelligent rewrite suggestions powered by OpenAI's GPT-4o-mini via LangChain.

- **Audience Adaptation**: Rewrite messages for Product Managers, Executives, Sales teams, or Non-technical stakeholders
- **Tone Presets**: Adjust tone to Neutral, Friendly, Formal, or Very Concise
- **Side-by-Side Comparison**: View original and rewritten versions side-by-side
- **Editable Rewrites**: Fine-tune AI suggestions before sending
- **Glossary-Aware**: Rewrites respect your organization's preferred plain-language terms

### 3. Team Messaging Platform 💬

**Slack-like Interface**: Full-featured messaging app with modern, aesthetic design.

- **Group Channels**: Create channels for team discussions
- **Direct Messages**: Private 1-on-1 conversations
- **User Search**: Find team members by name or email
- **Message Threading**: Organize conversations with replies
- **Real-time Updates**: Live message synchronization across users
- **Message Actions**: Edit, delete, and reply to messages

### 4. Personalization & Organization Settings 🎯

**Customizable Profiles**: Tailor jargon detection and rewrites to your needs.

- **Audience Presets**: Set default audience for your messages (PMs, Execs, Sales, etc.)
- **Tone Preferences**: Choose your preferred communication style
- **Organization Glossary**: Define company-specific terms with plain-language alternatives
- **Department & Role**: Organize users by department and role

## 🛠️ Technologies Used

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

## 🎬 How to Run the Code

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

## 📋 Quick Start Checklist

- [ ] MongoDB Atlas connection string in `backend/.env`
- [ ] OpenAI API key in `backend/.env`
- [ ] JWT secret key in `backend/.env`
- [ ] ML service running on port 5001
- [ ] Backend server running on port 4000
- [ ] Frontend dev server running on port 5173

## 🎯 Usage

1. **Register/Login**: Create an account or sign in
2. **Create Channels**: Set up group channels or start direct messages
3. **Type Messages**: As you type, jargon is automatically detected and highlighted
4. **Get Rewrites**: Click "Rewrite" to get AI-powered suggestions
5. **Customize**: Adjust audience and tone settings
6. **Send**: Share clear, jargon-free messages with your team

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
