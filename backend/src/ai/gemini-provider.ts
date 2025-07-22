import axios from 'axios';
import { AIProvider } from './ai-provider';
import { AIAnalysisRequest, ImageMetadata } from '../interfaces/types';

export class GeminiProvider implements AIProvider {
  async analyzeAndGeneratePrompt(apiKey: string, request: AIAnalysisRequest) {
    try {
      console.log(`[GeminiProvider] Analyzing image with Gemini Pro Vision`);

      const prompt = this.buildPrompt(request);

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: request.imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.9,
            topK: 40
          }
        },
        {
          headers: { 
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const candidate = response.data.candidates[0];
      
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Empty response from Gemini API');
      }

      const generatedPrompt = candidate.content.parts[0].text;

      if (!generatedPrompt) {
        throw new Error('No text content in Gemini response');
      }

      console.log(`[GeminiProvider] Successfully generated prompt (${generatedPrompt.length} characters)`);

      return {
        prompt: generatedPrompt.trim(),
        variations: [], // Gemini doesn't support easy variation generation in single call
        confidence: this.calculateConfidence(candidate)
      };

    } catch (error: any) {
      console.error(`[GeminiProvider] Error: ${error.message}`);
      
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.error) {
          if (errorData.error.code === 400) {
            throw new Error('Invalid request to Gemini API. Please check your API key and request format.');
          } else if (errorData.error.code === 403) {
            throw new Error('Invalid or unauthorized Gemini API key');
          } else if (errorData.error.code === 429) {
            throw new Error('Gemini API rate limit exceeded');
          } else {
            throw new Error(`Gemini API error: ${errorData.error.message || 'Unknown error'}`);
          }
        }
      }
      
      throw new Error(`Gemini request failed: ${error.message}`);
    }
  }

  async validateApiKey(apiKey: string): Promise<{
    isValid: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      console.log(`[GeminiProvider] Validating API key`);

      // Make a minimal API call to validate the key
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [
              { text: "Hello" }
            ]
          }],
          generationConfig: {
            maxOutputTokens: 1,
            temperature: 0.1
          }
        },
        {
          headers: { 
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout for validation
        }
      );

      // If we get here without an error, the API key is valid
      console.log(`[GeminiProvider] API key validation successful`);
      return {
        isValid: true,
        details: {
          model: 'gemini-pro',
          status: 'authenticated'
        }
      };

    } catch (error: any) {
      console.log(`[GeminiProvider] API key validation failed: ${error.message}`);
      
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.error) {
          if (errorData.error.code === 400) {
            return {
              isValid: false,
              error: 'Invalid request format or API key',
              details: { 
                code: 400,
                type: 'invalid_request' 
              }
            };
          } else if (errorData.error.code === 403) {
            return {
              isValid: false,
              error: 'Invalid or unauthorized Gemini API key',
              details: { 
                code: 403,
                type: 'authentication_error' 
              }
            };
          } else if (errorData.error.code === 429) {
            return {
              isValid: false,
              error: 'Gemini API rate limit exceeded',
              details: { 
                code: 429,
                type: 'rate_limit_error' 
              }
            };
          } else {
            return {
              isValid: false,
              error: `Gemini API error: ${errorData.error.message || 'Unknown error'}`,
              details: { 
                code: errorData.error.code,
                type: 'api_error' 
              }
            };
          }
        }
      }
      
      // Handle network errors or other issues
      return {
        isValid: false,
        error: `Network error or invalid API key: ${error.message}`,
        details: { 
          type: 'network_error' 
        }
      };
    }
  }

  private buildPrompt(request: AIAnalysisRequest): string {
    const systemInstructions = this.buildSystemPrompt(request.promptStyle, request.targetPlatform);
    const userPrompt = this.buildUserPrompt(request.metadata);
    
    return `${systemInstructions}\n\n${userPrompt}`;
  }

  private calculateConfidence(candidate: any): number {
    // Base confidence for successful response
    let confidence = 0.75;
    
    // Check safety ratings - if blocked, reduce confidence
    if (candidate.safetyRatings) {
      for (const rating of candidate.safetyRatings) {
        if (rating.probability === 'HIGH' || rating.probability === 'MEDIUM') {
          confidence -= 0.1;
        }
      }
    }
    
    // Check finish reason
    if (candidate.finishReason === 'STOP') {
      confidence += 0.15;
    } else if (candidate.finishReason === 'MAX_TOKENS') {
      confidence -= 0.05;
    }
    
    // Check content length
    const contentLength = candidate.content?.parts?.[0]?.text?.length || 0;
    if (contentLength >= 100 && contentLength <= 300) {
      confidence += 0.1;
    }
    
    return Math.min(Math.max(confidence, 0), 1.0);
  }

  private buildSystemPrompt(style: string, targetPlatform?: string): string {
    const basePrompt = `You are an expert AI image prompt engineer. Your task is to analyze the provided image and its metadata to create highly effective prompts for AI image generation tools.

IMPORTANT GUIDELINES:
1. Focus on visual elements you can actually see in the image
2. Include specific details about colors, lighting, composition, and style
3. Use descriptive but concise language
4. Avoid copyright-protected terms or brand names
5. Make the prompt actionable for AI image generation`;

    const styleInstructions = {
      detailed: "Create a comprehensive, detailed prompt with specific descriptions of all visual elements, including colors, lighting, composition, mood, and artistic style. Aim for 100-150 words.",
      concise: "Create a focused, efficient prompt that captures the essential visual elements in 50-80 words. Prioritize the most important visual features.",
      artistic: "Emphasize artistic style, mood, aesthetic qualities, and creative elements. Include references to art movements, techniques, and visual atmosphere.",
      technical: "Include technical photography and artistic terms, such as camera angles, lighting techniques, composition rules, and specific visual characteristics."
    };

    const platformInstructions = {
      midjourney: "Format the prompt for Midjourney with clear descriptive phrases. Consider adding aspect ratio suggestions and quality parameters.",
      'dall-e': "Optimize for DALL-E with clear, descriptive language that avoids ambiguous terms. Focus on concrete visual elements.",
      'stable-diffusion': "Include quality enhancement tags and consider negative prompt suggestions. Use commonly understood artistic terms.",
      leonardo: "Format for Leonardo AI with emphasis on artistic styles and quality modifiers."
    };

    let prompt = basePrompt + "\n\n" + styleInstructions[style as keyof typeof styleInstructions];

    if (targetPlatform && platformInstructions[targetPlatform as keyof typeof platformInstructions]) {
      prompt += "\n\n" + platformInstructions[targetPlatform as keyof typeof platformInstructions];
    }

    return prompt;
  }

  private buildUserPrompt(metadata: ImageMetadata): string {
    return `Please analyze this image and create an optimized AI generation prompt based on the following information:

**Original Title:** ${metadata.title || 'N/A'}
**Description:** ${metadata.description || 'N/A'}  
**Tags:** ${metadata.tags.length > 0 ? metadata.tags.join(', ') : 'N/A'}
**Category:** ${metadata.category || 'N/A'}
**Source Platform:** ${metadata.platform}

**Your Task:**
1. Carefully examine the image and identify key visual elements
2. Describe the composition, lighting, colors, and style
3. Create a prompt that would generate a similar image
4. Ensure the prompt is specific enough for accurate reproduction
5. Incorporate relevant information from the metadata where appropriate

**Output Format:**
Provide only the optimized prompt text, ready to use for AI image generation.`;
  }
}