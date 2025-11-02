'use server';

/**
 * @fileOverview An AI-powered symptom checker that suggests relevant lab tests based on user-described symptoms.
 *
 * - suggestLabTests - A function that takes a description of symptoms and returns a suggestion of relevant lab tests.
 * - SymptomCheckerInput - The input type for the suggestLabTests function.
 * - SymptomCheckerOutput - The return type for the suggestLabTests function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SymptomCheckerInputSchema = z.object({
  symptoms: z
    .string()
    .describe('A detailed description of the symptoms experienced by the user.'),
});
export type SymptomCheckerInput = z.infer<typeof SymptomCheckerInputSchema>;

const SymptomCheckerOutputSchema = z.object({
  suggestedTests: z
    .string()
    .describe(
      'A comma-separated list of lab tests that are relevant to the described symptoms.'
    ),
});
export type SymptomCheckerOutput = z.infer<typeof SymptomCheckerOutputSchema>;

export async function suggestLabTests(
  input: SymptomCheckerInput
): Promise<SymptomCheckerOutput> {
  return symptomCheckerFlow(input);
}

const symptomCheckerPrompt = ai.definePrompt({
  name: 'symptomCheckerPrompt',
  input: {schema: SymptomCheckerInputSchema},
  output: {schema: SymptomCheckerOutputSchema},
  prompt: `You are a medical assistant that suggests lab tests based on patient symptoms.

  Based on the following symptoms: {{{symptoms}}}, suggest a comma-separated list of lab tests that would be helpful in diagnosing the patient's condition.`,
});

const symptomCheckerFlow = ai.defineFlow(
  {
    name: 'symptomCheckerFlow',
    inputSchema: SymptomCheckerInputSchema,
    outputSchema: SymptomCheckerOutputSchema,
  },
  async input => {
    const {output} = await symptomCheckerPrompt(input);
    return output!;
  }
);
