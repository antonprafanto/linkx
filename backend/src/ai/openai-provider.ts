import axios from 'axios';
import { AIProvider } from './ai-provider';
import { AIAnalysisRequest, ImageMetadata } from '../interfaces/types';

export class OpenAIProvider implements AIProvider {
  async analyzeAndGeneratePrompt(apiKey: string, request: AIAnalysisRequest) {
    try {
      console.log(`[OpenAIProvider] Analyzing image with GPT-4 Turbo (fast mode)`);

      const systemPrompt = this.buildSystemPrompt(request.promptStyle, request.targetPlatform);
      const userPrompt = this.buildUserPrompt(request.metadata);

      // Use faster GPT-4 Turbo for vision tasks
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo', // Much faster than gpt-4-vision-preview
          messages: [
            { 
              role: 'system', 
              content: systemPrompt 
            },
            {
              role: 'user',
              content: [
                { 
                  type: 'text', 
                  text: userPrompt 
                },
                {
                  type: 'image_url',
                  image_url: { 
                    url: `data:image/jpeg;base64,${request.imageBase64}`,
                    detail: 'low' // Use 'low' for much faster processing
                  }
                }
              ]
            }
          ],
          max_tokens: 800, // Reduced for faster response
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 30000 // Reduced timeout for faster model
        }
      );

      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      const generatedPrompt = response.data.choices[0].message.content;
      
      if (!generatedPrompt) {
        throw new Error('Empty response from OpenAI API');
      }

      console.log(`[OpenAIProvider] Successfully generated prompt (${generatedPrompt.length} characters)`);

      // Generate variations
      const variations = await this.generateVariations(apiKey, generatedPrompt, request.promptStyle);

      return {
        prompt: generatedPrompt.trim(),
        variations,
        confidence: this.calculateConfidence(response.data)
      };

    } catch (error: any) {
      console.error(`[OpenAIProvider] Error: ${error.message}`);
      
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.error) {
          if (errorData.error.code === 'invalid_api_key') {
            throw new Error('Invalid OpenAI API key provided');
          } else if (errorData.error.code === 'insufficient_quota') {
            throw new Error('OpenAI API quota exceeded');
          } else {
            throw new Error(`OpenAI API error: ${errorData.error.message}`);
          }
        }
      }
      
      throw new Error(`OpenAI request failed: ${error.message}`);
    }
  }

  async validateApiKey(apiKey: string): Promise<{
    isValid: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      console.log('[OpenAIProvider] Validating API key with lightweight request');

      // Make a minimal API call to validate the key
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000
        }
      );

      return {
        isValid: true,
        details: { 
          status: 'valid',
          provider: 'openai',
          model: 'gpt-3.5-turbo'
        }
      };

    } catch (error: any) {
      console.error(`[OpenAIProvider] Validation failed: ${error.message}`);
      
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.error) {
          let errorMessage = '';
          let errorCode = '';

          switch (errorData.error.code) {
            case 'invalid_api_key':
              errorMessage = 'Invalid OpenAI API key';
              errorCode = 'invalid_key';
              break;
            case 'insufficient_quota':
              errorMessage = 'OpenAI API quota exceeded';
              errorCode = 'quota_exceeded';
              break;
            case 'model_not_found':
              errorMessage = 'Model access denied';
              errorCode = 'model_access_denied';
              break;
            default:
              errorMessage = errorData.error.message || 'OpenAI API error';
              errorCode = 'api_error';
          }

          return {
            isValid: false,
            error: errorMessage,
            details: {
              code: errorCode,
              originalError: errorData.error.code,
              status: error.response.status
            }
          };
        }
      }

      return {
        isValid: false,
        error: 'Network error or timeout while validating API key',
        details: {
          code: 'network_error',
          originalError: error.message
        }
      };
    }
  }

  private async generateVariations(apiKey: string, originalPrompt: string, style: string): Promise<string[]> {
    try {
      const variationPrompt = `Based on this AI image generation prompt, create 2 alternative variations that maintain the core concept but with different approaches or emphasis:

Original: "${originalPrompt}"

Style: ${style}

Requirements:
1. Keep the same main subject and concept
2. Vary the artistic style, mood, or technical approach  
3. Each variation should be complete and usable
4. Maintain similar length to the original

Provide only the 2 variations, separated by "---":`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: variationPrompt }
          ],
          max_tokens: 600,
          temperature: 0.8
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 30000
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        const variations = response.data.choices[0].message.content
          .split('---')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 10);
        
        return variations.slice(0, 2); // Ensure we return max 2 variations
      }

      return [];
    } catch (error) {
      console.warn(`[OpenAIProvider] Could not generate variations: ${error}`);
      return [];
    }
  }

  private calculateConfidence(data: any): number {
    // Calculate confidence based on response quality indicators
    if (!data.choices || data.choices.length === 0) return 0;

    const choice = data.choices[0];
    const promptLength = choice.message?.content?.length || 0;
    
    // Base confidence factors
    let confidence = 0.7; // Base confidence for successful response
    
    // Adjust based on prompt length (optimal range: 100-300 characters)
    if (promptLength >= 100 && promptLength <= 300) {
      confidence += 0.2;
    } else if (promptLength >= 50 && promptLength < 500) {
      confidence += 0.1;
    }
    
    // Check if finish reason is complete
    if (choice.finish_reason === 'stop') {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
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
      midjourney: "Format the prompt for Midjourney with clear descriptive phrases. Consider adding aspect ratio suggestions and quality parameters like '--v 6 --ar 16:9'.",
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