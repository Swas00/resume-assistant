import { Resume, JobDescription } from '../models';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export interface MatchResult {
  resumeId: string;
  jobId: string;
  matchScore: number; // 0-100
  exactMatches: string[]; // Required skills the resume has
  skillGaps: string[]; // Required skills missing from resume
  recommendations: string[]; // Suggestions for improvement
  strengthsSummary: string;
  improvementSummary: string;
}

// Canonical skill names (lowercase) detected in free text
const SKILL_KEYWORDS = [
  'python', 'javascript', 'typescript', 'java', 'cpp', 'csharp', 'golang', 'rust',
  'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'fastapi',
  'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins',
  'git', 'sql', 'html', 'css', 'rest', 'graphql',
  'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch',
  'agile', 'scrum', 'ci/cd', 'devops', 'microservices',
  'react native', 'flutter', 'ios', 'android',
  'spring boot', 'hibernate', 'jpa',
];

// Other spellings of the same skill -> canonical name
const SKILL_ALIASES: Record<string, string> = {
  nodejs: 'node.js',
  'rest api': 'rest',
  'rest apis': 'rest',
  restful: 'rest',
  postgres: 'postgresql',
  k8s: 'kubernetes',
  'c++': 'cpp',
  'c#': 'csharp',
  reactjs: 'react',
  'react.js': 'react',
  vuejs: 'vue',
  mongo: 'mongodb',
};

const NICE_TO_HAVE_RE = /nice[\s-]to[\s-]have|good[\s-]to[\s-]have|preferred|bonus|a plus|desired|optional/i;
const SECTION_RE =
  /^\W*(requirements?|qualifications?|responsibilities|what you.{0,6}(?:do|need|bring)|must[\s-]have|required|about)\b/i;

// Not preceded/followed by word chars or + # so 'java' != 'javascript' and 'c' != 'c++'
const skillPattern = (term: string): RegExp =>
  new RegExp(`(?<![\\w+#])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w+#])`, 'i');

const SKILL_PATTERNS: Array<[string, RegExp]> = [
  ...SKILL_KEYWORDS.map((s): [string, RegExp] => [s, skillPattern(s)]),
  ...Object.entries(SKILL_ALIASES).map(([alias, canon]): [string, RegExp] => [
    canon,
    skillPattern(alias),
  ]),
];

