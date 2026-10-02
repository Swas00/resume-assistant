import { useState, useRef } from 'react';
import LiquidChromeCanvas from './components/LiquidChromeCanvas';
import InteractiveListPreview, { type InteractiveListItem } from '@/components/ui/interactive-list-preview';
import { FlowButton } from '@/components/ui/flow-button';
import { PillNav, type PillNavItem } from '@/components/ui/pill-nav';
import { PillNavDemo } from '@/components/ui/pill-nav-demo';
import {
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Wand2,
  Mic,
  TrendingUp,
  AlertCircle,
  Layers
} from 'lucide-react';

type Page = 'hero' | 'upload' | 'analysis' | 'matching' | 'tailoring' | 'interview';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SHOWCASE_ITEMS: InteractiveListItem[] = [
  {
    client: "ATS PARSER CORE",
    platform: "PYTHON + SPACY",
    services: "Deep Entity Extraction, Contact Graphs, Skill Mapping",
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
  },
  {
    client: "MATCH MATRIX",
    platform: "REACT 19 + VITE",
    services: "0-100% Fit Scoring, Keyword Gap Alerts, Real-Time Alignment",
    img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
  },
  {
    client: "CLAUDE TAILOR",
    platform: "ANTHROPIC API",
    services: "Metric Densification, STAR Format Rewriting, Impact Analysis",
    img: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80",
  },
  {
    client: "INTERVIEW BOT",
    platform: "CUSTOM LLM CHAIN",
    services: "Behavioral Coaching, Technical Q&A, STAR Assessment",
    img: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
  },
  {
    client: "PDF ENGINE",
    platform: "TYPESCRIPT",
    services: "High-Fidelity PDF Export, Standard Single Column, ATS Compliant",
    img: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
  },
  {
    client: "SPATIAL CHROME",
    platform: "WEBGL 2.0 SHADER",
    services: "Procedural Mercury Raymarching, Inertial Physics, High-Key BRDF",
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('hero');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [rawBullet, setRawBullet] = useState('Built backend API endpoints and helped make the database queries faster.');
  const [tailoredBullet, setTailoredBullet] = useState<string | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResumeUpload = async (file: File) => {
    setResumeFile(file);
    setUploading(true);
    setUploadStatus('Uploading & parsing resume text...');

    const formData = new FormData();
    formData.append('file', file);

    const isHttpsProd = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isLocalBackend = !API_URL || API_URL.includes('localhost') || API_URL.includes('127.0.0.1');

    if (isHttpsProd && isLocalBackend) {
      setUploadStatus('Running procedural AI parser preview...');
      setTimeout(() => {
        setCurrentPage('analysis');
        setUploading(false);
      }, 900);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/resume/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await response.json();
        setUploadStatus('Parsed successfully! Redirecting to analysis...');
        setTimeout(() => {
          setCurrentPage('analysis');
          setUploading(false);
        }, 800);
      } else {
        setUploadStatus('Running local simulation preview...');
        setTimeout(() => {
          setCurrentPage('analysis');
          setUploading(false);
        }, 1000);
      }
    } catch {
      setUploadStatus('Running offline simulation preview...');
      setTimeout(() => {
        setCurrentPage('analysis');
        setUploading(false);
      }, 1000);
    }
  };

  const handleTailorBullet = () => {
    setIsTailoring(true);
    setTimeout(() => {
      setTailoredBullet(
        'Architected and deployed 14+ high-throughput Node.js microservices with Redis caching, slashing P99 latency by 43% and supporting 1.2M+ daily active API transactions.'
      );
      setIsTailoring(false);
    }, 1200);
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('features-preview');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToGallery = () => {
    const el = document.getElementById('interactive-showcase');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getActiveHref = () => {
    switch (currentPage) {
      case 'hero': return '#overview';
      case 'upload': return '#scanner';
      case 'analysis': return '#scanner';
      case 'matching': return '#matching';
      case 'tailoring': return '#tailor';
      case 'interview': return '#interview';
      default: return '#overview';
    }
  };

  const navItems: PillNavItem[] = [
    { label: 'Overview', href: '#overview', onClick: () => setCurrentPage('hero') },
    { label: 'ATS Scanner', href: '#scanner', onClick: () => setCurrentPage('upload') },
    { label: 'Job Match', href: '#matching', onClick: () => setCurrentPage('matching') },
    { label: 'Claude Tailor', href: '#tailor', onClick: () => setCurrentPage('tailoring') },
    { label: 'Interview Bot', href: '#interview', onClick: () => setCurrentPage('interview') },
    { label: 'Systems', href: '#systems', onClick: scrollToGallery },
  ];

  return (
    <div className="mercury-engine">
      {/* Dynamic Floating PillNav */}
      <header className="fixed top-2.5 left-0 right-0 z-50 px-4 pointer-events-none flex items-center justify-between max-w-6xl mx-auto">
        <div className="pointer-events-auto">
          <PillNav
            logo={<Sparkles size={18} className="text-white" />}
            logoAlt="Resume Assistant"
            items={navItems}
            activeHref={getActiveHref()}
            onLogoClick={() => setCurrentPage('hero')}
            baseColor="#111114"
            pillColor="rgba(255, 255, 255, 0.95)"
            hoveredPillTextColor="#ffffff"
            pillTextColor="#111114"
          />
        </div>

        <div className="hidden lg:flex items-center pointer-events-auto">
          <button
            className="nav-cta-btn shadow-lg backdrop-blur-md"
            onClick={() => setCurrentPage('upload')}
          >
            Upload Resume
          </button>
        </div>
      </header>

      {/* Hero Page with Liquid Chrome Background */}
      {currentPage === 'hero' && (
        <>
          <LiquidChromeCanvas />

          <main className="ui-layer">
            <div className="ui-content">
              <div className="badge-wrapper">
                <span className="system-badge">
                  <span className="badge-dot" />
                  AI Career Intelligence v2.0
                </span>
              </div>

              <h1 className="main-title">
                Resume <span className="liquid-text">Intelligence</span>
              </h1>

              <p className="description">
                A purely procedural world of AI career optimization. Real-time ATS parsing,
                intelligent job description matching, and Claude-tailored bullet points for high-tier tech placements.
              </p>

              <div className="cta-row flex items-center justify-center gap-4">
                <FlowButton
                  text="Start Vision"
                  onClick={() => setCurrentPage('upload')}
                  className="bg-white/80 backdrop-blur-md shadow-lg"
                />
                <button
                  className="btn btn-secondary"
                  onClick={scrollToFeatures}
                >
                  Specifications
                </button>
              </div>
            </div>
          </main>

          {/* Specifications & Feature Cards Section */}
          <section id="features-preview" className="features-section">
            <div className="section-tag">Platform Architecture</div>
            <h2 className="section-title">Engineered For Top Placements</h2>

            <div className="features-grid">
              <div className="feature-card" onClick={() => setCurrentPage('upload')}>
                <div className="feature-icon-wrapper">
                  <FileText size={24} />
                </div>
                <h3 className="feature-card-title">Instant ATS Parsing</h3>
                <p className="feature-card-desc">
                  Extracts structured contact details, skills, education, and work experience from PDF or DOCX resumes.
                </p>
              </div>

              <div className="feature-card" onClick={() => setCurrentPage('matching')}>
                <div className="feature-icon-wrapper">
                  <Briefcase size={24} />
                </div>
                <h3 className="feature-card-title">Skill Match Matrix</h3>
                <p className="feature-card-desc">
                  Compare your technical background directly against employer job descriptions with a 0-100% fit score.
                </p>
              </div>

              <div className="feature-card" onClick={() => setCurrentPage('tailoring')}>
                <div className="feature-icon-wrapper">
                  <Wand2 size={24} />
                </div>
                <h3 className="feature-card-title">Claude AI Tailoring</h3>
                <p className="feature-card-desc">
                  Transform bland responsibilities into high-impact, metric-driven STAR format achievements in seconds.
                </p>
              </div>

              <div className="feature-card" onClick={() => setCurrentPage('interview')}>
                <div className="feature-icon-wrapper">
                  <Mic size={24} />
                </div>
                <h3 className="feature-card-title">Mock Interview Bot</h3>
                <p className="feature-card-desc">
                  Simulate rigorous technical & behavioral interviews based on the specific job requirements and company profile.
                </p>
              </div>
            </div>
          </section>

          {/* Interactive List Preview Section */}
          <section id="interactive-showcase" className="relative z-10 w-full max-w-6xl mx-auto px-6 mb-28">
            <div className="text-center mb-10">
              <div className="section-tag flex items-center justify-center gap-2">
                <Layers size={14} /> Systems Directory
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-black tracking-tight mb-3">
                Elevating Interaction Through Motion
              </h2>
              <p className="text-sm font-mono text-black/50">
                Hover over each system in the list to reveal the real-time spatial preview
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-black/10 shadow-2xl bg-neutral-950">
              <InteractiveListPreview
                items={SHOWCASE_ITEMS}
                bgColor="#0a0a0c"
                className="py-4"
              />
            </div>
          </section>

          {/* Flow Button Kinetic UI Showcase */}
          <section className="relative z-10 w-full max-w-6xl mx-auto px-6 mb-28">
            <div className="rounded-3xl border border-black/10 bg-white/70 backdrop-blur-xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-md">
                <div className="section-tag flex items-center gap-2 mb-2">
                  <Sparkles size={14} /> Kinetic Component
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight mb-2">
                  Interactive Flow Button
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Smooth dual cubic-bezier transforms with expanding radial focus masks and seamless directional arrow handoff.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 p-6 rounded-2xl bg-neutral-100/90 border border-black/5 shadow-inner">
                <FlowButton text="Flow Button" />
                <FlowButton
                  text="Analyze Resume"
                  onClick={() => setCurrentPage('upload')}
                />
              </div>
            </div>
          </section>

          {/* PillNav Kinetic UI Showcase */}
          <section className="relative z-10 w-full max-w-6xl mx-auto px-6 mb-28">
            <div className="rounded-3xl border border-black/10 bg-white/70 backdrop-blur-xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-md">
                <div className="section-tag flex items-center gap-2 mb-2">
                  <Sparkles size={14} /> Navigation System
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight mb-2">
                  PillNav Interactive Menu
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Rising circle GSAP physics, rotating interactive logo, and responsive mobile drawer transitions.
                </p>
              </div>

              <div className="w-full md:w-auto">
                <PillNavDemo />
              </div>
            </div>
          </section>
        </>
      )}

      {/* Upload Page */}
      {currentPage === 'upload' && (
        <div className="app-view-container">
          <button className="back-btn" onClick={() => setCurrentPage('hero')}>
            <ArrowLeft size={16} /> Back to Overview
          </button>

          <div className="view-card">
            <h2 className="view-title">ATS Resume Scanner</h2>
            <p className="view-subtitle">
              Upload your PDF or DOCX resume to test parse accuracy and extract keyword metrics.
            </p>

            <div
              className="dropzone-box"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleResumeUpload(file);
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: '#000',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }}
                >
                  <UploadCloud size={32} />
                </div>

                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px' }}>
                    Drag & drop your resume file
                  </h3>
                  <p style={{ color: 'rgba(0,0,0,0.5)', fontSize: '0.9rem', margin: 0 }}>
                    Supports PDF, DOCX (Max 10MB)
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleResumeUpload(file);
                  }}
                />

                <button
                  className="btn btn-primary"
                  style={{ padding: '0.9rem 2.2rem', fontSize: '0.95rem', marginTop: '8px' }}
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? 'Processing File...' : 'Choose File'}
                </button>

                {uploadStatus && (
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#10b981', marginTop: '10px' }}>
                    {uploadStatus}
                  </p>
                )}

                {resumeFile && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.04)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}
                  >
                    <FileText size={16} /> {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis View */}
      {currentPage === 'analysis' && (
        <div className="app-view-container">
          <button className="back-btn" onClick={() => setCurrentPage('hero')}>
            <ArrowLeft size={16} /> Back to Overview
          </button>

          <div className="view-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 className="view-title">Analysis & ATS Report</h2>
                <p className="view-subtitle" style={{ margin: 0 }}>
                  Parsed from: <strong>{resumeFile ? resumeFile.name : 'Candidate_SoftwareEngineer.pdf'}</strong>
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '12px 24px',
                  borderRadius: '100px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>89</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#059669' }}>ATS Score</div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} color="#059669" /> Top 12% Candidate
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Extracted Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {['React', 'TypeScript', 'Node.js', 'FastAPI', 'Python', 'Docker', 'MongoDB', 'PostgreSQL', 'Tailwind', 'REST APIs', 'AWS'].map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: '#ffffff',
                        border: '1px solid rgba(0,0,0,0.08)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Key Highlights</div>
                <ul style={{ margin: '12px 0 0', paddingLeft: '0', listStyle: 'none', fontSize: '0.88rem', color: 'rgba(0,0,0,0.7)', lineHeight: 1.8 }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#10b981" /> Quantifiable metrics detected in 70% of bullets
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#10b981" /> Clean standard single-column layout
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#10b981" /> Clear technical leadership indicators
                  </li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }} onClick={() => setCurrentPage('matching')}>
                Match With Job <ArrowRight size={16} />
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }} onClick={() => setCurrentPage('tailoring')}>
                Tailor Bullets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Matching View */}
      {currentPage === 'matching' && (
        <div className="app-view-container">
          <button className="back-btn" onClick={() => setCurrentPage('hero')}>
            <ArrowLeft size={16} /> Back to Overview
          </button>

          <div className="view-card">
            <h2 className="view-title">Job Skill Matching</h2>
            <p className="view-subtitle">
              Paste the target job description to run a semantic gap analysis against your resume.
            </p>

            <textarea
              style={{
                width: '100%',
                height: '150px',
                borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.12)',
                padding: '16px',
                fontFamily: 'inherit',
                fontSize: '0.92rem',
                marginBottom: '20px',
                outline: 'none',
                resize: 'vertical',
                background: 'rgba(255,255,255,0.7)',
              }}
              placeholder="Paste Job Description here (e.g. Senior Full Stack Engineer at Stripe)..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(0,0,0,0.5)' }}>Skill Alignment</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>86% Compatibility</div>
              </div>
              <div
                style={{
                  width: '160px',
                  height: '10px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ width: '86%', height: '100%', background: '#000000', borderRadius: '10px' }} />
              </div>
            </div>

            <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} color="#d97706" />
              <span style={{ fontSize: '0.88rem', color: '#92400e', fontWeight: 500 }}>
                Recommendation: Add 1 bullet highlighting GraphQL or microservice caching to bump match score to 95%.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }}
                onClick={() => setCurrentPage('tailoring')}
              >
                Tailor Resume For This Job <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bullet Tailoring View */}
      {currentPage === 'tailoring' && (
        <div className="app-view-container">
          <button className="back-btn" onClick={() => setCurrentPage('hero')}>
            <ArrowLeft size={16} /> Back to Overview
          </button>

          <div className="view-card">
            <h2 className="view-title">Claude AI Bullet Tailor</h2>
            <p className="view-subtitle">
              Transform passive job descriptions into metric-dense STAR-format achievements.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'rgba(0,0,0,0.7)' }}>
                Draft Resume Bullet
              </label>
              <input
                type="text"
                value={rawBullet}
                onChange={(e) => setRawBullet(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.12)',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  outline: 'none',
                  background: 'rgba(255,255,255,0.8)',
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ padding: '0.9rem 2.2rem', fontSize: '0.95rem', marginBottom: '28px' }}
              disabled={isTailoring}
              onClick={handleTailorBullet}
            >
              {isTailoring ? 'Claude is Tailoring...' : '✨ Enhance with Claude'}
            </button>

            {tailoredBullet && (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '18px',
                  background: '#f9f9fb',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6366f1', marginBottom: '8px' }}>
                  AI Tailored Result (STAR Method)
                </div>
                <p style={{ fontSize: '1.02rem', lineHeight: 1.6, fontWeight: 500, margin: 0, color: '#000000' }}>
                  {tailoredBullet}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mock Interview View */}
      {currentPage === 'interview' && (
        <div className="app-view-container">
          <button className="back-btn" onClick={() => setCurrentPage('hero')}>
            <ArrowLeft size={16} /> Back to Overview
          </button>

          <div className="view-card">
            <h2 className="view-title">Mock Interview Assistant</h2>
            <p className="view-subtitle">
              Simulate technical and behavioral rounds with intelligent STAR coaching.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Question 1 · System Architecture</div>
                <h4 style={{ fontSize: '1.05rem', margin: '8px 0 6px' }}>
                  "Tell me about a time you optimized a slow database query or backend bottleneck in production."
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.55)', margin: 0 }}>
                  Focus on: Profiling tools used, specific indexing/caching strategy, and quantifiable latency drop.
                </p>
              </div>

              <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Question 2 · Behavioral (STAR)</div>
                <h4 style={{ fontSize: '1.05rem', margin: '8px 0 6px' }}>
                  "Describe a scenario where you had to push back on a product requirement due to technical constraints."
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.55)', margin: 0 }}>
                  Focus on: Stakeholder alignment, alternative trade-offs presented, and business outcome.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}