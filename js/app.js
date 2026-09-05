import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// TODO: Remplacez ces valeurs par celles de votre projet Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD3JZHSlG8BoZrJzJulWvuYHaq_BgacB88",
  authDomain: "freshstock-b2b2e.firebaseapp.com",
  projectId: "freshstock-b2b2e",
  storageBucket: "freshstock-b2b2e.firebasestorage.app",
  messagingSenderId: "940678295285",
  appId: "1:940678295285:web:26a2a498a3d7c7c2cc9fbc",
  measurementId: "G-ZCBPWG1S1F"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const fruitsCollection = collection(db, 'fruits');
const historyCollection = collection(db, 'history');
const salesCollection = collection(db, 'sales');

let allFruits = [];
let allSalesData = [];
let allRepaymentsData = [];

const DEFAULT_DEMO_FRUITS = [
    {
        id: "demo_1",
        name: "Mangues Kent",
        image: "🥭",
        origin: "Mbour, Sénégal",
        buyPrice: 350,
        price: 600,
        quantity: "500 kg",
        initialQuantity: 500,
        soldQuantity: 120,
        minQuantity: 50,
        date: "2026-09-01",
        status: "good",
        statusText: "En stock"
    },
    {
        id: "demo_2",
        name: "Banane Bio",
        image: "🍌",
        origin: "Tambacounda",
        buyPrice: 300,
        price: 500,
        quantity: "300 kg",
        initialQuantity: 300,
        soldQuantity: 80,
        minQuantity: 30,
        date: "2026-09-02",
        status: "good",
        statusText: "En stock"
    },
    {
        id: "demo_3",
        name: "Pomme Granny Smith",
        image: "🍏",
        origin: "Import (France)",
        buyPrice: 700,
        price: 1200,
        quantity: "200 kg",
        initialQuantity: 200,
        soldQuantity: 185,
        minQuantity: 40,
        date: "2026-08-28",
        status: "warning",
        statusText: "Stock Bas"
    },
    {
        id: "demo_4",
        name: "Orange Valencia",
        image: "🍊",
        origin: "Maroc",
        buyPrice: 400,
        price: 750,
        quantity: "400 kg",
        initialQuantity: 400,
        soldQuantity: 400,
        minQuantity: 50,
        date: "2026-08-20",
        status: "danger",
        statusText: "Épuisé"
    }
];

const DEFAULT_DEMO_SALES = [
    {
        id: "sale_demo_1",
        clientName: "Mamadou Diallo",
        clientPhone: "771234567",
        clientAddress: "Médina, Dakar",
        fruitName: "Mangues Kent",
        qty: 50,
        pricePerKg: 600,
        totalPrice: 30000,
        paymentMethod: "Espèces",
        createdAtStr: "04/09/2026 14:30"
    },
    {
        id: "sale_demo_2",
        clientName: "Fatou Sow",
        clientPhone: "789876543",
        clientAddress: "Almadies",
        fruitName: "Banane Bio",
        qty: 30,
        pricePerKg: 500,
        totalPrice: 15000,
        paymentMethod: "Crédit / Dette",
        createdAtStr: "05/09/2026 10:15"
    }
];

function loadLocalStorageData() {
    const savedFruits = localStorage.getItem('freshstock_fruits');
    if (savedFruits) {
        try { allFruits = JSON.parse(savedFruits); } catch(e) {}
    }
    if (!allFruits || allFruits.length === 0) {
        allFruits = [...DEFAULT_DEMO_FRUITS];
        saveLocalStorageData();
    }

    const savedSales = localStorage.getItem('freshstock_sales');
    if (savedSales) {
        try { allSalesData = JSON.parse(savedSales); } catch(e) {}
    }
    if (!allSalesData || allSalesData.length === 0) {
        allSalesData = [...DEFAULT_DEMO_SALES];
        saveLocalStorageData();
    }

    const savedRepayments = localStorage.getItem('freshstock_repayments');
    if (savedRepayments) {
        try { allRepaymentsData = JSON.parse(savedRepayments); } catch(e) {}
    }
}

function saveLocalStorageData() {
    try {
        localStorage.setItem('freshstock_fruits', JSON.stringify(allFruits));
        localStorage.setItem('freshstock_sales', JSON.stringify(allSalesData));
        localStorage.setItem('freshstock_repayments', JSON.stringify(allRepaymentsData));
    } catch(e) {
        console.error("LocalStorage write error:", e);
    }
}

function parseDate(val) {
    if (!val) return new Date();
    if (typeof val.toDate === 'function') return val.toDate();
    if (val && typeof val === 'object' && val.seconds !== undefined) return new Date(val.seconds * 1000);
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Helper per-product fruit icon & emoji renderer
function getFruitIcon(name = '', customIcon = '') {
    if (customIcon && customIcon.trim() && customIcon !== 'auto' && !customIcon.startsWith('http') && !customIcon.includes('flaticon')) {
        return customIcon;
    }
    const lower = (name || '').toLowerCase();
    if (lower.includes('mangue')) return '🥭';
    if (lower.includes('orange') || lower.includes('mandarine') || lower.includes('clementine')) return '🍊';
    if (lower.includes('banane')) return '🍌';
    if (lower.includes('pomme verte') || lower.includes('granny')) return '🍏';
    if (lower.includes('pomme')) return '🍎';
    if (lower.includes('citron')) return '🍋';
    if (lower.includes('raisin')) return '🍇';
    if (lower.includes('fraise') || lower.includes('fraiche') || lower.includes('fraîche')) return '🍓';
    if (lower.includes('ananas')) return '🍍';
    if (lower.includes('pastèque') || lower.includes('pasteque')) return '🍉';
    if (lower.includes('avocat')) return '🥑';
    if (lower.includes('melon')) return '🍈';
    if (lower.includes('cerise')) return '🍒';
    if (lower.includes('peche') || lower.includes('pêche')) return '🍑';
    if (lower.includes('poire')) return '🍐';
    if (lower.includes('kiwi')) return '🥝';
    if (lower.includes('papaye')) return '🍈';
    return '🍊';
}

function renderFruitIconHTML(item) {
    if (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://') || item.image.startsWith('data:'))) {
        if (item.image.includes('flaticon') || item.image.includes('3712175')) {
            const emoji = getFruitIcon(item.name, '');
            return `<div class="fruit-icon-badge">${emoji}</div>`;
        }
        const fallbackEmoji = getFruitIcon(item.name, '');
        return `<div class="fruit-icon-badge"><img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.parentNode.innerHTML='${fallbackEmoji}';"></div>`;
    }
    const emoji = getFruitIcon(item.name, item.image);
    return `<div class="fruit-icon-badge">${emoji}</div>`;
}

// Bip sonore synthétisé lors de la validation d'une vente POS
function playPosBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const audioCtx = new AudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(784, audioCtx.currentTime); // Note Sol (G5)
        osc.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.12); // Note Do (C6)
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
    } catch(e) {
        console.log("Audio POS feedback non disponible", e);
    }
}

