import os
import json
import re
from difflib import SequenceMatcher
import PyPDF2
import docx
import tempfile

# Import Azure services clients
from . import azure_language_client
from . import azure_vision_client

class ResumeAnalyzer:
    """
    A class to analyze resumes in comparison with job descriptions
    and provide tailoring suggestions using Azure AI services.
    """
    
    def __init__(self):
        self.similarity_threshold = 0.6  # Threshold for considering keywords similar
    
    def extract_text_from_file(self, file_content, file_type):
        """
        Extract text from uploaded files using appropriate methods based on file type.
        
        Args:
            file_content (bytes): The content of the file
            file_type (str): The type/extension of the file
            
        Returns:
            str: The extracted text
        """
        file_type = file_type.lower()
        
        # For PDF files, use Azure Computer Vision if we can, otherwise fall back to PyPDF2
        if file_type == 'pdf':
            try:
                # Try using Azure Computer Vision first
                extracted_text = azure_vision_client.extract_text_from_pdf(file_content)
                
                # If we get an error message back (as a string), fall back to PyPDF2
                if extracted_text.startswith("Error:"):
                    return self._extract_text_from_pdf_with_pypdf2(file_content)
                return extracted_text
            except Exception as e:
                print(f"Azure Vision PDF extraction failed: {str(e)}")
                return self._extract_text_from_pdf_with_pypdf2(file_content)
        
        # For DOCX files
        elif file_type == 'docx':
            try:
                return self._extract_text_from_docx(file_content)
            except Exception as e:
                print(f"DOCX extraction failed: {str(e)}")
                try:
                    return file_content.decode('utf-8')
                except:
                    return "Error: Could not extract text from the provided DOCX file."
        
        # For image files, use Azure Computer Vision
        elif file_type in ['jpg', 'jpeg', 'png', 'bmp', 'gif']:
            try:
                return azure_vision_client.extract_text_from_image(file_content)
            except Exception as e:
                print(f"Image extraction failed: {str(e)}")
                return "Error: Could not extract text from the provided image file."
        
        # For text files or unknown formats, try direct UTF-8 decoding
        else:
            try:
                return file_content.decode('utf-8')
            except UnicodeDecodeError:
                return "Error: Could not extract text from the provided file."
    
    def _extract_text_from_pdf_with_pypdf2(self, pdf_content):
        """Extract text from PDF using PyPDF2 library"""
        try:
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
                temp_file_path = temp_file.name
                temp_file.write(pdf_content)
            
            with open(temp_file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page_num in range(len(reader.pages)):
                    text += reader.pages[page_num].extract_text() + "\n"
            
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass
            
            return text
        except Exception as e:
            print(f"PyPDF2 extraction error: {str(e)}")
            return "Error: Could not extract text from the provided PDF file."
    
    def _extract_text_from_docx(self, docx_content):
        """Extract text from DOCX using python-docx library"""
        try:
            with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as temp_file:
                temp_file_path = temp_file.name
                temp_file.write(docx_content)
            
            doc = docx.Document(temp_file_path)
            text = ""
            for para in doc.paragraphs:
                text += para.text + "\n"
            
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass
            
            return text
        except Exception as e:
            print(f"DOCX extraction error: {str(e)}")
            return "Error: Could not extract text from the provided DOCX file."
    
    def analyze_resume_and_job_description(self, resume_text, job_desc_text):
        """
        Analyze a resume against a job description and provide tailoring suggestions.
        
        Args:
            resume_text (str): The text content of the resume
            job_desc_text (str): The text content of the job description
            
        Returns:
            dict: A dictionary containing analysis results and suggestions
        """
        # Check if text extraction was successful
        if resume_text.startswith("Error:") or job_desc_text.startswith("Error:"):
            return self._generate_error_response(resume_text, job_desc_text)
        
        # Extract key phrases from both documents using Azure Language Service
        resume_key_phrases = azure_language_client.extract_key_phrases(resume_text)
        job_key_phrases = azure_language_client.extract_key_phrases(job_desc_text)
        
        # Analyze the extracted key phrases for technical skills, qualifications, etc.
        technical_skills_in_job = self._extract_technical_skills(job_key_phrases, job_desc_text)
        technical_skills_in_resume = self._extract_technical_skills(resume_key_phrases, resume_text)
        
        # Identify soft skills in both documents
        soft_skills_in_job = self._extract_soft_skills(job_desc_text)
        soft_skills_in_resume = self._extract_soft_skills(resume_text)
        
        # Find keywords missing from the resume but present in the job description
        missing_technical_skills = [skill for skill in technical_skills_in_job 
                                    if not self._has_similar_term(skill, technical_skills_in_resume)]
        
        missing_soft_skills = [skill for skill in soft_skills_in_job 
                               if not self._has_similar_term(skill, soft_skills_in_resume)]
        
        # Analyze resume sentiment using Azure Text Analytics
        sentiment_analysis = azure_language_client.analyze_sentiment(resume_text)
        print("Sentiment Analysis Result from Azure:", sentiment_analysis)
        
        # Ensure the sentiment analysis object has the expected structure
        if not sentiment_analysis or not isinstance(sentiment_analysis, dict):
            sentiment_analysis = {
                "sentiment": "neutral"
            }
        
        # Combine all missing keywords
        keywords_to_add = missing_technical_skills + missing_soft_skills
        
        # Find keywords in the resume that are not relevant to the job description
        keywords_to_remove = [skill for skill in technical_skills_in_resume 
                              if not self._has_similar_term(skill, technical_skills_in_job)]
        
        # Generate content suggestions based on analysis
        content_suggestions = self._generate_content_suggestions(
            resume_text, job_desc_text, 
            technical_skills_in_resume, technical_skills_in_job,
            keywords_to_add
        )
        
        # Calculate match score
        match_score = self._calculate_match_score(
            resume_text, job_desc_text,
            technical_skills_in_resume, technical_skills_in_job,
            soft_skills_in_resume, soft_skills_in_job
        )
        
        # Return the analysis results
        return {
            "keywordsToAdd": keywords_to_add,
            "keywordsToRemove": keywords_to_remove,
            "contentSuggestions": content_suggestions,
            "matchScore": match_score,
            "technicalSkillsMatch": {
                "inJob": technical_skills_in_job,
                "inResume": technical_skills_in_resume,
                "missing": missing_technical_skills
            },
            "softSkillsMatch": {
                "inJob": soft_skills_in_job,
                "inResume": soft_skills_in_resume,
                "missing": missing_soft_skills
            },
            "sentimentAnalysis": sentiment_analysis
        }
    
    def _generate_error_response(self, resume_text, job_desc_text):
        """Generate an error response when text extraction fails"""
        error_messages = []
        if resume_text.startswith("Error:"):
            error_messages.append(resume_text)
        if job_desc_text.startswith("Error:"):
            error_messages.append(job_desc_text)
        
        return {
            "keywordsToAdd": [],
            "keywordsToRemove": [],
            "contentSuggestions": error_messages,
            "matchScore": 0,
            "technicalSkillsMatch": {"inJob": [], "inResume": [], "missing": []},
            "softSkillsMatch": {"inJob": [], "inResume": [], "missing": []},
            "sentimentAnalysis": {
                "sentiment": "neutral"
            }
        }
    
    def _extract_technical_skills(self, key_phrases, full_text):
        """
        Extract technical skills from key phrases and full text.
        
        Args:
            key_phrases (list): List of key phrases extracted from text
            full_text (str): The full text content
            
        Returns:
            list: A list of identified technical skills
        """
        # Expanded list of common technical skills by domain/category
        tech_skills_database = {
            "programming_languages": [
                'python', 'java', 'javascript', 'js', 'typescript', 'ts', 'c#', 'c++', 'c', 'go', 'golang',
                'ruby', 'scala', 'kotlin', 'swift', 'objective-c', 'php', 'perl', 'r', 'matlab', 'rust', 
                'dart', 'haskell', 'groovy', 'bash', 'powershell', 'lua', 'cobol', 'fortran'
            ],
            
            "web_tech": [
                'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'material ui', 'responsive design',
                'rest', 'restful', 'graphql', 'soap', 'ajax', 'json', 'xml', 'jwt', 'oauth', 'ssr', 'webpack',
                'babel', 'styled-components', 'css modules', 'cors', 'grpc', 'http', 'https', 'sse', 'websocket'
            ],
            
            "frontend_frameworks": [
                'react', 'reactjs', 'angular', 'angularjs', 'vue', 'vuejs', 'redux', 'svelte', 'next.js',
                'nuxt.js', 'gatsby', 'ember', 'jquery', 'backbone.js', 'lit', 'solid.js'
            ],
            
            "backend_frameworks": [
                'express', 'django', 'flask', 'spring', 'spring boot', 'rails', 'ruby on rails', 'asp.net',
                'laravel', 'symfony', 'fastapi', 'nest.js', 'gin', 'phoenix', 'play', 'quarkus', 'sails.js',
                'strapi', 'meteor'
            ],
            
            "mobile": [
                'android', 'ios', 'swift', 'flutter', 'react native', 'xamarin', 'ionic', 'kotlin', 'swiftui',
                'uikit', 'jetpack compose', 'android studio', 'xcode', 'objective-c', 'mobile development'
            ],
            
            "databases": [
                'sql', 'mysql', 'postgresql', 'oracle', 'mongodb', 'cassandra', 'redis', 'sqlite',
                'dynamodb', 'couchdb', 'firebase', 'neo4j', 'elasticsearch', 'mariadb', 'cosmosdb',
                'nosql', 'rdbms', 'sql server', 'mssql', 'oledb', 'jdbc', 'odbc', 'erd'
            ],
            
            "cloud_providers": [
                'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud', 'heroku',
                'digital ocean', 'ibm cloud', 'openstack', 'alibaba cloud', 'tencent cloud', 'oracle cloud',
                'linode', 'cloudflare'
            ],
            
            "devops": [
                'docker', 'kubernetes', 'k8s', 'terraform', 'jenkins', 'github actions', 'gitlab ci',
                'circleci', 'travis ci', 'ansible', 'puppet', 'chef', 'ci/cd', 'github', 'gitlab',
                'bitbucket', 'prometheus', 'grafana', 'elk', 'istio', 'helm', 'openshift'
            ],
            
            "data_science": [
                'pandas', 'numpy', 'scikit-learn', 'scipy', 'matplotlib', 'tensorflow', 'pytorch', 'keras',
                'machine learning', 'ml', 'deep learning', 'dl', 'neural networks', 'cnn', 'rnn', 'lstm',
                'computer vision', 'cv', 'nlp', 'natural language processing', 'ai', 'artificial intelligence',
                'data mining', 'big data', 'spark', 'hadoop', 'mapreduce', 'tableau', 'power bi'
            ],
            
            "version_control": [
                'git', 'github', 'gitlab', 'bitbucket', 'svn', 'subversion', 'mercurial', 'git flow',
                'version control'
            ],
            
            "methodologies": [
                'agile', 'scrum', 'kanban', 'waterfall', 'tdd', 'bdd', 'xp', 'lean', 'devops',
                'ci/cd', 'sre', 'site reliability engineering', 'itil'
            ],
            
            "tools": [
                'vscode', 'visual studio', 'intellij', 'pycharm', 'eclipse', 'atom', 'sublime text',
                'notepad++', 'postman', 'insomnia', 'jira', 'confluence', 'slack', 'trello', 'notion',
                'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator'
            ]
        }
        
        # Combine all categories for a flat list
        common_tech_skills = []
        for category, skills in tech_skills_database.items():
            common_tech_skills.extend(skills)

        # Extract potential technical skills from key phrases
        tech_skills = []
        
        # Add common tech skills found in the key phrases or text
        for skill in common_tech_skills:
            # Look for the skill as a standalone word or part of a phrase
            pattern = r'\b' + re.escape(skill) + r'\b'
            if (any(re.search(pattern, phrase, re.IGNORECASE) for phrase in key_phrases) or
                re.search(pattern, full_text, re.IGNORECASE)):
                # Add the skill if it's not already in the list
                if skill not in [s.lower() for s in tech_skills]:
                    tech_skills.append(skill)
        
        # Extract multi-word technical skills from key phrases
        for phrase in key_phrases:
            words = phrase.lower().split()
            # If the phrase contains technical keywords, add it
            tech_keywords = ['software', 'developer', 'engineer', 'programming', 'development',
                            'system', 'database', 'web', 'mobile', 'cloud', 'data', 'network',
                            'security', 'fullstack', 'frontend', 'backend', 'devops', 'architecture',
                            'api', 'service', 'infrastructure', 'platform', 'framework', 'library',
                            'stack', 'design', 'coding', 'script', 'app', 'application', 'server',
                            'client', 'interface', 'orm', 'repository', 'module', 'package', 'dependency']
            
            if any(keyword in words for keyword in tech_keywords) and 2 <= len(words) <= 5:
                if phrase not in tech_skills:
                    tech_skills.append(phrase)
        
        # Look for common technology patterns
        tech_patterns = [
            # Databases with specific versions or contexts
            r'(my|postgre|ms)sql( server)?( \d+)?',
            # Cloud services
            r'(aws|azure|gcp)( lambda| ec2| s3| rds| redshift| ecs| eks| vm| functions)?',
            # Languages with versions
            r'(python|java|php|ruby)( \d+(\.\d+)*)?',
            # Frameworks with versions
            r'(react|angular|vue|django|spring|rails)( js)?( \d+(\.\d+)*)?',
            # Containerization technologies
            r'(docker|kubernetes|k8s|openshift)( swarm| compose| container)?',
            # Methodologies and practices
            r'(agile|scrum|kanban|waterfall)( methodology)?',
            # Testing frameworks
            r'(junit|pytest|jest|mocha|chai|jasmine|selenium|cypress|testng)',
            # DevOps tools
            r'(jenkins|github actions|gitlab ci|circleci|travis)'
        ]
        
        for pattern in tech_patterns:
            for match in re.finditer(pattern, full_text.lower()):
                skill = match.group(0).strip()
                if skill and skill not in tech_skills:
                    tech_skills.append(skill)
        
        return tech_skills
    
    def _extract_soft_skills(self, text):
        """
        Extract soft skills from text.
        
        Args:
            text (str): The text to analyze
            
        Returns:
            list: A list of identified soft skills
        """
        common_soft_skills = [
            'leadership', 'teamwork', 'communication', 'problem solving', 'problem-solving',
            'critical thinking', 'time management', 'creativity', 'adaptability', 'flexibility',
            'organization', 'organizational', 'attention to detail', 'interpersonal',
            'collaboration', 'team player', 'multitasking', 'decision making', 'decision-making',
            'conflict resolution', 'emotional intelligence', 'negotiation', 'persuasion', 'presentation',
            'customer service', 'work ethic', 'self-motivated', 'self motivated', 'proactive', 'initiative',
            'analytical', 'research', 'resourceful', 'planning', 'mentoring', 'coaching', 'innovative',
            'strategic thinking', 'project management', 'agile'
        ]
        
        text_lower = text.lower()
        found_skills = []
        
        for skill in common_soft_skills:
            if skill in text_lower or skill.replace('-', ' ') in text_lower:
                found_skills.append(skill)
        
        return found_skills
    
    def _has_similar_term(self, term, term_list, threshold=None, is_tech_skill=True):
        """
        Check if a term has a similar match in the term list using contextual similarity.
        
        Args:
            term (str): The term to check
            term_list (list): The list of terms to check against
            threshold (float, optional): The similarity threshold. Defaults to the class threshold.
            is_tech_skill (bool): Whether this is a technical skill comparison
            
        Returns:
            bool: True if a similar term is found, False otherwise
        """
        if threshold is None:
            threshold = self.similarity_threshold
        
        term_lower = term.lower()
        
        # Check for exact matches first (fastest check)
        if term_lower in [t.lower() for t in term_list]:
            return True
        
        # Check if the term is a substring of any term in the list (still fast)
        for list_term in term_list:
            list_term_lower = list_term.lower()
            if term_lower in list_term_lower or list_term_lower in term_lower:
                # If one is a substring of the other, check if they're close enough in length
                if len(min(term_lower, list_term_lower, key=len)) / len(max(term_lower, list_term_lower, key=len)) > threshold:
                    return True
        
        # Use enhanced similarity check for technical skills
        for list_term in term_list:
            # Calculate contextual similarity using improved method
            similarity = azure_language_client.calculate_text_similarity(term, list_term, is_tech_skill=is_tech_skill)
            if similarity > threshold:
                return True
        
        return False
    
    def _identify_irrelevant_keywords(self, resume_skills, job_skills, job_desc_text):
        """
        Identify potentially irrelevant or outdated keywords in the resume.
        
        Args:
            resume_skills (list): Technical skills found in the resume
            job_skills (list): Technical skills found in the job description
            job_desc_text (str): The full text of the job description
            
        Returns:
            list: List of potentially irrelevant keywords
        """
        irrelevant_keywords = []
        
        # List of potentially outdated technologies
        outdated_technologies = [
            'jquery', 'flash', 'actionscript', 'silverlight', 'cobol', 'fortran',
            'pascal', 'vbscript', 'delphi', 'foxpro', 'coffeescript', 'svn', 'cvs'
        ]
        
        for skill in resume_skills:
            skill_lower = skill.lower()
            
            # Check if skill is outdated
            if skill_lower in outdated_technologies:
                irrelevant_keywords.append(skill)
                continue
            
            # Check if skill is not mentioned in job description and not similar to any job skill
            if not self._has_similar_term(skill, job_skills) and skill_lower not in job_desc_text.lower():
                # For short skills (1-2 words), they might be less relevant if not in job description
                if len(skill.split()) <= 2:
                    irrelevant_keywords.append(skill)
        
        return irrelevant_keywords
    
    def _generate_content_suggestions(self, resume_text, job_desc_text, resume_skills, job_skills, keywords_to_add):
        """
        Generate content suggestions for the resume using pretrained language models.
        
        Args:
            resume_text (str): The text content of the resume
            job_desc_text (str): The text content of the job description
            resume_skills (list): The skills found in the resume
            job_skills (list): The skills found in the job description
            keywords_to_add (list): The keywords to add to the resume
            
        Returns:
            list: A list of content suggestions
        """
        suggestions = []
        
        try:
            # Use Azure Language Service to generate more sophisticated content suggestions
            # This now leverages the pre-trained models through Azure services
            
            # First, analyze the resume and job description for key information
            resume_phrases = azure_language_client.extract_key_phrases(resume_text)
            job_phrases = azure_language_client.extract_key_phrases(job_desc_text)
            
            # Use text similarity to find missing important content
            relevant_achievements = []
            achievements_context = "achievements accomplishments results impact outcomes success metrics"
            
            # Check if resume seems achievement-oriented using semantic analysis
            has_achievements = azure_language_client.calculate_text_similarity(resume_text, achievements_context) > 0.3
            
            if not has_achievements:
                suggestions.append("Your resume lacks achievement-oriented language. Add quantifiable results and outcomes for your experiences.")
            
            # Add specific suggestions based on missing keywords
            if keywords_to_add:
                # Get top 3 most important missing keywords for detailed suggestions
                top_keywords = keywords_to_add[:3]
                
                for keyword in top_keywords:
                    # Generate a context-aware suggestion using content from both resume and job description
                    if keyword in job_desc_text.lower():
                        # Find surrounding context for this keyword in job description
                        keyword_index = job_desc_text.lower().find(keyword.lower())
                        start_index = max(0, keyword_index - 100)
                        end_index = min(len(job_desc_text), keyword_index + 100)
                        keyword_context = job_desc_text[start_index:end_index]
                        
                        # Use language model to generate personalized suggestion
                        suggestions.append(f"Add details about your experience with '{keyword}'. The job description specifically mentions this skill in the context of: '{keyword_context.strip()}'")
            
            # Check for active vs. passive voice using language analysis
            result = azure_language_client.analyze_text_quality(resume_text)
            
            # Suggest stronger action verbs if needed
            if result.get('passive_voice_ratio', 0) > 0.3:  # If more than 30% is passive voice
                suggestions.append("Use more active voice and stronger action verbs to describe your experience.")
                
                # Provide specific examples of passive phrases to improve
                passive_examples = result.get('passive_examples', [])
                if passive_examples and len(passive_examples) > 0:
                    for i, example in enumerate(passive_examples[:2]):  # Limit to 2 examples
                        suggestions.append(f"Replace passive phrase '{example['original']}' with active alternative like '{example['suggestion']}'")
            
            # Suggest more impactful statements for experience sections
            experience_section = self._extract_section(resume_text, ["experience", "work experience", "employment"])
            if experience_section:
                impact_score = azure_language_client.calculate_text_similarity(experience_section, "achieved improved increased decreased launched created managed led")
                if impact_score < 0.4:
                    suggestions.append("Enhance your experience descriptions with more impactful action verbs like 'achieved', 'improved', 'increased', 'launched' or 'led'.")
            
            # Check for specific qualities mentioned in the job but missing in the resume
            job_qualities = set(self._extract_soft_skills(job_desc_text))
            resume_qualities = set(self._extract_soft_skills(resume_text))
            missing_qualities = job_qualities - resume_qualities
            
            if missing_qualities:
                top_qualities = list(missing_qualities)[:2]
                for quality in top_qualities:
                    suggestions.append(f"Demonstrate the '{quality}' quality mentioned in the job description with specific examples from your experience.")
            
            # Ensure we have at least some suggestions
            if not suggestions:
                suggestions.append("Tailor your resume to highlight more accomplishments and specific results relevant to the job description.")
                suggestions.append("Use numbers and metrics to quantify your achievements and responsibilities.")
        
        except Exception as e:
            print(f"Error generating content suggestions with Azure ML models: {str(e)}")
            # Fallback to basic suggestions if there's an error
            suggestions = [
                "Tailor your resume to highlight skills and experiences relevant to the job description.",
                "Use numbers and metrics to quantify your achievements and responsibilities.",
                "Focus on results and accomplishments rather than just listing duties."
            ]
            
            if keywords_to_add:
                suggestions.append(f"Add relevant keywords such as: {', '.join(keywords_to_add[:5])}.")
        
        return suggestions
    
    def _extract_section(self, text, section_names):
        """
        Extract a specific section from resume text.
        
        Args:
            text (str): The resume text
            section_names (list): Possible names of the section to extract
            
        Returns:
            str: The extracted section text, or empty string if not found
        """
        for section_name in section_names:
            # Various formatting patterns for section headers
            patterns = [
                fr'\b{section_name}\s*:?\s*\n(.*?)(?:\n\s*\n|\n\s*[A-Z]|\Z)',
                fr'\b{section_name.upper()}\s*:?\s*\n(.*?)(?:\n\s*\n|\n\s*[A-Z]|\Z)',
                fr'\b{section_name.title()}\s*:?\s*\n(.*?)(?:\n\s*\n|\n\s*[A-Z]|\Z)'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
                if match:
                    return match.group(1).strip()
        
        return ""
    
    def _calculate_match_score(self, resume_text, job_desc_text, resume_tech_skills, job_tech_skills, 
                             resume_soft_skills, job_soft_skills):
        """
        Calculate a match score between resume and job description.
        
        Args:
            resume_text (str): The text content of the resume
            job_desc_text (str): The text content of the job description
            resume_tech_skills (list): Technical skills from the resume
            job_tech_skills (list): Technical skills from the job description
            resume_soft_skills (list): Soft skills from the resume
            job_soft_skills (list): Soft skills from the job description
            
        Returns:
            int: A match score from 0-100
        """
        score_components = []
        
        # 1. Technical skills match (50% of total score)
        if job_tech_skills:
            tech_matches = sum(1 for skill in job_tech_skills 
                             if self._has_similar_term(skill, resume_tech_skills))
            tech_score = min(100, int((tech_matches / len(job_tech_skills)) * 100))
            score_components.append(tech_score * 0.5)
        else:
            score_components.append(50)  # Default if no tech skills found
        
        # 2. Soft skills match (20% of total score)
        if job_soft_skills:
            soft_matches = sum(1 for skill in job_soft_skills 
                             if self._has_similar_term(skill, resume_soft_skills))
            soft_score = min(100, int((soft_matches / len(job_soft_skills)) * 100))
            score_components.append(soft_score * 0.2)
        else:
            score_components.append(20)  # Default if no soft skills found
        
        # 3. Overall text similarity (30% of total score)
        # Calculate Jaccard similarity between the job description and resume
        job_words = set(re.findall(r'\b\w+\b', job_desc_text.lower()))
        resume_words = set(re.findall(r'\b\w+\b', resume_text.lower()))
        
        intersection = len(job_words.intersection(resume_words))
        union = len(job_words.union(resume_words))
        
        if union > 0:
            jaccard_similarity = (intersection / union) * 100
            score_components.append(min(100, int(jaccard_similarity)) * 0.3)
        else:
            score_components.append(0)
        
        # Calculate the final score and ensure it's between 0 and 100
        final_score = min(100, max(0, int(sum(score_components))))
        
        return final_score 