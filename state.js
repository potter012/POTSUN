import * as ui from './ui.js';

let payoffStateCount = 2;
let payoffAltCount = 2;
let npvCfCount = 5;
let irrCfCount = 5;

export const stateManager = {
    storageKey: 'potsun-appState',

    // --- Save ---
    save() {
        const state = {
            static: this.getStaticInputState(),
            payoff: this.getPayoffState(),
            corr: this.getCorrState(),
            anova: this.getAnovaState(),
            npv: this.getNpvState(),
            irr: this.getIrrState(),
        };
        localStorage.setItem(this.storageKey, JSON.stringify(state));
    },

    getStaticInputState() {
        const staticState = {};
        const inputs = document.querySelectorAll('.panel input[id]:not([class*="-cf-input"]):not([class*="-group-input"]):not([class*="payoff-"]):not([class*="corr-var-"]), .panel textarea[id]:not([class*="corr-var-"]), .panel select[id]');
        inputs.forEach(el => {
            // This check is technically redundant as the selector scopes to .panel, but it's good practice.
            if (el.type === 'checkbox' || el.type === 'radio') {
                staticState[el.id] = el.checked;
            } else {
                staticState[el.id] = el.value;
            }
        });
        return staticState;
    },
    
    getPayoffState() {
        return {
            states: payoffStateCount,
            alts: payoffAltCount,
            stateNames: Array.from(document.querySelectorAll('.payoff-state-name')).map(i => i.value),
            altNames: Array.from(document.querySelectorAll('.payoff-alt-name')).map(i => i.value),
            values: Array.from(document.querySelectorAll('.payoff-value')).map(i => i.value),
        };
    },

    getCorrState() {
        const groups = document.querySelectorAll('.corr-var-group');
        return {
            count: groups.length,
            data: Array.from(groups).map(g => ({
                name: g.querySelector('.corr-var-name').value,
                values: g.querySelector('.corr-var-data').value,
            }))
        };
    },

    getAnovaState() {
        const groups = document.querySelectorAll('.anova-group-input');
        return {
            count: groups.length,
            values: Array.from(groups).map(g => g.value)
        };
    },

    getNpvState() {
        return {
            count: npvCfCount,
            values: Array.from(document.querySelectorAll('.npv-cf-input')).map(i => i.value)
        };
    },

    getIrrState() {
        return {
            count: irrCfCount,
            values: Array.from(document.querySelectorAll('.irr-cf-input')).map(i => i.value)
        };
    },

    // --- Load ---
    load() {
        const savedState = localStorage.getItem(this.storageKey);
        if (!savedState) {
            return false; // Indicate no state was loaded
        }
        const state = JSON.parse(savedState);
        
        this.loadStaticInputState(state.static);
        this.loadPayoffState(state.payoff);
        this.loadCorrState(state.corr);
        this.loadAnovaState(state.anova);
        this.loadNpvState(state.npv);
        this.loadIrrState(state.irr);
        return true; // Indicate success
    },

    loadStaticInputState(staticState) {
        if (!staticState) return;
        for (const id in staticState) {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox' || el.type === 'radio') {
                    el.checked = staticState[id];
                } else {
                    el.value = staticState[id];
                }
            }
        }
    },

    loadPayoffState(payoffState) {
        if (!payoffState) return;
        payoffStateCount = payoffState.states || 2;
        payoffAltCount = payoffState.alts || 2;
        ui.buildPayoffGrid(payoffStateCount, payoffAltCount); // Rebuild with correct dimensions

        document.querySelectorAll('.payoff-state-name').forEach((el, i) => { if(payoffState.stateNames && payoffState.stateNames[i] !== undefined) el.value = payoffState.stateNames[i]; });
        document.querySelectorAll('.payoff-alt-name').forEach((el, i) => { if(payoffState.altNames && payoffState.altNames[i] !== undefined) el.value = payoffState.altNames[i]; });
        document.querySelectorAll('.payoff-value').forEach((el, i) => { if(payoffState.values && payoffState.values[i] !== undefined) el.value = payoffState.values[i]; });
    },

    loadCorrState(corrState) {
        if (!corrState || !corrState.data) return;
        const container = document.getElementById('corr-vars-container');
        container.innerHTML = ''; // Clear default
        corrState.data.forEach((d, i) => {
            const groupCount = i + 1;
            const newGroupDiv = document.createElement('div');
            newGroupDiv.className = 'corr-var-group';
            newGroupDiv.innerHTML = `
                <label>ชื่อตัวแปรที่ ${groupCount}</label>
                <input type="text" class="corr-var-name" value="${d.name}">
                <label>ข้อมูล (คั่นด้วยคอมมา/ช่องว่าง)</label>
                <textarea class="corr-var-data" placeholder="...">${d.values}</textarea>
            `;
            container.appendChild(newGroupDiv);
        });
        ui.updateCorrVarButtons();
    },
    
    loadAnovaState(anovaState) {
        if (!anovaState || !anovaState.values) return;
        const container = document.getElementById('anova-groups-container');
        container.innerHTML = ''; // Clear default
        anovaState.values.forEach((val, i) => {
            const groupCount = i + 1;
            const newGroupDiv = document.createElement('div');
            newGroupDiv.className = 'anova-group';
            newGroupDiv.innerHTML = `
                <label>ข้อมูลกลุ่มที่ ${groupCount}</label>
                <input type="text" class="anova-group-input" placeholder="17.5 18.2 19.1 16.9 18.8" value="${val}">
            `;
            container.appendChild(newGroupDiv);
        });
        ui.updateAnovaButtons();
    },

    loadNpvState(npvState) {
        if (!npvState) return;
        npvCfCount = npvState.count || 5;
        ui.buildNpvInputs(npvCfCount);
        document.querySelectorAll('.npv-cf-input').forEach((el, i) => { if(npvState.values && npvState.values[i] !== undefined) el.value = npvState.values[i]; });
    },

    loadIrrState(irrState) {
        if (!irrState) return;
        irrCfCount = irrState.count || 5;
        ui.buildIrrInputs(irrCfCount);
        document.querySelectorAll('.irr-cf-input').forEach((el, i) => { if(irrState.values && irrState.values[i] !== undefined) el.value = irrState.values[i]; });
    },

    // --- Auto-save setup ---
    initAutoSave() {
        let saveTimeout;
        const debouncedSave = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => this.save(), 500);
        };

        document.body.addEventListener('input', (e) => {
            if (e.target.closest('section.panel') && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
                debouncedSave();
            }
        });
        
        document.body.addEventListener('click', (e) => {
            if (e.target.matches('.btn-add, .btn-remove')) {
                setTimeout(() => this.save(), 50);
            }
        });
    }
};