// Impression d'étiquette de prix de rayon
function printPriceTag(fruit) {
    const emoji = getFruitIcon(fruit.name, fruit.image);
    const tagWindow = window.open('', '_blank', 'width=500,height=400');
    tagWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Étiquette Prix - ${fruit.name}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f1f5f9; }
                .price-tag { width: 320px; border: 3px solid #10b981; border-radius: 16px; padding: 20px; background: white; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative; overflow: hidden; }
                .tag-header { background: #10b981; color: white; margin: -20px -20px 15px -20px; padding: 10px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                .fruit-emoji { font-size: 54px; margin-bottom: 5px; }
                .fruit-name { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; }
                .fruit-origin { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 15px; }
                .price-box { background: #ecfdf5; border: 2px dashed #10b981; padding: 12px; border-radius: 12px; margin-bottom: 10px; }
                .price-val { font-size: 32px; font-weight: 900; color: #047857; line-height: 1; }
                .price-unit { font-size: 14px; font-weight: 700; color: #10b981; margin-top: 4px; }
                .tag-footer { font-size: 10px; color: #94a3b8; margin-top: 10px; font-weight: 600; text-transform: uppercase; }
                @media print {
                    body { background: white; }
                    .price-tag { box-shadow: none; border-color: #000; }
                    .tag-header { background: #000; }
                    .price-box { border-color: #000; background: #fff; }
                    .price-val { color: #000; }
                }
            </style>
        </head>
        <body>
            <div class="price-tag">
                <div class="tag-header">🍊 FreshStock - Qualité Premium</div>
                <div class="fruit-emoji">${emoji}</div>
                <div class="fruit-name">${fruit.name}</div>
                <div class="fruit-origin">Origine: ${fruit.origin || 'Sélectionné'}</div>
                <div class="price-box">
                    <div class="price-val">${(fruit.price || 0).toLocaleString('fr-FR')} FCFA</div>
                    <div class="price-unit">LE KILOGRAMME (KG)</div>
                </div>
                <div class="tag-footer">Garantie Fraîcheur & Traçabilité</div>
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    tagWindow.document.close();
}

// Fonction pour enregistrer une action dans l'historique
async function logAction(action, detail) {
    try {
        if (auth.currentUser && !window.isDemoMode) {
            await addDoc(historyCollection, {
                action: action,
                detail: detail,
                createdAt: serverTimestamp()
            });
        } else {
            addLocalHistoryEntry(action, detail);
        }
    } catch(e) {
        console.warn("Erreur historique Firestore:", e);
        addLocalHistoryEntry(action, detail);
    }
}

function addLocalHistoryEntry(action, detail) {
    const tbody = document.getElementById('history-list');
    if(!tbody) return;
    const dateStr = new Date().toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'});
    
    let color = "var(--text-main)";
    if(action === "AJOUT") color = "var(--primary)";
    if(action === "MODIFICATION") color = "var(--accent-blue)";
    if(action === "VENTE") color = "var(--accent-orange)";
    if(action === "ANNULATION VENTE" || action === "SUPPRESSION" || action === "PERTE") color = "var(--accent-red)";
    if(action === "RÈGLEMENT DETTE") color = "var(--primary)";

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${dateStr}</td>
        <td><strong style="color: ${color}">${action}</strong></td>
        <td>${detail}</td>
    `;
    tbody.insertBefore(tr, tbody.firstChild);
}

// ---------------- NAV LOGIC ----------------
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
            
            e.currentTarget.classList.add('active');
            const targetId = e.currentTarget.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// ---------------- REALTIME & PERSISTENCE ----------------
function initRealtimeUpdates() {
    // 0. Charger immédiatement le cache localStorage et les données démo par défaut
    loadLocalStorageData();
    renderTable();
    updateStatsAndReports();
    updatePOSSelect();
    renderRecentSalesTable();

    // 1. Écoute des fruits (Firestore Sync)
    const qFruits = query(fruitsCollection, orderBy('createdAt', 'desc'));
    onSnapshot(qFruits, (snapshot) => {
        if (snapshot.docs.length > 0) {
            allFruits = [];
            snapshot.forEach(docSnapshot => {
                allFruits.push({ id: docSnapshot.id, ...docSnapshot.data() });
            });
            saveLocalStorageData();
        }
        renderTable();
        updateStatsAndReports();
        updatePOSSelect();
    }, (err) => {
        console.warn("Écouteur Firestore fruits inaccessible, utilisation des données locales:", err);
        renderTable();
        updateStatsAndReports();
        updatePOSSelect();
    });

    // 2. Écoute des remboursements / règlements de dettes
    const repaymentsCollection = collection(db, 'repayments');
    onSnapshot(repaymentsCollection, (snapshot) => {
        if (snapshot.docs.length > 0) {
            allRepaymentsData = [];
            snapshot.forEach(docSnapshot => {
                allRepaymentsData.push({ id: docSnapshot.id, ...docSnapshot.data() });
            });
        }
        renderClientsTable();
    }, () => {
        renderClientsTable();
    });

    // 3. Écoute de l'historique général
    const qHistory = query(historyCollection, orderBy('createdAt', 'desc'));
    onSnapshot(qHistory, (snapshot) => {
        const tbody = document.getElementById('history-list');
        if(!tbody) return;
        tbody.innerHTML = '';
        snapshot.forEach(docSnapshot => {
            const item = docSnapshot.data();
            const dateStr = item.createdAt ? new Date(item.createdAt.toDate()).toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'}) : "À l'instant";
            
            let color = "var(--text-main)";
            if(item.action === "AJOUT") color = "var(--primary)";
            if(item.action === "MODIFICATION") color = "var(--accent-blue)";
            if(item.action === "VENTE") color = "var(--accent-orange)";
            if(item.action === "ANNULATION VENTE") color = "var(--accent-red)";
            if(item.action === "SUPPRESSION") color = "var(--accent-red)";

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><strong style="color: ${color}">${item.action}</strong></td>
                <td>${item.detail}</td>
            `;
            tbody.appendChild(tr);
        });
    });

    // 4. Écoute des Ventes (POS Sync)
    const qSales = query(salesCollection, orderBy('createdAt', 'desc'));
    onSnapshot(qSales, (snapshot) => {
        if (snapshot.docs.length > 0) {
            allSalesData = [];
            snapshot.forEach(docSnapshot => {
                const sale = { id: docSnapshot.id, ...docSnapshot.data() };
                allSalesData.push(sale);
            });
            saveLocalStorageData();
        }
        renderRecentSalesTable();
    }, (err) => {
        console.warn("Écouteur Firestore ventes inaccessible, utilisation des données locales:", err);
        renderRecentSalesTable();
    });
}

function renderRecentSalesTable() {
    const tbody = document.getElementById('sales-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    allSalesData.forEach(sale => {
        let dateStr = sale.createdAtStr;
        if (!dateStr) {
            const d = parseDate(sale.createdAt);
            dateStr = d.toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'});
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td>
                <strong>${sale.clientName}</strong><br>
                <small style="color: var(--text-muted);">${sale.clientPhone}</small>
            </td>
            <td>${sale.fruitName}</td>
            <td><span class="status-badge" style="background: rgba(255,255,255,0.15); color: var(--text-main); font-weight: 500;">${sale.paymentMethod || 'Espèces'}</span></td>
            <td><strong>${(sale.totalPrice || 0).toLocaleString('fr-FR')} FCFA</strong></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit-sale-btn" data-sale='${encodeURIComponent(JSON.stringify({...sale, createdAt: null, createdAtStr: dateStr}))}' title="Modifier cette vente" style="color: var(--accent-orange);"><i class='bx bx-edit'></i></button>
                    <button class="btn-icon print-sale-btn" data-sale='${encodeURIComponent(JSON.stringify({...sale, createdAt: null, createdAtStr: dateStr}))}' title="Imprimer le ticket" style="color: var(--primary);"><i class='bx bx-printer'></i></button>
                    <button class="btn-icon print-invoice-btn" data-sale='${encodeURIComponent(JSON.stringify({...sale, createdAt: null, createdAtStr: dateStr}))}' title="Bon de Livraison / Facture A4" style="color: #3b82f6;"><i class='bx bx-file'></i></button>
                    <button class="btn-icon cancel-sale-btn" data-id="${sale.id}" data-fruit="${sale.fruitId}" data-qty="${sale.qty}" title="Annuler cette vente" style="color: #ef4444;"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateStatsAndReports();

    document.querySelectorAll('.print-sale-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const saleData = JSON.parse(decodeURIComponent(e.currentTarget.getAttribute('data-sale')));
            printReceipt(saleData);
        });
    });

    document.querySelectorAll('.print-invoice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const saleData = JSON.parse(decodeURIComponent(e.currentTarget.getAttribute('data-sale')));
            printInvoice(saleData);
        });
    });

    document.querySelectorAll('.edit-sale-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sale = JSON.parse(decodeURIComponent(e.currentTarget.getAttribute('data-sale')));
            document.getElementById('posFormTitle').innerHTML = "<i class='bx bx-edit'></i> Modifier Vente";
            document.getElementById('posEditSaleId').value = sale.id;
            document.getElementById('posEditOldQty').value = sale.qty;
            
            const select = document.getElementById('posFruitSelect');
            select.value = sale.fruitId;
            select.disabled = true;
            select.dispatchEvent(new Event('change'));
            
            document.getElementById('posQty').value = sale.qty;
            document.getElementById('posClientName').value = sale.clientName;
            document.getElementById('posClientPhone').value = sale.clientPhone;
            document.getElementById('posClientAddress').value = sale.clientAddress || '';
            
            document.getElementById('posQty').dispatchEvent(new Event('input'));
            
            const submitBtn = document.getElementById('posForm').querySelector('button[type="submit"]');
            submitBtn.textContent = "Enregistrer la modification";
            submitBtn.style.background = "var(--accent-blue)";
            
            const cancelBtn = document.getElementById('posCancelEditBtn');
            if(cancelBtn) cancelBtn.style.display = 'block';
            
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
    });

    document.querySelectorAll('.cancel-sale-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const saleId = e.currentTarget.getAttribute('data-id');
            const fruitId = e.currentTarget.getAttribute('data-fruit');
            const qtyToCancel = parseInt(e.currentTarget.getAttribute('data-qty')) || 0;

            if(confirm('Êtes-vous sûr de vouloir annuler cette vente ? Le stock sera restitué.')) {
                try {
                    if (auth.currentUser && !window.isDemoMode) {
                        await deleteDoc(doc(db, 'sales', saleId));
                        const fruitToUpdate = allFruits.find(f => f.id === fruitId);
                        if (fruitToUpdate) {
                            const newSoldQty = Math.max(0, (fruitToUpdate.soldQuantity || 0) - qtyToCancel);
                            const initialQty = fruitToUpdate.initialQuantity !== undefined ? fruitToUpdate.initialQuantity : (parseInt(fruitToUpdate.quantity) || 0);
                            const remaining = initialQty - newSoldQty;
                            let newStatus = fruitToUpdate.status;
                            let newStatusText = fruitToUpdate.statusText;
                            if (remaining > 0 && fruitToUpdate.status === "danger" && fruitToUpdate.statusText === "Épuisé") {
                                newStatus = "good";
                                newStatusText = "En stock";
                            }
                            await updateDoc(doc(db, 'fruits', fruitId), {
                                soldQuantity: newSoldQty,
                                status: newStatus,
                                statusText: newStatusText
                            });
                        }
                    } else {
                        const sIdx = allSalesData.findIndex(s => s.id === saleId);
                        if (sIdx !== -1) allSalesData.splice(sIdx, 1);
                        const fruitToUpdate = allFruits.find(f => f.id === fruitId);
                        if (fruitToUpdate) {
                            fruitToUpdate.soldQuantity = Math.max(0, (fruitToUpdate.soldQuantity || 0) - qtyToCancel);
                        }
                        saveLocalStorageData();
                        renderTable();
                        updatePOSSelect();
                        renderRecentSalesTable();
                    }
                    logAction("ANNULATION VENTE", `Vente d'ID ${saleId} annulée. ${qtyToCancel} kg réinjecté en stock.`);
                } catch(err) {
                    console.error("Erreur lors de l'annulation:", err);
                }
            }
        });
    });
}

