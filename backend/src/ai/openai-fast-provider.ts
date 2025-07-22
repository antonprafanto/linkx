import axios from 'axios';
import { AIProvider } from './ai-provider';
import { AIAnalysisRequest, ImageMetadata } from '../interfaces/types';

export class OpenAIFastProvider implements AIProvider {
  async analyzeAndGeneratePrompt(apiKey: string, request: AIAnalysisRequest) {
    try {
      console.log(`[OpenAIFastProvider] Fast analysis with GPT-3.5-turbo (text-only mode)`);

      // For faster processing, we'll analyze based on metadata only
      // This is much faster than vision models
      const systemPrompt = this.buildSystemPrompt(request.promptStyle, request.targetPlatform);
      const userPrompt = this.buildUserPromptFromMetadata(request.metadata);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini', // Fastest GPT-4 model
          messages: [
            { 
              role: 'system', 
              content: systemPrompt 
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 15000 // Very short timeout
        }
      );

      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      const generatedPrompt = response.data.choices[0].message.content;
      
      if (!generatedPrompt) {
        throw new Error('Empty response from OpenAI API');
      }

      console.log(`[OpenAIFastProvider] Successfully generated prompt (${generatedPrompt.length} characters)`);

      // Generate one quick variation
      const variations = await this.generateQuickVariation(apiKey, generatedPrompt);

      return {
        prompt: generatedPrompt.trim(),
        variations,
        confidence: this.calculateConfidence(response.data)
      };

    } catch (error: any) {
      console.error(`[OpenAIFastProvider] Error: ${error.message}`);
      
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
      console.log('[OpenAIFastProvider] Validating API key with lightweight request');

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 5000
        }
      );

      return {
        isValid: true,
        details: { 
          status: 'valid',
          provider: 'openai-fast',
          model: 'gpt-4o-mini'
        }
      };

    } catch (error: any) {
      console.error(`[OpenAIFastProvider] Validation failed: ${error.message}`);
      
      if (error.response?.data?.error) {
        const errorData = error.response.data;
        let errorMessage = '';
        
        switch (errorData.error.code) {
          case 'invalid_api_key':
            errorMessage = 'Invalid OpenAI API key';
            break;
          case 'insufficient_quota':
            errorMessage = 'OpenAI API quota exceeded';
            break;
          default:
            errorMessage = errorData.error.message || 'OpenAI API error';
        }

        return { isValid: false, error: errorMessage };
      }

      return { isValid: false, error: 'Network error while validating API key' };
    }
  }

  private async generateQuickVariation(apiKey: string, originalPrompt: string): Promise<string[]> {
    try {
      const variationPrompt = `Create 1 short variation of this prompt with a different artistic style: "${originalPrompt}"`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: variationPrompt }],
          max_tokens: 200,
          temperature: 0.8
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        return [response.data.choices[0].message.content.trim()];
      }
      return [];
    } catch (error) {
      console.warn(`[OpenAIFastProvider] Could not generate variation: ${error}`);
      return [];
    }
  }

  private calculateConfidence(data: any): number {
    if (!data.choices || data.choices.length === 0) return 0;
    return data.choices[0].finish_reason === 'stop' ? 0.8 : 0.6;
  }

  private buildSystemPrompt(style: string, targetPlatform?: string): string {
    return `You are an expert AI prompt engineer. Create effective AI image generation prompts based on stock photo metadata.

FAST MODE - Focus on:
1. Main subject and composition 
2. Key colors and lighting
3. Artistic style
4. Target platform optimization

Style: ${style}
${targetPlatform ? `Platform: ${targetPlatform}` : ''}

Keep prompts concise but descriptive (80-120 words).`;
  }

  private buildUserPromptFromMetadata(metadata: ImageMetadata): string {
    return `Create an AI image generation prompt for this stock photo:

Title: ${metadata.title || 'Untitled'}
Description: ${metadata.description || 'No description'}  
Tags: ${metadata.tags.slice(0, 10).join(', ') || 'No tags'}
Category: ${metadata.category || 'General'}

Create a prompt that captures the essence of this image for AI generation. Focus on visual elements, composition, and style.

Output only the prompt text, ready to use.`;
  }
}