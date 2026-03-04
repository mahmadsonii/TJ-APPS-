let apps = JSON.parse(localStorage.getItem('tj_apps')) || [];
let currentIcon = "";
let currentScreens = [];
// Гирифтани маълумот аз db.js ва илова кардани он ба массиви асосӣ
let allApps = [...DATABASE]; 

function renderApps() {
    // Акнун allApps-ро истифода мебарем
    allApps.forEach((app, idx) => {
        // Коди намоиш...
    });
}


// 1. Гузариш байни Табҳо
function switchTab(tab, el) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById(tab + '-view').classList.add('active');
    el.classList.add('active');
}

// 2. Функсияи фишурдани расм (барои сабук шудани сайт)
async function compressImage(file, maxWidth, maxHeight) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // Сифати 70%
            };
        };
    });
}

// 3. Пешнамоиши Иконка
async function previewFile(input, targetId) {
    if (input.files && input.files[0]) {
        const compressed = await compressImage(input.files[0], 200, 200);
        currentIcon = compressed;
        document.getElementById(targetId).src = compressed;
    }
}

// 4. Пешнамоиши Скриншотҳо
async function previewScreenshots(input) {
    const container = document.getElementById('preview-container');
    container.innerHTML = "Боргирӣ..."; 
    currentScreens = [];

    if (input.files) {
        for (let file of input.files) {
            const compressed = await compressImage(file, 600, 1000);
            currentScreens.push(compressed);
        }
        
        container.innerHTML = ""; // Тоза кардан
        currentScreens.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.className = "p-img-screen";
            container.appendChild(img);
        });
    }
}

// 5. Илова кардан (Publish)
function publishApp() {
    const name = document.getElementById('aName').value;
    const type = document.getElementById('aType').value;
    const cat = document.getElementById('aCat').value;
    const desc = document.getElementById('aDesc').value;
    const link = document.getElementById('aLink').value;
    const videoRaw = document.getElementById('aVideo').value; // Видеоро мегирем

    if (!name || !currentIcon) {
        alert("Ном ва иконкаро ҳатман интихоб кунед!");
        return;
    }

    const newApp = {
        name, 
        type, 
        cat, 
        desc, 
        link,
        icon: currentIcon,
        screens: currentScreens,
        video: formatDriveLink(videoRaw) // Ин ҷо илова шуд
    };

    apps.push(newApp);
    localStorage.setItem('tj_apps', JSON.stringify(apps));
    
    alert("Барнома илова шуд!");
    location.reload();
}


// 6. Намоиши барномаҳо
// Ин қисмро дар дохили renderApps иваз кун (барои пайдо шудани тугмаи Edit)
function renderApps() {
    const grid = document.getElementById('app-grid');
    const gGrid = document.getElementById('games-grid');
    const adminList = document.getElementById('adminAppList');
    
    if(grid) grid.innerHTML = "";
    if(gGrid) gGrid.innerHTML = "";
    if(adminList) adminList.innerHTML = "";

    apps.forEach((app, idx) => {
        // Сохтани HTML-и барнома
        const html = `
            <div class="app-card" onclick="openDetails(${idx})">
                <div class="icon-wrapper">
                    <img src="${app.icon}">
                    <div class="shine-line"></div>
                </div>
                <p>${app.name}</p>
            </div>
        `;

        // Тақсимбандӣ ба Барнома ё Бозӣ
        if (app.type === 'game') {
            if(gGrid) gGrid.innerHTML += html;
        } else {
            if(grid) grid.innerHTML += html;
        }

        // Рӯйхати админка
        if(adminList) {
            adminList.innerHTML += `
                <div class="admin-item-row">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${app.icon}" style="width:30px; height:30px; border-radius:5px;">
                        <span>${app.name}</span>
                    </div>
                    <div>
                        <button onclick="editApp(${idx})" style="color:#01875f; background:none; border:none; margin-right:10px;">Edit</button>
                        <button onclick="deleteApp(${idx})" style="color:#ff4444; background:none; border:none;">Delete</button>
                    </div>
                </div>
            `;
        }
    });
}