function updateStatsAndReports() {
    let totalRemainingQty = 0;
    let dangerStockCount = 0;
    let originProductMap = {}; 
    let uniqueVarieties = new Set(); 

    allFruits.forEach(fruit => {
        const initialQty = fruit.initialQuantity !== undefined ? fruit.initialQuantity : (parseInt(fruit.quantity) || 0);
        const soldQty = fruit.soldQuantity || 0;
        const remainingQty = initialQty - soldQty;
        
        totalRemainingQty += remainingQty;

        if(fruit.status === "danger") dangerStockCount++;

        if(fruit.name && remainingQty > 0) {
            uniqueVarieties.add(fruit.name.toLowerCase().trim());
        }

        const key = `${fruit.name}___${fruit.origin}`;
        if(!originProductMap[key]) {
            originProductMap[key] = {
                name: fruit.name,
                origin: fruit.origin,
                qty: 0
            };
        }
        originProductMap[key].qty += remainingQty;
    });

    document.getElementById('stat-total-qty').textContent = totalRemainingQty + " kg";
    document.getElementById('stat-varietes').textContent = uniqueVarieties.size + " Variétés";
    document.getElementById('stat-danger-stock').textContent = dangerStockCount + " Lots";
    document.getElementById('stat-lots').textContent = allFruits.length + " Lots";

    // --- Gestion des Notifications ---
    const notifBadge = document.getElementById('notifBadge');
    const notifList = document.getElementById('notifList');
    
    let notifsHTML = "";
    if (dangerStockCount > 0) {
        if (notifBadge) {
            notifBadge.textContent = dangerStockCount;
            notifBadge.style.display = 'flex';
        }
    } else {
        if (notifBadge) notifBadge.style.display = 'none';
    }

    allFruits.forEach(fruit => {
        if(fruit.status === "danger") {
            notifsHTML += `
                <div style="padding: 15px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; gap: 15px;">
                    <i class='bx bxs-error-circle' style="color: var(--accent-red); font-size: 28px;"></i>
                    <div>
                        <strong style="color: var(--text-main);">${fruit.name}</strong><br>
                        <span style="font-size: 13px; color: var(--text-muted);">${fruit.statusText || 'Stock critique'} (Origine: ${fruit.origin})</span>
                    </div>
                </div>
            `;
        }
    });

    if (notifList) {
        if (dangerStockCount > 0) {
            notifList.innerHTML = notifsHTML;
        } else {
            notifList.innerHTML = "<p style='color: var(--text-muted); text-align: center; padding: 20px;'>Aucune alerte de stock. Tout va bien !</p>";
        }
    }
    // ---------------------------------

    const reportTbody = document.getElementById('report-origin-list');
    if(reportTbody) {
        reportTbody.innerHTML = '';
        // Trier les produits par stock restant décroissant
        const sortedStock = Object.values(originProductMap).sort((a,b) => b.qty - a.qty);
        
        for (const item of sortedStock) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td><span style="color: var(--text-muted);">${item.origin}</span></td>
                <td>${item.qty} kg</td>
            `;
            reportTbody.appendChild(tr);
        }
    }

    // Statistiques des Ventes (Filtrées par Période)
    const periodSelect = document.getElementById('reportPeriodSelect');
    const period = periodSelect ? periodSelect.value : 'all';
    const now = new Date();

    const filteredSales = allSalesData.filter(sale => {
        if(!sale.createdAt && !sale.createdAtStr) return true;
        const saleDate = parseDate(sale.createdAt);
        if(period === 'today') {
            return saleDate.toDateString() === now.toDateString();
        } else if(period === 'week') {
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            return saleDate >= sevenDaysAgo;
        } else if(period === 'month') {
            return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        }
        return true;
    });

    let totalRevenue = 0;
    let totalKilosSold = 0;
    let totalCost = 0;
    let productSalesMap = {};

    filteredSales.forEach(sale => {
        const rev = sale.totalPrice || 0;
        const qty = sale.qty || 0;
        const buyPrice = sale.buyPricePerKg !== undefined ? sale.buyPricePerKg : 0;

        totalRevenue += rev;
        totalKilosSold += qty;
        totalCost += (buyPrice * qty);

        if(!productSalesMap[sale.fruitName]) {
            productSalesMap[sale.fruitName] = { qty: 0, revenue: 0 };
        }
        productSalesMap[sale.fruitName].qty += qty;
        productSalesMap[sale.fruitName].revenue += rev;
    });

    const netProfit = totalRevenue - totalCost;

    // Mise à jour des KPI
    const revEl = document.getElementById('report-revenue');
    if (revEl) revEl.textContent = totalRevenue.toLocaleString('fr-FR') + " FCFA";
    
    const kgEl = document.getElementById('report-kilos-sold');
    if (kgEl) kgEl.textContent = totalKilosSold + " kg";

    const profitEl = document.getElementById('report-net-profit');
    if (profitEl) profitEl.textContent = netProfit.toLocaleString('fr-FR') + " FCFA";

    renderClientsTable();
    renderCharts(filteredSales);

    // Top Ventes & Best Seller
    const topSalesArray = Object.entries(productSalesMap)
                                .map(([name, data]) => ({ name, ...data }))
                                .sort((a, b) => b.revenue - a.revenue); // Tri par revenu décroissant

    const bestSellerEl = document.getElementById('report-best-seller');
    if (bestSellerEl) {
        if (topSalesArray.length > 0) {
            bestSellerEl.innerHTML = `${topSalesArray[0].name}<br><span style="color: var(--text-muted); font-size:14px; font-weight: normal;">${topSalesArray[0].revenue.toLocaleString('fr-FR')} FCFA</span>`;
        } else {
            bestSellerEl.textContent = "-";
        }
    }

    const reportTopSalesTbody = document.getElementById('report-top-sales');
    if (reportTopSalesTbody) {
        reportTopSalesTbody.innerHTML = '';
        topSalesArray.forEach((item, index) => {
            const tr = document.createElement('tr');
            const medal = index === 0 ? "🥇 " : index === 1 ? "🥈 " : index === 2 ? "🥉 " : "";
            tr.innerHTML = `
                <td><strong>${medal}${item.name}</strong></td>
                <td>${item.qty} kg</td>
                <td><strong style="color: var(--primary);">${item.revenue.toLocaleString('fr-FR')} FCFA</strong></td>
            `;
            reportTopSalesTbody.appendChild(tr);
        });
    }
}


function renderClientsTable() {
    const tbody = document.getElementById('clients-list');
    if(!tbody) return;
    tbody.innerHTML = '';

    let clientsMap = {};

    allSalesData.forEach(sale => {
        const phone = (sale.clientPhone || '').trim();
        const key = phone || sale.clientName;
        if(!key) return;

        if(!clientsMap[key]) {
            clientsMap[key] = {
                name: sale.clientName,
                phone: sale.clientPhone,
                address: sale.clientAddress || '-',
                purchaseCount: 0,
                totalSpent: 0,
                totalCredit: 0,
                repaid: 0
            };
        }
        clientsMap[key].purchaseCount += 1;
        clientsMap[key].totalSpent += (sale.totalPrice || 0);
        if(sale.paymentMethod === 'Crédit / Dette') {
            clientsMap[key].totalCredit += (sale.totalPrice || 0);
        }
        if(sale.clientAddress && sale.clientAddress !== '-') clientsMap[key].address = sale.clientAddress;
    });

    allRepaymentsData.forEach(rep => {
        const phone = (rep.clientPhone || '').trim();
        const key = phone || rep.clientName;
        if(clientsMap[key]) {
            clientsMap[key].repaid += (rep.amount || 0);
        }
    });

    const sortedClients = Object.values(clientsMap).sort((a,b) => b.totalSpent - a.totalSpent);

    if (sortedClients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">Aucun client enregistré pour l'instant.</td></tr>`;
        return;
    }

    sortedClients.forEach(c => {
        const cleanPhone = (c.phone || '').replace(/\D/g, '');
        const netDebt = Math.max(0, c.totalCredit - c.repaid);
        const relanceMsg = encodeURIComponent(`Bonjour ${c.name}, nous vous contactons concernant votre solde dû de ${netDebt.toLocaleString('fr-FR')} FCFA chez FreshStock. Merci de nous recontacter pour procéder au règlement. Cordialement !`);
        const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '#';
        const waRelanceLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${relanceMsg}` : '#';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.name}</strong></td>
            <td>${c.phone}</td>
            <td><span style="color: var(--text-muted);">${c.address}</span></td>
            <td><span class="status-badge status-good">${c.purchaseCount} commande(s)</span></td>
            <td><strong style="color: var(--primary);">${c.totalSpent.toLocaleString('fr-FR')} FCFA</strong></td>
            <td>
                ${netDebt > 0 ? `<strong style="color: var(--accent-red);">${netDebt.toLocaleString('fr-FR')} FCFA</strong>` : `<span style="color: var(--primary); font-size: 13px;">0 FCFA (À jour)</span>`}
            </td>
            <td>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    ${cleanPhone ? `<a href="${waLink}" target="_blank" class="btn-icon" style="color: #25D366; text-decoration: none;" title="Discuter sur WhatsApp"><i class='bx bxl-whatsapp' style="font-size: 22px;"></i></a>` : ''}
                    ${netDebt > 0 && cleanPhone ? `<a href="${waRelanceLink}" target="_blank" class="btn-primary" style="padding: 5px 10px; font-size: 11px; background: #25D366; color: white; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;" title="Envoyer un rappel de règlement par WhatsApp"><i class='bx bxl-whatsapp'></i> Relancer</a>` : ''}
                    ${netDebt > 0 ? `<button class="btn-primary pay-debt-btn" data-name="${c.name}" data-phone="${c.phone}" data-debt="${netDebt}" style="padding: 5px 10px; font-size: 11px; background: var(--primary); font-weight: 600;" title="Enregistrer un versement"><i class='bx bx-wallet'></i> Régler</button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.pay-debt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.currentTarget.getAttribute('data-name');
            const phone = e.currentTarget.getAttribute('data-phone');
            const debt = parseInt(e.currentTarget.getAttribute('data-debt'));
            openDebtModal(name, phone, debt);
        });
    });
}

