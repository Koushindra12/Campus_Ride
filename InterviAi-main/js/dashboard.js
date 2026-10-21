/* ============================================================
   INTERVIAI — dashboard.js
   Dashboard page logic: charts, widgets, stats
   ============================================================ */

const Dashboard = (() => {
  function init() {
    const profile = Storage.getProfile();
    const history = Storage.getHistory();

    // Greeting
    const greetingEl = document.getElementById('dashboard-greeting');
    if (greetingEl) greetingEl.textContent = Utils.getGreeting() + ',';

    const nameEl = document.getElementById('dashboard-name');
    if (nameEl) nameEl.textContent = profile.name.split(' ')[0] + ' 👋';

    // Stats
    const totalInterviews = history.length;
    const avgScore = totalInterviews > 0 ? Math.round(history.reduce((s, i) => s + i.score, 0) / totalInterviews) : 0;
    const bestScore = totalInterviews > 0 ? Math.max(...history.map(i => i.score)) : 0;

    Utils.animateCounter(document.getElementById('stat-interviews'), 0, totalInterviews, 800);
    Utils.animateCounter(document.getElementById('stat-avg-score'), 0, avgScore, 900, '%');
    Utils.animateCounter(document.getElementById('stat-best-score'), 0, bestScore, 1000);
    Utils.animateCounter(document.getElementById('stat-streak'), 0, profile.streak || 3, 700, ' days');

    // Resume card
    const resume = Storage.getResumeData();
    renderResumeCard(resume);

    // Recent history
    renderRecentHistory(history.slice(0, 3));

    // Charts
    renderPerformanceChart();
    renderSkillsRadar();

    // Animate progress bars
    setTimeout(() => {
      document.querySelectorAll('.progress-bar-hm[data-width]').forEach(bar => {
        const w = bar.getAttribute('data-width');
        Utils.animateProgressBar(bar, parseInt(w));
      });
    }, 300);
  }

  function renderResumeCard(resume) {
    const el = document.getElementById('resume-analysis-card');
    if (!el) return;

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div>
          <div class="card-title">Resume Analysis</div>
          <div style="font-size:1.05rem;font-weight:800;color:var(--primary)">${resume.candidate.name}</div>
        </div>
        <div class="badge-hm badge-success" style="font-size:0.7rem">
          <i class="bi bi-check-circle-fill"></i> Analyzed
        </div>
      </div>

      <div style="background:var(--bg);border-radius:var(--radius);padding:12px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary)">Detected Role</div>
          <div class="badge-hm badge-accent">${resume.primaryRole}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="progress-hm" style="flex:1">
            <div class="progress-bar-hm gradient" data-width="${resume.confidence}" style="width:0%"></div>
          </div>
          <span style="font-size:0.8rem;font-weight:700;color:var(--accent)">${resume.confidence}%</span>
        </div>
      </div>

      <div style="margin-bottom:12px">
        <div style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:8px">Skills</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          ${resume.skills.slice(0, 6).map(s => `<span class="skill-tag">${s}</span>`).join('')}
          ${resume.skills.length > 6 ? `<span class="skill-tag" style="background:var(--bg);color:var(--text-muted);border-color:var(--border)">+${resume.skills.length - 6}</span>` : ''}
        </div>
      </div>

      <div style="margin-bottom:12px">
        <div style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:6px">Projects</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          ${resume.projects.map(p => `
            <div style="display:flex;align-items:center;gap:6px;font-size:0.8rem;color:var(--text-secondary)">
              <i class="bi bi-folder-fill" style="color:var(--accent);font-size:0.75rem"></i>
              ${p.name}
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.78rem">
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:8px">
          <div style="color:var(--text-muted);font-size:0.65rem;margin-bottom:2px">Experience</div>
          <div style="font-weight:600;color:var(--text-primary)">${resume.experience[0]?.title || 'N/A'}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:8px">
          <div style="color:var(--text-muted);font-size:0.65rem;margin-bottom:2px">Education</div>
          <div style="font-weight:600;color:var(--text-primary)">${resume.education[0]?.degree || 'N/A'}</div>
        </div>
      </div>

      <a href="upload.html" class="btn-hm btn-outline" style="width:100%;justify-content:center;margin-top:14px">
        <i class="bi bi-arrow-repeat"></i> Re-analyze Resume
      </a>
    `;
  }

  function renderRecentHistory(history) {
    const el = document.getElementById('recent-history');
    if (!el) return;

    if (history.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:32px;color:var(--text-muted)">
          <i class="bi bi-camera-video" style="font-size:2rem;display:block;margin-bottom:8px"></i>
          No interviews yet. Start your first interview!
        </div>
      `;
      return;
    }

    el.innerHTML = history.map(item => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:var(--radius);transition:background 0.2s;cursor:pointer" 
           onmouseenter="this.style.background='var(--bg)'" 
           onmouseleave="this.style.background='transparent'"
           onclick="window.location.href='report.html'">
        <div class="card-icon ${item.score >= 75 ? 'success' : item.score >= 50 ? 'warning' : 'danger'}">
          <i class="bi bi-camera-video-fill"></i>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:0.875rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.role}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${item.type} • ${Utils.formatDate(item.date)} • ${item.duration}</div>
        </div>
        <div class="score-chip ${Utils.getScoreClass(item.score)}">${item.score}/100</div>
        <i class="bi bi-chevron-right" style="color:var(--text-muted);font-size:0.8rem"></i>
      </div>
    `).join('<div class="divider" style="margin:0"></div>');
  }

  function renderPerformanceChart() {
    const canvas = document.getElementById('performance-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const history = Storage.getHistory();
    const labels = history.slice().reverse().map(h => Utils.formatDate(h.date));
    const data = history.slice().reverse().map(h => h.score);

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['No data'],
        datasets: [{
          label: 'Interview Score',
          data: data.length > 0 ? data : [0],
          borderColor: '#5865f2',
          backgroundColor: 'rgba(88,101,242,0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e2a3a',
            titleColor: '#ffffff',
            bodyColor: '#a0aec0',
            borderColor: 'rgba(99,102,241,0.3)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: ctx => `Score: ${ctx.raw}/100`
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 11 }, color: '#94a3b8' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: '#94a3b8' }
          }
        }
      }
    });
  }

  function renderSkillsRadar() {
    const canvas = document.getElementById('skills-radar');
    if (!canvas || typeof Chart === 'undefined') return;

    const lastReport = Storage.getLastReport();
    const data = lastReport?.metrics || {
      'Technical': 82,
      'Communication': 68,
      'Problem Solving': 81,
      'Role Knowledge': 79,
      'Answer Quality': 85
    };

    new Chart(canvas, {
      type: 'radar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Your Skills',
          data: Object.values(data),
          backgroundColor: 'rgba(37,99,235,0.12)',
          borderColor: '#2563eb',
          pointBackgroundColor: '#2563eb',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 4,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { display: false },
            grid: { color: 'rgba(0,0,0,0.06)' },
            pointLabels: { font: { size: 11 }, color: '#475569' }
          }
        }
      }
    });
  }

  return { init };
})();

window.Dashboard = Dashboard;
