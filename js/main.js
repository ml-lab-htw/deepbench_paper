// DOM ready bootstrapping is defined at the end of the file; avoid wrapping twice.

    // --- STATE ---
    let currentCorruption = 'Brightness';

    // --- DOM ELEMENTS ---
    const corruptionTypeHeading = document.getElementById('corruption-type-heading');
    const corruptionDescription = document.getElementById('corruption-description');
    const topThumbnailContainer = document.getElementById('thumbnail-container');

    // --- DATA ---
    const corruptions = [
        'Brightness', 'Contrast', 'GaussianBlur', 'GaussianNoise',
        'GlobalColourShift', 'GridDistortion', 'GridElasticDeformation',
        'ImageFlip', 'ImageRotation', 'MotionBlur', 'PerspectiveTransformation',
        'Rain', 'SaltPepperNoise', 'Shadow', 'CloudGenerator'
    ];

    const datasetSources = {
        'MedicalDiagnosis': '<strong>Medical:</strong> Eight datasets across radiography and ultrasound provide domain labels for medical imaging [Wang, 2017; Halabi, 2019; Sarhan, 2024; Ali, 2016; Baby, 2017; Al, 2020; Joo, 2023; Lee, 2017].',
        'AutonomousDriving': '<strong>Driving:</strong> KITTI offers diverse traffic scenes from onboard sensors; objects are cropped and relabeled into car, person, tram, and truck [Geiger, 2012].',
        'ManufacturingQuality': '<strong>Manufacturing:</strong> MVTec AD is repurposed as a 15-class object dataset over industrial items [Bergmann, 2019].',
        'PeopleRecognition': '<strong>People:</strong> FER13 contains 35k grayscale faces across seven emotions under varied conditions [Goodfellow, 2013].',
        'SatelliteImaging': '<strong>Satellite:</strong> AID provides high-res aerial scenes spanning 15 categories from Google Earth [Xia, 2017].',
        'Handheld': '<strong>Handheld:</strong> Food-101 comprises 101k images across 101 food categories in real-world handheld photography [Bossard, 2014].'
    };

    const useCases = [
        'AutonomousDriving', 'Handheld', 'ManufacturingQuality',
        'MedicalDiagnosis', 'PeopleRecognition', 'SatelliteImaging'
    ];

    const thumbnailFileMap = {
        'Brightness': 'Brightness_-60.png', 'CloudGenerator': 'CloudGenerator_0.5.png', 'Contrast': 'Contrast_1.5.png',
        'GaussianBlur': 'GaussianBlur_3.png', 'GaussianNoise': 'GaussianNoise_0.1.png', 'GlobalColourShift': 'GlobalColourShift_30.png',
        'GridDistortion': 'GridDistortion_0.5.png', 'GridElasticDeformation': 'GridElasticDeformation_0.5.png', 'ImageFlip': 'ImageFlip_1.png',
        'ImageRotation': 'ImageRotation_45.png', 'MotionBlur': 'MotionBlur_10_45.png', 'PerspectiveTransformation': 'PerspectiveTransformation_0.5.png',
        'Rain': 'Rain_0.5.png', 'SaltPepperNoise': 'SaltPepperNoise_0.05_0.5.png', 'Shadow': 'Shadow_0.5.png'
    };

    const corruptionDescriptions = {
        'GaussianBlur': 'Smoothens the image by blurring it, reducing fine details or noise.',
        'ImageRotation': 'Rotates the image by a specified angle, keeping its contents intact.',
        'GaussianNoise': 'Adds random, fine-grained noise (Gaussian) to simulate sensor noise.',
        'SaltPepperNoise': 'Adds random white and black dots to the image, mimicking noisy pixels.',
        'GlobalColourShift': 'Adjusts the overall color balance of the image, shifting its tones globally.',
        'Contrast': 'Alters the difference between light and dark areas to make the image appear more or less vivid.',
        'Brightness': 'Changes the overall lightness or darkness of the image.',
        'Rain': 'Adds synthetic raindrop effects or streaks to mimic rainy conditions.',
        'Shadow': 'Adds synthetic shadows to an image to simulate lighting conditions.',
        'MotionBlur': 'Blurs the image to simulate movement, as if the camera or object was in motion.',
        'GridDistortion': 'Distorts the image by applying a grid-like warping effect, bending specific areas.',
        'GridElasticDeformation': 'Applies a rubber-sheet-like deformation to the image, bending it smoothly.',
        'ImageFlip': 'Flips the image horizontally or vertically, mirroring its contents.',
        'PerspectiveTransformation': 'Warps images by changing its perspective, as if viewed from a different angle.',
        'CloudGenerator': 'Overlays or generates cloud-like textures in the image, simulating an overcast sky.'
    };

    // Dynamic images manifest for corruption examples
    const imagesManifestUrl = 'assets/images/manifest.json';
    let imagesManifest = null;
    async function loadImagesManifest() {
        if (imagesManifest) return imagesManifest;
        try {
            const res = await fetch(imagesManifestUrl);
            if (!res.ok) throw new Error('Failed to load images manifest');
            imagesManifest = await res.json();
        } catch (e) {
            console.warn('Images manifest not available; falling back to default patterns.', e);
            imagesManifest = {};
        }
        return imagesManifest;
    }

    const corruptionsPerUseCase = {
        'AutonomousDriving': ['Brightness','Contrast','ImageFlip','GaussianNoise','GlobalColourShift','ImageRotation','MotionBlur','PerspectiveTransformation','Rain','Shadow'],
        'Handheld': ['Brightness','Contrast','ImageFlip','GaussianNoise','GlobalColourShift','GridElasticDeformation','ImageRotation','MotionBlur','PerspectiveTransformation','Shadow'],
        'ManufacturingQuality': ['Brightness','Contrast','ImageFlip','GaussianBlur','GaussianNoise','GridDistortion','GridElasticDeformation','ImageRotation','MotionBlur','PerspectiveTransformation','SaltPepperNoise','Shadow'],
        'MedicalDiagnosis': ['Brightness','Contrast','ImageFlip','GaussianBlur','GaussianNoise','GridElasticDeformation','ImageRotation','MotionBlur','PerspectiveTransformation','SaltPepperNoise'],
        'PeopleRecognition': ['Brightness','Contrast','ImageFlip','GaussianNoise','GridElasticDeformation','ImageRotation','MotionBlur','PerspectiveTransformation','SaltPepperNoise','Shadow'],
        'SatelliteImaging': ['Brightness','CloudGenerator','Contrast','ImageFlip','GaussianNoise','ImageRotation','MotionBlur','PerspectiveTransformation','Shadow']
    };

    const plotCorruptionNameMap = {
        'ImageFlip': 'Flip'
    };

    // --- HELPERS ---
    function humanizeCamelCase(name) {
        return name.replace(/([A-Z])/g, ' $1').trim();
    }

    // Replace LaTeX-like citation markers with plain bracketed citation text (no links).
    // We use the citation key to produce something like " [Wang, 2017]" or fallback to [key].
    function applyCitations(content) {
        if (!content) return '';
        // Handle ~\citep and ~\cite (with leading tilde)
        content = content.replace(/~\\(?:cite|citep)\{([^}]+)}/g, (m, key) => {
            const yearMatch = key.match(/\d{4}/);
            const year = yearMatch ? yearMatch[0] : '';
            const authorPart = key.replace(/\d{4}.*/, '');
            const author = authorPart ? (authorPart.charAt(0).toUpperCase() + authorPart.slice(1)) : key;
            return ` [${author}${year ? ', ' + year : ''}]`;
        });
        // Handle \cite and \citep without tilde
        content = content.replace(/\\(?:cite|citep)\{([^}]+)}/g, (m, key) => {
            const yearMatch = key.match(/\d{4}/);
            const year = yearMatch ? yearMatch[0] : '';
            const authorPart = key.replace(/\d{4}.*/, '');
            const author = authorPart ? (authorPart.charAt(0).toUpperCase() + authorPart.slice(1)) : key;
            return ` [${author}${year ? ', ' + year : ''}]`;
        });
        return content;
    }

    // --- UPDATE FUNCTIONS ---
    async function updateLargeImageView() {
        const corruptionName = humanizeCamelCase(currentCorruption);
        corruptionTypeHeading.innerHTML = `Selected: <strong>${corruptionName}</strong>`;
        corruptionDescription.textContent = corruptionDescriptions[currentCorruption] || '';

        const container = document.getElementById('large-image-container');
        if (!container) return;

        // Render sequencing guard to avoid duplicate appends from overlapping async calls
        window.__lbSeq = (window.__lbSeq || 0) + 1;
        const seq = window.__lbSeq;
        container.dataset.renderSeq = String(seq);

        // Build list of sources using manifest, then fallbacks
        const sources = [];
        try {
            const manifest = await loadImagesManifest();
            const files = (manifest[currentCorruption] || []).slice(0, 4);
            if (files.length) {
                files.forEach(file => sources.push(`assets/images/${currentCorruption}/${file}`));
            } else {
                ['1','2','3','4'].forEach(n => sources.push(`assets/images/${currentCorruption}/${currentCorruption}_${n}.png`));
            }
        } catch (e) {
            ['1','2','3','4'].forEach(n => sources.push(`assets/images/${currentCorruption}/${currentCorruption}_${n}.png`));
        }

        // If a newer render started, abort
        if (container.dataset.renderSeq !== String(seq)) return;

        // Clear and append images
        container.innerHTML = '';
        let appended = 0;
        for (const src of sources) {
            const img = document.createElement('img');
            img.src = src;
            img.alt = `${corruptionName} example`;
            img.onerror = () => { img.remove(); };
            container.appendChild(img);
            appended++;
        }
        // Final fallback if nothing appended
        if (appended === 0) {
            const fallback = document.createElement('img');
            fallback.src = `assets/images/${currentCorruption}.png`;
            fallback.alt = `${corruptionName} example`;
            container.appendChild(fallback);
        }

        // Activate thumbnail state
        document.querySelectorAll('#thumbnail-container .thumbnail').forEach(thumb => {
            thumb.classList.toggle('active', thumb.dataset.corruption === currentCorruption);
        });
    }

    async function createThumbnail(corruptionName, onClick) {
        const thumbnail = document.createElement('img');
        thumbnail.classList.add('thumbnail');
        thumbnail.dataset.corruption = corruptionName;
        thumbnail.alt = `Thumbnail for ${corruptionName}`;

        // Always show a thumbnail: start with the top-level combined image
        const topLevel = `assets/images/${corruptionName}.png`;
        thumbnail.src = topLevel;

        thumbnail.addEventListener('click', onClick);

        // Try to upgrade to a folder example if available
        try {
            const manifest = await loadImagesManifest();
            const rep = (manifest[corruptionName] && manifest[corruptionName][0]) || thumbnailFileMap[corruptionName] || `${corruptionName}_1.png`;
            const candidate = `assets/images/${corruptionName}/${rep}`;
            // Preload and swap only if it loads
            const testImg = new Image();
            testImg.onload = () => { thumbnail.src = candidate; };
            testImg.onerror = () => { /* keep top-level */ };
            testImg.src = candidate;
        } catch (e) {
            // keep top-level if anything goes wrong
        }

        return thumbnail;
    }

    function buildCorruptionGallery() {
        topThumbnailContainer.innerHTML = '';
        (async () => {
            for (const corr of corruptions) {
                const thumb = await createThumbnail(corr, () => {
                    currentCorruption = corr;
                    updateLargeImageView();
                });
                topThumbnailContainer.appendChild(thumb);
            }
            updateLargeImageView();
        })();
    }

    function createExperimentSection({ expKey, container, basePath }) {
        // No heading/description — only thumbnails and plots in experiments

         // Thumbnails
         const thumbContainer = document.createElement('div');
         thumbContainer.id = `${expKey}-usecase-thumbnail-container`;
         thumbContainer.classList.add('thumbnail-container');
         container.appendChild(thumbContainer);

         // Options (context label only)
         const plotOptions = document.createElement('div');
         plotOptions.className = 'plot-options';
         plotOptions.innerHTML = `<span id="${expKey}-plot-context-label" class="plot-context-label"></span>`;
         container.appendChild(plotOptions);

         // Plots
         const plots = document.createElement('div');
         plots.id = `${expKey}-plots-container`;
         plots.className = 'plots-container';
         if (expKey === 'correlation') {
             plots.innerHTML = `
                 <div class="plot-block">
                     <h3>Correlation between LFP and Accuracy</h3>
                     <img id="${expKey}-corr-plot" alt="Correlation plot">
                 </div>
             `;
         } else {
             plots.innerHTML = `
                 <div class="plot-block">
                     <h3>Balanced Accuracy</h3>
                     <img id="${expKey}-acc-plot" alt="Balanced accuracy plot">
                 </div>
                 <div class="plot-block">
                     <h3 id="${expKey}-second-plot-title">Label Flip Probability</h3>
                     <img id="${expKey}-flip-plot" alt="Label flip probability plot">
                 </div>
             `;
         }
         container.appendChild(plots);

         // Local corruption thumbnail bar (skip for correlation)
         if (expKey !== 'correlation') {
             const corrBar = document.createElement('div');
             corrBar.id = `${expKey}-corruption-bar`;
             corrBar.classList.add('thumbnail-container', 'corruption-bar-local');
             container.appendChild(corrBar);
         }

         initializeSharedExperimentLogic(expKey, basePath);
     }

    function initializeSharedExperimentLogic(expKey, basePath) {
         const thumbs = document.getElementById(`${expKey}-usecase-thumbnail-container`);
         const accImg = document.getElementById(`${expKey}-acc-plot`);
         const flipImg = document.getElementById(`${expKey}-flip-plot`);
         const corrImg = document.getElementById(`${expKey}-corr-plot`);
         const plotContextLabelLocal = document.getElementById(`${expKey}-plot-context-label`);
         const plotsContainerLocal = document.getElementById(`${expKey}-plots-container`);
         const secondPlotTitleEl = document.getElementById(`${expKey}-second-plot-title`);
         const corruptionBar = document.getElementById(`${expKey}-corruption-bar`);

         // Determine which use cases to show for this experiment
         const ucList = (expKey === 'specialists')
           ? ['MedicalDiagnosis', 'SatelliteImaging']
           : useCases;

         let currentUC = ucList[0];
         let selectedCorruption = null; // null = combined view

         // build thumbnails for use cases
         ucList.forEach(uc => {
             const thumb = createUseCaseThumbnail(uc, () => {
                 currentUC = uc;
                 selectedCorruption = null;
                 updateCorruptionThumbnails();
                 updatePlots();
             });
             thumbs.appendChild(thumb);
         });

         function updateUseCaseSelection() {
             thumbs.querySelectorAll('.thumbnail').forEach(t => {
                 t.classList.toggle('active', t.dataset.usecase === currentUC);
             });
         }

         function updateCorruptionThumbnails() {
             if (!corruptionBar) return;
             corruptionBar.innerHTML = '';
             const availableCorruptions = corruptionsPerUseCase[currentUC] || [];
             (async () => {
                 for (const corr of availableCorruptions) {
                     const thumb = await createThumbnail(corr, () => {
                         if (selectedCorruption === corr) {
                             selectedCorruption = null;
                         } else {
                             selectedCorruption = corr;
                         }
                         updateCorruptionSelection();
                         updatePlots();
                     });
                     thumb.classList.add('corruption-thumb-small');
                     corruptionBar.appendChild(thumb);
                 }
                 updateCorruptionSelection();
             })();
         }

         function updateCorruptionSelection() {
             if (!corruptionBar) return;
             corruptionBar.querySelectorAll('.thumbnail').forEach(t => {
                 t.classList.toggle('active', t.dataset.corruption === selectedCorruption);
             });
         }

         function updatePlots() {
             updateUseCaseSelection();

             if (expKey === 'correlation') {
                 const corrPath = `assets/experiments/main/correlation_${currentUC}.png`;
                 if (corrImg) {
                     corrImg.onerror = null;
                     corrImg.src = corrPath;
                     corrImg.alt = `Correlation between LFP and Accuracy for ${humanizeCamelCase(currentUC)}`;
                 }
                 if (plotContextLabelLocal) plotContextLabelLocal.textContent = '';
                 return;
             }

             const corr = selectedCorruption;
             const corrForFile = corr ? (plotCorruptionNameMap[corr] || corr) : null;

             // Configure second plot depending on experiment
             const secondPrefix = (expKey === 'pretraining') ? 'mce' : 'flip';
             const secondTitle = (expKey === 'pretraining') ? 'Mean Corruption Error (MCE)' : 'Label Flip Probability';
             if (secondPlotTitleEl) secondPlotTitleEl.textContent = secondTitle;

             const combinedAcc = `${basePath}/acc_${currentUC}.png`;
             const perCorrAcc = corrForFile ? `${basePath}/acc_${currentUC}_${corrForFile}.png` : null;

             const combinedSecond = `${basePath}/${secondPrefix}_${currentUC}.png`;
             const perCorrSecond = corrForFile ? `${basePath}/${secondPrefix}_${currentUC}_${corrForFile}.png` : null;

             // Optional alternate prefix fallback (e.g., use flip when mce missing)
             const altSecondPrefix = (secondPrefix === 'mce') ? 'flip' : null;
             const combinedSecondAlt = altSecondPrefix ? `${basePath}/${altSecondPrefix}_${currentUC}.png` : null;
             const perCorrSecondAlt = (altSecondPrefix && corrForFile) ? `${basePath}/${altSecondPrefix}_${currentUC}_${corrForFile}.png` : null;

             const showPerCorruption = selectedCorruption !== null;
             let anyFallbackUsed = false;

             // Toggle side-by-side layout when showing per-corruption
             plotsContainerLocal.classList.toggle('side-by-side', showPerCorruption);

             function setWithFallback(imgEl, primary, fallback, altPrimary, altFallback) {
                 imgEl.onerror = null;
                 imgEl.alt = altPrimary;
                 imgEl.onerror = () => {
                     imgEl.onerror = null;
                     imgEl.src = fallback;
                     imgEl.alt = altFallback;
                     anyFallbackUsed = true;
                     updatePlotContextLabelLocal(showPerCorruption, anyFallbackUsed);
                 };
                 imgEl.src = primary;
             }

             function setWithMultiFallback(imgEl, sources, alts) {
                 let idx = 0;
                 function tryNext() {
                     if (idx >= sources.length) return;
                     imgEl.onerror = () => {
                         idx++;
                         anyFallbackUsed = true;
                         updatePlotContextLabelLocal(showPerCorruption, anyFallbackUsed);
                         tryNext();
                     };
                     imgEl.src = sources[idx];
                     imgEl.alt = alts[idx] || '';
                 }
                 tryNext();
             }

             if (showPerCorruption) {
                 // accuracy plot
                 setWithFallback(
                     accImg,
                     perCorrAcc,
                     combinedAcc,
                     `Balanced accuracy for ${humanizeCamelCase(currentUC)} — ${humanizeCamelCase(corr)}`,
                     `Balanced accuracy for ${humanizeCamelCase(currentUC)} (combined)`
                 );

                 // second plot with richer fallbacks for pretraining
                 if (expKey === 'pretraining') {
                     const sources = [perCorrSecond, combinedSecond];
                     const alts = [
                         `${secondTitle} for ${humanizeCamelCase(currentUC)} — ${humanizeCamelCase(corr)}`,
                         `${secondTitle} for ${humanizeCamelCase(currentUC)} (combined)`
                     ];
                     if (perCorrSecondAlt) {
                         sources.push(perCorrSecondAlt);
                         alts.push(`Label Flip Probability for ${humanizeCamelCase(currentUC)} — ${humanizeCamelCase(corr)}`);
                     }
                     if (combinedSecondAlt) {
                         sources.push(combinedSecondAlt);
                         alts.push(`Label Flip Probability for ${humanizeCamelCase(currentUC)} (combined)`);
                     }
                     setWithMultiFallback(flipImg, sources, alts);
                 } else {
                     setWithFallback(
                         flipImg,
                         perCorrSecond,
                         combinedSecond,
                         `${secondTitle} for ${humanizeCamelCase(currentUC)} — ${humanizeCamelCase(corr)}`,
                         `${secondTitle} for ${humanizeCamelCase(currentUC)} (combined)`
                     );
                 }
             } else {
                 accImg.onerror = null;
                 accImg.src = combinedAcc;
                 accImg.alt = `Balanced accuracy for ${humanizeCamelCase(currentUC)} (combined)`;

                 if (expKey === 'pretraining') {
                     const sources = [combinedSecond];
                     const alts = [`${secondTitle} for ${humanizeCamelCase(currentUC)} (combined)`];
                     if (combinedSecondAlt) {
                         sources.push(combinedSecondAlt);
                         alts.push(`Label Flip Probability for ${humanizeCamelCase(currentUC)} (combined)`);
                     }
                     setWithMultiFallback(flipImg, sources, alts);
                 } else {
                     flipImg.onerror = null;
                     flipImg.src = combinedSecond;
                     flipImg.alt = `${secondTitle} for ${humanizeCamelCase(currentUC)} (combined)`;
                 }
             }

             updatePlotContextLabelLocal(showPerCorruption, anyFallbackUsed);
         }

         function updatePlotContextLabelLocal(showPerCorruption, usedFallback=false) {
             if (!plotContextLabelLocal) return;
             if (showPerCorruption) {
                 if (usedFallback) {
                     plotContextLabelLocal.textContent = `Per-corruption plot not available for ${humanizeCamelCase(selectedCorruption)} in ${humanizeCamelCase(currentUC)} — showing combined.`;
                 } else {
                     plotContextLabelLocal.textContent = `Showing: ${humanizeCamelCase(currentUC)} — ${humanizeCamelCase(selectedCorruption)}`;
                 }
             } else {
                 plotContextLabelLocal.textContent = '';
             }
         }

         // initial
         updateUseCaseSelection();
         updateCorruptionThumbnails();
         updatePlots();
     }

    function createUseCaseThumbnail(useCaseName, onClick) {
        const thumbnail = document.createElement('img');
        thumbnail.classList.add('thumbnail');
        thumbnail.dataset.usecase = useCaseName;
        thumbnail.alt = `Thumbnail for ${useCaseName}`;
        thumbnail.src = `assets/experiments/usecases/${useCaseName}_1.png`;
        thumbnail.onerror = () => {
            thumbnail.src = `assets/experiments/usecases/${useCaseName}.png`;
            thumbnail.onerror = () => { thumbnail.removeAttribute('src'); thumbnail.alt = 'Example not available.'; };
        };
        thumbnail.addEventListener('click', onClick);
        return thumbnail;
    }

    // --- RQ1 MODEL SELECTOR ---
    const rq1Models = [
        { id: 'gpt-4o',              label: 'GPT-4o' },
        { id: 'gpt-4o-mini',         label: 'GPT-4o-mini' },
        { id: 'gpt-oss_120b',        label: 'GPT-OSS 120B' },
        { id: 'qwen_110b',           label: 'Qwen2.5 110B' },
        { id: 'llama3.3_70b',        label: 'Llama-3.3 70B' },
        { id: 'deepseek-r1_70b',     label: 'DeepSeek-R1 70B' },
        { id: 'gemma3_27b',          label: 'Gemma-3 27B' },
        { id: 'llama_4_scout_17b',   label: 'Llama-4 Scout 17B' },
        { id: 'phi4_14b',            label: 'Phi-4 14B' },
        { id: 'qwen3_8b',            label: 'Qwen2.5 8B' },
        { id: 'mistral_latest',      label: 'Mistral 8x7B' },
    ];

    function buildRQ1ModelSelector() {
        const container = document.getElementById('rq1-model-thumbnails');
        const heatmap = document.getElementById('rq1-heatmap');
        const title = document.getElementById('rq1-plot-title');
        if (!container || !heatmap) return;

        let selectedModel = rq1Models[0].id;

        function update() {
            const model = rq1Models.find(m => m.id === selectedModel);
            const path = `assets/experiments/augmentation_selection/${selectedModel}/augmentation_selection_${selectedModel}_heatmap_flipped.png`;
            heatmap.src = path;
            heatmap.alt = `Heatmap of ${model.label} corruption selection frequencies`;
            if (title) title.textContent = `Corruption Selection Frequencies (${model.label})`;
            container.querySelectorAll('.rq1-model-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.model === selectedModel);
            });
        }

        rq1Models.forEach(model => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rq1-model-btn';
            btn.dataset.model = model.id;
            btn.textContent = model.label;
            btn.addEventListener('click', () => {
                selectedModel = model.id;
                update();
            });
            container.appendChild(btn);
        });

        update();
    }

    // --- INITIALIZATION ---
    function initialize() {
        buildCorruptionGallery();
        buildUseCasesSection();
        buildRQ1ModelSelector();
        document.querySelectorAll('.experiment').forEach(expDiv => {
            const expKey = expDiv.dataset.exp;
            const basePath = `assets/experiments/${expKey}`;
            createExperimentSection({ expKey, container: expDiv, basePath });
        });

        // Header shrink on scroll
        setupHeaderScrollBehavior();

        // Toggle Coming Soon via URL or global flag
        setupComingSoonAutoToggle();

        // Removed duplicate renderSources call; handled on DOMContentLoaded
        // renderSources();

        // Apply citations to any exp-summary paragraphs (they contain ~\cite references)
        document.querySelectorAll('p.exp-summary').forEach(p => {
            p.innerHTML = applyCitations(p.innerHTML);
        });

        // Removed duplicate initial image render to prevent double rows
        // updateLargeImageView();

        // Hook up citation copy button
        const copyBtn = document.getElementById('copy-cite-btn');
        const citeCode = document.getElementById('cite-bibtex');
        if (copyBtn && citeCode) {
            copyBtn.addEventListener('click', async () => {
                const text = citeCode.textContent || '';
                try {
                    await navigator.clipboard.writeText(text);
                    copyBtn.classList.add('copied');
                    const prev = copyBtn.textContent;
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.textContent = prev; }, 1200);
                } catch (e) {
                    // Fallback: select text
                    const range = document.createRange();
                    range.selectNodeContents(citeCode);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                    try {
                        document.execCommand('copy');
                        copyBtn.classList.add('copied');
                        const prev = copyBtn.textContent;
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.textContent = prev; }, 1200);
                    } finally {
                        sel.removeAllRanges();
                    }
                }
            });
        }

        // Hide dataset description boxes inside experiments to focus on plots
        document.querySelectorAll('[id$="-usecase-description-box"]').forEach(box => {
            box.style.display = 'none';
        });
    }

    // Coming Soon toggle helpers
    function setComingSoon(active) {
        document.body.classList.toggle('coming-soon-active', !!active);
        const overlay = document.getElementById('coming-soon-overlay');
        if (overlay) overlay.setAttribute('aria-hidden', active ? 'false' : 'true');
    }
    function toggleComingSoon() {
        setComingSoon(!document.body.classList.contains('coming-soon-active'));
    }
    function setupComingSoonAutoToggle() {
        const params = new URLSearchParams(window.location.search);
        const fromParam = params.get('comingSoon');
        const fromGlobal = typeof window.SHOW_COMING_SOON !== 'undefined' ? !!window.SHOW_COMING_SOON : null;
        if (fromParam === '1' || fromParam === 'true') setComingSoon(true);
        else if (fromParam === '0' || fromParam === 'false') setComingSoon(false);
        else if (fromGlobal !== null) setComingSoon(fromGlobal);
    }

    // Expose toggle on window for easy manual control
    window.toggleComingSoon = toggleComingSoon;
    window.setComingSoon = setComingSoon;

    // Build Use Cases section: description and 4-image grid for selected use case
    function buildUseCasesSection() {
        const thumbContainer = document.getElementById('usecases-thumbnail-container');
        const descEl = document.getElementById('usecases-description');
        const imagesGrid = document.getElementById('usecases-images');
        if (!thumbContainer || !descEl || !imagesGrid) return;

        let selectedUC = 'AutonomousDriving';

        function renderUseCase() {
            const content = datasetSources[selectedUC] || '';
            descEl.innerHTML = applyCitations(content);
            renderUseCaseImages(selectedUC, imagesGrid);
            thumbContainer.querySelectorAll('.thumbnail').forEach(t => {
                t.classList.toggle('active', t.dataset.usecase === selectedUC);
            });
        }

        // Build thumbnails for all use cases
        useCases.forEach(uc => {
            const thumb = document.createElement('img');
            thumb.classList.add('thumbnail');
            thumb.dataset.usecase = uc;
            thumb.alt = `Thumbnail for ${uc}`;
            // Reuse existing example thumbnails
            thumb.src = `assets/experiments/usecases/${uc}_1.png`;
            thumb.onerror = () => {
                thumb.src = `assets/experiments/usecases/${uc}.png`;
                thumb.onerror = () => { thumb.removeAttribute('src'); thumb.alt = 'Example not available.'; };
            };
            thumb.addEventListener('click', () => { selectedUC = uc; renderUseCase(); });
            thumbContainer.appendChild(thumb);
        });

        renderUseCase();
    }

    function renderUseCaseImages(uc, gridEl) {
        gridEl.innerHTML = '';
        // Try to load four images for the dataset use case
        const candidates = [
            `assets/experiments/usecases/${uc}_1.png`,
            `assets/experiments/usecases/${uc}_2.png`,
            `assets/experiments/usecases/${uc}_3.png`,
            `assets/experiments/usecases/${uc}_4.png`,
        ];
        candidates.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = `${uc} example`;
            img.onerror = () => { img.remove(); };
            gridEl.appendChild(img);
        });
    }


