// DOM ready bootstrapping is defined at the end of the file; avoid wrapping twice.

    // --- STATE ---
    let currentCorruption = 'Brightness';

    // --- DOM ELEMENTS ---
    const largeImage = document.getElementById('large-image');
    const corruptionTypeHeading = document.getElementById('corruption-type-heading');
    const corruptionDescription = document.getElementById('corruption-description');
    const topThumbnailContainer = document.getElementById('thumbnail-container');

    // --- DATA ---
    const corruptions = [
        'Brightness', 'Contrast', 'GaussianBlur', 'GaussianNoise',
        'GlobalColourShift', 'GridDistortion', 'GridElasticDeformation',
        'ImageRotation', 'MotionBlur', 'PerspectiveTransformation', 'Rain',
        'SaltPepperNoise', 'Shadow', 'CloudGenerator'
    ];

    const datasetSources = {
        'MedicalDiagnosis': '<strong>Medical:</strong> Eight datasets across radiography and ultrasound provide domain labels for medical imaging [Wang, 2017; Halabi, 2019; Sarhan, 2024; Ali, 2016; Baby, 2017; Al, 2020; Joo, 2013; Lee, 2017].',
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
        // Build sequentially; createThumbnail is async to read manifest safely
        (async () => {
            for (const corr of corruptions) {
                const thumb = await createThumbnail(corr, () => {
                    currentCorruption = corr;
                    updateLargeImageView();
                    document.querySelectorAll('.experiment').forEach(expDiv => {
                        const ev = new Event('corruptionChanged');
                        expDiv.dispatchEvent(ev);
                    });
                });
                topThumbnailContainer.appendChild(thumb);
            }
            updateLargeImageView();
        })();
    }

    function createExperimentSection({ expKey, container, basePath }) {
        // Title / selected use case
        const title = document.createElement('h3');
        title.id = `${expKey}-usecase-type-heading`;
        container.appendChild(title);

        // Description box
        const descBox = document.createElement('div');
        descBox.id = `${expKey}-usecase-description-box`;
        const desc = document.createElement('p');
        desc.id = `${expKey}-usecase-description`;
        descBox.appendChild(desc);
        container.appendChild(descBox);

        // Thumbnails
        const thumbContainer = document.createElement('div');
        thumbContainer.id = `${expKey}-usecase-thumbnail-container`;
        thumbContainer.classList.add('thumbnail-container');
        container.appendChild(thumbContainer);

        // Options (filter toggle)
        const plotOptions = document.createElement('div');
        plotOptions.className = 'plot-options';
        // For correlation experiment, there is no per-corruption toggle
        plotOptions.innerHTML = (expKey === 'correlation')
            ? `<span id="${expKey}-plot-context-label" class="plot-context-label"></span>`
            : `
            <label><input type="checkbox" id="${expKey}-filter-by-corruption"> Show only selected corruption</label>
            <span id="${expKey}-plot-context-label" class="plot-context-label"></span>
        `;
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

        initializeSharedExperimentLogic(expKey, basePath);
    }

    function initializeSharedExperimentLogic(expKey, basePath) {
        const heading = document.getElementById(`${expKey}-usecase-type-heading`);
        const thumbs = document.getElementById(`${expKey}-usecase-thumbnail-container`);
        const desc = document.getElementById(`${expKey}-usecase-description`);
        const accImg = document.getElementById(`${expKey}-acc-plot`);
        const flipImg = document.getElementById(`${expKey}-flip-plot`);
        const corrImg = document.getElementById(`${expKey}-corr-plot`);
        const filterToggle = document.getElementById(`${expKey}-filter-by-corruption`);
        const plotContextLabelLocal = document.getElementById(`${expKey}-plot-context-label`);
        const plotsContainerLocal = document.getElementById(`${expKey}-plots-container`);
        const descBoxEl = document.getElementById(`${expKey}-usecase-description-box`);
        const secondPlotTitleEl = document.getElementById(`${expKey}-second-plot-title`);

        // Determine which use cases to show for this experiment
        const ucList = (expKey === 'specialists')
          ? ['MedicalDiagnosis', 'SatelliteImaging']
          : useCases;

        let currentUC = ucList[0];

        // build thumbnails for use cases
        ucList.forEach(uc => {
            const thumb = createUseCaseThumbnail(uc, () => {
                currentUC = uc;
                updateUseCaseHeading();
                updatePlots();
            });
            thumbs.appendChild(thumb);
        });

        // Restore persisted toggle if any (non-correlation only)
        if (filterToggle) {
            const saved = localStorage.getItem(`${expKey}_filterByCorruption`);
            if (saved === '1' || saved === '0') filterToggle.checked = saved === '1';
            filterToggle.addEventListener('change', () => {
                localStorage.setItem(`${expKey}_filterByCorruption`, filterToggle.checked ? '1' : '0');
                updatePlots();
            });
        }

        // react when global corruption changes (non-correlation only)
        const onGlobalCorrChange = () => {
            updatePlots();
        };
        document.querySelectorAll('.experiment').forEach(expDiv => {
            expDiv.addEventListener('corruptionChanged', onGlobalCorrChange);
        });

        function updateUseCaseHeading() {
            heading.innerHTML = `Selected: <strong>${humanizeCamelCase(currentUC)}</strong>`;
            const content = datasetSources[currentUC] || '';
            desc.innerHTML = applyCitations(content);
            thumbs.querySelectorAll('.thumbnail').forEach(t => {
                t.classList.toggle('active', t.dataset.usecase === currentUC);
            });
        }

        function updatePlots() {
            const corr = currentCorruption;
            const corrForFile = plotCorruptionNameMap[corr] || corr;

            if (expKey === 'correlation') {
                // Correlation plot lives under main experiment assets path
                const corrPath = `assets/experiments/main/correlation_${currentUC}.png`;
                if (corrImg) {
                    corrImg.onerror = null;
                    corrImg.src = corrPath;
                    corrImg.alt = `Correlation between LFP and Accuracy for ${humanizeCamelCase(currentUC)}`;
                }
                if (plotContextLabelLocal) plotContextLabelLocal.textContent = '';
                return;
            }

            // Configure second plot depending on experiment
            const secondPrefix = (expKey === 'pretraining') ? 'mce' : 'flip';
            const secondTitle = (expKey === 'pretraining') ? 'Mean Corruption Error (MCE)' : 'Label Flip Probability';
            if (secondPlotTitleEl) secondPlotTitleEl.textContent = secondTitle;

            const combinedAcc = `${basePath}/acc_${currentUC}.png`;
            const perCorrAcc = `${basePath}/acc_${currentUC}_${corrForFile}.png`;

            const combinedSecond = `${basePath}/${secondPrefix}_${currentUC}.png`;
            const perCorrSecond = `${basePath}/${secondPrefix}_${currentUC}_${corrForFile}.png`;

            // Optional alternate prefix fallback (e.g., use flip when mce missing)
            const altSecondPrefix = (secondPrefix === 'mce') ? 'flip' : null;
            const combinedSecondAlt = altSecondPrefix ? `${basePath}/${altSecondPrefix}_${currentUC}.png` : null;
            const perCorrSecondAlt = altSecondPrefix ? `${basePath}/${altSecondPrefix}_${currentUC}_${corrForFile}.png` : null;

            const showPerCorruption = !!(filterToggle && filterToggle.checked);
            let anyFallbackUsed = false;

            // Toggle side-by-side layout when showing per-corruption
            plotsContainerLocal.classList.toggle('side-by-side', showPerCorruption);

            function setWithFallback(imgEl, primary, fallback, altPrimary, altFallback) {
                imgEl.onerror = null;
                imgEl.src = primary;
                imgEl.alt = altPrimary;
                imgEl.onerror = () => {
                    imgEl.onerror = null;
                    imgEl.src = fallback;
                    imgEl.alt = altFallback;
                    anyFallbackUsed = true;
                    updatePlotContextLabelLocal(showPerCorruption, anyFallbackUsed);
                };
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
                    // Try combined MCE then combined flip as fallback
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
                    plotContextLabelLocal.textContent = `Per-corruption plot not available for ${humanizeCamelCase(currentCorruption)} in ${humanizeCamelCase(currentUC)} — showing combined.`;
                } else {
                    plotContextLabelLocal.textContent = `Showing: ${humanizeCamelCase(currentUC)} — ${humanizeCamelCase(currentCorruption)}`;
                }
            } else {
                plotContextLabelLocal.textContent = '';
            }
        }

        // Stabilize description box height to avoid layout jumping
        function computeAndSetStableDescHeight() {
            if (!descBoxEl) return;
            const cs = window.getComputedStyle(descBoxEl);
            const width = descBoxEl.clientWidth || parseFloat(cs.width) || 0;
            if (!width) return; // can't measure yet

            const measure = document.createElement('div');
            measure.style.position = 'absolute';
            measure.style.left = '-10000px';
            measure.style.top = '0';
            measure.style.visibility = 'hidden';
            measure.style.pointerEvents = 'none';
            measure.style.width = width + 'px';
            // mirror key typography/padding
            measure.style.fontFamily = cs.fontFamily;
            measure.style.fontSize = cs.fontSize;
            measure.style.fontWeight = cs.fontWeight;
            measure.style.lineHeight = cs.lineHeight;
            measure.style.paddingTop = cs.paddingTop;
            measure.style.paddingBottom = cs.paddingBottom;
            measure.style.paddingLeft = cs.paddingLeft;
            measure.style.paddingRight = cs.paddingRight;

            const p = document.createElement('p');
            measure.appendChild(p);
            document.body.appendChild(measure);

            let maxInner = 0;
            ucList.forEach(uc => {
                p.innerHTML = applyCitations(datasetSources[uc] || '');
                // Force reflow and measure
                const h = p.offsetHeight;
                if (h > maxInner) maxInner = h;
            });

            const padTop = parseFloat(cs.paddingTop) || 0;
            const padBottom = parseFloat(cs.paddingBottom) || 0;
            const targetMin = Math.ceil(maxInner + padTop + padBottom);
            descBoxEl.style.minHeight = targetMin + 'px';

            // cleanup
            document.body.removeChild(measure);
        }
        // simple debounce
        function debounce(fn, wait=150) {
            let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
        }

        const recomputeStableHeight = debounce(() => computeAndSetStableDescHeight(), 150);

        // initial
        updateUseCaseHeading();
        updatePlots();
        computeAndSetStableDescHeight();
        window.addEventListener('resize', recomputeStableHeight);
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

    // --- INITIALIZATION ---
    function initialize() {
        buildCorruptionGallery();

        // Build the Use Cases showcase section
        buildUseCasesSection();

        // Create experiment sections dynamically from DOM mount points
        document.querySelectorAll('.experiment').forEach(expDiv => {
            const expKey = expDiv.dataset.exp;
            const basePath = `assets/experiments/${expKey}`;
            createExperimentSection({ expKey, container: expDiv, basePath });
        });

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

// Build a plain-text, paper-style reference string without links
function formatBibEntry(entry) {
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

  let parts = [];
  if (authors) parts.push(authors + '.');
  if (title) parts.push(title + '.');

  switch (entry.type) {
    case 'article':
      if (journal) {
        let j = journal;
        let volIssue = volume ? (number ? `${volume}${number}` : volume) : '';
        let jp = [];
        jp.push(j);
        if (volIssue) jp.push(volIssue);
        if (pages) jp.push(pages);
        parts.push(jp.join(', ') + '.');
      }
      if (year) parts.push(year + '.');
      break;
    case 'inproceedings':
      if (booktitle) {
        let conf = `In: ${booktitle}`;
        let extras = [];
        if (pages) extras.push(pages);
        if (organization) extras.push(organization);
        if (extras.length) conf += `, ${extras.join(', ')}`;
        parts.push(conf + '.');
      }
      if (year) parts.push(year + '.');
      break;
    case 'book':
      const pubBits = [];
      if (publisher) pubBits.push(publisher);
      if (year) pubBits.push(year);
      if (pubBits.length) parts.push(pubBits.join(', ') + '.');
      break;
    default:
      // Fallback: include journal or booktitle or publisher if available
      const where = journal || booktitle || publisher || organization;
      if (where) parts.push(where + '.');
      if (year) parts.push(year + '.');
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
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
    li.textContent = formatBibEntry(entry);
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
