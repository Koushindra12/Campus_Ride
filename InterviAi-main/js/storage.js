/* ============================================================
   INTERVIAI — storage.js
   localStorage abstraction layer
   ============================================================ */

const Storage = (() => {
  const PREFIX = 'hm_';

  const key = (k) => PREFIX + k;

  const get = (k, fallback = null) => {
    try {
      const val = localStorage.getItem(key(k));
      return val !== null ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  };

  const set = (k, v) => {
    try { localStorage.setItem(key(k), JSON.stringify(v)); return true; }
    catch { return false; }
  };

  const remove = (k) => { localStorage.removeItem(key(k)); };

  const clear = () => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(PREFIX)) localStorage.removeItem(k);
    });
  };

  // Specific typed helpers
  const getUser = () => get('user');
  const setUser = (u) => set('user', u);
  const clearUser = () => remove('user');

  const isLoggedIn = () => !!get('user');

  const getProfile = () => get('profile', {
    name: 'Mohan Saini',
    email: 'student@interviai.ai',
    role: 'Student',
    education: 'B.Tech CSE',
    university: 'DTU, New Delhi',
    avatar: 'MS',
    skills: ['Python', 'Flask', 'JavaScript', 'MongoDB', 'HTML', 'CSS', 'REST API'],
    projects: ['SmartStudy AI', 'SUG-Exam', 'Task Flow'],
    interviewCount: 5,
    avgScore: 74,
    bestScore: 88,
    streak: 3
  });

  const setProfile = (p) => set('profile', p);

  const getHistory = () => get('history', [
    {
      id: 'int-001',
      date: '2026-09-12',
      role: 'Full Stack Developer',
      score: 88,
      type: 'Technical',
      duration: '22 min',
      status: 'Completed',
      questions: 10
    },
    {
      id: 'int-002',
      date: '2026-09-10',
      role: 'Python Developer',
      score: 76,
      type: 'HR',
      duration: '15 min',
      status: 'Completed',
      questions: 8
    },
    {
      id: 'int-003',
      date: '2026-09-07',
      role: 'Backend Developer',
      score: 69,
      type: 'Project Based',
      duration: '18 min',
      status: 'Completed',
      questions: 10
    },
    {
      id: 'int-004',
      date: '2026-09-04',
      role: 'Full Stack Developer',
      score: 55,
      type: 'Technical',
      duration: '12 min',
      status: 'Incomplete',
      questions: 6
    }
  ]);

  const addHistory = (entry) => {
    const h = getHistory();
    h.unshift({ ...entry, id: 'int-' + Date.now() });
    set('history', h);
  };

  const getConfig = () => get('interviewConfig', {
    type: 'technical',
    role: 'Full Stack Developer',
    difficulty: 'intermediate',
    duration: 20,
    language: 'english',
    questionCount: 10,
    cameraMonitoring: true,
    integrityMonitoring: true,
    recording: false
  });

  const setConfig = (c) => set('interviewConfig', c);

  const getResumeData = () => get('resumeData', {
    name: 'mohan_resume.pdf',
    size: '1.2 MB',
    uploadedAt: new Date().toISOString(),
    parsed: true,
    candidate: {
      name: 'Mohan Saini',
      email: 'mohan.saini@email.com',
      phone: '+91 98765 43210',
      location: 'New Delhi, India',
      linkedin: 'linkedin.com/in/mohansaini'
    },
    skills: ['Python', 'Flask', 'JavaScript', 'MongoDB', 'HTML', 'CSS', 'REST API', 'Git', 'React JS'],
    projects: [
      { name: 'SmartStudy AI', tech: 'Python, Flask, OpenAI API, React', desc: 'AI-powered study assistant with adaptive quizzing' },
      { name: 'SUG-Exam', tech: 'Python, MongoDB, REST API', desc: 'Examination management system for university' },
      { name: 'Task Flow', tech: 'JavaScript, HTML, CSS', desc: 'Task management web application' }
    ],
    experience: [{ title: 'Web Development Intern', company: 'TechCorp Solutions', duration: '3 months' }],
    education: [{ degree: 'B.Tech CSE', institution: 'Delhi Technological University', year: '2024' }],
    detectedRoles: [
      { role: 'Full Stack Developer', match: 92 },
      { role: 'Python Backend Developer', match: 87 },
      { role: 'Web Developer', match: 78 }
    ],
    primaryRole: 'Full Stack Developer',
    confidence: 92,
    strengths: ['Strong project portfolio', 'Diverse tech stack', 'AI/ML experience'],
    missing: ['Cloud experience (AWS/GCP)', 'Testing frameworks', 'Docker/Kubernetes']
  });

  const setResumeData = (r) => set('resumeData', r);

  const getLastReport = () => get('lastReport', null);
  const setLastReport = (r) => set('lastReport', r);

  const getSettings = () => get('settings', {
    theme: 'dark',
    notifications: true,
    soundEnabled: true,
    autoSave: true
  });

  const setSettings = (s) => set('settings', s);

  return {
    get, set, remove, clear,
    getUser, setUser, clearUser, isLoggedIn,
    getProfile, setProfile,
    getHistory, addHistory,
    getConfig, setConfig,
    getResumeData, setResumeData,
    getLastReport, setLastReport,
    getSettings, setSettings
  };
})();

window.Storage = Storage;