// === Sources Section Loader ===

// Utility: strip outer braces or quotes
function stripOuter(value) {
  if (!value) return '';
  value = value.trim();
  if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('"') && value.endsWith('"'))) {
    value = value.substring(1, value.length - 1);
  }
  // Remove nested brace artifacts and collapse whitespace
  return value.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}

// Parse BibTeX text into an array of entries while preserving order
function parseBibtexText(bibText) {
  const entries = [];
  const text = bibText
    .split('\n')
    .filter(line => !/^\s*(#|%|\/\/|[-]{2,}|\s*$)/.test(line)) // drop comments, separators, empty
    .join('\n');

  let i = 0;
  const n = text.length;
  while (i < n) {
    // find next '@'
    if (text[i] !== '@') { i++; continue; }
    i++; // skip '@'
    // read type
    let type = '';
    while (i < n && /[A-Za-z]/.test(text[i])) { type += text[i++]; }
    // skip until '{'
    while (i < n && text[i] !== '{') i++;
    if (i >= n) break;
    i++; // skip '{'

    // read entry content until matching '}'
    let depth = 1;
    let content = '';
    while (i < n && depth > 0) {
      const ch = text[i++];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      content += ch;
    }
    // content currently ends with the closing '}', remove last '}' added
    if (content.endsWith('}')) content = content.slice(0, -1);

    // first token up to first comma is the key
    let key = '';
    let rest = '';
    const firstCommaIdx = (() => {
      let d = 0; // track nested for safety
      for (let j = 0; j < content.length; j++) {
        const c = content[j];
        if (c === '{') d++;
        else if (c === '}') d--;
        else if (c === ',' && d === 0) return j;
      }
      return -1;
    })();
    if (firstCommaIdx >= 0) {
      key = content.slice(0, firstCommaIdx).trim();
      rest = content.slice(firstCommaIdx + 1);
    } else {
      key = content.trim();
      rest = '';
    }

    // parse fields in rest
    const fields = {};
    const parts = [];
    // split on commas at top level
    (function splitTopLevel() {
      let d = 0, current = '';
      let inQuotes = false;
      for (let j = 0; j < rest.length; j++) {
        const c = rest[j];
        if (c === '"') inQuotes = !inQuotes;
        if (!inQuotes) {
          if (c === '{') d++;
          else if (c === '}') d--;
          if (c === ',' && d === 0) {
            parts.push(current);
            current = '';
            continue;
          }
        }
        current += c;
      }
      if (current.trim()) parts.push(current);
    })();

    parts.forEach(p => {
      const eqIdx = p.indexOf('=');
      if (eqIdx === -1) return;
      const name = p.slice(0, eqIdx).trim().toLowerCase();
      const value = stripOuter(p.slice(eqIdx + 1).trim());
      if (name) fields[name] = value;
    });

    entries.push({ type: (type || '').toLowerCase(), key, fields });
  }
  return entries;
}

// Format author list "A and B and C" -> "A, B and C"
function formatAuthors(authorField) {
  if (!authorField) return '';
  const authors = authorField.split(/\s+and\s+/i).map(a => a.trim()).filter(Boolean);
  if (authors.length === 0) return '';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors.slice(0, -1).join(', ')}, and ${authors[authors.length - 1]}`;
}

function formatPages(pages) {
  if (!pages) return '';
  return pages.replace(/--/g, '–');
}

// Build structured HTML for a reference entry
function formatBibEntryHTML(entry) {
  const f = entry.fields;
  const authors = formatAuthors(f.author);
  const title = f.title ? f.title.replace(/[{}]/g, '') : '';
  const year = f.year || '';
  const volume = f.volume ? f.volume : '';
  const number = f.number ? `(${f.number})` : '';
  const pages = f.pages ? formatPages(f.pages) : '';
  const publisher = f.publisher || '';
  const booktitle = f.booktitle || '';
  const journal = f.journal || '';
  const organization = f.organization || '';
  const note = f.note || '';

  let venue = '';
  switch (entry.type) {
    case 'article':
      if (journal) {
        let jp = [journal];
        let volIssue = volume ? (number ? `${volume}${number}` : volume) : '';
        if (volIssue) jp.push(volIssue);
        if (pages) jp.push(pages);
        venue = jp.join(', ');
      }
      break;
    case 'inproceedings':
      if (booktitle) {
        let extras = [];
        if (pages) extras.push(pages);
        if (organization) extras.push(organization);
        venue = `In: ${booktitle}`;
        if (extras.length) venue += `, ${extras.join(', ')}`;
      }
      break;
    case 'book': {
      const bits = [];
      if (publisher) bits.push(publisher);
      if (bits.length) venue = bits.join(', ');
      break;
    }
    default: {
      const where = journal || booktitle || publisher || organization;
      if (where) venue = where;
    }
  }

  const parts = [];
  if (authors) parts.push(`<span class="ref-authors">${authors}</span>`);
  if (title) parts.push(`<span class="ref-title">${title}</span>`);
  if (venue) parts.push(`<span class="ref-venue">${venue}</span>`);
  if (year) parts.push(`<span class="ref-year">${year}</span>`);
  if (note) parts.push(`<span class="ref-note">${note}</span>`);

  return parts.join(' ');
}

// 1. Load BibTeX file
async function loadBibtex() {
  try {
    const response = await fetch('assets/references.bib');
    if (!response.ok) { console.error('Failed to load BibTeX file'); return null; }
    return await response.text();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// 4. Render Sources section (all entries, formatted, no links)
async function renderSources() {
  const bibtex = await loadBibtex();
  if (!bibtex) return;
  const entries = parseBibtexText(bibtex);
  const container = document.getElementById('sources-list');
  if (!container) return;

  // Create ordered list like in a paper
  const ol = document.createElement('ol');
  ol.className = 'references-list';

  // Build all <li> first
  const items = entries.map(entry => {
    const li = document.createElement('li');
    li.innerHTML = formatBibEntryHTML(entry);
    return li;
  });

  // Expand/collapse behavior
  const INITIAL_COUNT = 5; // number of items to show by default
  const total = items.length;
  items.forEach((li, idx) => {
    if (idx >= INITIAL_COUNT) li.style.display = 'none';
    ol.appendChild(li);
  });

  // Clear and append fresh content
  container.innerHTML = '';
  container.appendChild(ol);

  if (total > INITIAL_COUNT) {
    const controls = document.createElement('div');
    controls.className = 'references-controls';

    const summary = document.createElement('span');
    summary.className = 'references-summary';
    summary.textContent = `Showing ${Math.min(INITIAL_COUNT, total)} of ${total}`;

    const btn = document.createElement('button');
    btn.id = 'references-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = `Show all ${total}`;

    let expanded = false;
    btn.addEventListener('click', () => {
      expanded = !expanded;
      if (expanded) {
        items.forEach(li => { li.style.display = ''; });
        btn.textContent = 'Show less';
        btn.setAttribute('aria-expanded', 'true');
        summary.textContent = `Showing ${total} of ${total}`;
      } else {
        items.forEach((li, idx) => { li.style.display = idx < INITIAL_COUNT ? '' : 'none'; });
        btn.textContent = `Show all ${total}`;
        btn.setAttribute('aria-expanded', 'false');
        summary.textContent = `Showing ${Math.min(INITIAL_COUNT, total)} of ${total}`;
      }
    });

    controls.appendChild(summary);
    controls.appendChild(btn);
    container.appendChild(controls);
  }
}

// Call on load
document.addEventListener('DOMContentLoaded', () => {
    renderSources();
    initialize();
});
function setupHeaderScrollBehavior() {
        const headerEl = document.querySelector('header');
        if (!headerEl) return;

        function onScroll() {
            if (window.scrollY > 20) headerEl.classList.add('scrolled');
            else headerEl.classList.remove('scrolled');
            const h = headerEl.getBoundingClientRect().height;
            document.documentElement.style.setProperty('--header-offset', `${Math.round(h)}px`);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', () => onScroll());
        onScroll();
    }

// Add header background grid population (deterministic 4-row layout)
async function populateHeaderBgGrid() {
    const grid = document.querySelector('.header-bg-grid');
    const headerEl = document.querySelector('header');
    if (!grid || !headerEl) return;

    // Read CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    const tileSizeRaw = rootStyles.getPropertyValue('--header-tile-size').trim() || '28px';
    const gapRaw = rootStyles.getPropertyValue('--header-tile-gap').trim() || '6px';
    const tileSize = parseFloat(tileSizeRaw);
    const gap = parseFloat(gapRaw);
    const rows = 4; // fixed rows requested by user

    // Compute available width inside the header (subtract header horizontal padding)
    const headerStyles = getComputedStyle(headerEl);
    const paddingLeft = parseFloat(headerStyles.paddingLeft) || 0;
    const paddingRight = parseFloat(headerStyles.paddingRight) || 0;
    const availableWidth = Math.max(0, headerEl.clientWidth - paddingLeft - paddingRight);

    // Determine number of columns such that tile size ~ CSS tile size and grid fills width
    // We compute columns = floor((availableWidth + gap) / (tileSize + gap)) but ensure at least 1
    let columns = Math.max(1, Math.floor((availableWidth + gap) / (tileSize + gap)));
    // Cap columns to a reasonable number to avoid runaway on very wide screens
    columns = Math.min(columns, 128);

    // Set explicit grid template so there are exactly `columns` columns and `rows` rows
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, ${tileSize}px)`;

    // Determine number of tiles to render
    const totalTiles = columns * rows;

    // Build list of candidate image sources (try manifest, fallback to numeric files)
    const exampleDir = 'assets/example_images';
    let files = [];
    try {
        const manifestUrl = exampleDir + '/manifest.json';
        const res = await fetch(manifestUrl, { cache: 'no-cache' });
        if (res.ok) {
            const m = await res.json();
            if (Array.isArray(m) && m.length) files = m.map(p => exampleDir + '/' + p);
        }
    } catch (e) {
        // ignore manifest errors
    }
    if (!files.length) {
        // fallback numeric patterns known in repo
        for (let i = 0; i <= 140; i++) files.push(`${exampleDir}/${i}.png`);
        // also some original names exist; include a few common alternatives if present
        // (we won't check existence here — broken images will simply show as broken but won't affect count)
    }

    function shuffleArray(input) {
        const arr = input.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    const signature = files.join('|');
    if (!window.__headerGridFiles || window.__headerGridFilesSignature !== signature) {
        window.__headerGridFiles = shuffleArray(files);
        window.__headerGridFilesSignature = signature;
    }
    const shuffledFiles = window.__headerGridFiles;

    // Prepare fragment and ensure exactly totalTiles elements
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < totalTiles; i++) {
        const src = shuffledFiles[i % shuffledFiles.length]; // cycle through candidates to fill the grid
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        // fade-in when loaded (non-destructive)
        img.style.opacity = '0';
        img.addEventListener('load', () => { img.style.transition = 'opacity 220ms ease'; img.style.opacity = '1'; });
        // do not remove on error — keep placeholder to preserve grid shape
        img.addEventListener('error', () => { img.style.opacity = '0.12'; img.style.filter = 'grayscale(60%)'; });
        fragment.appendChild(img);
    }

    grid.appendChild(fragment);

    // Recompute on resize (debounced). Install listener once.
    if (!window.__headerGridResizeInit) {
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { populateHeaderBgGrid().catch(() => {}); }, 120);
        });
        window.__headerGridResizeInit = true;
    }
}

