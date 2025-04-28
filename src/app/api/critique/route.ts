import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import PDFParser from 'pdf2json';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('resume') as File;

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = '';

  if (file.name.endsWith('.pdf')) {
    text = await extractPdfText(buffer);
  } else if (file.name.endsWith('.docx')) {
    text = (await mammoth.extractRawText({ buffer })).value;
  } else if (file.name.endsWith('.txt')) {
    text = buffer.toString('utf-8');
  } else {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  const critique = await getCritiqueFromGemini(text);

  return NextResponse.json({ feedback: critique });
}

async function extractPdfText(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
  
      pdfParser.on('pdfParser_dataError', errData => reject(errData.parserError));
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {  // <-- force 'any' type here
        const texts = pdfData?.formImage?.Pages.flatMap((page: any) =>
          page.Texts.map((textObj: any) => decodeURIComponent(textObj.R.map((r: any) => r.T).join('')))
        );
        resolve(texts?.join(' ') ?? '');
      });
  
      pdfParser.parseBuffer(buffer);
    });
  }

  async function getCritiqueFromGemini(resumeText: string) {
    const prompt = `
  You are a professional career coach. Critique the following resume. Highlight improvements based on the latest job market trends.
  
  Resume:
  ${resumeText}
  
  Please provide:
  - Overall Impression
  - Top 5 Improvement Suggestions
  - Highlight missing skills/keywords
  - Tone and formatting feedback
  `;
  
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GOOGLE_AI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
  
    const data = await response.json();
    
    console.log('Gemini API raw response:', JSON.stringify(data, null, 2));
  
    const modelResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No feedback generated.';
    
    return modelResponse;
  }