// Функсияи Таҳрир (Edit)
let editIndex = null; // Барои донистани он ки кадом барномаро таҳрир дорем

function editApp(idx) {
    const app = apps[idx];
    editIndex = idx; // Индексро захира мекунем

    // Маълумотро ба форма мегузорем
    document.getElementById('aName').value = app.name;
    document.getElementById('aType').value = app.type;
    document.getElementById('aCat').value = app.cat || "";
    document.getElementById('aDesc').value = app.desc || "";
    document.getElementById('aLink').value = app.link || "";
    document.getElementById('pIcon').src = app.icon;
    
    currentIcon = app.icon;
    currentScreens = app.screens || [];

    // Тугмаи "Илова кардан"-ро ба "Захира кардан" иваз мекунем
    const mainBtn = document.querySelector('.admin-form .btn-main');
    mainBtn.innerText = "Захира кардани тағйирот";
    mainBtn.onclick = saveEdit;
    
    // Скриншотҳоро нишон медиҳем
    const container = document.getElementById('preview-container');
    container.innerHTML = "";
    currentScreens.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.className = "p-img-screen";
        container.appendChild(img);
    });

    alert("Маълумот барои таҳрир омода аст!");
}

function saveEdit() {
    if (editIndex === null) return;

    apps[editIndex] = {
        name: document.getElementById('aName').value,
        type: document.getElementById('aType').value,
        cat: document.getElementById('aCat').value,
        desc: document.getElementById('aDesc').value,
        link: document.getElementById('aLink').value,
        icon: currentIcon,
        screens: currentScreens
    };

    localStorage.setItem('tj_apps', JSON.stringify(apps));
    alert("Тағйирот захира шуд!");
    location.reload();
}


// 7. Кушодани Тафсилот (Details)
    function openDetails(idx) {
    const app = allApps[idx];
    const modal = document.getElementById('appModal');
    const content = document.getElementById('modal-data');

    // ШАРТ: Агар линки видео дар db.js бошад, плеерро месозад
    let videoHtml = "";
    if (app.video && app.video.trim() !== "") {
        videoHtml = `
            <div class="video-container" style="margin-bottom:20px; border-radius:12px; overflow:hidden; background:#000;">
                <iframe 
                    src="${app.video}" 
                    width="100%" 
                    height="600" 
                    frameborder="0" 
                    allow="autoplay; fullscreen" 
                    allowfullscreen="true">
                </iframe>
            </div>
        `;
    }

    // Скриншотҳо
    let screensHtml = (app.screens && app.screens.length > 0) ? 
        `<div class="scr-slider">${app.screens.map(s => `<img src="${s}" class="scr-img">`).join('')}</div>` : "";

    content.innerHTML = `
        <button class="btn-close-modal" onclick="closeModal('appModal')">←</button>
        <div class="app-detail-header">
            <img src="${app.icon}" class="detail-icon">
            <div class="detail-info">
                <h2>${app.name}</h2>
                <p class="detail-cat" style="color:#01875f;">${app.cat || 'Барнома'}</p>
            </div>
        </div>
        
        <button class="btn-main" onclick="window.open('${app.link}')" style="margin-bottom:20px;">Установить</button>
        
        ${videoHtml} 
        ${screensHtml}

        <div class="detail-desc" style="margin-top:20px;">
            <h3>Дар бораи барнома</h3>
            <p style="color:#9aa0a6;">${app.desc || 'Маълумот нест...'}</p>
        </div>
    `;
    
    modal.style.display = 'block';
    history.pushState({ page: 'details' }, '');
    }

function loginAdmin() {
    const pass = prompt("Рамз:");
    if (pass === "2008") {
        document.getElementById('adminPanel').style.display = 'block';
        renderApps();
    }
}

