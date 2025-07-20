# AI-Powered Job Application Assistant

An innovative full-stack web application that leverages artificial intelligence to streamline and enhance the job application process for job seekers.

## Introduction

The AI-Powered Job Application Assistant is a comprehensive solution designed to address the challenges faced by job seekers in today's competitive job market. With the increasing complexity of application processes and the growing use of applicant tracking systems (ATS), candidates need intelligent tools to stand out from the crowd.

This application harnesses the power of modern AI technologies—including natural language processing, machine learning, and cognitive services—to provide personalized assistance throughout the entire job application journey. From optimizing resumes to match specific job descriptions to preparing for interviews through AI-driven simulations, this platform offers end-to-end support to maximize your chances of landing your dream job.

The system analyzes application materials using sophisticated algorithms, provides real-time feedback, and continuously learns from user interactions to improve its recommendations. Whether you're a recent graduate entering the job market or an experienced professional looking to change careers, this tool adapts to your unique needs and helps you present your skills and experiences in the most compelling way possible.

## Description

The AI-Powered Job Application Assistant is a comprehensive tool designed to help job seekers optimize their applications through various AI-enhanced features. This project combines frontend and backend technologies to provide a seamless experience for users looking to improve their job application materials and interview skills.

## Features

### Resume Analysis and Tailoring
- AI-powered resume analysis that identifies strengths and weaknesses
- Keyword extraction to match your resume with job descriptions
- Automated suggestions for resume improvements
- Content suggestions based on your resume and the job requirements
- PDF and DOCX resume parsing

### Mock Interview Preparation
- Virtual interview simulation with AI-generated questions
- Real-time feedback on your responses
- BERT analysis for sentiment and content evaluation
- Speech-to-text capabilities for verbal practice
- Industry-specific interview question banks

### Interview Chatbot
- AI chatbot to answer common interview questions using LLaMA 3

### User Profile Management
- Secure user authentication
- Profile customization

## Technologies Used

### Frontend
- React 
- TypeScript 
- Material-UI 
- React Router 
- Axios for API requests
- Context API for state management
- Progressive Web App capabilities

### Backend
- Django 
- Django REST Framework 
- Django CORS Headers 
- SQLite3 database 

### AI Services
- Azure Cognitive Services:
  - Text Analytics API for resume and content analysis
  - Computer Vision for document processing
  - Speech Services for interview practice
- BERT models for interview analysis
- Groq API for natural language processing
- Hugging Face Transformers for text processing
- PyTorch for machine learning components

### Development Tools
- npm for package management
- Create React App for frontend bootstrapping
- Python for backend processing

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Python (v3.8 or higher)
- pip (latest version)
- Git

### Clone the Repository
```bash
git clone https://github.com/yourusername/AI-Powered-Job-Application-Assistant.git
cd AI-Powered-Job-Application-Assistant
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start the development server
cd AI-Powered-Job-Application-Assistant-main
npm start

```
Starting frontend development server at
```
http://localhost:3000/
```

### Backend Setup
```bash
# Navigate to the backend directory and run the backend
cd AI-Powered-Job-Application-Assistant-main/backend
python manage.py runserver

# Create and activate a virtual environment (recommended)
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create a .env file based on the provided example

# Run migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

Starting backend development server at
```
http://127.0.0.1:8000/
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
AZURE_LANGUAGE_KEY=your_azure_language_key
AZURE_LANGUAGE_ENDPOINT=your_azure_language_endpoint
AZURE_VISION_KEY=your_azure_vision_key
AZURE_VISION_ENDPOINT=your_azure_vision_endpoint
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_ENDPOINT=your_azure_speech_endpoint
AZURE_SPEECH_REGION=your_azure_speech_region
GROQ_API_KEY=your_groq_api_key
```

## Usage

1. Register for an account or log in
2. Navigate to the dashboard to access all features
3. Upload your resume for analysis and tailoring
4. Practice interviews with the mock interview tool to get immediate feedback and suggestions
5. AI chatbot to inquire about interview-related questions 

### Admin Access

For administrators, you can access the Django admin interface at:
```
http://127.0.0.1:8000/admin/
```

Admin credentials:
- Username: omen
- Email: omen@example.com
- Password: omen666

> Note: These are development credentials. For production, please use secure credentials and HTTPS.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Azure Cognitive Services for AI capabilities
- Groq API for natural language processing
- The open-source community for the various libraries and tools used