export class MatchingService {
  /**
   * Calculate match score between resume and job
   * Score = (Required skills the resume has / Total required skills) * 100
   */
  static async matchResumeToJob(
    resumeId: string,
    jobId: string,
    userId: string
  ): Promise<MatchResult> {
    try {
      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        throw new AppError('Resume not found', 404);
      }

      const job = await JobDescription.findOne({ _id: jobId, userId });
      if (!job) {
        throw new AppError('Job not found', 404);
      }

      // Resume skills: what the parser extracted, plus anything detected in the raw text
      const resumeSkills = this.unique([
        ...(resume.parsedData?.skills ?? []).map((s) => this.normalizeSkill(s)),
        ...this.extractSkillsFromText(resume.originalContent).required,
      ]);

      // Job skills: split into required / nice-to-have by section; anything the
      // upload-time parser already extracted counts as required
      const fromText = this.extractSkillsFromText(job.rawContent);
      const jobRequiredSkills = this.unique([
        ...(job.extractedData?.requiredSkills ?? []).map((s) => this.normalizeSkill(s)),
        ...fromText.required,
      ]);
      const jobNiceToHaveSkills = fromText.niceToHave.filter(
        (s) => !jobRequiredSkills.includes(s)
      );

      const resumeSet = new Set(resumeSkills);
      const exactMatches = jobRequiredSkills.filter((s) => resumeSet.has(s));
      const skillGaps = jobRequiredSkills.filter((s) => !resumeSet.has(s));
      const niceToHaveMatches = jobNiceToHaveSkills.filter((s) => resumeSet.has(s));

      // No detectable requirements means no basis for a score, not a perfect one
      const matchScore =
        jobRequiredSkills.length === 0
          ? 0
          : Math.round((exactMatches.length / jobRequiredSkills.length) * 100);

      const recommendations =
        jobRequiredSkills.length === 0
          ? ['No required skills were detected in this job description. Check that the job text was uploaded correctly.']
          : this.generateRecommendations(exactMatches, skillGaps, niceToHaveMatches);

      const strengthsSummary = this.generateStrengthsSummary(
        exactMatches,
        niceToHaveMatches,
        matchScore
      );
      const improvementSummary = this.generateImprovementSummary(skillGaps);

      logger.info(`Match calculated: Resume ${resumeId} vs Job ${jobId} = ${matchScore}%`);

      return {
        resumeId,
        jobId,
        matchScore,
        exactMatches,
        skillGaps,
        recommendations,
        strengthsSummary,
        improvementSummary,
      };
    } catch (error) {
      logger.error('Error calculating match:', error);
      throw error;
    }
  }

  private static unique(items: string[]): string[] {
    return [...new Set(items)];
  }

  /**
   * Extract technical skills from text. Skills on a "nice to have"/"preferred"
   * line, or under such a heading, are nice-to-have; a skill that also appears
   * elsewhere counts as required.
   */
  private static extractSkillsFromText(text: string): { required: string[]; niceToHave: string[] } {
    const required: string[] = [];
    const niceToHave: string[] = [];
    let inNiceSection = false;

    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;

      let isNice: boolean;
      if (NICE_TO_HAVE_RE.test(line)) {
        if (line.length < 60) inNiceSection = true; // a heading: following lines belong to it
        isNice = true;
      } else {
        if (line.length < 60 && SECTION_RE.test(line)) inNiceSection = false;
        isNice = inNiceSection;
      }

      for (const [skill, pattern] of SKILL_PATTERNS) {
        if (!pattern.test(line)) continue;
        const target = isNice ? niceToHave : required;
        if (!target.includes(skill)) target.push(skill);
      }
    }

    return { required, niceToHave: niceToHave.filter((s) => !required.includes(s)) };
  }

  /**
   * Normalize a skill name to its canonical lowercase form for comparison
   */
  private static normalizeSkill(skill: string): string {
    const cleaned = skill.toLowerCase().trim().replace(/\s+/g, ' ');
    return SKILL_ALIASES[cleaned] ?? cleaned;
  }

  /**
   * Generate recommendations based on skill match
   */
  private static generateRecommendations(
    exactMatches: string[],
    skillGaps: string[],
    niceToHaveMatches: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (skillGaps.length > 0) {
      recommendations.push(`Learn these missing skills: ${skillGaps.slice(0, 3).join(', ')}`);
    }

    if (niceToHaveMatches.length > 0) {
      recommendations.push(
        `Highlight these bonus skills in your resume: ${niceToHaveMatches.slice(0, 2).join(', ')}`
      );
    }

    if (exactMatches.length >= 5) {
      recommendations.push(
        'Your resume is well-aligned with this job! Focus on tailoring your bullet points.'
      );
    }

    if (skillGaps.length === 0 && niceToHaveMatches.length > 0) {
      recommendations.push(
        'You meet all required skills! Add a portfolio link showcasing your projects.'
      );
    }

    return recommendations.length > 0
      ? recommendations
      : ['Review the job description and add more relevant experience.'];
  }

  /**
   * Generate strengths summary
   */
  private static generateStrengthsSummary(
    exactMatches: string[],
    niceToHaveMatches: string[],
    matchScore: number
  ): string {
    const bonus =
      niceToHaveMatches.length > 0
        ? ` Plus ${niceToHaveMatches.length} nice-to-have skill${niceToHaveMatches.length > 1 ? 's' : ''}.`
        : '';

    if (matchScore >= 80) {
      return `Excellent match! Your resume covers ${exactMatches.length} key requirements.${bonus}`;
    } else if (matchScore >= 60) {
      return `Good match! You have most of the required skills (${exactMatches.length} matched).${bonus}`;
    } else if (matchScore >= 40) {
      return `Moderate match. You have some relevant skills but could use more.${bonus}`;
    }
    return `Limited match. Consider developing more of the required technical skills.${bonus}`;
  }

  /**
   * Generate improvement summary
   */
  private static generateImprovementSummary(skillGaps: string[]): string {
    if (skillGaps.length === 0) {
      return 'Your resume covers all required skills!';
    } else if (skillGaps.length <= 2) {
      return `Add experience with: ${skillGaps.join(', ')}`;
    }
    return `Missing ${skillGaps.length} key skills. Prioritize: ${skillGaps.slice(0, 3).join(', ')}`;
  }
}
