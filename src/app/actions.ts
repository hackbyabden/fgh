'use server';

import { generateChessRoast, type GenerateChessRoastInput } from '@/ai/flows/generate-chess-roast';

export async function getRoast(input: GenerateChessRoastInput) {
  try {
    const result = await generateChessRoast(input);
    return result.roast;
  } catch (error) {
    console.error('Error generating roast:', error);
    if (input.language === 'Urdu') {
      return 'AI بے آواز ہے۔ آپ کی چال... ناقابل بیان تھی۔';
    }
    return 'The AI is speechless. Your move was... indescribable.';
  }
}