// 9. Ҷустуҷӯ
function searchApps() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const resultsGrid = document.getElementById('search-results');
    resultsGrid.innerHTML = "";
    if (!query) return;

    apps.forEach((app, index) => {
        if (app.name.toLowerCase().includes(query)) {
            resultsGrid.innerHTML += `
                <div class="app-card" onclick="openDetails(${index})">
                    <div class="icon-wrapper">
                        <img src="${app.icon}">
                        <div class="shine-line"></div>
                    </div>
                    <p>${app.name}</p>
                </div>`;
        }
    });
}


renderApps();
// Функсия барои табдил додани линки Google Drive ба линки видеоплеер
// 1. Функсияи табдили линки Google Drive ба видеоплеер
function formatDriveLink(link) {
    if (!link) return null;
    try {
        // Агар линк дорои ID бошад, онро мегирем
        let fileId = "";
        if (link.includes('file/d/')) {
            fileId = link.split('file/d/')[1].split('/')[0];
        } else if (link.includes('id=')) {
            fileId = link.split('id=')[1].split('&')[0];
        }
        
        if (fileId) {
            return `https://drive.google.com/file/d/${fileId}/preview`;
        }
    } catch (e) {
        console.error("Хато дар формат кардани линк", e);
    }
    return link;
}

// 2. Функсияи иловакунии барнома (Publish)
function publishApp() {
    const name = document.getElementById('aName').value;
    const type = document.getElementById('aType').value;
    const cat = document.getElementById('aCat').value;
    const desc = document.getElementById('aDesc').value;
    const link = document.getElementById('aLink').value;
    const videoRaw = document.getElementById('aVideo').value; // Линки видео

    if (!name || !currentIcon) {
        alert("Ном ва иконкаро ҳатман интихоб кунед!");
        return;
    }

    const newApp = {
        name, 
        type, 
        cat, 
        desc, 
        link,
        icon: currentIcon,
        screens: currentScreens,
        video: formatDriveLink(videoRaw) // Табдил додани линк дар ин ҷо
    };

    apps.push(newApp);
    localStorage.setItem('tj_apps', JSON.stringify(apps));
    
    alert("Барнома бо муваффақият илова шуд!");
    location.reload();
}

// 3. Функсияи намоиши тафсилот (Open Details)
function openDetails(idx) {
    const app = apps[idx];
    if (!app) return;

    const modal = document.getElementById('appModal');
    const content = document.getElementById('modal-data');

    let videoHtml = "";
    if (app.video) {
        // Истифодаи iframe барои видеои Google Drive
        videoHtml = `
            <div class="video-container" style="margin-bottom:20px; border-radius:12px; overflow:hidden; background:#000;">
                <iframe src="${app.video}" width="100%" height="220" frameborder="0" allow="autoplay" allowfullscreen></iframe>
            </div>
        `;
    }

    let screensHtml = "";
    if (app.screens && app.screens.length > 0) {
        screensHtml = `<div class="scr-slider">${app.screens.map(s => `<img src="${s}" class="scr-img">`).join('')}</div>`;
    }

    content.innerHTML = `
        <button class="btn-close-modal" onclick="closeModal('appModal')">←</button>
        <div class="app-detail-header">
            <img src="${app.icon}" class="detail-icon">
            <div class="detail-info">
                <h2>${app.name}</h2>
                <p class="detail-cat" style="color:#01875f;">${app.cat || 'Барнома'}</p>
            </div>
        </div>
        
        <button class="btn-main" onclick="window.location.href='${app.link}'" style="margin-bottom:20px;">Установить</button>
        
        ${videoHtml} 
        ${screensHtml}

        <div class="detail-desc" style="margin-top:20px;">
            <h3>Дар бораи барнома</h3>
            <p style="color:#9aa0a6;">${app.desc || 'Маълумот нест...'}</p>
        </div>
    `;
    
    modal.style.display = 'block';
    window.history.pushState({ page: 'details' }, '');
}
