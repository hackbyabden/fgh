// This is a server-side file.
'use server';

/**
 * @fileOverview Generates humorous roasts of chess moves based on a user-defined intensity.
 *
 * - generateChessRoast - A function that generates chess move roasts.
 * - GenerateChessRoastInput - The input type for the generateChessRoast function.
 * - GenerateChessRoastOutput - The return type for the generateChessRoast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChessRoastInputSchema = z.object({
  move: z.string().describe('The chess move to roast (e.g., e4, Nf3).'),
  intensity: z
    .enum(['low', 'medium', 'high'])
    .describe('The intensity of the roast.'),
  language: z.enum(['English', 'Urdu']).describe('The language to use.'),
});
export type GenerateChessRoastInput = z.infer<typeof GenerateChessRoastInputSchema>;

const GenerateChessRoastOutputSchema = z.object({
  roast: z.string().describe('The humorous roast of the chess move, including an emoji.'),
});
export type GenerateChessRoastOutput = z.infer<typeof GenerateChessRoastOutputSchema>;

export async function generateChessRoast(input: GenerateChessRoastInput): Promise<GenerateChessRoastOutput> {
  return generateChessRoastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChessRoastPrompt',
  input: {schema: GenerateChessRoastInputSchema},
  output: {schema: GenerateChessRoastOutputSchema},
  prompt: `You are a chess commentator known for your witty and sarcastic remarks. You will generate a humorous roast of a chess move based on the specified intensity and language. The roast must include at least one relevant emoji to enhance the humor.

Move: {{{move}}}
Intensity: {{{intensity}}}
Language: {{{language}}}

Roast:`, // Ensure the output is only the roast itself
});

const generateChessRoastFlow = ai.defineFlow(
  {
    name: 'generateChessRoastFlow',
    inputSchema: GenerateChessRoastInputSchema,
    outputSchema: GenerateChessRoastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
