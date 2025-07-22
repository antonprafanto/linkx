import axios from 'axios';
import { AIProvider } from './ai-provider';
import { AIAnalysisRequest, ImageMetadata } from '../interfaces/types';

export class ClaudeProvider implements AIProvider {
  async analyzeAndGeneratePrompt(apiKey: string, request: AIAnalysisRequest) {
    try {
      console.log(`[ClaudeProvider] Analyzing image with Claude 3 Sonnet`);

      const systemPrompt = this.buildSystemPrompt(request.promptStyle, request.targetPlatform);
      const userPrompt = this.buildUserPrompt(request.metadata);

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: request.imageBase64
                }
              }
            ]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 60000
        }
      );

      if (!response.data || !response.data.content || response.data.content.length === 0) {
        throw new Error('No response from Claude API');
      }

      const content = response.data.content[0];
      if (!content || content.type !== 'text' || !content.text) {
        throw new Error('Invalid response format from Claude API');
      }

      const generatedPrompt = content.text;

      console.log(`[ClaudeProvider] Successfully generated prompt (${generatedPrompt.length} characters)`);

      return {
        prompt: generatedPrompt.trim(),
        variations: [], // Claude would need separate call for variations
        confidence: this.calculateConfidence(response.data)
      };

    } catch (error: any) {
      console.error(`[ClaudeProvider] Error: ${error.message}`);
      
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.error) {
          const errorType = errorData.error.type;
          const errorMessage = errorData.error.message;
          
          if (errorType === 'authentication_error') {
            throw new Error('Invalid Claude API key provided');
          } else if (errorType === 'permission_error') {
            throw new Error('Claude API permission denied - check your API key permissions');
          } else if (errorType === 'rate_limit_error') {
            throw new Error('Claude API rate limit exceeded');
          } else if (errorType === 'invalid_request_error') {
            throw new Error(`Claude API invalid request: ${errorMessage}`);
          } else {
            throw new Error(`Claude API error: ${errorMessage || 'Unknown error'}`);
          }
        }
      }
      
      throw new Error(`Claude request failed: ${error.message}`);
    }
  }

  async validateApiKey(apiKey: string): Promise<{
    isValid: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      console.log(`[ClaudeProvider] Validating API key`);

      // Make a minimal API call to validate the key
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1,
          temperature: 0.1,
          messages: [{
            role: 'user',
            content: 'Hello'
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 10000 // 10 second timeout for validation
        }
      );

      // If we get here without an error, the API key is valid
      console.log(`[ClaudeProvider] API key validation successful`);
      return {
        isValid: true,
        details: {
          model: 'claude-3-sonnet-20240229',
          status: 'authenticated'
        }
      };

    } catch (error: any) {
      console.log(`[ClaudeProvider] API key validation failed: ${error.message}`);
      
      if (error.response) {
        const errorData = error.response.data;
        if (errorData.error) {
          const errorType = errorData.error.type;
          const errorMessage = errorData.error.message;
          
          if (errorType === 'authentication_error') {
            return {
              isValid: false,
              error: 'Invalid Claude API key provided',
              details: { 
                type: 'authentication_error',
                status: 401
              }
            };
          } else if (errorType === 'permission_error') {
            return {
              isValid: false,
              error: 'Claude API permission denied - check your API key permissions',
              details: { 
                type: 'permission_error',
                status: 403
              }
            };
          } else if (errorType === 'rate_limit_error') {
            return {
              isValid: false,
              error: 'Claude API rate limit exceeded',
              details: { 
                type: 'rate_limit_error',
                status: 429
              }
            };
          } else if (errorType === 'invalid_request_error') {
            return {
              isValid: false,
              error: `Claude API invalid request: ${errorMessage}`,
              details: { 
                type: 'invalid_request_error',
                status: 400
              }
            };
          } else {
            return {
              isValid: false,
              error: `Claude API error: ${errorMessage || 'Unknown error'}`,
              details: { 
                type: errorType || 'api_error',
                status: error.response.status
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

  private calculateConfidence(data: any): number {
    // Base confidence for successful response
    let confidence = 0.8; // Claude generally provides high-quality responses
    
    // Check stop reason
    if (data.stop_reason === 'end_turn') {
      confidence += 0.1;
    } else if (data.stop_reason === 'max_tokens') {
      confidence -= 0.1;
    }
    
    // Check content length
    const contentLength = data.content?.[0]?.text?.length || 0;
    if (contentLength >= 100 && contentLength <= 300) {
      confidence += 0.1;
    } else if (contentLength < 50) {
      confidence -= 0.2;
    }
    
    // Check usage efficiency
    if (data.usage) {
      const inputTokens = data.usage.input_tokens || 0;
      const outputTokens = data.usage.output_tokens || 0;
      
      // Reasonable token usage indicates good response
      if (outputTokens >= 50 && outputTokens <= 500) {
        confidence += 0.05;
      }
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