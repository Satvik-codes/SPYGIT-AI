import axios from 'axios';

// Updated to use v1beta and gemini-1.5-flash (or your preferred model)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function generateRepoSummary(
  repoName: string,
  description: string,
  readme: string,
  languages: string[]
): Promise<string> {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const trimmedReadme = readme.length > 1500 ? readme.slice(0, 1500) : readme;

    const prompt = `Please provide a concise, human-friendly summary of this GitHub repository:

Repository Name: ${repoName}
Description: ${description}
Primary Languages: ${languages.join(', ')}

README Content:
${trimmedReadme}

Create a 5-10 line summary that:
1. Explains the project's purpose in simple terms
2. Highlights key features and technologies
3. Describes potential use cases
4. Makes technical concepts accessible to non-developers

Format the response in clear, concise paragraphs.`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('No generated text in response');
    }

    return generatedText.trim();
  } catch (error: any) {
    console.error('Gemini API Error:', {
      message: error.message,
      response: error.response?.data,
      config: error.config,
    });
    return 'Failed to generate summary. Please try again later.';
  }
}