function renderTable() {
    const tbody = document.getElementById('inventory-list');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    const filteredFruits = allFruits.filter(fruit => {
        const name = (fruit.name || '').toLowerCase();
        const origin = (fruit.origin || '').toLowerCase();
        return name.includes(searchTerm) || origin.includes(searchTerm);
    });

    filteredFruits.forEach(item => {
        const initialQty = item.initialQuantity !== undefined ? item.initialQuantity : (parseInt(item.quantity) || 0);
        const soldQty = item.soldQuantity || 0;
        const remainingQty = initialQty - soldQty;
        const minQty = item.minQuantity !== undefined ? item.minQuantity : 20;

        let statusBadge = `<span class="status-badge status-${item.status}">${item.statusText}</span>`;
        if (remainingQty <= 0) {
            statusBadge = `<span class="status-badge status-danger">Épuisé</span>`;
        } else if (remainingQty <= minQty) {
            statusBadge = `<span class="status-badge status-warning" title="Seuil min: ${minQty} kg">Stock Bas (${remainingQty}kg)</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    ${renderFruitIconHTML(item)}
                    <span>${item.name}</span>
                </div>
            </td>
            <td>${item.origin}</td>
            <td><strong>${item.price || 0} FCFA</strong></td>
            <td style="color: var(--text-muted);">${initialQty} kg</td>
            <td style="color: var(--accent-orange); font-weight: 500;">${soldQty} kg</td>
            <td><strong style="font-size: 16px;">${remainingQty} kg</strong></td>
            <td>${new Date(item.date).toLocaleDateString('fr-FR')}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon tag-btn" data-id="${item.id}" title="Imprimer Étiquette Rayon" style="color: #10b981;"><i class='bx bx-purchase-tag-alt'></i></button>
                    <button class="btn-icon edit-btn" data-id="${item.id}" title="Modifier"><i class='bx bx-edit'></i></button>
                    <button class="btn-icon delete-btn" data-id="${item.id}" data-name="${item.name}" title="Supprimer" style="color: #ef4444;"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const docId = e.currentTarget.getAttribute('data-id');
            const fruit = allFruits.find(f => f.id === docId);
            if(fruit) printPriceTag(fruit);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const docId = e.currentTarget.getAttribute('data-id');
            const fruitToEdit = allFruits.find(f => f.id === docId);
            if(fruitToEdit) openEditModal(fruitToEdit);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const docId = e.currentTarget.getAttribute('data-id');
            const fruitName = e.currentTarget.getAttribute('data-name');
            if(confirm('Êtes-vous sûr de vouloir supprimer ce lot entier ?')) {
                try {
                    if (auth.currentUser && !window.isDemoMode) {
                        await deleteDoc(doc(db, 'fruits', docId));
                    } else {
                        const idx = allFruits.findIndex(f => f.id === docId);
                        if (idx !== -1) allFruits.splice(idx, 1);
                        saveLocalStorageData();
                        renderTable();
                        updateStatsAndReports();
                        updatePOSSelect();
                    }
                    logAction("SUPPRESSION", `Le lot de "${fruitName}" a été supprimé.`);
                } catch(error) {
                    console.warn("Erreur suppression Firestore, suppression locale:", error);
                    const idx = allFruits.findIndex(f => f.id === docId);
                    if (idx !== -1) allFruits.splice(idx, 1);
                    saveLocalStorageData();
                    renderTable();
                    updateStatsAndReports();
                    updatePOSSelect();
                }
            }
        });
    });
}

// ---------------- POINT DE VENTE (POS) LOGIC ----------------
function updatePOSSelect() {
    const select = document.getElementById('posFruitSelect');
    if(!select) return;
    
    // Garder la valeur sélectionnée si possible
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Choisir un lot en stock --</option>';
    
    allFruits.forEach(fruit => {
        const initialQty = fruit.initialQuantity !== undefined ? fruit.initialQuantity : (parseInt(fruit.quantity) || 0);
        const soldQty = fruit.soldQuantity || 0;
        const remainingQty = initialQty - soldQty;
        
        if (remainingQty > 0) {
            const price = fruit.price || 0;
            const icon = getFruitIcon(fruit.name, fruit.image);
            const opt = document.createElement('option');
            opt.value = fruit.id;
            opt.dataset.price = price;
            opt.textContent = `${icon} ${fruit.name} (Origine: ${fruit.origin}) - Reste: ${remainingQty} kg - Prix: ${price} FCFA/kg`;
            select.appendChild(opt);
        }
    });

    if(currentVal) select.value = currentVal;
}

function initPOS() {
    const form = document.getElementById('posForm');
    const select = document.getElementById('posFruitSelect');
    const qtyInput = document.getElementById('posQty');
    const helpText = document.getElementById('posStockHelp');

    if(!form) return;

    const totalPriceEl = document.getElementById('posTotalPrice');

    const updateTotal = () => {
        const option = select.options[select.selectedIndex];
        const price = option && option.dataset.price ? parseInt(option.dataset.price) : 0;
        const qty = parseInt(qtyInput.value) || 0;
        totalPriceEl.textContent = (price * qty).toLocaleString('fr-FR') + " FCFA";
    };

    select.addEventListener('change', () => {
        const fruitId = select.value;
        const fruit = allFruits.find(f => f.id === fruitId);
        
        const editSaleId = document.getElementById('posEditSaleId') ? document.getElementById('posEditSaleId').value : "";
        const oldQty = editSaleId ? (parseInt(document.getElementById('posEditOldQty').value) || 0) : 0;
        
        if(fruit) {
            const initialQty = fruit.initialQuantity !== undefined ? fruit.initialQuantity : (parseInt(fruit.quantity) || 0);
            const remainingQty = initialQty - (fruit.soldQuantity || 0) + oldQty;
            qtyInput.max = remainingQty;
            helpText.textContent = `Stock max disponible : ${remainingQty} kg`;
        } else {
            qtyInput.max = "";
            helpText.textContent = "";
        }
        updateTotal();
    });

    qtyInput.addEventListener('input', updateTotal);

    const cancelEditBtn = document.getElementById('posCancelEditBtn');
    const resetPOSForm = () => {
        form.reset();
        if(document.getElementById('posEditSaleId')) document.getElementById('posEditSaleId').value = "";
        if(document.getElementById('posEditOldQty')) document.getElementById('posEditOldQty').value = "";
        if(document.getElementById('posFormTitle')) document.getElementById('posFormTitle').innerHTML = "<i class='bx bx-cart'></i> Nouvelle Vente";
        select.disabled = false;
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = "Valider la vente";
        submitBtn.style.background = "var(--accent-orange)";
        if(cancelEditBtn) cancelEditBtn.style.display = 'none';
        updateTotal();
        helpText.textContent = "";
    };
    
    if(cancelEditBtn) cancelEditBtn.addEventListener('click', resetPOSForm);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enregistrement...';

        const fruitId = select.value;
        const qtyToSell = parseInt(qtyInput.value) || 0;
        const clientName = document.getElementById('posClientName').value;
        const clientPhone = document.getElementById('posClientPhone').value;
        const clientAddress = document.getElementById('posClientAddress').value;
        
        const editSaleId = document.getElementById('posEditSaleId') ? document.getElementById('posEditSaleId').value : "";
        const oldQty = editSaleId ? (parseInt(document.getElementById('posEditOldQty').value) || 0) : 0;

        const fruit = allFruits.find(f => f.id === fruitId);
        if(!fruit) {
            submitBtn.disabled = false;
            return;
        }

        const initialQty = fruit.initialQuantity !== undefined ? fruit.initialQuantity : (parseInt(fruit.quantity) || 0);
        const currentSold = fruit.soldQuantity || 0;
        const newSoldQty = currentSold - oldQty + qtyToSell;
        const remaining = initialQty - newSoldQty;

        let newStatus = fruit.status;
        let newStatusText = fruit.statusText;
        if (remaining <= 0) {
            newStatus = "danger";
            newStatusText = "Épuisé";
        } else if (fruit.status === "danger" && fruit.statusText === "Épuisé") {
            newStatus = "good";
            newStatusText = "En stock";
        }

        try {
            const pricePerKg = fruit.price || 0;
            const totalPrice = pricePerKg * qtyToSell;
            const paymentMethod = document.getElementById('posPaymentMethod') ? document.getElementById('posPaymentMethod').value : "Espèces";

            if (auth.currentUser && !window.isDemoMode) {
                if (editSaleId) {
                    await updateDoc(doc(db, 'sales', editSaleId), {
                        qty: qtyToSell,
                        totalPrice: totalPrice,
                        paymentMethod: paymentMethod,
                        clientName: clientName,
                        clientPhone: clientPhone,
                        clientAddress: clientAddress
                    });
                    logAction("MODIFICATION", `Vente modifiée: ${qtyToSell} kg de "${fruit.name}" pour ${clientName}`);
                } else {
                    await addDoc(salesCollection, {
                        fruitId: fruitId,
                        fruitName: fruit.name,
                        qty: qtyToSell,
                        pricePerKg: pricePerKg,
                        buyPricePerKg: fruit.buyPrice || 0,
                        totalPrice: totalPrice,
                        paymentMethod: paymentMethod,
                        clientName: clientName,
                        clientPhone: clientPhone,
                        clientAddress: clientAddress,
                        createdAt: serverTimestamp()
                    });
                    const addrText = clientAddress ? ` (Livraison: ${clientAddress})` : "";
                    logAction("VENTE", `Vente de ${qtyToSell} kg de "${fruit.name}" au client ${clientName} [Tél: ${clientPhone}]${addrText}.`);
                }

                await updateDoc(doc(db, 'fruits', fruitId), {
                    soldQuantity: newSoldQty,
                    status: newStatus,
                    statusText: newStatusText
                });
            } else {
                // Mode Démo / Offline
                fruit.soldQuantity = newSoldQty;
                fruit.status = newStatus;
                fruit.statusText = newStatusText;

                const newSaleObj = {
                    id: editSaleId || ("sale_" + Date.now()),
                    fruitId: fruitId,
                    fruitName: fruit.name,
                    qty: qtyToSell,
                    pricePerKg: pricePerKg,
                    buyPricePerKg: fruit.buyPrice || 0,
                    totalPrice: totalPrice,
                    paymentMethod: paymentMethod,
                    clientName: clientName,
                    clientPhone: clientPhone,
                    clientAddress: clientAddress,
                    createdAt: { toDate: () => new Date() }
                };

                if (editSaleId) {
                    const sIdx = allSalesData.findIndex(s => s.id === editSaleId);
                    if (sIdx !== -1) allSalesData[sIdx] = newSaleObj;
                } else {
                    allSalesData.unshift(newSaleObj);
                }

                saveLocalStorageData();
                updateStatsAndReports();
                renderTable();
                updatePOSSelect();
                renderRecentSalesTable();
            }
            
            resetPOSForm();
            playPosBeep();
            helpText.textContent = editSaleId ? "Modification enregistrée !" : "Vente enregistrée avec succès !";
            setTimeout(() => helpText.textContent = "", 3000);

            if (!editSaleId) {
                openReceiptModal({
                    fruitName: fruit.name,
                    qty: qtyToSell,
                    totalPrice: totalPrice,
                    paymentMethod: paymentMethod,
                    clientName: clientName,
                    clientPhone: clientPhone,
                    createdAtStr: new Date().toLocaleString('fr-FR')
                });
            }
        } catch (error) {
            console.warn("Erreur Firestore, enregistrement local de la vente:", error);
            fruit.soldQuantity = newSoldQty;
            fruit.status = newStatus;
            fruit.statusText = newStatusText;

            allSalesData.unshift({
                id: "sale_" + Date.now(),
                fruitId: fruitId,
                fruitName: fruit.name,
                qty: qtyToSell,
                pricePerKg: pricePerKg,
                buyPricePerKg: fruit.buyPrice || 0,
                totalPrice: totalPrice,
                paymentMethod: paymentMethod,
                clientName: clientName,
                clientPhone: clientPhone,
                clientAddress: clientAddress,
                createdAt: { toDate: () => new Date() }
            });

            saveLocalStorageData();
            updateStatsAndReports();
            renderTable();
            updatePOSSelect();
            renderRecentSalesTable();
            resetPOSForm();
            playPosBeep();

            if (!editSaleId) {
                openReceiptModal({
                    fruitName: fruit.name,
                    qty: qtyToSell,
                    totalPrice: totalPrice,
                    paymentMethod: paymentMethod,
                    clientName: clientName,
                    clientPhone: clientPhone,
                    createdAtStr: new Date().toLocaleString('fr-FR')
                });
            }
        } finally {
            submitBtn.disabled = false;
        }
    });
}

function openReceiptModal(sale) {
    const modal = document.getElementById('receiptModal');
    if (!modal) return;

    const dateStr = sale.createdAtStr || new Date().toLocaleString('fr-FR');
    const recNum = sale.id ? sale.id.slice(0, 8).toUpperCase() : Math.floor(100000 + Math.random() * 900000);
    
    document.getElementById('receiptNumber').textContent = `Reçu N° #REC-${recNum}`;
    document.getElementById('receiptDate').textContent = `Date: ${dateStr}`;
    document.getElementById('receiptClientName').textContent = sale.clientName || 'Passage';
    document.getElementById('receiptClientPhone').textContent = sale.clientPhone || '-';
    document.getElementById('receiptPaymentMethod').textContent = sale.paymentMethod || 'Espèces';

    const itemsTbody = document.getElementById('receiptItems');
    if (itemsTbody) {
        itemsTbody.innerHTML = `
            <tr>
                <td style="padding: 8px 0;"><strong>${sale.fruitName}</strong></td>
                <td style="padding: 8px 0; text-align: center;">${sale.qty} kg</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${(sale.totalPrice || 0).toLocaleString('fr-FR')} FCFA</td>
            </tr>
        `;
    }

    document.getElementById('receiptTotal').textContent = `${(sale.totalPrice || 0).toLocaleString('fr-FR')} FCFA`;
    modal.classList.add('active');
}

function printReceipt(sale) {
    openReceiptModal(sale);
}

function printInvoice(sale) {
    const invoiceWindow = window.open('', '_blank', 'width=850,height=950');
    invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Facture / Bon de Livraison - ${sale.id || 'N/A'}</title>
            <style>
                body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.5; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 30px; font-weight: 800; color: #10b981; letter-spacing: -0.5px; }
                .doc-type { font-size: 20px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 35px; }
                .box { background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; }
                .box h3 { margin-top: 0; margin-bottom: 10px; color: #10b981; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th, td { border: 1px solid #cbd5e1; padding: 14px 16px; text-align: left; }
                th { background: #f1f5f9; font-weight: 600; color: #334155; }
                .total-row td { font-size: 18px; font-weight: bold; background: #ecfdf5; color: #047857; }
                .footer { text-align: center; margin-top: 60px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                .signature-box { margin-top: 50px; display: flex; justify-content: space-between; }
                .sig-line { width: 220px; border-top: 1px dashed #94a3b8; margin-top: 60px; text-align: center; font-size: 12px; color: #64748b; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🍊 FreshStock</div>
                <div style="text-align: right;">
                    <div class="doc-type">BON DE LIVRAISON & FACTURE</div>
                    <div style="color: #64748b; font-size: 14px; margin-top: 4px;">RÉF: #${sale.id ? sale.id.slice(0, 8).toUpperCase() : '001'}</div>
                </div>
            </div>
            <div class="details-grid">
                <div class="box">
                    <h3>Émetteur</h3>
                    <strong style="font-size: 16px;">FreshStock Senegal SARL</strong><br>
                    Marché Central de Fruits<br>
                    Dakar, Sénégal<br>
                    Tél: +221 77 000 00 00
                </div>
                <div class="box">
                    <h3>Client / Destinataire</h3>
                    <strong style="font-size: 16px;">${sale.clientName || 'Client'}</strong><br>
                    Téléphone: ${sale.clientPhone || '-'}<br>
                    Adresse: ${sale.clientAddress || 'Livraison en boutique'}<br>
                    Date de vente: ${sale.createdAtStr || new Date().toLocaleString('fr-FR')}
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Désignation Produit</th>
                        <th>Quantité (kg)</th>
                        <th>Prix Unitaire HT</th>
                        <th>Montant Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>${sale.fruitName}</strong> (Qualité Garantie)</td>
                        <td>${sale.qty} kg</td>
                        <td>${(sale.pricePerKg || 0).toLocaleString('fr-FR')} FCFA / kg</td>
                        <td><strong>${(sale.totalPrice || 0).toLocaleString('fr-FR')} FCFA</strong></td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" style="text-align: right; font-weight: 700;">TOTAL NET À PAYER :</td>
                        <td>${(sale.totalPrice || 0).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="signature-box">
                <div class="sig-line">Signature & Cachet Client</div>
                <div class="sig-line">Signature Responsable Stock</div>
            </div>

            <div class="footer">
                Merci d'avoir choisi FreshStock pour vos approvisionnements de fruits ! - Document généré automatiquement.
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    invoiceWindow.document.close();
}

// ---------------- ADD/EDIT MODAL LOGIC ----------------
function openEditModal(fruit) {
    const modal = document.getElementById('addModal');
    document.getElementById('modalTitle').textContent = "Modifier l'Arrivage";
    document.getElementById('fruitId').value = fruit.id;
    document.getElementById('fruitName').value = fruit.name;
    const iconSelect = document.getElementById('fruitIconSelect');
    if (iconSelect) iconSelect.value = fruit.image || 'auto';
    document.getElementById('fruitOrigin').value = fruit.origin;
    document.getElementById('fruitBuyPrice').value = fruit.buyPrice || 0;
    document.getElementById('fruitPrice').value = fruit.price || 0;
    document.getElementById('fruitMinQty').value = fruit.minQuantity !== undefined ? fruit.minQuantity : 20;
    
    const initialQty = fruit.initialQuantity !== undefined ? fruit.initialQuantity : (parseInt(fruit.quantity) || 0);
    document.getElementById('fruitQty').value = initialQty;
    
    const soldQtyGroup = document.getElementById('soldQtyGroup');
    if(soldQtyGroup) soldQtyGroup.style.display = 'none';
    
    document.getElementById('fruitDate').value = fruit.date;
    document.getElementById('fruitStatus').value = fruit.status;
    modal.classList.add('active');
}

function initAddModal() {
    const modal = document.getElementById('addModal');
    const form = document.getElementById('addForm');
    
    const openAddMode = () => {
        form.reset();
        document.getElementById('modalTitle').textContent = "Nouvel Arrivage de Fruits";
        document.getElementById('fruitId').value = ""; 
        document.getElementById('fruitDate').valueAsDate = new Date();
        const soldQtyGroup = document.getElementById('soldQtyGroup');
        if(soldQtyGroup) soldQtyGroup.style.display = 'none';
        modal.classList.add('active');
    };

    const btnAdd = document.getElementById('btnAddArrivage');
    const btnBigAdd = document.getElementById('btnBigAddArrivage');
    if(btnAdd) btnAdd.addEventListener('click', openAddMode);
    if(btnBigAdd) btnBigAdd.addEventListener('click', openAddMode);

    const closeModal = () => modal.classList.remove('active');
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const statusValue = document.getElementById('fruitStatus').value;
        let statusText = "En stock";
        if(statusValue === "warning") statusText = "À surveiller";
        if(statusValue === "danger") statusText = "Périme bientôt";

        const fruitId = document.getElementById('fruitId').value;
        const nameVal = document.getElementById('fruitName').value;
        const selectedIcon = document.getElementById('fruitIconSelect') ? document.getElementById('fruitIconSelect').value : 'auto';
        const finalIcon = selectedIcon !== 'auto' ? selectedIcon : getFruitIcon(nameVal, '');

        const qtyVal = parseInt(document.getElementById('fruitQty').value) || 0;
        const buyPriceVal = parseInt(document.getElementById('fruitBuyPrice').value) || 0;
        const priceVal = parseInt(document.getElementById('fruitPrice').value) || 0;
        const minQtyVal = parseInt(document.getElementById('fruitMinQty').value) || 20;
        
        const itemData = {
            name: nameVal,
            image: finalIcon,
            origin: document.getElementById('fruitOrigin').value,
            buyPrice: buyPriceVal,
            price: priceVal,
            quantity: qtyVal + " kg",
            initialQuantity: qtyVal,
            minQuantity: minQtyVal,
            date: document.getElementById('fruitDate').value,
            status: statusValue,
            statusText: statusText
        };

        try {
            if (auth.currentUser && !window.isDemoMode) {
                if(fruitId) {
                    await updateDoc(doc(db, 'fruits', fruitId), itemData);
                    logAction("MODIFICATION", `Mise à jour du lot "${nameVal}"`);
                } else {
                    itemData.soldQuantity = 0;
                    itemData.createdAt = serverTimestamp();
                    await addDoc(fruitsCollection, itemData);
                    logAction("AJOUT", `Arrivage de ${qtyVal} kg de "${nameVal}" enregistré`);
                }
            } else {
                // Mode Démo / Offline - Mise à jour locale du stock
                if (fruitId) {
                    const idx = allFruits.findIndex(f => f.id === fruitId);
                    if (idx !== -1) allFruits[idx] = { ...allFruits[idx], ...itemData };
                } else {
                    itemData.id = "demo_" + Date.now();
                    itemData.soldQuantity = 0;
                    itemData.createdAt = { toDate: () => new Date() };
                    allFruits.unshift(itemData);
                }
                saveLocalStorageData();
                updateStatsAndReports();
                renderTable();
                updatePOSSelect();
            }
            closeModal();
            form.reset();
        } catch (error) {
            console.warn("Erreur réseau/Firestore, enregistrement en mode local:", error);
            if (fruitId) {
                const idx = allFruits.findIndex(f => f.id === fruitId);
                if (idx !== -1) allFruits[idx] = { ...allFruits[idx], ...itemData };
            } else {
                itemData.id = "demo_" + Date.now();
                itemData.soldQuantity = 0;
                itemData.createdAt = { toDate: () => new Date() };
                allFruits.unshift(itemData);
            }
            saveLocalStorageData();
            updateStatsAndReports();
            renderTable();
            updatePOSSelect();
            closeModal();
            form.reset();
        } finally {
            submitBtn.disabled = false;
        }
    });
}

function initNotifModal() {
    const notifModal = document.getElementById('notifModal');
    const notifIcon = document.getElementById('notifIcon');
    const closeNotifBtn = document.getElementById('closeNotifBtn');

    if(notifIcon && notifModal) {
        notifIcon.addEventListener('click', () => {
            notifModal.classList.add('active');
        });
    }

    const closeNotif = () => {
        if(notifModal) notifModal.classList.remove('active');
    };
    
    if(closeNotifBtn) closeNotifBtn.addEventListener('click', closeNotif);
    
    if(notifModal) {
        notifModal.addEventListener('click', (e) => { 
            if(e.target === notifModal) closeNotif(); 
        });
    }
}

function initAuth() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    
    // Restaurer la session locale au chargement si elle existe
    const savedDemoUser = localStorage.getItem('freshstock_demo_user');
    if (savedDemoUser) {
        window.isDemoMode = true;
    }

    // Écouteur d'état d'authentification
    onAuthStateChanged(auth, (user) => {
        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.getElementById('app-container');
        const demoUser = localStorage.getItem('freshstock_demo_user');
        
        if (user || window.isDemoMode || demoUser) {
            loginScreen.style.display = 'none';
            appContainer.style.display = 'flex';
            const emailLabel = document.getElementById('currentUserEmail');
            if(emailLabel) emailLabel.textContent = user ? user.email.split('@')[0] : (demoUser || "Demo Admin");
        } else {
            loginScreen.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    });

    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            loginBtn.textContent = "Connexion...";
            loginBtn.disabled = true;
            loginError.style.display = 'none';
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
                localStorage.removeItem('freshstock_demo_user');
                loginForm.reset();
            } catch (error) {
                console.error("Erreur de connexion:", error);
                if (email === "skhamidou03@gmail.com" && password === "Menia042912") {
                    window.isDemoMode = true;
                    localStorage.setItem('freshstock_demo_user', "skhamidou03");
                    document.getElementById('login-screen').style.display = 'none';
                    document.getElementById('app-container').style.display = 'flex';
                    const emailLabel = document.getElementById('currentUserEmail');
                    if(emailLabel) emailLabel.textContent = "skhamidou03";
                } else if (error.code === 'auth/configuration-not-found') {
                    loginError.innerHTML = `L'authentification n'est pas encore activée sur la console Firebase.<br><button id="btnDemoMode" style="margin-top: 10px; padding: 6px 12px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Accéder en Mode Démo</button>`;
                    loginError.style.display = 'block';
                    document.getElementById('btnDemoMode')?.addEventListener('click', () => {
                        window.isDemoMode = true;
                        localStorage.setItem('freshstock_demo_user', "Demo Admin");
                        document.getElementById('login-screen').style.display = 'none';
                        document.getElementById('app-container').style.display = 'flex';
                    });
                } else {
                    loginError.textContent = "Email ou mot de passe incorrect.";
                    loginError.style.display = 'block';
                }
            } finally {
                loginBtn.textContent = "Se Connecter";
                loginBtn.disabled = false;
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.isDemoMode = false;
            localStorage.removeItem('freshstock_demo_user');
            signOut(auth);
            document.getElementById('login-screen').style.display = 'flex';
            document.getElementById('app-container').style.display = 'none';
        });
    }
}

// ---------------- EXPORT CSV HELPERS ----------------
function downloadCSV(csvContent, fileName) {
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function initCSVExports() {
    const btnSales = document.getElementById('btnExportSalesCSV');
    if(btnSales) {
        btnSales.addEventListener('click', () => {
            let csv = "Date;Client;Telephone;Adresse;Produit;Quantite (kg);Prix Unitaire (FCFA);Total (FCFA)\n";
            allSalesData.forEach(s => {
                const dateStr = s.createdAt ? new Date(s.createdAt.toDate()).toLocaleString('fr-FR') : "";
                csv += `"${dateStr}";"${s.clientName || ''}";"${s.clientPhone || ''}";"${s.clientAddress || ''}";"${s.fruitName || ''}";${s.qty || 0};${s.pricePerKg || 0};${s.totalPrice || 0}\n`;
            });
            downloadCSV(csv, `FreshStock_Ventes_${new Date().toISOString().slice(0,10)}.csv`);
        });
    }

    const btnInv = document.getElementById('btnExportInventoryCSV');
    if(btnInv) {
        btnInv.addEventListener('click', () => {
            let csv = "Produit;Origine;Prix Achat (FCFA/kg);Prix Vente (FCFA/kg);Quantite Initiale (kg);Vendu (kg);Restant (kg);Date Arrivage;Statut\n";
            allFruits.forEach(f => {
                const initQty = f.initialQuantity !== undefined ? f.initialQuantity : (parseInt(f.quantity) || 0);
                const soldQty = f.soldQuantity || 0;
                const remaining = initQty - soldQty;
                csv += `"${f.name || ''}";"${f.origin || ''}";${f.buyPrice || 0};${f.price || 0};${initQty};${soldQty};${remaining};"${f.date || ''}";"${f.statusText || f.status || ''}"\n`;
            });
            downloadCSV(csv, `FreshStock_Inventaire_${new Date().toISOString().slice(0,10)}.csv`);
        });
    }

    const btnClients = document.getElementById('btnExportClients');
    if(btnClients) {
        btnClients.addEventListener('click', () => {
            let clientsMap = {};
            allSalesData.forEach(sale => {
                const key = (sale.clientPhone || '').trim() || sale.clientName;
                if(!key) return;
                if(!clientsMap[key]) {
                    clientsMap[key] = { name: sale.clientName, phone: sale.clientPhone, address: sale.clientAddress || '', count: 0, spent: 0 };
                }
                clientsMap[key].count += 1;
                clientsMap[key].spent += (sale.totalPrice || 0);
            });
            let csv = "Nom Client;Telephone;Adresse;Nombre d'achats;Total Depense (FCFA)\n";
            Object.values(clientsMap).forEach(c => {
                csv += `"${c.name}";"${c.phone}";"${c.address}";${c.count};${c.spent}\n`;
            });
            downloadCSV(csv, `FreshStock_Clients_${new Date().toISOString().slice(0,10)}.csv`);
        });
    }
}

// ---------------- CHART.JS & WASTE LOGIC ----------------
let trendChartInstance = null;
let distChartInstance = null;

function renderCharts(salesData) {
    const trendCtx = document.getElementById('salesTrendChart')?.getContext('2d');
    const distCtx = document.getElementById('fruitDistributionChart')?.getContext('2d');

    if (!trendCtx || !distCtx || typeof Chart === 'undefined') return;

    let dateSalesMap = {};
    let fruitSalesMap = {};

    salesData.forEach(sale => {
        let dateKey = sale.createdAtStr ? sale.createdAtStr.split(' ')[0] : parseDate(sale.createdAt).toLocaleDateString('fr-FR', {day: '2-digit', month:'2-digit'});
        dateSalesMap[dateKey] = (dateSalesMap[dateKey] || 0) + (sale.totalPrice || 0);
        fruitSalesMap[sale.fruitName] = (fruitSalesMap[sale.fruitName] || 0) + (sale.qty || 0);
    });

    const dates = Object.keys(dateSalesMap);
    const revenues = Object.values(dateSalesMap);
    const fruits = Object.keys(fruitSalesMap);
    const volumes = Object.values(fruitSalesMap);

    if (trendChartInstance) trendChartInstance.destroy();
    if (distChartInstance) distChartInstance.destroy();

    trendChartInstance = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: dates.length ? dates : ['Aucune vente'],
            datasets: [{
                label: 'Chiffre d\'affaires (FCFA)',
                data: revenues.length ? revenues : [0],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    distChartInstance = new Chart(distCtx, {
        type: 'doughnut',
        data: {
            labels: fruits.length ? fruits : ['Aucun fruit'],
            datasets: [{
                data: volumes.length ? volumes : [1],
                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#94a3b8', boxWidth: 12 } }
            }
        }
    });
}

function initWasteModal() {
    const modal = document.getElementById('wasteModal');
    const form = document.getElementById('wasteForm');
    const select = document.getElementById('wasteFruitSelect');

    const openWaste = () => {
        form.reset();
        if(select) {
            select.innerHTML = '<option value="">-- Choisir un lot --</option>';
            allFruits.forEach(f => {
                const initQty = f.initialQuantity !== undefined ? f.initialQuantity : (parseInt(f.quantity) || 0);
                const remaining = initQty - (f.soldQuantity || 0);
                if(remaining > 0) {
                    select.innerHTML += `<option value="${f.id}">${f.name} (Restant: ${remaining} kg)</option>`;
                }
            });
        }
        modal.classList.add('active');
    };

    const btnOpen = document.getElementById('btnOpenWasteModal');
    if(btnOpen) btnOpen.addEventListener('click', openWaste);

    const closeModal = () => modal.classList.remove('active');
    document.getElementById('closeWasteModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelWasteBtn')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            const fruitId = select.value;
            const wasteQty = parseInt(document.getElementById('wasteQty').value) || 0;
            const reason = document.getElementById('wasteReason').value;

            const fruit = allFruits.find(f => f.id === fruitId);
            if(!fruit) {
                submitBtn.disabled = false;
                return;
            }

            const initialQty = fruit.initialQuantity !== undefined ? fruit.initialQuantity : (parseInt(fruit.quantity) || 0);
            const currentSold = fruit.soldQuantity || 0;
            const newSoldQty = currentSold + wasteQty;
            const remaining = initialQty - newSoldQty;

            let newStatus = remaining <= 0 ? "danger" : fruit.status;
            let newStatusText = remaining <= 0 ? "Épuisé" : (fruit.statusText || fruit.status || "");

            try {
                if (auth.currentUser && !window.isDemoMode) {
                    await updateDoc(doc(db, 'fruits', fruitId), {
                        soldQuantity: newSoldQty,
                        status: newStatus,
                        statusText: newStatusText
                    });
                } else {
                    fruit.soldQuantity = newSoldQty;
                    fruit.status = newStatus;
                    fruit.statusText = newStatusText;
                    saveLocalStorageData();
                    if(typeof renderTable === 'function') renderTable();
                    if(typeof updateStatsAndReports === 'function') updateStatsAndReports();
                    if(typeof updatePOSSelect === 'function') updatePOSSelect();
                }
                logAction("PERTE", `Perte déclarée: ${wasteQty} kg de "${fruit.name}" (Motif: ${reason}).`);
                alert(`Perte de ${wasteQty} kg enregistrée avec succès !`);
                closeModal();
            } catch(err) {
                console.warn("Erreur perte, enregistrement local:", err);
                fruit.soldQuantity = newSoldQty;
                fruit.status = newStatus;
                fruit.statusText = newStatusText;
                saveLocalStorageData();
                if(typeof renderTable === 'function') renderTable();
                if(typeof updateStatsAndReports === 'function') updateStatsAndReports();
                if(typeof updatePOSSelect === 'function') updatePOSSelect();
                logAction("PERTE", `Perte déclarée: ${wasteQty} kg de "${fruit.name}" (Motif: ${reason}).`);
                alert(`Perte de ${wasteQty} kg enregistrée avec succès !`);
                closeModal();
            } finally {
                submitBtn.disabled = false;
            }
        });
    }
}

// ---------------- DEBT REPAYMENT & THEME LOGIC ----------------
function openDebtModal(name, phone, debt) {
    const modal = document.getElementById('debtModal');
    if(!modal) return;
    document.getElementById('debtClientName').value = name;
    document.getElementById('debtClientPhone').value = phone;
    document.getElementById('debtCurrentAmount').textContent = debt.toLocaleString('fr-FR') + " FCFA";
    document.getElementById('debtPayAmount').value = "";
    document.getElementById('debtPayAmount').max = debt;
    modal.classList.add('active');
}

function initDebtModal() {
    const modal = document.getElementById('debtModal');
    const form = document.getElementById('debtForm');
    if(!modal || !form) return;

    const closeModal = () => modal.classList.remove('active');
    document.getElementById('closeDebtModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelDebtBtn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const name = document.getElementById('debtClientName').value;
        const phone = document.getElementById('debtClientPhone').value;
        const amount = parseInt(document.getElementById('debtPayAmount').value) || 0;

        try {
            if (auth.currentUser && !window.isDemoMode) {
                const repaymentsCollection = collection(db, 'repayments');
                await addDoc(repaymentsCollection, {
                    clientName: name,
                    clientPhone: phone,
                    amount: amount,
                    createdAt: serverTimestamp()
                });
            } else {
                const repObj = {
                    id: "rep_" + Date.now(),
                    clientName: name,
                    clientPhone: phone,
                    amount: amount,
                    createdAt: { toDate: () => new Date() }
                };
                allRepaymentsData.push(repObj);
                saveLocalStorageData();
                renderClientsTable();
            }
            logAction("RÈGLEMENT DETTE", `Versement de ${amount.toLocaleString('fr-FR')} FCFA reçu du client ${name} (${phone}).`);
            alert(`Versement de ${amount.toLocaleString('fr-FR')} FCFA enregistré avec succès !`);
            closeModal();
        } catch(err) {
            console.warn("Erreur règlement, enregistrement local:", err);
            const repObj = {
                id: "rep_" + Date.now(),
                clientName: name,
                clientPhone: phone,
                amount: amount,
                createdAt: { toDate: () => new Date() }
            };
            allRepaymentsData.push(repObj);
            saveLocalStorageData();
            renderClientsTable();
            logAction("RÈGLEMENT DETTE", `Versement de ${amount.toLocaleString('fr-FR')} FCFA reçu du client ${name} (${phone}).`);
            alert(`Versement de ${amount.toLocaleString('fr-FR')} FCFA enregistré avec succès !`);
            closeModal();
        } finally {
            submitBtn.disabled = false;
        }
    });
}

function initThemeToggle() {
    const btn = document.getElementById('themeToggleBtn');
    const icon = document.getElementById('themeIcon');

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        if (icon) {
            icon.className = theme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
        }
    };

    const savedTheme = localStorage.getItem('freshstock_theme') || 'light';
    applyTheme(savedTheme);

    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem('freshstock_theme', next);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initThemeToggle();
    initRealtimeUpdates();
    initAddModal();
    initNotifModal();
    initWasteModal();
    initDebtModal();
    initPOS();
    initAuth();
    initCSVExports();
    
    const searchInput = document.getElementById('searchInput');
    if(searchInput) searchInput.addEventListener('input', renderTable);

    const reportPeriodSelect = document.getElementById('reportPeriodSelect');
    if(reportPeriodSelect) reportPeriodSelect.addEventListener('change', updateStatsAndReports);

    const receiptModal = document.getElementById('receiptModal');
    const closeReceiptBtn = document.getElementById('closeReceiptBtn');
    const printReceiptBtn = document.getElementById('printReceiptBtn');

    if (closeReceiptBtn && receiptModal) {
        closeReceiptBtn.addEventListener('click', () => receiptModal.classList.remove('active'));
        receiptModal.addEventListener('click', (e) => {
            if (e.target === receiptModal) receiptModal.classList.remove('active');
        });
    }

    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', () => {
            window.print();
        });
    }
});
