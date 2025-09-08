export function displayResult(elementId, result) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.innerHTML = ''; // Clear previous content first

    // If result is null or undefined, do nothing further after clearing.
    if (result === null || typeof result === 'undefined') {
        return;
    }

    const container = document.createElement('div');

    if (result && (typeof result.answer !== 'undefined' || typeof result === 'string')) {
        const answerContent = result.answer || result;
        // If the answer is likely HTML, use a div. Otherwise, use a pre for formatted text.
        if (typeof answerContent === 'string' && answerContent.trim().startsWith('<')) {
            const answerDiv = document.createElement('div');
            answerDiv.className = 'answer-container'; // Add a class for styling
            answerDiv.innerHTML = answerContent;
            container.appendChild(answerDiv);
        } else {
            const answerPre = document.createElement('pre');
            answerPre.textContent = typeof answerContent === 'object' ? JSON.stringify(answerContent, null, 2) : answerContent;
            container.appendChild(answerPre);
        }
    }

    if (result && result.steps) {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = 'แสดงวิธีทำ';
        details.appendChild(summary);

        const stepsDiv = document.createElement('div');
        stepsDiv.className = 'steps-container';
        stepsDiv.innerHTML = result.steps; // steps will be an HTML string
        details.appendChild(stepsDiv);
        
        container.appendChild(details);

        // Render math formulas using KaTeX
        if (window.renderMathInElement) {
            renderMathInElement(stepsDiv, {
                delimiters: [ {left: "$$", right: "$$", display: true}, {left: "$", right: "$", display: false} ]
            });
        }
    }

    el.appendChild(container);
}

export function showError(message, elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  el.innerHTML = ''; // Clear previous content
  el.appendChild(errorDiv);
}

export function getPlotlyLayout(title = '', xaxis_title = '', yaxis_title = '') {
    const styles = getComputedStyle(document.documentElement);
    const gridColor = styles.getPropertyValue('--border-color').trim();
    const fontColor = styles.getPropertyValue('--text').trim();
    const mutedColor = styles.getPropertyValue('--muted').trim();
    return {
        title: {
            text: title,
            font: { color: fontColor, size: 16 },
            x: 0.05,
            xanchor: 'left'
        },
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        font: { color: mutedColor },
        xaxis: {
            title: { text: xaxis_title, font: { color: fontColor } },
            automargin: true,
            gridcolor: gridColor,
            zerolinecolor: gridColor,
            linecolor: gridColor,
            tickfont: { color: mutedColor }
        },
        yaxis: {
            title: { text: yaxis_title, font: { color: fontColor } },
            automargin: true,
            gridcolor: gridColor,
            zerolinecolor: gridColor,
            linecolor: gridColor,
            tickfont: { color: mutedColor }
        },
        legend: {
            font: { color: mutedColor },
            orientation: 'h',
            yanchor: 'bottom',
            y: 1.02,
            xanchor: 'right',
            x: 1
        },
        margin: { l: 40, r: 20, b: 40, t: 50 }
    };
}

export const plotlyConfig = {
    responsive: true,
    displaylogo: false,
    displayModeBar: false
};

export function buildPayoffGrid(stateCount, altCount) {
    const payoffGrid = document.getElementById('payoff-grid');
    payoffGrid.innerHTML = '';
    payoffGrid.style.gridTemplateColumns = `1fr repeat(${stateCount}, 1fr)`;

    // Header Row
    const topLeft = document.createElement('div');
    topLeft.className = 'payoff-top-left';
    topLeft.textContent = 'ทางเลือก ↓ / สภาวะ →';
    payoffGrid.appendChild(topLeft);
    for (let j = 1; j <= stateCount; j++) {
        const headerInput = document.createElement('input');
        headerInput.type = 'text';
        headerInput.className = 'payoff-state-name';
        headerInput.value = `สภาวะที่ ${j}`;
        payoffGrid.appendChild(headerInput);
    }

    // Alternative Rows
    for (let i = 1; i <= altCount; i++) {
        const altInput = document.createElement('input');
        altInput.type = 'text';
        altInput.className = 'payoff-alt-name';
        altInput.value = `ทางเลือกที่ ${i}`;
        payoffGrid.appendChild(altInput);

        for (let j = 1; j <= stateCount; j++) {
            const valueInput = document.createElement('input');
            valueInput.type = 'number';
            valueInput.className = 'payoff-value';
            payoffGrid.appendChild(valueInput);
        }
    }
    updatePayoffButtons(stateCount, altCount);
}

export function updatePayoffButtons(stateCount, altCount) {
    document.getElementById('removePayoffState').disabled = stateCount <= 1;
    document.getElementById('removePayoffAlt').disabled = altCount <= 1;
}

export function buildNpvInputs(count) {
    const npvCfContainer = document.getElementById('npv-cashflows-container');
    npvCfContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'npv-cf-group';
        const labelText = i === 0 ? `กระแสเงินสดปีที่ ${i} (เงินลงทุน)` : `กระแสเงินสดปีที่ ${i}`;
        inputGroup.innerHTML = `
            <label for="npv_cf_${i}">${labelText}</label>
            <input type="number" id="npv_cf_${i}" class="npv-cf-input" placeholder="ใส่ค่ากระแสเงินสด">
        `;
        npvCfContainer.appendChild(inputGroup);
    }
    document.getElementById('removeNpvCf').disabled = count <= 2;
}

export function buildIrrInputs(count) {
    const irrCfContainer = document.getElementById('irr-cashflows-container');
    irrCfContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'irr-cf-group';
        const labelText = i === 0 ? `กระแสเงินสดปีที่ ${i} (เงินลงทุน)` : `กระแสเงินสดปีที่ ${i}`;
        inputGroup.innerHTML = `
            <label for="irr_cf_${i}">${labelText}</label>
            <input type="number" id="irr_cf_${i}" class="irr-cf-input" placeholder="ใส่ค่ากระแสเงินสด">
        `;
        irrCfContainer.appendChild(inputGroup);
    }
    document.getElementById('removeIrrCf').disabled = count <= 2;
}

export function updateCorrVarButtons() {
    const container = document.getElementById('corr-vars-container');
    if (!container) return;
    const groupCount = container.children.length;
    const removeBtn = document.getElementById('removeCorrVar');
    if (removeBtn) {
        removeBtn.disabled = groupCount <= 2;
    }
}

export function updateAnovaButtons() {
    const container = document.getElementById('anova-groups-container');
    if (!container) return;
    const groupCount = container.children.length;
    const removeBtn = document.getElementById('removeAnovaGroup');
    if (removeBtn) {
        removeBtn.disabled = groupCount <= 2;
    }
}