// Ensure --primary-color-rgb is populated from --primary-color (supports #hex and rgb(...) formats)
function ensurePrimaryColorRgb() {
    try {
        const root = document.documentElement;
        const cs = getComputedStyle(root);
        let c = cs.getPropertyValue('--primary-color').trim();
        if (!c) return;
        let r, g, b;
        if (c.startsWith('#')) {
            const hex = c.slice(1).trim();
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else if (hex.length === 6) {
                r = parseInt(hex.slice(0,2), 16);
                g = parseInt(hex.slice(2,4), 16);
                b = parseInt(hex.slice(4,6), 16);
            }
        } else if (c.startsWith('rgb')) {
            const parts = c.replace(/rgba?\(|\)/g, '').split(',').map(s => s.trim());
            r = parseInt(parts[0], 10);
            g = parseInt(parts[1], 10);
            b = parseInt(parts[2], 10);
        }
        if ([r,g,b].every(v => Number.isFinite(v))) {
            root.style.setProperty('--primary-color-rgb', `${r}, ${g}, ${b}`);
        }
    } catch (e) {
        // silently ignore
        console.warn('Failed to derive --primary-color-rgb', e);
    }
}

// --- LIGHTBOX ---
function setupLightbox() {
    const overlay = document.getElementById('lightbox-overlay');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close');
    if (!overlay || !lightboxImg || !closeBtn) return;

    function openLightbox(src, alt) {
        lightboxImg.src = src;
        lightboxImg.alt = alt || '';
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Close on backdrop click (but not on the image itself)
    overlay.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) closeLightbox();
    });

    closeBtn.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeLightbox();
    });

    // Delegate clicks: any image inside content areas with the zoomable class
    document.addEventListener('click', (e) => {
        const img = e.target.closest('img.zoomable-img');
        if (img) openLightbox(img.src, img.alt);
    });

    // Mark existing and future content images as zoomable using a MutationObserver
    function markZoomable(root) {
        // Selectors for images that should be clickable
        const selectors = [
            '#graphical-abstract img',
            '.corruption-images-grid img',
            '.usecases-images-grid img',
            '.plot-block img',
        ];
        selectors.forEach(sel => {
            root.querySelectorAll(sel).forEach(img => {
                if (!img.classList.contains('thumbnail') && !img.closest('.header-bg-grid')) {
                    img.classList.add('zoomable-img');
                }
            });
        });
    }

    // Initial pass
    markZoomable(document);

    // Observe DOM changes so dynamically added images also become zoomable
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'IMG') {
                        // Check if the added img itself matches
                        const parent = node.closest('.corruption-images-grid, .usecases-images-grid, .plot-block, #graphical-abstract');
                        if (parent && !node.classList.contains('thumbnail')) {
                            node.classList.add('zoomable-img');
                        }
                    } else {
                        markZoomable(node);
                    }
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// Ensure header grid populates on initialize()
const _initialize_orig = initialize;
initialize = function() {
    // call original initialize logic
    try { _initialize_orig(); } catch (e) { console.error(e); }
    // ensure RGB var for overlay follows primary color
    ensurePrimaryColorRgb();
    // populate grid (don't block main rendering)
    populateHeaderBgGrid().catch(err => { console.warn('Header grid population failed', err); });
    // setup lightbox for image zoom
    setupLightbox();
};

