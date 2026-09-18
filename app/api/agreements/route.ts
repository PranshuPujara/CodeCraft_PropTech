import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { extractTextFromPDF } from '../../../lib/agreementPdf';
import { completeStructuredJSON } from '../../../lib/ai/client';
import { AGREEMENT_EXTRACTION_SYSTEM_PROMPT } from '../../../lib/ai/prompts/agreementExtract';
import { AGREEMENT_FLAGS_SYSTEM_PROMPT } from '../../../lib/ai/prompts/agreementFlags';
import { AgreementExtractionResponse, AgreementFlagsResponse } from '../../../lib/ai/types';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    // For demo purposes, we'll hardcode the user ID to the demo user 
    // since authentication isn't implemented in this track.
    const userId = 'demo-user-1';

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extract text from PDF
    const extractedText = await extractTextFromPDF(buffer);

    // 2. Generate structured fields
    const extractionResponse = await completeStructuredJSON<AgreementExtractionResponse>({
      systemPrompt: AGREEMENT_EXTRACTION_SYSTEM_PROMPT,
      userMessage: `Please extract the required fields from this rental agreement text:\n\n${extractedText}`,
    });

    // 3. Generate summary/flags
    const flagsResponse = await completeStructuredJSON<AgreementFlagsResponse>({
      systemPrompt: AGREEMENT_FLAGS_SYSTEM_PROMPT,
      userMessage: `Please analyze this rental agreement text and flag clauses that deserve attention:\n\n${extractedText}`,
    });

    // 4. Store the result
    const agreement = await db.agreement.create({
      data: {
        userId,
        fileName: file.name,
        extractedFields: JSON.stringify({
          rent: extractionResponse.rent,
          deposit: extractionResponse.deposit,
          leaseDuration: extractionResponse.leaseDuration,
          lockInPeriod: extractionResponse.lockInPeriod,
          noticePeriod: extractionResponse.noticePeriod,
          rentEscalation: extractionResponse.rentEscalation,
          maintenanceResponsibility: extractionResponse.maintenanceResponsibility,
          utilityResponsibility: extractionResponse.utilityResponsibility,
          penalties: extractionResponse.penalties,
          terminationConditions: extractionResponse.terminationConditions,
        }),
        summary: extractionResponse.summary,
        flaggedClauses: JSON.stringify(flagsResponse.flaggedClauses),
      },
    });

    return NextResponse.json(agreement);
  } catch (error) {
    console.error('Error analyzing agreement:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
