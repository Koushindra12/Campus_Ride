/* ============================================================
   INTERVIAI — resume.js
   Resume upload logic with drag-and-drop and AI processing simulation
   ============================================================ */

const Resume = (() => {
  let selectedFile = null;

  function init() {
    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const uploadBtn = document.getElementById('upload-btn');

    if (!zone) return;

    // Drag & drop events
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    zone.addEventListener('click', () => fileInput && fileInput.click());

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) handleFile(fileInput.files[0]);
      });
    }

    if (browseBtn) {
      browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput && fileInput.click();
      });
    }

    if (uploadBtn) {
      uploadBtn.addEventListener('click', startUpload);
    }
  }

  function handleFile(file) {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    if (!Utils.validators.fileType(file, allowedTypes)) {
      Utils.showError('Invalid File Type', 'Please upload a PDF, DOC, or DOCX file.');
      return;
    }

    if (!Utils.validators.fileSize(file, 10)) {
      Utils.showError('File Too Large', 'Maximum file size is 10 MB.');
      return;
    }

    selectedFile = file;
    showFilePreview(file);
  }

  function showFilePreview(file) {
    const zone = document.getElementById('upload-zone');
    const preview = document.getElementById('file-preview');
    const uploadBtn = document.getElementById('upload-btn');

    if (zone) zone.style.display = 'none';
    if (preview) {
      preview.style.display = 'flex';
      const nameEl = preview.querySelector('#file-name');
      const sizeEl = preview.querySelector('#file-size');
      const iconEl = preview.querySelector('#file-icon');

      if (nameEl) nameEl.textContent = file.name;
      if (sizeEl) sizeEl.textContent = Utils.formatFileSize(file.size);
      if (iconEl) {
        const ext = file.name.split('.').pop().toLowerCase();
        iconEl.className = `bi bi-file-earmark-${ext === 'pdf' ? 'pdf' : 'word'}-fill`;
        iconEl.style.color = ext === 'pdf' ? '#ef4444' : '#3b82f6';
        iconEl.style.fontSize = '2.5rem';
      }
    }
    if (uploadBtn) uploadBtn.removeAttribute('disabled');
  }

  async function startUpload() {
    if (!selectedFile) return;

    const uploadBtn = document.getElementById('upload-btn');
    const progressSection = document.getElementById('progress-section');
    const filePreview = document.getElementById('file-preview');

    Utils.setButtonLoading(uploadBtn, true, 'Processing...');
    if (filePreview) filePreview.style.display = 'none';
    if (progressSection) progressSection.style.display = 'block';

    const steps = [
      { label: 'Uploading Resume...', icon: 'bi-cloud-arrow-up-fill', progress: 15 },
      { label: 'Extracting Text & Structure...', icon: 'bi-file-text-fill', progress: 30 },
      { label: 'Detecting Skills & Technologies...', icon: 'bi-cpu-fill', progress: 50 },
      { label: 'Identifying Projects & Experience...', icon: 'bi-folder-fill', progress: 68 },
      { label: 'Analyzing Education Background...', icon: 'bi-mortarboard-fill', progress: 80 },
      { label: 'Detecting Best Fit Role...', icon: 'bi-bullseye', progress: 90 },
      { label: 'Generating Interview Plan...', icon: 'bi-calendar-check-fill', progress: 100 }
    ];

    const stepsList = document.getElementById('processing-steps');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressPercent = document.getElementById('progress-percent');

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await Utils.delay(700 + Math.random() * 400);

      if (stepsList) {
        const existingSteps = stepsList.querySelectorAll('.proc-step');
        existingSteps.forEach(s => {
          const icon = s.querySelector('.proc-icon');
          if (icon) icon.className = 'bi bi-check-circle-fill proc-icon';
          if (icon) icon.style.color = 'var(--success)';
        });

        const stepEl = document.createElement('div');
        stepEl.className = 'proc-step';
        stepEl.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 0;animation:fadeInUp 0.3s ease';
        stepEl.innerHTML = `
          <i class="bi ${step.icon} proc-icon" style="font-size:1rem;color:var(--accent);width:20px;text-align:center"></i>
          <span style="font-size:0.875rem;color:var(--text-secondary)">${step.label}</span>
          <div class="spinner-hm spinner-sm" style="margin-left:auto"></div>
        `;
        stepsList.appendChild(stepEl);
        stepsList.scrollTop = stepsList.scrollHeight;
      }

      if (progressBar) progressBar.style.width = step.progress + '%';
      if (progressPercent) progressPercent.textContent = step.progress + '%';
    }

    await Utils.delay(600);

    // Save resume data
    const resumeData = Storage.getResumeData();
    resumeData.name = selectedFile.name;
    resumeData.size = Utils.formatFileSize(selectedFile.size);
    resumeData.uploadedAt = new Date().toISOString();
    Storage.setResumeData(resumeData);

    Utils.showSuccess('Resume Analyzed!', 'AI has successfully analyzed your resume. Redirecting to results...');
    await Utils.delay(1200);
    Utils.navigate('analysis.html');
  }

  function resetUpload() {
    selectedFile = null;
    const zone = document.getElementById('upload-zone');
    const preview = document.getElementById('file-preview');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');

    if (zone) zone.style.display = '';
    if (preview) preview.style.display = 'none';
    if (uploadBtn) uploadBtn.setAttribute('disabled', '');
    if (fileInput) fileInput.value = '';
  }

  return { init, resetUpload };
})();

window.Resume = Resume;
