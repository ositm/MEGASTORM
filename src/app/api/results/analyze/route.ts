import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { firebaseConfig } from '@/firebase/config';

// Only files in our own Storage bucket may be analyzed. This prevents the
// endpoint being used as an open proxy to fetch arbitrary URLs.
function isAllowedFileUrl(fileUrl: string): boolean {
    const bucket = firebaseConfig.storageBucket;
    return typeof fileUrl === 'string'
        && fileUrl.startsWith(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o/`);
}

export async function POST(req: NextRequest) {
    try {
        // ---------------------------------------------------------
        // 1. Authenticate caller
        // ---------------------------------------------------------
        const caller = await getAuthenticatedUser(req);
        if (!caller) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ---------------------------------------------------------
        // 2. Get and validate file URL
        // ---------------------------------------------------------
        let fileUrl;
        try {
            const body = await req.json();
            fileUrl = body.fileUrl;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        if (!fileUrl) {
            return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
        }

        if (!isAllowedFileUrl(fileUrl)) {
            return NextResponse.json(
                { error: 'Only files stored in LabLink storage can be analyzed' },
                { status: 400 }
            );
        }

        // ---------------------------------------------------------
        // 3. Fetch file
        // ---------------------------------------------------------
        const response = await fetch(fileUrl);
        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // ---------------------------------------------------------
        // 4. Parse PDF (pdf2json)
        // ---------------------------------------------------------
        let pdfText = '';
        try {
            const PDFParserModule = await import('pdf2json');
            const PDFParser = PDFParserModule.default || PDFParserModule;

            const parser = new PDFParser(null, true); // text content only

            pdfText = await new Promise((resolve, reject) => {
                parser.on("pdfParser_dataError", (errData: any) => reject(new Error(errData.parserError)));

                parser.on("pdfParser_dataReady", (pdfData: any) => {
                    try {
                        // pdf2json v3+ exposes Pages at the top level; the old
                        // formImage wrapper is kept as a fallback for safety.
                        const pages = pdfData.Pages || pdfData.formImage?.Pages || [];
                        const text = pages.map((page: any) =>
                            page.Texts.map((t: any) =>
                                t.R.map((r: any) => decodeURIComponent(r.T)).join(' ')
                            ).join(' ')
                        ).join('\n');
                        resolve(text);
                    } catch (e) {
                        reject(new Error('Could not extract text from PDF'));
                    }
                });

                parser.parseBuffer(buffer);
            });
        } catch (e: any) {
            console.error('PDF Parse Error:', e);
            return NextResponse.json({ error: 'PDF parsing failed' }, { status: 422 });
        }

        if (!pdfText.trim()) {
            return NextResponse.json(
                { error: 'No readable text found in this PDF. Scanned/image-based reports are not supported yet.' },
                { status: 422 }
            );
        }

        // ---------------------------------------------------------
        // 5. Send to Gemini
        // ---------------------------------------------------------
        const truncatedText = pdfText.substring(0, 30000);

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error('GOOGLE_API_KEY missing');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const prompt = `You are a health-education assistant explaining a lab report to a patient.
This is for educational purposes only. You must not diagnose conditions, recommend treatment, or replace clinical judgment.

Please analyze the following text from a lab report and provide a structured summary in Markdown.

**Structure your response exactly like this:**

## 📋 One-Line Summary
[A single, clear sentence summarizing what these results show.]

## 🔍 Key Findings
| Test Name | Result | Status | What this measures |
| :--- | :--- | :--- | :--- |
| [Name] | [Value] | [Normal/High/Low] | [Simple 1-sentence explanation] |
*(List only the most important or abnormal results. If everything is normal, list the main panels checked)*

## 💡 Next Steps
*   Share these results with your doctor, who can interpret them in the context of your health history.
*   [One general, non-prescriptive educational note if relevant.]

## ⚠️ Important
This summary is AI-generated for educational purposes only. It is not a medical diagnosis. Always consult a qualified healthcare professional about your results.

**Rules:**
1.  Use simple, non-medical language where possible.
2.  In the table, if a result is Normal, say "Normal". If High/Low, say "High" or "Low".
3.  Never suggest a diagnosis, medication, or treatment.
4.  Be calm, factual, and professional.

**Lab Report Text:**
${truncatedText}`;

        const aiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            console.error('Gemini API Error Body:', errText);
            return NextResponse.json({ error: 'AI analysis service is unavailable' }, { status: 502 });
        }

        const result = await aiResponse.json();

        if (!result.candidates || !result.candidates[0]) {
            console.error('Invalid Gemini Response:', JSON.stringify(result));
            return NextResponse.json({ error: 'AI analysis returned no output' }, { status: 502 });
        }

        const summary = result.candidates[0].content?.parts?.[0]?.text || "No analysis text found.";

        return NextResponse.json({ summary });

    } catch (error: any) {
        console.error('Unhandled Analysis Error:', error);
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }
}
