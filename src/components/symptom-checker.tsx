'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suggestLabTests, SymptomCheckerInput, SymptomCheckerOutput } from '@/ai/flows/ai-symptom-checker';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Beaker, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  symptoms: z.string().min(10, {
    message: 'Please describe your symptoms in at least 10 characters.',
  }),
});

export default function SymptomChecker() {
  const [result, setResult] = useState<SymptomCheckerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      symptoms: '',
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await suggestLabTests(data as SymptomCheckerInput);
      setResult(response);
    } catch (error) {
      console.error("AI Symptom Checker Error:", error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Could not get suggestions. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedTests = result?.suggestedTests.split(',').map(s => s.trim()).filter(Boolean) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Lightbulb className="text-primary" />
          AI-Powered Symptom Checker
        </CardTitle>
        <CardDescription>
          Describe your symptoms, and our AI will suggest relevant lab tests to discuss with your healthcare provider.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Symptoms</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'For the last week, I've had a persistent dry cough, fatigue, and a low-grade fever in the evenings...'"
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Suggestions
            </Button>
          </CardFooter>
        </form>
      </Form>
      {suggestedTests.length > 0 && (
        <CardContent>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Beaker className="text-primary"/>
                Suggested Lab Tests
            </h3>
            <div className="flex flex-wrap gap-2">
                {suggestedTests.map((test, index) => (
                    <Badge key={index} variant="secondary" className="text-base px-3 py-1">
                        {test}
                    </Badge>
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
                This is not a medical diagnosis. Please consult with a healthcare professional.
            </p>
        </CardContent>
      )}
    </Card>
  );
}
