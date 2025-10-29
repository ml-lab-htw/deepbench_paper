document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let currentCorruption = 'Brightness';
    let currentUseCase = 'AutonomousDriving';

    // --- DOM ELEMENTS ---
    const largeImage = document.getElementById('large-image');
    const corruptionTypeHeading = document.getElementById('corruption-type-heading');
    const corruptionDescription = document.getElementById('corruption-description');
    const topThumbnailContainer = document.getElementById('thumbnail-container');
    const tabsContainer = document.querySelector('.tabs');
    const plotsContainer = document.getElementById('plots-container');
    const datasetSourceContent = document.getElementById('dataset-source-content');
    const useCaseTypeHeading = document.getElementById('usecase-type-heading');
    const useCaseDescription = document.getElementById('usecase-description');
    const useCaseThumbnailContainer = document.getElementById('usecase-thumbnail-container');
    const useCaseDescriptionBox = document.getElementById('usecase-description-box');

    // --- DATA ---
    const corruptions = [
        'Brightness', 'CloudGenerator', 'Contrast', 'GaussianBlur', 'GaussianNoise',
        'GlobalColourShift', 'GridDistortion', 'GridElasticDeformation',
        'ImageRotation', 'MotionBlur', 'PerspectiveTransformation', 'Rain',
        'SaltPepperNoise', 'Shadow'
    ];

    const citationData = {
        'wang2017chestx': 'https://www.cv-foundation.org/openaccess/content_cvpr_2017/html/Wang_ChestX-ray8_Hospital-Scale_Chest_CVPR_2017_paper.html',
        'halabi2019rsna': 'https://pubs.rsna.org/doi/10.1148/radiol.2018180548',
        'sarhan2024knee': 'https://www.atlantis-press.com/journals/ijcis/125970008/view',
        'ali2016detection': 'https://www.thinkmind.org/index.php?view=article&articleid=icsea_2016_10_30_30103',
        'baby2017automatic': 'https://ieeexplore.ieee.org/document/7953361',
        'al2020dataset': 'https://www.sciencedirect.com/science/article/pii/S235234091931228X',
        'joo2023classification': 'https://www.mdpi.com/2075-4418/13/8/1380', // This seems to be a different paper, but using what's in bib
        'lee2017curated': 'https://www.nature.com/articles/sdata2017177',
        'geiger2012we': 'http://www.cvlibs.net/publications/Geiger2012CVPR.pdf',
        'bergmann2019mvtec': 'https://www.mvtec.com/company/research/datasets/mvtec-ad',
        'goodfellow2013challenges': 'https://link.springer.com/chapter/10.1007/978-3-642-41340-3_8',
        'xia2017aid': 'https://ieeexplore.ieee.org/document/7926695',
        'bossard2014food': 'https://link.springer.com/chapter/10.1007/978-3-319-10578-9_29'
    };

    const datasetSources = {
        'MedicalDiagnosis': '<strong>Medical:</strong> We use eight datasets for medical domain identification, including chest X-rays~\\citep{wang2017chestx}, hand X-rays for bone age assessment~\\citep{halabi2019rsna}, knee X-rays for osteoarthritis diagnosis~\\citep{sarhan2024knee}, dental X-rays~\\citep{ali2016detection}, ultrasound images for nerve segmentation~\\citep{baby2017automatic}, breast ultrasound images~\\citep{al2020dataset}, liver fibrosis ultrasound images~\\citep{joo2023classification}, and mammography images~\\citep{lee2017curated}. Each image is labeled according to its medical domain, with 126--999 samples per class.',
        'AutonomousDriving': '<strong>Driving:</strong> The autonomous driving dataset KITTI (Karlsruhe Institute of Technology and Toyota Technological Institute,~\\cite{geiger2012we}) consists of hours of traffic scenarios recorded with a variety of sensor modalities, including high-resolution RGB images. These images were cropped around non-overlapping object bounding boxes and re-labeled into four categories: <em>car</em>, <em>person</em>, <em>tram</em>, <em>truck</em>, with 156--4660 samples per class.',
        'ManufacturingQuality': '<strong>Manufacturing:</strong> The MVTec anomaly detection dataset for quality control (MVTec AD,~\\cite{bergmann2019mvtec}) is repurposed as a 15-class object classification task over industrial items, with 60--391 samples per class.',
        'PeopleRecognition': '<strong>People:</strong> The Facial Expression Recognition 2013 dataset (FER13,~\\cite{goodfellow2013challenges}) contains 35,887 grayscale face images labeled with seven emotion categories, with 751--1093 samples per class.',
        'SatelliteImaging': '<strong>Satellite:</strong> The Aerial Image Dataset (AID,~\\cite{xia2017aid}) offers 15 scene categories (e.g., farmland, airport) with 800 high-res RGB images per class from Google Earth.',
        'Handheld': '<strong>Handheld:</strong> Food-101~\\citep{bossard2014food} is a dataset including 101 thousand images across 101 food categories (1,000 per class), showing a range of dishes under varied real-world conditions.'
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
        'GaussianBlur': 'Smoothens the image by blurring it, reducing fine details or noise.', 'ImageRotation': 'Rotates the image by a specified angle, keeping its contents intact.',
        'GaussianNoise': 'Adds random, fine-grained noise (Gaussian) to simulate sensor noise.', 'SaltPepperNoise': 'Adds random white and black dots to the image, mimicking noisy pixels.',
        'GlobalColourShift': 'Adjusts the overall color balance of the image, shifting its tones globally.', 'Contrast': 'Alters the difference between light and dark areas to make the image appear more or less vivid.',
        'Brightness': 'Changes the overall lightness or darkness of the image.', 'Rain': 'Adds synthetic raindrop effects or streaks to mimic rainy conditions.',
        'Shadow': 'Adds synthetic shadows to an image to simulate lighting conditions.', 'MotionBlur': 'Blurs the image to simulate movement, as if the camera or object was in motion.',
        'GridDistortion': 'Distorts the image by applying a grid-like warping effect, bending specific areas.', 'GridElasticDeformation': 'Applies a rubber-sheet-like deformation to the image, bending it smoothly.',
        'PerspectiveTransformation': 'Warps images by changing its perspective, as if viewed from a different angle.', 'CloudGenerator': 'Overlays or generates cloud-like textures in the image, simulating an overcast sky.'
    };

    // --- HELPERS ---
    function humanizeCamelCase(name) {
        return name.replace(/([A-Z])/g, ' $1').trim();
    }

    function applyCitations(content) {
        if (!content) return '';
        return content.replace(/~\\(cite|citep)\{([^}]+)}/g, (match, command, key) => {
            const url = citationData[key];
            if (url) {
                const year = (key.match(/\d{4}/) || [''])[0];
                const author = key.replace(/\d{4}.*/, '');
                const linkText = `[${author.charAt(0).toUpperCase() + author.slice(1)}, ${year}]`;
                return ` <a href="${url}" target="_blank" class="citation-link">${linkText}</a>`;
            }
            return ` [${key}]`;
        });
    }

    // --- UPDATE FUNCTIONS ---
    function updateAllViews() {
        updateLargeImageView();
        updatePlotsView();
        updateDatasetSourceView();
        updateUseCaseSelectionView();
        lockUseCaseDescriptionHeight();
    }

    function updateLargeImageView() {
        // Update heading and description
        const corruptionName = humanizeCamelCase(currentCorruption);
        corruptionTypeHeading.innerHTML = `Selected: <strong>${corruptionName}</strong>`;
        corruptionDescription.textContent = corruptionDescriptions[currentCorruption] || '';

        // Update large image
        largeImage.src = `assets/images/${currentCorruption}.png`;

        // Update active thumbnail
        document.querySelectorAll('#thumbnail-container .thumbnail').forEach(thumb => {
            thumb.classList.toggle('active', thumb.dataset.corruption === currentCorruption);
        });
    }

    function updateUseCaseSelectionView() {
        const useCaseName = humanizeCamelCase(currentUseCase);
        useCaseTypeHeading.innerHTML = `Selected: <strong>${useCaseName}</strong>`;

        let content = datasetSources[currentUseCase] || '';
        content = applyCitations(content);
        useCaseDescription.innerHTML = content || 'Description not available.';

        // Update active use case thumbnail
        document.querySelectorAll('#usecase-thumbnail-container .thumbnail').forEach(thumb => {
            thumb.classList.toggle('active', thumb.dataset.usecase === currentUseCase);
        });
    }

    function updateDatasetSourceView() {
        let content = datasetSources[currentUseCase] || '';
        content = applyCitations(content);
        if (datasetSourceContent) {
            datasetSourceContent.innerHTML = content;
        }
    }

    function updatePlotsView() {
        const accImg = document.getElementById('acc-plot');
        const flipImg = document.getElementById('flip-plot');
        accImg.src = `assets/experiments/main/acc_${currentUseCase}.png`;
        accImg.alt = `Balanced accuracy for ${humanizeCamelCase(currentUseCase)}`;
        flipImg.src = `assets/experiments/main/flip_${currentUseCase}.png`;
        flipImg.alt = `Label flip plot for ${humanizeCamelCase(currentUseCase)}`;
    }

    // Measure tallest description across use cases and fix the box height
    function lockUseCaseDescriptionHeight() {
        if (!useCaseDescriptionBox) return;

        // Create a hidden measurer with the same width
        const measurer = document.createElement('div');
        measurer.style.visibility = 'hidden';
        measurer.style.position = 'absolute';
        measurer.style.left = '-9999px';
        measurer.style.top = '0';
        // Match width to current box width to reflect wrapping at this breakpoint
        const targetWidth = useCaseDescriptionBox.clientWidth || useCaseDescriptionBox.offsetWidth || 600;
        measurer.style.width = targetWidth + 'px';
        // Inherit font styles from body/section
        measurer.style.fontFamily = getComputedStyle(useCaseDescriptionBox).fontFamily;
        measurer.style.fontSize = getComputedStyle(useCaseDescriptionBox).fontSize;
        measurer.style.lineHeight = getComputedStyle(useCaseDescriptionBox).lineHeight;
        document.body.appendChild(measurer);

        let maxH = 0;
        useCases.forEach(uc => {
            const raw = datasetSources[uc] || '';
            const html = applyCitations(raw);
            measurer.innerHTML = `<p style="margin:0">${html}</p>`;
            const h = measurer.offsetHeight;
            if (h > maxH) maxH = h;
        });

        document.body.removeChild(measurer);
        if (maxH > 0) {
            useCaseDescriptionBox.style.height = maxH + 'px';
        }
    }

    // Debounced resize handler to recompute height when layout width changes
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // reset height to allow recalculation under new width
            useCaseDescriptionBox.style.height = 'auto';
            lockUseCaseDescriptionHeight();
        }, 150);
    });

    // --- INITIALIZATION ---
    function initialize() {
        // 1. Create Corruption Thumbnails (Top Gallery)
        corruptions.forEach(corruptionName => {
            const thumbnail = createThumbnail(corruptionName, () => {
                currentCorruption = corruptionName;
                updateAllViews();
            });
            topThumbnailContainer.appendChild(thumbnail);
        });

        // 2. Create Use Case Thumbnails (Experiments)
        if (tabsContainer) tabsContainer.innerHTML = '';
        useCaseThumbnailContainer.innerHTML = '';
        useCases.forEach(useCase => {
            const thumb = createUseCaseThumbnail(useCase, () => {
                currentUseCase = useCase;
                updateAllViews();
            });
            useCaseThumbnailContainer.appendChild(thumb);
        });

        // 3. Create Plot Elements
        plotsContainer.innerHTML = '';

        const accTitle = document.createElement('h3');
        accTitle.textContent = 'Balanced Accuracy';
        plotsContainer.appendChild(accTitle);

        const accImg = document.createElement('img');
        accImg.id = 'acc-plot';
        accImg.onerror = () => { accImg.alt = 'Plot not available.'; };
        plotsContainer.appendChild(accImg);

        const flipTitle = document.createElement('h3');
        flipTitle.textContent = 'Label Flip Probability';
        plotsContainer.appendChild(flipTitle);

        const flipImg = document.createElement('img');
        flipImg.id = 'flip-plot';
        flipImg.onerror = () => { flipImg.alt = 'Plot not available.'; };
        plotsContainer.appendChild(flipImg);

        // 4. Initial selection highlight and content
        updateAllViews();
    }

    function createThumbnail(corruptionName, onClick) {
        const thumbnail = document.createElement('img');
        thumbnail.classList.add('thumbnail');
        thumbnail.dataset.corruption = corruptionName;
        thumbnail.alt = `Thumbnail for ${corruptionName}`;

        const thumbFileName = thumbnailFileMap[corruptionName];
        thumbnail.src = thumbFileName ? `assets/images/${corruptionName}/${thumbFileName}` : `assets/images/${corruptionName}.png`;

        thumbnail.onerror = () => {
            thumbnail.src = `assets/images/${corruptionName}.png`;
            thumbnail.onerror = null;
        };

        thumbnail.addEventListener('click', onClick);
        return thumbnail;
    }

    function createUseCaseThumbnail(useCaseName, onClick) {
        const thumbnail = document.createElement('img');
        thumbnail.classList.add('thumbnail');
        thumbnail.dataset.usecase = useCaseName;
        thumbnail.alt = `Thumbnail for ${useCaseName}`;
        thumbnail.src = `assets/experiments/usecases/${useCaseName}_1.png`;
        thumbnail.onerror = () => {
            // Fallback to non-indexed name if available; otherwise clear
            thumbnail.src = `assets/experiments/usecases/${useCaseName}.png`;
            thumbnail.onerror = () => { thumbnail.removeAttribute('src'); thumbnail.alt = 'Example not available.'; };
        };
        thumbnail.addEventListener('click', onClick);
        return thumbnail;
    }

    initialize();
});
