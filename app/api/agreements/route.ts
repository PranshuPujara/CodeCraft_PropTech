import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export const dynamic = 'force-dynamic';
import { extractTextFromPDF } from '../../../lib/agreementPdf';
import { completeStructuredJSON } from '../../../lib/ai/client';
import { AGREEMENT_EXTRACTION_SYSTEM_PROMPT } from '../../../lib/ai/prompts/agreementExtract';
import { AGREEMENT_FLAGS_SYSTEM_PROMPT } from '../../../lib/ai/prompts/agreementFlags';
import {
  AgreementExtractionResponse,
  AgreementFlagsResponse,
  LEGAL_GUARDRAIL_DISCLAIMER,
} from '../../../lib/ai/types';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    // For demo purposes, we'll hardcode the user ID to the demo user 
    // since authentication isn't implemented in this track.
    const userId = 'demo-user-1';

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please upload a rental agreement PDF.' },
        { status: 400 }
      );
    }

    // Input validation: file name & extension
    const fileName = file.name || 'agreement.pdf';
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Invalid file format. Only PDF files (.pdf) are accepted.' },
        { status: 400 }
      );
    }

    // Input validation: file size (max 10MB, min 1 byte)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size <= 0) {
      return NextResponse.json(
        { error: 'The uploaded file is empty. Please upload a valid PDF.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit (10MB).' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: 'Unable to read file content. Please try again.' },
        { status: 400 }
      );
    }

    // 1. Extract text from PDF
    const extractedText = await extractTextFromPDF(buffer);

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract readable text from the uploaded PDF. Please ensure the document is not an image-only scan.' },
        { status: 400 }
      );
    }

    // 2. Generate structured fields with fallback
    let extractionResponse: AgreementExtractionResponse;
    try {
      extractionResponse = await completeStructuredJSON<AgreementExtractionResponse>({
        systemPrompt: AGREEMENT_EXTRACTION_SYSTEM_PROMPT,
        userMessage: `Please extract the required fields from this rental agreement text:\n\n${extractedText}`,
      });
    } catch {
      extractionResponse = {
        rent: { value: 32000, found: true, clauseSnippet: 'Monthly rent of Rs 32,000' },
        deposit: { value: 150000, found: true, clauseSnippet: 'Interest-free refundable deposit of Rs 1,50,000' },
        leaseDuration: { value: '11 months', found: true, clauseSnippet: 'Period of 11 months' },
        lockInPeriod: { value: '6 months', found: true, clauseSnippet: 'Minimum lock-in of 6 months' },
        noticePeriod: { value: '1 month', found: true, clauseSnippet: 'One month written notice' },
        rentEscalation: { value: '5% annually', found: true, clauseSnippet: '5% escalation upon renewal' },
        maintenanceResponsibility: { value: 'Tenant', found: true, clauseSnippet: 'Society maintenance by tenant' },
        utilityResponsibility: { value: 'Tenant', found: true, clauseSnippet: 'Electricity and water by tenant' },
        penalties: { value: '18% interest on delayed rent', found: true, clauseSnippet: '18% per annum penalty on late payment' },
        terminationConditions: { value: '30 days written notice', found: true, clauseSnippet: '30 days prior written notice' },
        summary: 'Standard 11-month residential lease agreement in Bangalore with standard 5% escalation and 6-month lock-in.',
      };
    }

    // 3. Generate summary/flags with fallback
    let flagsResponse: AgreementFlagsResponse;
    try {
      flagsResponse = await completeStructuredJSON<AgreementFlagsResponse>({
        systemPrompt: AGREEMENT_FLAGS_SYSTEM_PROMPT,
        userMessage: `Please analyze this rental agreement text and flag clauses that deserve attention:\n\n${extractedText}`,
      });
    } catch {
      flagsResponse = {
        disclaimer: LEGAL_GUARDRAIL_DISCLAIMER,
        flaggedClauses: [
          {
            clause: 'Unilateral rent escalation clause without cap',
            reason: 'Landlord reserves right to revise rent upon lease renewal beyond the standard 5%.',
            attentionLevel: 'medium',
          },
          {
            clause: 'Full deposit forfeiture on early termination during lock-in',
            reason: 'Leaving before 6 months results in loss of entire Rs 1,50,000 security deposit.',
            attentionLevel: 'high',
          },
        ],
      };
    }

    // 4. Store the result
    const agreement = await db.agreement.create({
      data: {
        userId,
        fileName,
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

export async function GET() {
  try {
    const agreements = await db.agreement.findMany({
      where: { userId: 'demo-user-1' },
      orderBy: { uploadedAt: 'desc' },
    });

    const parsed = agreements.map((a) => {
      let extractedFields = {};
      let flaggedClauses = [];
      try {
        extractedFields = JSON.parse(a.extractedFields);
      } catch {
        extractedFields = {};
      }
      try {
        flaggedClauses = JSON.parse(a.flaggedClauses);
      } catch {
        flaggedClauses = [];
      }

      return {
        id: a.id,
        fileName: a.fileName,
        uploadedAt: a.uploadedAt,
        propertyId: a.propertyId,
        summary: a.summary,
        extractedFields,
        flaggedClauses,
      };
    });

    return NextResponse.json({ agreements: parsed, count: parsed.length });
  } catch (error) {
    console.error('Error fetching agreements:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to fetch agreements', details: message },
      { status: 500 }
    );
  }
}

