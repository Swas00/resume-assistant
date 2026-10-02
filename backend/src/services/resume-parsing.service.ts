import axios from 'axios';
import { Resume } from '../models';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// Shape returned by the Python AI service's POST /api/parse (`data` field).
// Missing values arrive as null, not undefined.
export interface ParsedData {
  name: string | null;
  email: string | null;
  phone: string | null;
  location?: string | null;
  summary?: string | null;
  skills: string[];
  experiences: Array<{
    job_title: string;
    company: string;
    start_date?: string | null;
    end_date?: string | null;
    description?: string | null;
    duration_months?: number | null;
  }>;
  education: Array<{
    degree: string;
    school: string;
    field?: string | null;
    graduation_year?: number | null;
    gpa?: string | null;
  }>;
  certifications: Array<{
    name: string;
    issuer?: string | null;
    date?: string | null;
  }>;
  confidence: number;
}

interface ParseApiResponse {
  success: boolean;
  message: string;
  data?: ParsedData | null;
}

/**
 * Call Python AI service to parse resume text
 */
export const callResumeParsing = async (resumeText: string): Promise<ParsedData> => {
  try {
    logger.info(`Calling AI Service: POST ${config.aiServiceUrl}/api/parse`);

    const response = await axios.post<ParseApiResponse>(
      `${config.aiServiceUrl}/api/parse`,
      { text: resumeText },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000, // 30 second timeout
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Parsing failed');
    }

    logger.info(`Parsing successful. Confidence: ${response.data.data.confidence}`);

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // FastAPI errors carry the reason in `detail` (e.g. text too short)
      const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
      logger.error(`AI Service error: ${error.message}`, error.response?.data);
      throw new Error(`AI Service unavailable: ${detail ?? error.message}`);
    }
    throw error;
  }
};

/**
 * Update resume with parsed data
 */
export const updateResumeWithParsedData = async (
  resumeId: string,
  parsedData: ParsedData
): Promise<void> => {
  try {
    const updated = await Resume.findByIdAndUpdate(
      resumeId,
      {
        parsedData: {
          name: parsedData.name,
          email: parsedData.email,
          phone: parsedData.phone,
          skills: parsedData.skills,
          experiences: parsedData.experiences,
          education: parsedData.education,
          certifications: parsedData.certifications,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new Error(`Resume not found: ${resumeId}`);
    }

    logger.info(`Resume ${resumeId} updated with parsed data`);
  } catch (error) {
    logger.error(`Failed to update resume: ${error}`);
    throw error;
  }
};
