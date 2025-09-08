import * as utils from './utils.js';
import * as ui from './ui.js';
import { stateManager } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- THEME SWITCHER ---
    const dom = {
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        clearDataBtn: document.getElementById('clearDataBtn'),
        tabs: document.querySelectorAll('.tabbtn'),
        panels: document.querySelectorAll('section.panel'),
    };
    const THEME_KEY = 'potsun-theme';

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        // Force redraw of any visible plots
        document.querySelectorAll('.plot-container').forEach(container => {
            if (container._fullLayout) Plotly.relayout(container, ui.getPlotlyLayout(container.layout));
        });
    };

    dom.themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // Load initial theme
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // Default to dark if no preference is saved
        applyTheme('dark');
    }

    // --- LOGOUT ---
    if (dom.logoutBtn) {
        dom.logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });
    }


    // --- TAB NAVIGATION ---
    dom.tabs.forEach(button => button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        const targetPanel = document.getElementById(targetTab);

        if (button.classList.contains('active') || !targetPanel) {
            return;
        }

        // Update button states
        dom.tabs.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update panel visibility
        dom.panels.forEach(panel => panel.classList.remove('active'));
        targetPanel.classList.add('active');

        // After the panel is made visible, tell Plotly to resize any graphs inside it.
        // A small timeout ensures the browser has rendered the panel and it has dimensions.
        setTimeout(() => {
            targetPanel.querySelectorAll('.plot-container').forEach(plotDiv => {
                if (plotDiv._fullLayout) { // A simple check to see if it's a plotly graph
                    Plotly.Plots.resize(plotDiv);
                }
            });
        }, 50); // A small delay is sometimes needed for the container to get its final size.
    }));

    // --- STATS TAB ---
    const handleCalcStats = () => {
        try {
            const arr = utils.parseNums(document.getElementById('nums').value);
            if (arr.length === 0) {
                throw new utils.ValidationError('กรุณากรอกตัวเลขอย่างน้อยหนึ่งตัว');
            }
            const mu = utils.mean(arr);
            const v = utils.variance(arr);
            const s = utils.stddev(arr);
            const out = {
                'ค่าเฉลี่ย (Mean)': mu.toFixed(4),
                'มัธยฐาน (Median)': utils.median(arr).toFixed(4),
                'ฐานนิยม (Mode)': utils.mode(arr),
                'ความแปรปรวน (Variance)': v.toFixed(4),
                'ส่วนเบี่ยงเบนมาตรฐาน (StdDev)': s.toFixed(4),
                'จำนวนข้อมูล (Count)': arr.length
            };
            const answer = JSON.stringify(out, null, 2);
            const steps = `
                <b>ค่าเฉลี่ย (Mean):</b>
                <p>สูตร: $$ \\mu = \\frac{\\sum x_i}{n} $$</p>
                ${
                  arr.length <= 8
                  ? `<p>$$ \\mu = \\frac{${arr.join(' + ')}}{${arr.length}} = \\frac{${arr.reduce((a,b)=>a+b,0)}}{${arr.length}} = \\mathbf{${mu.toFixed(4)}} $$</p>`
                  : `<p>$$ \\mu = \\frac{\\sum x_i}{n} = \\frac{${arr.reduce((a,b)=>a+b,0)}}{${arr.length}} = \\mathbf{${mu.toFixed(4)}} $$</p>`
                }
                <br>
                <b>มัธยฐาน (Median):</b>
                <p>1. เรียงข้อมูลจากน้อยไปมาก: </p>
                <p>[${arr.slice().sort((a,b)=>a-b).join(', ')}]</p>
                <p>2. หาตำแหน่งตรงกลาง: (n+1)/2 = (${arr.length}+1)/2 = ${(arr.length+1)/2}</p>
                ${
                  arr.length % 2
                  ? `<p>ข้อมูลมีจำนวนคี่, มัธยฐานคือข้อมูลในตำแหน่งที่ ${Math.ceil(arr.length/2)} ซึ่งคือ <b>${utils.median(arr).toFixed(4)}</b></p>`
                  : `<p>ข้อมูลมีจำนวนคู่, มัธยฐานคือค่าเฉลี่ยของข้อมูลในตำแหน่งที่ ${arr.length/2} และ ${arr.length/2 + 1}</p>
                     <p>Median = (${arr.slice().sort((a,b)=>a-b)[arr.length/2 - 1]} + ${arr.slice().sort((a,b)=>a-b)[arr.length/2]}) / 2 = <b>${utils.median(arr).toFixed(4)}</b></p>`
                }
                <br>
                <b>ฐานนิยม (Mode):</b>
                <p>1. นับความถี่ของข้อมูลแต่ละตัว:</p>
                <table class="steps-table compact">
                  <thead><tr><th>ข้อมูล</th><th>ความถี่</th></tr></thead>
                  <tbody>
                    ${Object.entries(arr.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {})).map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join('')}
                  </tbody>
                </table>
                <br>
                <p>2. ข้อมูลที่มีความถี่สูงสุดคือ <b>${utils.mode(arr)}</b></p>
                <br>
                <b>ความแปรปรวน (Variance):</b>
                <p>สูตร: $$ \\sigma^2 = \\frac{\\sum(x_i - \\mu)^2}{n} $$</p>
                <p><b>1. คำนวณผลรวมของค่าเบี่ยงเบนกำลังสอง (Numerator):</b></p>
                <table class="steps-table compact">
                  <thead><tr><th>xᵢ</th><th>xᵢ - μ</th><th>(xᵢ - μ)²</th></tr></thead>
                  <tbody>
                    ${arr.map(x => `<tr><td>${x.toFixed(2)}</td><td>${(x - mu).toFixed(2)}</td><td>${((x - mu)**2).toFixed(2)}</td></tr>`).join('')}
                  </tbody>
                  <tfoot><tr><td colspan="2"><b>ผลรวม (Σ)</b></td><td><b>${arr.reduce((a,b)=>a+(b-mu)**2,0).toFixed(4)}</b></td></tr></tfoot>
                </table>
                <br>
                <p><b>2. คำนวณความแปรปรวน:</b></p>
                <p>$$ \\sigma^2 = \\frac{${arr.reduce((a,b)=>a+(b-mu)**2,0).toFixed(4)}}{${arr.length}} = \\mathbf{${v.toFixed(4)}} $$</p>
                <br>
                <b>ส่วนเบี่ยงเบนมาตรฐาน (StdDev):</b>
                <p>$$ \\sigma = \\sqrt{\\sigma^2} = \\sqrt{${v.toFixed(4)}} = \\mathbf{${s.toFixed(4)}} $$</p>
            `;
            ui.displayResult('statsOut', { answer, steps });
        } catch (e) {
            if (e instanceof utils.ValidationError) {
                 ui.showError(e.message, 'statsOut');
            } else {
                console.error('An unexpected error occurred in Basic Stats:', e);
                ui.showError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาตรวจสอบ Console สำหรับข้อมูลเพิ่มเติม', 'statsOut');
            }
        }
    };
    document.getElementById('calcStats').addEventListener('click', handleCalcStats);

    document.getElementById('calcMA').addEventListener('click', () => {
        try {
            const arr = utils.parseNums(document.getElementById('nums').value);
            const w = parseInt(document.getElementById('maWindow').value) || 3;
            if (arr.length === 0) {
                throw new utils.ValidationError('กรุณากรอกข้อมูล');
            }
            if (w <= 0 || w > arr.length) {
                throw new utils.ValidationError('ขนาดของ Window ต้องเป็นจำนวนเต็มบวก และไม่เกินจำนวนข้อมูลที่มี');
            }
            const ma = []; const stepsArr = [];
            for (let i = 0; i <= arr.length - w; i++) { const win = arr.slice(i, i + w); const winSum = win.reduce((a, b) => a + b, 0); const winMean = (winSum / w).toFixed(4); ma.push(winMean); stepsArr.push(`<p>MA<sub>${i + 1}</sub> = (${win.join(' + ')}) / ${w} = ${winMean}</p>`); }
            const answer = `ค่าเฉลี่ยเคลื่อนที่ (MA, window=${w}):\n${ma.join(', ')}`;
            const steps = stepsArr.join('');
            ui.displayResult('statsOut', { answer, steps });
        } catch (e) {
            if (e instanceof utils.ValidationError) { ui.showError(e.message, 'statsOut'); }
            else { console.error('Error in MA calc:', e); ui.showError('เกิดข้อผิดพลาดในการคำนวณ MA', 'statsOut'); }
        }
    });

    document.getElementById('plotHistogram').addEventListener('click', () => {
        const plotContainer = document.getElementById('statsPlot');
        try {
            const arr = utils.parseNums(document.getElementById('nums').value);
            if (arr.length === 0) {
                plotContainer.style.display = 'none'; // Hide if no data
                throw new utils.ValidationError('กรุณากรอกข้อมูลเพื่อสร้าง Histogram');
            }

            plotContainer.style.display = 'block'; // Show the container
            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

            const trace = {
                x: arr,
                type: 'histogram',
                marker: {
                    color: accentColor,
                    line: { color: 'var(--panel)', width: 1 }
                },
                autobinx: true,
            };

            const layout = ui.getPlotlyLayout('Histogram ของชุดข้อมูล', 'ค่าข้อมูล', 'ความถี่');
            Plotly.newPlot(plotContainer, [trace], layout, ui.plotlyConfig);
        } catch (e) {
            ui.showError(e instanceof utils.ValidationError ? e.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด', 'statsOut');
            plotContainer.style.display = 'none';
        }
    });

    // --- QUANT TAB ---
    document.getElementById('runLR').addEventListener('click', ()=>{
      const xs = utils.parseNums(document.getElementById('xs').value);
      const ys = utils.parseNums(document.getElementById('ys').value);
      const predXVal = document.getElementById('predX').value.trim();
      if(xs.length!==ys.length || xs.length<2){ ui.showError('กรุณาใส่ข้อมูล X และ Y ให้มีจำนวนเท่ากัน และต้องมีข้อมูลอย่างน้อย 2 ชุด', 'lrResult'); return; }
      const lr = utils.linearRegression(xs, ys);
      if (!lr) {
        ui.showError('ไม่สามารถคำนวณ Regression ได้ เนื่องจากค่า X ทั้งหมดมีค่าเท่ากัน', 'lrResult');
        return;
      }
      const xm = utils.mean(xs);
      const ym = utils.mean(ys);
      let num = 0, den = 0;
      for(let i=0; i<xs.length; i++){
        num += (xs[i]-xm)*(ys[i]-ym);
        den += (xs[i]-xm)**2;
      }
      const res = { 'ความชัน (Slope)': lr.slope.toFixed(4), 'จุดตัดแกน Y (Intercept)': lr.intercept.toFixed(4) };
      if(predXVal!==''){ const px = parseFloat(predXVal); if(!isNaN(px)){ res['ค่าพยากรณ์ Y (Predict Y)'] = (lr.slope*px + lr.intercept).toFixed(4) } else { res['ค่าพยากรณ์ Y (Predict Y)'] = 'invalid input' } }
      const answer = JSON.stringify(res,null,2);

      let calculationTable = `
        <p><b>ตารางการคำนวณค่าต่างๆ:</b></p>
        <table class="steps-table">
          <thead>
            <tr><th>i</th><th>xᵢ</th><th>yᵢ</th><th>(xᵢ - x̄)</th><th>(yᵢ - ȳ)</th><th>(xᵢ - x̄)²</th><th>(xᵢ - x̄)(yᵢ - ȳ)</th></tr>
          </thead>
          <tbody>`;
      let sum_x_minus_xm_sq = 0;
      let sum_xy_products = 0;
      for(let i=0; i<xs.length; i++) {
        const x_minus_xm = xs[i] - xm;
        const y_minus_ym = ys[i] - ym;
        const x_minus_xm_sq = x_minus_xm**2;
        const xy_product = x_minus_xm * y_minus_ym;
        sum_x_minus_xm_sq += x_minus_xm_sq;
        sum_xy_products += xy_product;
        calculationTable += `<tr><td>${i+1}</td><td>${xs[i]}</td><td>${ys[i]}</td><td>${x_minus_xm.toFixed(2)}</td><td>${y_minus_ym.toFixed(2)}</td><td>${x_minus_xm_sq.toFixed(2)}</td><td>${xy_product.toFixed(2)}</td></tr>`;
      }
      calculationTable += `
          </tbody>
          <tfoot>
            <tr><td colspan="5"><b>ผลรวม (Σ)</b></td><td><b>${sum_x_minus_xm_sq.toFixed(4)}</b></td><td><b>${sum_xy_products.toFixed(4)}</b></td></tr>
          </tfoot>
        </table><br>`;

      const steps = `
        <p><b>1. คำนวณค่าเฉลี่ย:</b></p>
        <p>ค่าเฉลี่ย x̄ = ${xm.toFixed(4)}</p>
        <p>ค่าเฉลี่ย ȳ = ${ym.toFixed(4)}</p>
        <br>
        ${calculationTable}
        <b>2. คำนวณความชัน (Slope, b):</b>
        $$ b = \\frac{\\sum(x_i - \\bar{x})(y_i - \\bar{y})}{\\sum(x_i - \\bar{x})^2} $$
        <p>$$ b = \\frac{${sum_xy_products.toFixed(4)}}{${sum_x_minus_xm_sq.toFixed(4)}} = \\mathbf{${lr.slope.toFixed(4)}} $$</p>
        <br>
        <b>3. คำนวณจุดตัดแกน Y (Intercept, a):</b>
        $$ a = \\bar{y} - b\\bar{x} $$
        <p>$$ a = ${ym.toFixed(4)} - (${lr.slope.toFixed(4)} \\times ${xm.toFixed(4)}) $$</p>
        <p>$$ a = \\mathbf{${lr.intercept.toFixed(4)}} $$</p>
        <br>
        <b>4. สรุปสมการเส้นตรง:</b>
        $$ \\mathbf{\\hat{y} = ${lr.intercept.toFixed(4)} + ${lr.slope.toFixed(4)}x} $$
      `;
      ui.displayResult('lrResult', { answer, steps });

      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
      const lineY = xs.map(x=>lr.slope*x + lr.intercept);
      const trace1 = { 
          x: xs, 
          y: ys, 
          mode: 'markers', 
          name:'ข้อมูล',
          marker: {
              color: mutedColor,
              size: 8,
              opacity: 0.7
          }
      };
      const trace2 = { 
          x: xs, 
          y: lineY, 
          mode: 'lines', 
          name:'เส้นถดถอย',
          line: { color: accentColor, width: 3 }
      };
      const plotContainer = document.getElementById('lrPlot');
      const layout = ui.getPlotlyLayout('แผนภาพการกระจายและเส้นถodถอย', 'X', 'Y');
      Plotly.newPlot(plotContainer, [trace1, trace2], layout, ui.plotlyConfig);
    });

    document.getElementById('calcEV').addEventListener('click', ()=>{
      const outcomes = utils.parseNums(document.getElementById('ev_outcomes').value);
      const probs = utils.parseNums(document.getElementById('ev_probs').value);
      if(outcomes.length!==probs.length){ ui.showError('จำนวน Outcomes และ Probabilities ต้องเท่ากัน', 'evOut'); return }
      const sumP = probs.reduce((a,b)=>a+b,0);
      if(Math.abs(sumP-1)>1e-6){ ui.showError('ผลรวมของ Probabilities ทั้งหมดต้องเท่ากับ 1', 'evOut'); return }
      let ev = 0;
      let steps = '<p>EV = Σ(xᵢ * P(xᵢ))</p>';
      let stepCalc = [];
      for(let i=0;i<outcomes.length;i++) {
        ev += outcomes[i]*probs[i];
        stepCalc.push(`(${outcomes[i]} * ${probs[i]})`);
      }
      steps += `<p>EV = ${stepCalc.join(' + ')} = <b>${ev.toFixed(4)}</b></p>`;
      ui.displayResult('evOut', { answer: `ค่าคาดหวัง (EV): ${ev.toFixed(4)}`, steps });
    });

    // --- PAYOFF MATRIX BUILDER ---
    let payoffStateCount = 2;
    let payoffAltCount = 2;

    document.getElementById('addPayoffState').addEventListener('click', () => { payoffStateCount++; ui.buildPayoffGrid(payoffStateCount, payoffAltCount); });
    document.getElementById('removePayoffState').addEventListener('click', () => { if (payoffStateCount > 1) { payoffStateCount--; ui.buildPayoffGrid(payoffStateCount, payoffAltCount); }});

    document.getElementById('addPayoffAlt').addEventListener('click', () => { payoffAltCount++; ui.buildPayoffGrid(payoffStateCount, payoffAltCount); });
    document.getElementById('removePayoffAlt').addEventListener('click', () => { if (payoffAltCount > 1) { payoffAltCount--; ui.buildPayoffGrid(payoffStateCount, payoffAltCount); } });


    document.getElementById('calcPayoff').addEventListener('click', () => {
        try {
            const alpha = parseFloat(document.getElementById('hurwicz_alpha').value);
            if (isNaN(alpha) || alpha < 0 || alpha > 1) {
                throw new utils.ValidationError('ค่า Alpha สำหรับ Hurwicz ต้องอยู่ระหว่าง 0 และ 1');
            }

            const stateNames = Array.from(document.querySelectorAll('.payoff-state-name')).map(input => input.value || 'Untitled State');
            const altNames = Array.from(document.querySelectorAll('.payoff-alt-name')).map(input => input.value || 'Untitled Alt');
            const allValues = Array.from(document.querySelectorAll('.payoff-value')).map(input => parseFloat(input.value));

            if (allValues.some(isNaN)) {
                throw new utils.ValidationError('กรุณากรอกข้อมูล Payoff ให้ครบทุกช่องและเป็นตัวเลข');
            }

            // Reconstruct the matrix
            const matrix = [];
            for (let i = 0; i < altNames.length; i++) {
                matrix.push(allValues.slice(i * stateNames.length, (i + 1) * stateNames.length));
            }

            if (matrix.length === 0 || matrix[0].length === 0) {
                throw new utils.ValidationError('ไม่พบข้อมูลในตาราง Payoff');
            }

            analyzePayoff(matrix, alpha, altNames, stateNames);

        } catch (e) {
            if (e instanceof utils.ValidationError) {
                ui.showError(e.message, 'payoffOut');
            } else {
                console.error('An unexpected error occurred in Payoff Analysis:', e);
                ui.showError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาตรวจสอบ Console', 'payoffOut');
            }
        }
    });

    function analyzePayoff(matrix, alpha, altNames, stateNames) {
        const numAlternatives = matrix.length;

        // Maximax (Optimistic)
        const maximaxValues = matrix.map(row => Math.max(...row));
        const maximaxChoice = maximaxValues.indexOf(Math.max(...maximaxValues));
        const maximaxResult = `เลือก '${altNames[maximaxChoice]}' (ค่า Payoff สูงสุดคือ ${maximaxValues[maximaxChoice].toLocaleString()})`;

        // Maximin (Pessimistic)
        const maximinValues = matrix.map(row => Math.min(...row));
        const maximinChoice = maximinValues.indexOf(Math.max(...maximinValues));
        const maximinResult = `เลือก '${altNames[maximinChoice]}' (ค่า Payoff ต่ำสุดที่สูงที่สุดคือ ${maximinValues[maximinChoice].toLocaleString()})`;

        // Laplace
        const laplaceValues = matrix.map(row => utils.mean(row));
        const laplaceChoice = laplaceValues.indexOf(Math.max(...laplaceValues));
        const laplaceResult = `เลือก '${altNames[laplaceChoice]}' (ค่าเฉลี่ยสูงสุดคือ ${laplaceValues[laplaceChoice].toFixed(2).toLocaleString()})`;

        // Hurwicz
        const hurwiczValues = matrix.map(row => alpha * Math.max(...row) + (1 - alpha) * Math.min(...row));
        const hurwiczChoice = hurwiczValues.indexOf(Math.max(...hurwiczValues));
        const hurwiczResult = `เลือก '${altNames[hurwiczChoice]}' (ค่าถ่วงน้ำหนักสูงสุดคือ ${hurwiczValues[hurwiczChoice].toFixed(2).toLocaleString()})`;

        // Minimax Regret
        const numStates = matrix[0].length;
        const maxInCols = Array(numStates).fill(-Infinity);
        for (let j = 0; j < numStates; j++) {
            for (let i = 0; i < numAlternatives; i++) {
                if (matrix[i][j] > maxInCols[j]) {
                    maxInCols[j] = matrix[i][j];
                }
            }
        }
        const regretMatrix = matrix.map(row => row.map((val, j) => maxInCols[j] - val));
        const maxRegretInRows = regretMatrix.map(row => Math.max(...row));
        const minimaxRegretChoice = maxRegretInRows.indexOf(Math.min(...maxRegretInRows));
        const minimaxResult = `เลือก '${altNames[minimaxRegretChoice]}' (ค่าเสียโอกาสสูงสุดที่น้อยที่สุดคือ ${maxRegretInRows[minimaxRegretChoice].toLocaleString()})`;

        const results = {
            'Maximax (มองโลกในแง่ดี)': maximaxResult,
            'Maximin (มองโลกในแง่ร้าย)': maximinResult,
            'Laplace (ความน่าจะเป็นเท่ากัน)': laplaceResult,
            [`Hurwicz (alpha=${alpha})`]: hurwiczResult,
            'Minimax Regret (เสียโอกาสน้อยสุด)': minimaxResult
        };
        const answer = JSON.stringify(results, null, 2);

        let regretTableHtml = '<table class="steps-table"><thead><tr><th>ทางเลือก</th><th>' + stateNames.join('</th><th>') + '</th></tr></thead><tbody>';
        regretMatrix.forEach((row, i) => {
            regretTableHtml += `<tr><td><b>${altNames[i]}</b></td>`;
            row.forEach(val => { regretTableHtml += `<td>${val.toLocaleString()}</td>`; });
            regretTableHtml += '</tr>';
        });
        regretTableHtml += '</tbody></table>';

        const steps = `
            <b>1. Maximax (มองโลกในแง่ดี)</b>
            <p>หาค่าสูงสุดของแต่ละทางเลือก แล้วเลือกทางเลือกที่ให้ค่าสูงสุด</p>
            <ul>${maximaxValues.map((v, i) => `<li>${altNames[i]}: ค่าสูงสุดคือ ${v.toLocaleString()}</li>`).join('')}</ul>
            <p>ค่าที่มากที่สุดคือ ${Math.max(...maximaxValues).toLocaleString()} ดังนั้น <b>${maximaxResult}</b></p>
            <br>
            <b>2. Maximin (มองโลกในแง่ร้าย)</b>
            <p>หาค่าต่ำสุดของแต่ละทางเลือก แล้วเลือกทางเลือกที่ให้ค่าสูงสุดในบรรดาค่าต่ำสุดเหล่านั้น</p>
            <ul>${maximinValues.map((v, i) => `<li>${altNames[i]}: ค่าต่ำสุดคือ ${v.toLocaleString()}</li>`).join('')}</ul>
            <p>ค่าที่มากที่สุดในกลุ่มนี้คือ ${Math.max(...maximinValues).toLocaleString()} ดังนั้น <b>${maximinResult}</b></p>
            <br>
            <b>3. Laplace (ความน่าจะเป็นเท่ากัน)</b>
            <p>หาค่าเฉลี่ยของแต่ละทางเลือก แล้วเลือกทางเลือกที่ให้ค่าเฉลี่ยสูงสุด</p>
            <ul>${laplaceValues.map((v, i) => `<li>${altNames[i]}: ค่าเฉลี่ยคือ ${v.toFixed(2).toLocaleString()}</li>`).join('')}</ul>
            <p>ค่าเฉลี่ยสูงสุดคือ ${Math.max(...laplaceValues).toFixed(2).toLocaleString()} ดังนั้น <b>${laplaceResult}</b></p>
            <br>
            <b>4. Hurwicz (alpha=${alpha})</b>
            <p>คำนวณค่าถ่วงน้ำหนัก [α * (ค่าสูงสุด)] + [(1-α) * (ค่าต่ำสุด)] ของแต่ละทางเลือก แล้วเลือกค่าสูงสุด</p>
            <ul>${hurwiczValues.map((v, i) => `<li>${altNames[i]}: (${alpha}*${Math.max(...matrix[i])}) + (${1-alpha}*${Math.min(...matrix[i])}) = ${v.toFixed(2).toLocaleString()}</li>`).join('')}</ul>
            <p>ค่าถ่วงน้ำหนักสูงสุดคือ ${Math.max(...hurwiczValues).toFixed(2).toLocaleString()} ดังนั้น <b>${hurwiczResult}</b></p>
            <br>
            <b>5. Minimax Regret (ค่าเสียโอกาสน้อยที่สุด)</b>
            <p>ขั้นตอนที่ 1: หาค่าที่ดีที่สุด (สูงสุด) ของแต่ละสภาวะการณ์ (แต่ละคอลัมน์): [${maxInCols.join(', ')}]</p>
            <p>ขั้นตอนที่ 2: สร้างตารางค่าเสียโอกาส (Regret Matrix) โดยนำค่าที่ดีที่สุดของคอลัมน์นั้นๆ ลบด้วยค่าในแต่ละช่อง</p>
            ${regretTableHtml}
            <p>ขั้นตอนที่ 3: หาค่าเสียโอกาสที่สูงสุดของแต่ละทางเลือก (แต่ละแถว): [${maxRegretInRows.join(', ')}]</p>
            <p>ขั้นตอนที่ 4: เลือกทางเลือกที่มีค่าเสียโอกาสสูงสุดที่น้อยที่สุด คือ ${Math.min(...maxRegretInRows).toLocaleString()} ดังนั้น <b>${minimaxResult}</b></p>
        `;
        ui.displayResult('payoffOut', { answer, steps });
    }

    // --- Function Plotter: Handle dropdown selection ---
    document.getElementById('func_select').addEventListener('change', (e) => {
        const selectedFunction = e.target.value;
        if (selectedFunction) document.getElementById('func_expr').value = selectedFunction;
    });

    document.getElementById('plotFunc').addEventListener('click', () => {
        // Clear previous results
        document.getElementById('funcOut').innerHTML = '';
        Plotly.purge('funcPlot');

        const expr = document.getElementById('func_expr').value;
        const minX = parseFloat(document.getElementById('func_min_x').value);
        const maxX = parseFloat(document.getElementById('func_max_x').value);

        if (!expr || isNaN(minX) || isNaN(maxX) || minX >= maxX) {
            ui.showError('กรุณากรอกนิพจน์และช่วงของ x ให้ถูกต้อง', 'funcOut');
            return;
        }

        try {
            const sanitizedExpr = expr.replace(/\^/g, '**'); // Allow both ^ and ** for power
            const func = new Function('x', `return ${sanitizedExpr}`);
            
            const numSteps = 200;
            const stepSize = (maxX - minX) / numSteps;
            const xVals = [];
            const yVals = [];
            let minY = Infinity, maxY = -Infinity;
            let minX_val = minX, maxX_val = minX;

            for (let i = 0; i <= numSteps; i++) {
                const x = minX + i * stepSize;
                const y = func(x);
                if (isNaN(y) || !isFinite(y)) continue;
                xVals.push(x);
                yVals.push(y);
                if (y < minY) { minY = y; minX_val = x; }
                if (y > maxY) { maxY = y; maxX_val = x; }
            }

            if (yVals.length === 0) {
                throw new utils.ValidationError('ไม่สามารถคำนวณค่า y ที่เป็นตัวเลขในช่วงที่กำหนดได้');
            }

            // --- Create result and steps ---
            const answerObj = {
                'ฟังก์ชัน': `f(x) = ${expr}`,
                'ช่วงที่พิจารณา': `[${minX}, ${maxX}]`,
                'ค่าสูงสุด (Max)': `y = ${maxY.toFixed(4)} ที่ x ≈ ${maxX_val.toFixed(4)}`,
                'ค่าต่ำสุด (Min)': `y = ${minY.toFixed(4)} ที่ x ≈ ${minX_val.toFixed(4)}`
            };
            const answer = JSON.stringify(answerObj, null, 2);

            const steps = `
                <p><b>1. การประเมินฟังก์ชัน:</b></p>
                <p>โปรแกรมจะแบ่งช่วง [${minX}, ${maxX}] ออกเป็น ${numSteps} ส่วนเท่าๆ กัน และคำนวณค่า y สำหรับแต่ละค่า x ในช่วงนั้น</p>
                <br>
                <p><b>2. การหาค่าสูงสุดและต่ำสุด:</b></p>
                <p>จากค่า y ทั้งหมดที่คำนวณได้ โปรแกรมจะค้นหาค่าที่มากที่สุดและน้อยที่สุดในชุดข้อมูล</p>
                <p>ค่าสูงสุดที่พบคือ <b>${maxY.toFixed(4)}</b> เมื่อ x มีค่าประมาณ <b>${maxX_val.toFixed(4)}</b></p>
                <p>ค่าต่ำสุดที่พบคือ <b>${minY.toFixed(4)}</b> เมื่อ x มีค่าประมาณ <b>${minX_val.toFixed(4)}</b></p>
                <br>
                <p><i>หมายเหตุ: ค่าที่ได้คือค่าสูงสุดและต่ำสุดเชิงเปรียบเทียบ (local extrema) ภายในช่วงที่กำหนดเท่านั้น ไม่ใช่ค่าสูงสุด/ต่ำสุดสัมบูรณ์ (global extrema) ของฟังก์ชันเสมอไป</i></p>
            `;

            ui.displayResult('funcOut', { answer, steps });

            // --- Plotting ---
            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
            const trace = { 
                x: xVals, 
                y: yVals, 
                mode: 'lines', 
                name: 'f(x)',
                line: { color: accentColor, width: 3 }
            };
            const layout = ui.getPlotlyLayout(`กราฟของ f(x) = ${expr}`, 'x', 'f(x)');
            const annotationBgColor = 'rgba(0, 0, 0, 0.7)';
            layout.annotations = [
                { x: maxX_val, y: maxY, text: `Max: (${maxX_val.toFixed(2)}, ${maxY.toFixed(2)})`, showarrow: true, arrowhead: 4, ax: 0, ay: -40, bgcolor: annotationBgColor, borderpad: 4, bordercolor: 'transparent', borderradius: 4 },
                { x: minX_val, y: minY, text: `Min: (${minX_val.toFixed(2)}, ${minY.toFixed(2)})`, showarrow: true, arrowhead: 4, ax: 0, ay: 40, bgcolor: annotationBgColor, borderpad: 4, bordercolor: 'transparent', borderradius: 4 }
            ];
            Plotly.newPlot('funcPlot', [trace], layout, ui.plotlyConfig);
        } catch (e) {
            Plotly.purge('funcPlot');
            if (e instanceof utils.ValidationError) {
                ui.showError(e.message, 'funcOut');
            } else {
                ui.showError(`นิพจน์ไม่ถูกต้อง: ${e.message}`, 'funcOut');
            }
        }
    });

    document.getElementById('addCorrVar').addEventListener('click', () => {
        const container = document.getElementById('corr-vars-container');
        const groupCount = container.children.length + 1;
        const newGroupDiv = document.createElement('div');
        newGroupDiv.className = 'corr-var-group';
        newGroupDiv.innerHTML = `
            <label>ชื่อตัวแปรที่ ${groupCount}</label>
            <input type="text" class="corr-var-name" value="Var${groupCount}">
            <label>ข้อมูล (คั่นด้วยคอมมา/ช่องว่าง)</label>
            <textarea class="corr-var-data" placeholder="..."></textarea>
        `;
        container.appendChild(newGroupDiv);
        ui.updateCorrVarButtons();
    });

    document.getElementById('removeCorrVar').addEventListener('click', () => {
        const container = document.getElementById('corr-vars-container');
        if (container.children.length > 2) {
            container.removeChild(container.lastElementChild);
            ui.updateCorrVarButtons();
        }
    });

    document.getElementById('calcCorrMatrix').addEventListener('click', () => {
        try {
            Plotly.purge('corrPlot'); // Clear previous plot
            const alpha = parseFloat(document.getElementById('corr_alpha').value);
            if (isNaN(alpha) || alpha <= 0 || alpha >= 1) {
                throw new utils.ValidationError('Alpha (α) ต้องเป็นค่าระหว่าง 0 และ 1');
            }

            const varGroups = document.querySelectorAll('.corr-var-group');
            const headerLine = Array.from(varGroups).map(group => group.querySelector('.corr-var-name').value.trim() || 'Untitled');
            const columns = Array.from(varGroups).map(group => utils.parseNums(group.querySelector('.corr-var-data').value));

            if (columns.length < 2) {
                throw new utils.ValidationError('ต้องมีตัวแปรอย่างน้อย 2 ตัวเพื่อคำนวณสหสัมพันธ์');
            }
            if (columns.some(col => col.length === 0)) {
                throw new utils.ValidationError('กรุณากรอกข้อมูลสำหรับทุกตัวแปร');
            }
            const n = columns[0].length;
            if (columns.some(col => col.length !== n)) {
                throw new utils.ValidationError('ตัวแปรทุกตัวต้องมีจำนวนข้อมูลเท่ากัน');
            }
            if (n < 3) {
                throw new utils.ValidationError('ต้องมีข้อมูลอย่างน้อย 3 แถวเพื่อทำการทดสอบสมมติฐาน');
            }
            const numCols = headerLine.length;

            // Calculate correlation and p-value matrices
            const corrMatrix = Array(numCols).fill(0).map(() => Array(numCols).fill(0));
            const pValueMatrix = Array(numCols).fill(0).map(() => Array(numCols).fill(0));
            const df = n - 2;

            for (let i = 0; i < numCols; i++) {
                for (let j = i; j < numCols; j++) {
                    if (i === j) {
                        corrMatrix[i][j] = 1.0;
                        pValueMatrix[i][j] = 0.0;
                    } else {
                        const cov = columns[i].reduce((sum, x, k) => sum + (x - utils.mean(columns[i])) * (columns[j][k] - utils.mean(columns[j])), 0) / n;
                        const r = cov / (utils.stddev(columns[i]) * utils.stddev(columns[j]));
                        corrMatrix[i][j] = r;
                        corrMatrix[j][i] = r;

                        if (Math.abs(r) === 1.0) {
                            pValueMatrix[i][j] = 0.0;
                            pValueMatrix[j][i] = 0.0;
                        } else {
                            const t_stat = r * Math.sqrt(df / (1 - r**2));
                            const p_value = 2 * (1 - jStat.studentt.cdf(Math.abs(t_stat), df));
                            pValueMatrix[i][j] = p_value;
                            pValueMatrix[j][i] = p_value;
                        }
                    }
                }
            }

            // --- Generate Result Table ---
            let tableHtml = `<p><b>Correlation Matrix (P-values)</b></p><p style="font-size:12px; color:var(--muted);">ทดสอบสมมติฐาน H₀: ρ = 0 (ไม่มีความสัมพันธ์เชิงเส้น)</p><table class="steps-table"><thead><tr><th></th>`;
            headerLine.forEach(h => tableHtml += `<th>${h}</th>`);
            tableHtml += '</tr></thead><tbody>';
            corrMatrix.forEach((row, i) => {
                tableHtml += `<tr><td><b>${headerLine[i]}</b></td>`;
                row.forEach((val, j) => {
                    const p_val = pValueMatrix[i][j];
                    const isSignificant = p_val < alpha && i !== j;

                    // Color mapping: -1 (red) -> 0 (panel bg) -> +1 (blue)
                    const r = val > 0 ? 59 : 185; // blue vs red
                    const g = val > 0 ? 130 : 28;
                    const b = val > 0 ? 246 : 28;
                    const bgColor = `rgba(${r}, ${g}, ${b}, ${Math.abs(val) * 0.8})`;
                    const textColor = Math.abs(val) > 0.5 ? 'white' : 'var(--text)';

                    const style = `background-color: ${i === j ? 'transparent' : bgColor}; color: ${textColor};`;
                    
                    tableHtml += `<td style="${style}">
                        <div style="font-size: 1.1em; ${isSignificant ? 'font-weight: bold;' : ''}">${val.toFixed(4)}</div>
                        <div style="font-size: 11px; opacity: 0.8;">(p=${p_val.toFixed(4)})</div>
                    </td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += `</tbody></table><p style="font-size:12px; color:var(--muted);">* ค่าในวงเล็บคือ P-value. ค่าที่ <b>ตัวหนา</b> คือค่าที่มีนัยสำคัญทางสถิติที่ระดับ α = ${alpha}</p>`;

            // --- Generate Steps ---
            const x = columns[0];
            const y = columns[1];
            const mean_x = utils.mean(x);
            const mean_y = utils.mean(y);
            const r_xy = corrMatrix[0][1];
            const sum_x_dev_sq = x.reduce((sum, val) => sum + (val - mean_x)**2, 0);
            const sum_y_dev_sq = y.reduce((sum, val) => sum + (val - mean_y)**2, 0);
            const sum_xy_prod = x.reduce((sum, val, k) => sum + (val - mean_x) * (y[k] - mean_y), 0);
            
            const steps = `
                <b>1. การคำนวณค่าสหสัมพันธ์ของเพียร์สัน (Pearson Correlation, r)</b>
                <p>สูตร: $$ r = \\frac{\\sum(x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum(x_i - \\bar{x})^2 \\sum(y_i - \\bar{y})^2}} $$</p>
                <p><u>ตัวอย่างการคำนวณระหว่าง ${headerLine[0]} และ ${headerLine[1]}:</u></p>
                <ul>
                    <li>ค่าเฉลี่ยของ ${headerLine[0]} (x̄): ${mean_x.toFixed(4)}</li>
                    <li>ค่าเฉลี่ยของ ${headerLine[1]} (ȳ): ${mean_y.toFixed(4)}</li>
                    <li>ผลรวมของผลคูณค่าเบี่ยงเบน ( числитель / Numerator ): ${sum_xy_prod.toFixed(4)}</li>
                    <li>ผลรวมกำลังสองของค่าเบี่ยงเบนของ X (ใน الجذر / Denominator part 1): ${sum_x_dev_sq.toFixed(4)}</li>
                    <li>ผลรวมกำลังสองของค่าเบี่ยงเบนของ Y (ใน الجذر / Denominator part 2): ${sum_y_dev_sq.toFixed(4)}</li>
                </ul>
                <p>$$ r = \\frac{${sum_xy_prod.toFixed(4)}}{\\sqrt{${sum_x_dev_sq.toFixed(4)} \\times ${sum_y_dev_sq.toFixed(4)}}} = \\mathbf{${r_xy.toFixed(4)}} $$</p>
                <br>
                <b>2. การทดสอบนัยสำคัญ (P-value)</b>
                <p>คำนวณค่า t-statistic จากค่า r: $$ t = r \\sqrt{\\frac{n-2}{1-r^2}} $$</p>
                <p>จากนั้นนำค่า t ไปเปรียบเทียบกับการแจกแจงของ t (t-distribution) ที่มีองศาอิสระ (df) = n-2 = ${df} เพื่อหาค่า p-value (two-tailed).</p>
            `;

            // Use separate containers for the matrix table and the steps to control layout better
            ui.displayResult('corrOut', tableHtml);
            ui.displayResult('corrSteps', { steps: steps });

            // --- IMPROVED HEATMAP ---
            // Mask the upper triangle for a cleaner look
            const z_masked = corrMatrix.map((row, i) => row.map((val, j) => (j > i ? null : val)));
            const annotations = [];
            for (let i = 0; i < headerLine.length; i++) {
                for (let j = 0; j < i + 1; j++) { // Only loop through lower triangle
                    const currentValue = corrMatrix[i][j];
                    const isDarkBg = Math.abs(currentValue) > 0.5;
                    annotations.push({
                        xref: 'x1', yref: 'y1', x: headerLine[j], y: headerLine[i],
                        text: currentValue.toFixed(2),
                        font: { family: 'Arial, sans-serif', size: 12, color: isDarkBg ? 'white' : 'black' },
                        showarrow: false
                    });
                }
            }
            const layout = ui.getPlotlyLayout('Correlation Heatmap');
            layout.annotations = annotations;
            layout.yaxis.autorange = 'reversed';

            // Get border color from CSS to use as cell gaps, making the heatmap look like a grid.
            const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
            layout.plot_bgcolor = borderColor;

            const heatmap_data = [{
                z: z_masked, x: headerLine, y: headerLine, type: 'heatmap',
                colorscale: 'RdBu', reversescale: true, zmin: -1, zmax: 1,
                hoverongaps: false,
                xgap: 2, // Create cell borders
                ygap: 2,
                colorbar: { thickness: 15, len: 0.9, tickfont: { color: ui.getPlotlyLayout().font.color } }
            }];
            const plotContainer = document.getElementById('corrPlot');
            Plotly.newPlot(plotContainer, heatmap_data, layout, ui.plotlyConfig);
        } catch (e) {
            Plotly.purge('corrPlot'); // Clear plot on error
            // Clear both output areas on error
            document.getElementById('corrOut').innerHTML = '';
            document.getElementById('corrSteps').innerHTML = '';
            if (e instanceof utils.ValidationError) { ui.showError(e.message, 'corrOut'); }
            else { console.error('An unexpected error in Correlation Matrix:', e); ui.showError('เกิดข้อผิดพลาดที่ไม่คาดคิด', 'corrOut'); }
        }
    });

    document.getElementById('calcBino').addEventListener('click', () => {
        const n = parseInt(document.getElementById('bino_n').value);
        const p = parseFloat(document.getElementById('bino_p').value);
        const x = parseInt(document.getElementById('bino_x').value);

        if (isNaN(n) || isNaN(p) || isNaN(x)) {
            ui.showError('กรุณากรอกข้อมูล n, p, และ x ให้ครบถ้วน', 'binoOut'); return;
        }
        if (n <= 0 || !Number.isInteger(n) || x < 0 || !Number.isInteger(x) || x > n) {
            ui.showError('n ต้องเป็นจำนวนเต็มบวก, x ต้องเป็นจำนวนเต็มไม่ติดลบและไม่เกิน n', 'binoOut'); return;
        }
        if (p < 0 || p > 1) {
            ui.showError('p ต้องมีค่าระหว่าง 0 และ 1', 'binoOut'); return;
        }

        const prob = utils.combinations(n, x) * Math.pow(p, x) * Math.pow(1 - p, n - x);
        const meanVal = n * p;
        const varianceVal = n * p * (1 - p);
        const answerObj = {
            'P(X = x)': prob.toFixed(6),
            'ค่าคาดหวัง E(X)': meanVal.toFixed(4),
            'ความแปรปรวน Var(X)': varianceVal.toFixed(4)
        };
        const answer = JSON.stringify(answerObj, null, 2);
        const steps = `
            <p>P(X=x) = C(n,x) * pˣ * (1-p)ⁿ⁻ˣ</p>
            <p>P(X=${x}) = C(${n},${x}) * ${p}<sup>${x}</sup> * (1-${p})<sup>${n}-${x}</sup></p>
            <p>P(X=${x}) = ${utils.combinations(n,x)} * ${Math.pow(p,x).toFixed(4)} * ${Math.pow(1-p, n-x).toFixed(4)} = <b>${prob.toFixed(6)}</b></p>
            <br>
            <p>E(X) = n * p = ${n} * ${p} = <b>${meanVal.toFixed(4)}</b></p>
            <p>Var(X) = n * p * (1-p) = ${n} * ${p} * ${1-p} = <b>${varianceVal.toFixed(4)}</b></p>
        `;
        ui.displayResult('binoOut', { answer, steps });
    });

    document.getElementById('calcPoisson').addEventListener('click', () => {
        const lambda = parseFloat(document.getElementById('poisson_l').value);
        const x = parseInt(document.getElementById('poisson_x').value);

        if (isNaN(lambda) || isNaN(x)) {
            ui.showError('กรุณากรอกข้อมูล λ และ x ให้ครบถ้วน', 'poissonOut'); return;
        }
        if (lambda <= 0 || x < 0 || !Number.isInteger(x)) {
            ui.showError('λ ต้องเป็นค่าบวก, x ต้องเป็นจำนวนเต็มไม่ติดลบ', 'poissonOut'); return;
        }

        const fact_x = utils.factorial(x);
        if (fact_x === Infinity) {
            ui.showError('ค่า x ใหญ่เกินไป ไม่สามารถคำนวณ Factorial ได้', 'poissonOut'); return;
        }
        const prob = (Math.pow(lambda, x) * Math.exp(-lambda)) / fact_x;
        const answer = `P(X = ${x}) = ${prob.toFixed(6)}`;
        const steps = `
            <p>P(X=x) = (λˣ * e⁻ˡ) / x!</p>
            <p>P(X=${x}) = (${lambda}<sup>${x}</sup> * e<sup>-${lambda}</sup>) / ${x}!</p>
            <p>P(X=${x}) = (${Math.pow(lambda, x).toFixed(4)} * ${Math.exp(-lambda).toFixed(4)}) / ${fact_x}</p>
            <p>P(X=${x}) = <b>${prob.toFixed(6)}</b></p>`;
        ui.displayResult('poissonOut', { answer, steps });
    });

    // --- ECON TAB ---
    document.getElementById('calcEq').addEventListener('click', ()=>{
      const a= parseFloat(document.getElementById('ea').value);
      const b= parseFloat(document.getElementById('eb').value);
      const c= parseFloat(document.getElementById('ec').value);
      const d= parseFloat(document.getElementById('ed').value);
      const denom = b + d; if(denom===0){ ui.showError('พารามิเตอร์ไม่ถูกต้อง ทำให้ไม่สามารถหาจุดสมดุลได้ (b + d ต้องไม่เท่ากับ 0)', 'econOut'); return }
      const P_eq = (a - c)/denom;
      const Q_eq = a - b*P_eq;
      const answer = JSON.stringify({'ราคาดุลยภาพ (P*)':P_eq.toFixed(4),'ปริมาณดุลยภาพ (Q*)':Q_eq.toFixed(4)},null,2);
      const steps = `
        <p>ตั้งสมการ Qd = Qs</p>
        <p>${a} - ${b}P = ${c} + ${d}P</p>
        <p>${a-c} = ${b+d}P</p>
        <p>P* = ${a-c} / ${b+d} = <b>${P_eq.toFixed(4)}</b></p>
        <p>Q* = ${a} - ${b}(${P_eq.toFixed(4)}) = <b>${Q_eq.toFixed(4)}</b></p>`;
      ui.displayResult('econOut', { answer, steps });
    });

    document.getElementById('calcElas').addEventListener('click', ()=>{
        const a = parseFloat(document.getElementById('ea').value);
      const b = parseFloat(document.getElementById('eb').value);
      const P = parseFloat(document.getElementById('elasP').value);
      const Q = a - b*P; if(Q===0){ ui.showError('ที่ราคานี้ ปริมาณ (Q) เท่ากับ 0 ทำให้ไม่สามารถคำนวณความยืดหยุ่นได้', 'econOut'); return }
      const elas = (-b) * (P / Q);
      const answer = `ความยืดหยุ่นของอุปสงค์ (Ed) = ${elas.toFixed(4)}`;
      const steps = `
        <p>Ed = (dQ/dP) * (P/Q)</p>
        <p>จาก Qd = ${a} - ${b}P, dQ/dP คือ -b = ${-b}</p>
        <p>ที่ P = ${P}, Q = ${a} - ${b}(${P}) = ${Q}</p>
        <p>Ed = ${-b} * (${P} / ${Q}) = <b>${elas.toFixed(4)}</b></p>`;
      ui.displayResult('econOut', { answer, steps });
    });

    document.getElementById('calcBE').addEventListener('click', ()=>{
        const fc = parseFloat(document.getElementById('fc').value);
      const vc = parseFloat(document.getElementById('vc').value);
      const ppu = parseFloat(document.getElementById('ppu').value);
      const margin = ppu - vc; if(margin<=0){ ui.showError('ราคาต่อหน่วย (Price per Unit) ต้องมากกว่าต้นทุนผันแปร (Variable Cost)', 'beOut'); return }
      const units = fc / margin; 
      const answer = `จุดคุ้มทุน (หน่วย) = ${units.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}`;
      const steps = `
        <p>BE (Units) = Fixed Costs / (Price per Unit - Variable Cost per Unit)</p>
        <p>BE (Units) = ${fc.toLocaleString()} / (${ppu.toLocaleString()} - ${vc.toLocaleString()})</p>
        <p>BE (Units) = ${fc.toLocaleString()} / ${margin.toLocaleString()}</p>
        <p><b>BE (Units) = ${answer.split('= ')[1]}</b></p>
    `;
      ui.displayResult('beOut', { answer, steps });
    });
    document.getElementById('plotDS').addEventListener('click', ()=>{
      const a= parseFloat(document.getElementById('ea').value);
      const b= parseFloat(document.getElementById('eb').value);
      const c= parseFloat(document.getElementById('ec').value);
      const d= parseFloat(document.getElementById('ed').value);
      if (b + d === 0) {
        ui.showError('ไม่สามารถสร้างกราฟได้ เนื่องจาก b + d ต้องไม่เท่ากับ 0', 'dsPlot'); return;
      }
      const P_eq = (a - c)/(b + d);
      const Pmax = Math.max(P_eq*1.6, 50);
      const P = Array.from({length:100}, (_,i)=>i*(Pmax/99));
      const Qd = P.map(p=>a - b*p);
      const Qs = P.map(p=>c + d*p);
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const traces = [ 
          {x:P, y:Qd, mode:'lines', name:'อุปสงค์ (Qd)', line: { color: accentColor, width: 3 }}, 
          {x:P, y:Qs, mode:'lines', name:'อุปทาน (Qs)', line: { color: '#3b82f6', width: 3 }}, // Blue for supply
          {x:[P_eq], y:[a - b*P_eq], mode:'markers', name:'จุดดุลยภาพ', 
              marker:{color: '#f59e0b', size:12, symbol: 'star', line: { color: '#fff', width: 1}} // Yellow star
          } 
      ];
      const plotContainer = document.getElementById('dsPlot');
      const layout = ui.getPlotlyLayout('กราฟอุปสงค์และอุปทาน', 'ปริมาณ (Q)', 'ราคา (P)');
      Plotly.newPlot(plotContainer, traces, layout, ui.plotlyConfig);
    });

    document.getElementById('calcEOQ').addEventListener('click', () => {
      const D = parseFloat(document.getElementById('eoq_d').value);
      const S = parseFloat(document.getElementById('eoq_s').value);
      const H = parseFloat(document.getElementById('eoq_h').value);

      if (isNaN(D) || isNaN(S) || isNaN(H)) {
          ui.showError('กรุณากรอกข้อมูล Demand, Ordering Cost, และ Holding Cost ให้ครบถ้วน', 'eoqOut');
          return;
      }
      if (D <= 0 || S <= 0 || H <= 0) {
          ui.showError('ค่า D, S, และ H ต้องเป็นค่าบวก', 'eoqOut');
          return;
      }
      const eoq = Math.sqrt((2 * D * S) / H);
      const answer = `ปริมาณสั่งซื้อที่ประหยัดที่สุด (EOQ): ${eoq.toFixed(4)}`;
      const steps = `
        <p>EOQ = √((2 * D * S) / H)</p>
        <p>EOQ = √((2 * ${D} * ${S}) / ${H})</p>
        <p>EOQ = <b>${eoq.toFixed(4)}</b></p>`;
      ui.displayResult('eoqOut', { answer, steps });
    });

    // --- ALGEBRA TAB ---
    document.getElementById('calcLinEq').addEventListener('click', () => {
        const a = parseFloat(document.getElementById('lin_a').value);
        const b = parseFloat(document.getElementById('lin_b').value);
        const c = parseFloat(document.getElementById('lin_c').value);
        if (isNaN(a) || isNaN(b) || isNaN(c)) {
            ui.showError('กรุณากรอกค่า a, b, และ c ให้ครบถ้วน', 'linEqOut');
            return;
        }
        if (a === 0) {
            if (c - b === 0) {
                ui.displayResult('linEqOut', 'สมการเป็นจริงสำหรับทุกค่า x (0 = 0)');
            } else {
                ui.displayResult('linEqOut', 'สมการไม่มีคำตอบ (ขัดแย้ง)');
            }
            return;
        }
        const x = (c - b) / a;
        const answer = `ผลลัพธ์:\nx = ${x.toFixed(4)}`;
        const steps = `
            <p>${a}x + ${b} = ${c}</p>
            <p>${a}x = ${c} - ${b}</p>
            <p>x = ${c-b} / ${a} = <b>${x.toFixed(4)}</b></p>`;
        ui.displayResult('linEqOut', { answer, steps });
    });

    document.getElementById('calcQuadEq').addEventListener('click', () => {
        const a = parseFloat(document.getElementById('quad_a').value);
        const b = parseFloat(document.getElementById('quad_b').value);
        const c = parseFloat(document.getElementById('quad_c').value);
        if (isNaN(a) || isNaN(b) || isNaN(c)) {
            ui.showError('กรุณากรอกค่า a, b, และ c ให้ครบถ้วน', 'quadEqOut');
            return;
        }
        if (a === 0) {
            ui.showError('นี่คือสมการเชิงเส้น ไม่ใช่สมการกำลังสอง (a ต้องไม่เท่ากับ 0)', 'quadEqOut');
            return;
        }

        const delta = b * b - 4 * a * c;
        const vertex_x = -b / (2 * a);
        const vertex_y = a * vertex_x**2 + b * vertex_x + c;
        let steps = `<p>จาก ax² + bx + c = 0</p><p>a=${a}, b=${b}, c=${c}</p><br>
        <b>1. หาจุดยอด (Vertex):</b>
        <p>สูตร: x = -b / 2a</p>
        <p>x = -(${b}) / (2 * ${a}) = <b>${vertex_x.toFixed(4)}</b></p>
        <p>แทนค่า x ในสมการเพื่อหา y:</p>
        <p>y = ${a}(${vertex_x.toFixed(4)})² + ${b}(${vertex_x.toFixed(4)}) + ${c} = <b>${vertex_y.toFixed(4)}</b></p>
        <br>
        <b>2. หาคำตอบของสมการ (Roots):</b>
        <p>ใช้สูตร: x = [-b ± √(b²-4ac)] / 2a</p>`;
        let result = {
            'รูปแบบสมการ': `${a}x² + ${b}x + ${c} = 0`,
            'จุดยอด (Vertex)': `(${vertex_x.toFixed(4)}, ${vertex_y.toFixed(4)})`,
            'ประเภทจุดยอด': a > 0 ? 'จุดต่ำสุด' : 'จุดสูงสุด',
            'คำตอบ (Roots)': ''
        };

        steps += `<p>คำนวณค่า Discriminant (Δ = b²-4ac):</p>`;
        steps += `<p>Δ = (${b})² - 4(${a})(${c}) = ${delta}</p>`;

        if (delta > 0) {
            const x1 = (-b + Math.sqrt(delta)) / (2 * a);
            const x2 = (-b - Math.sqrt(delta)) / (2 * a);
            result['คำตอบ (Roots)'] = `มี 2 คำตอบจริง: x1 = ${x1.toFixed(4)}, x2 = ${x2.toFixed(4)}`;
            steps += `<p>x1 = [${-b} + √${delta}] / 2(${a}) = <b>${x1.toFixed(4)}</b></p>`;
            steps += `<p>x2 = [${-b} - √${delta}] / 2(${a}) = <b>${x2.toFixed(4)}</b></p>`;
        } else if (delta === 0) {
            const x1 = -b / (2 * a);
            result['คำตอบ (Roots)'] = `มี 1 คำตอบจริง: x = ${x1.toFixed(4)}`;
            steps += `<p>x = ${-b} / 2(${a}) = <b>${x1.toFixed(4)}</b></p>`;
        } else { // delta < 0
            const realPart = (-b / (2 * a)).toFixed(4);
            const imagPart = (Math.sqrt(-delta) / (2 * a)).toFixed(4);
            result['คำตอบ (Roots)'] = `มี 2 คำตอบเชิงซ้อน: ${realPart} ± ${imagPart}i`;
            steps += `<p>เนื่องจาก delta < 0, คำตอบเป็นจำนวนเชิงซ้อน</p><p>x = [${-b} ± √${delta}] / 2(${a}) = <b>${realPart} ± ${imagPart}i</b></p>`;
        }
        const answer = JSON.stringify(result, null, 2);
        ui.displayResult('quadEqOut', { answer, steps });
    });

    document.getElementById('calcPow').addEventListener('click', () => {
        const base = parseFloat(document.getElementById('pow_base').value);
        const exp = parseFloat(document.getElementById('pow_exp').value);
        if (isNaN(base) || isNaN(exp)) {
            ui.showError('กรุณากรอกค่าฐานและเลขชี้กำลัง', 'powOut');
            return;
        }
        const result = Math.pow(base, exp);
        if (isNaN(result) || !isFinite(result)) {
            ui.showError('ไม่สามารถคำนวณได้ (อาจเกิดจาก 0^0 หรือกรณีอื่นๆ)', 'powOut');
            return;
        }
        const answer = `${base} ^ ${exp} = ${result}`;
        const steps = `<p>คำนวณ ${base} คูณกัน ${exp} ครั้ง.</p>`;
        ui.displayResult('powOut', { answer, steps });
    });

    document.getElementById('calcLog').addEventListener('click', () => {
        const base = parseFloat(document.getElementById('log_base').value);
        const num = parseFloat(document.getElementById('log_num').value);
        if (isNaN(base) || isNaN(num)) {
            ui.showError('กรุณากรอกค่าฐานและตัวเลข', 'logOut');
            return;
        }
        if (num <= 0 || base <= 0) {
            ui.showError('ค่าฐานและตัวเลขในลอการิทึมต้องเป็นค่าบวก', 'logOut');
            return;
        }
        if (base === 1) {
            ui.showError('ฐานของลอการิทึมต้องไม่เท่ากับ 1', 'logOut');
            return;
        }
        const result = Math.log(num) / Math.log(base);
        const answer = `log${base}(${num}) = ${result.toFixed(6)}`;
        const steps = `<p>logₐ(b) = log(b) / log(a)</p>
        <p>log${base}(${num}) = log(${num}) / log(${base})</p>
        <p>log${base}(${num}) = ${Math.log(num).toFixed(4)} / ${Math.log(base).toFixed(4)} = <b>${result.toFixed(6)}</b></p>`;
        ui.displayResult('logOut', { answer, steps });
    });

    document.getElementById('calcArith').addEventListener('click', () => {
        const a1 = parseFloat(document.getElementById('arith_a1').value);
        const d = parseFloat(document.getElementById('arith_d').value);
        const n = parseInt(document.getElementById('arith_n').value);
        if (isNaN(a1) || isNaN(d) || isNaN(n)) {
            ui.showError('กรุณากรอกข้อมูล a₁, d, และ n ให้ครบถ้วน', 'arithOut'); return;
        }
        if (n <= 0 || !Number.isInteger(n)) {
            ui.showError('จำนวนพจน์ (n) ต้องเป็นจำนวนเต็มบวก', 'arithOut'); return;
        }
        const sum = (n / 2) * (2 * a1 + (n - 1) * d);
        const answer = `ผลบวก ${n} พจน์แรก (Sₙ) = ${sum.toLocaleString()}`;
        const steps = `
            <p>Sₙ = n/2 * (2a₁ + (n-1)d)</p>
            <p>Sₙ = ${n}/2 * (2*${a1} + (${n}-1)*${d})</p>
            <p>Sₙ = ${n/2} * (${2*a1} + ${n-1}*${d}) = <b>${sum.toLocaleString()}</b></p>`;
        ui.displayResult('arithOut', { answer, steps });
    });

    document.getElementById('calcGeo').addEventListener('click', () => {
        const a1 = parseFloat(document.getElementById('geo_a1').value);
        const r = parseFloat(document.getElementById('geo_r').value);
        const n = parseInt(document.getElementById('geo_n').value);
        if (isNaN(a1) || isNaN(r) || isNaN(n)) {
            ui.showError('กรุณากรอกข้อมูล a₁, r, และ n ให้ครบถ้วน', 'geoOut'); return;
        }
        if (n <= 0 || !Number.isInteger(n)) {
            ui.showError('จำนวนพจน์ (n) ต้องเป็นจำนวนเต็มบวก', 'geoOut'); return;
        }

        let sum; let steps;
        if (r === 1) {
            sum = a1 * n;
            steps = `<p>เมื่อ r=1, Sₙ = a₁ * n</p><p>Sₙ = ${a1} * ${n} = <b>${sum.toLocaleString()}</b></p>`;
        } else {
            sum = a1 * (1 - Math.pow(r, n)) / (1 - r);
            steps = `
                <p>Sₙ = a₁(1-rⁿ)/(1-r)</p>
                <p>Sₙ = ${a1}(1-${r}<sup>${n}</sup>)/(1-${r})</p>
                <p>Sₙ = ${a1}(${1 - Math.pow(r,n)})/(${1-r}) = <b>${sum.toLocaleString()}</b></p>`;
        }

        if (isNaN(sum) || !isFinite(sum)) {
            ui.showError('ไม่สามารถคำนวณได้ ผลลัพธ์มีขนาดใหญ่เกินไป', 'geoOut'); return;
        }
        const answer = `ผลบวก ${n} พจน์แรก (Sₙ) = ${sum.toLocaleString()}`;
        ui.displayResult('geoOut', { answer, steps });
    });

    // --- FINANCE TAB ---
    document.getElementById('calcPerc1').addEventListener('click', () => {
        const p = parseFloat(document.getElementById('perc1_p').value);
        const val = parseFloat(document.getElementById('perc1_val').value);
        if (isNaN(p) || isNaN(val)) {
            ui.showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'perc1Out'); return;
        }
        const result = (p / 100) * val;
        const answer = `ผลลัพธ์: ${result.toLocaleString()}`;
        const steps = `<p>(${p} / 100) * ${val} = <b>${result.toLocaleString()}</b></p>`;
        ui.displayResult('perc1Out', { answer, steps });
    });

    document.getElementById('calcPerc2').addEventListener('click', () => {
        const part = parseFloat(document.getElementById('perc2_part').value);
        const total = parseFloat(document.getElementById('perc2_total').value);
        if (isNaN(part) || isNaN(total)) {
            ui.showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'perc2Out'); return;
        }
        if (total === 0) {
            ui.showError('ตัวหาร (ค่าทั้งหมด) ต้องไม่เป็น 0', 'perc2Out'); return;
        }
        const result = (part / total) * 100;
        const answer = `ผลลัพธ์: ${result.toFixed(4)} %`;
        const steps = `<p>(${part} / ${total}) * 100 = <b>${result.toFixed(4)} %</b></p>`;
        ui.displayResult('perc2Out', { answer, steps });
    });

    document.getElementById('calcRatio').addEventListener('click', () => {
        const a = parseInt(document.getElementById('ratio_a').value);
        const b = parseInt(document.getElementById('ratio_b').value);
        if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
            ui.showError('กรุณากรอกตัวเลขจำนวนเต็มบวกสำหรับอัตราส่วน', 'ratioOut'); return;
        }
        if (a === 0 && b === 0) {
            ui.displayResult('ratioOut', '0 : 0'); return;
        }
        const commonDivisor = utils.gcd(a, b);
        const answer = `อัตราส่วนอย่างต่ำ: ${a / commonDivisor} : ${b / commonDivisor}`;
        const steps = `<p>หา ห.ร.ม. ของ ${a} และ ${b} คือ ${commonDivisor}</p><p>(${a} / ${commonDivisor}) : (${b} / ${commonDivisor}) = <b>${a / commonDivisor} : ${b / commonDivisor}</b></p>`;
        ui.displayResult('ratioOut', { answer, steps });
    });

    document.getElementById('calcSI').addEventListener('click', () => {
        const P = parseFloat(document.getElementById('si_p').value);
        const r_percent = parseFloat(document.getElementById('si_r').value);
        const t = parseFloat(document.getElementById('si_t').value);

        if (isNaN(P) || isNaN(r_percent) || isNaN(t)) {
            ui.showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'siOut'); return;
        }
        const r = r_percent / 100;
        if (P < 0 || r < 0 || t < 0) {
            ui.showError('กรุณากรอกค่าที่ไม่ติดลบ', 'siOut'); return;
        }

        const interest = P * r * t;
        const totalAmount = P + interest;
        const answerObj = {
            'ดอกเบี้ย (Interest)': interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'เงินรวม (Total Amount)': totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        };
        const answer = JSON.stringify(answerObj, null, 2);
        const steps = `
            <p>สูตรดอกเบี้ย: I = P * r * t</p>
            <p>I = ${P.toLocaleString()} * ${r} * ${t}</p>
            <p>I = <b>${answerObj['ดอกเบี้ย (Interest)']}</b></p>
            <br>
            <p>สูตรเงินรวม: A = P + I</p>
            <p>A = ${P.toLocaleString()} + ${answerObj['ดอกเบี้ย (Interest)']}</p>
            <p>A = <b>${answerObj['เงินรวม (Total Amount)']}</b></p>
        `;
        ui.displayResult('siOut', { answer, steps });
    });

    document.getElementById('calcFV').addEventListener('click', () => {
        const P = parseFloat(document.getElementById('fv_p').value);
        const r_percent = parseFloat(document.getElementById('fv_r').value);
        const n = parseFloat(document.getElementById('fv_n').value);
        const t = parseFloat(document.getElementById('fv_t').value);

        if (isNaN(P) || isNaN(r_percent) || isNaN(n) || isNaN(t)) {
            ui.showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'fvOut'); return;
        }
        if (P < 0 || r_percent < 0 || n <= 0 || t < 0) {
            ui.showError('กรุณากรอกค่าที่ไม่ติดลบ (n ต้องมากกว่า 0)', 'fvOut'); return;
        }

        const r = r_percent / 100;
        const nt = n * t;
        const r_div_n = r / n;
        const base = 1 + r_div_n;
        const A = P * Math.pow(base, nt);
        const totalInterest = A - P;

        const answerObj = {
            'มูลค่าในอนาคต (Future Value)': A.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'ดอกเบี้ยทั้งหมด (Total Interest)': totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        };
        const answer = JSON.stringify(answerObj, null, 2);
        const steps = `
            <b>สูตรมูลค่าอนาคต:</b> $$ FV = P \\left(1 + \\frac{r}{n}\\right)^{nt} $$
            <p>$$ FV = ${P.toLocaleString()} \\times \\left(1 + \\frac{${r}}{${n}}\\right)^{${n} \\times ${t}} $$</p>
            <p>$$ FV = ${P.toLocaleString()} \\times (${(1 + r / n).toFixed(6)})^{${n*t}} $$</p>
            <p>$$ \\mathbf{FV = ${answerObj['มูลค่าในอนาคต (Future Value)']}} $$</p>
            <br>
            <b>สูตรดอกเบี้ยทั้งหมด:</b> $$ I = FV - P $$
            <p>$$ I = ${answerObj['มูลค่าในอนาคต (Future Value)']} - ${P.toLocaleString()} $$</p>
            <p>$$ \\mathbf{I = ${answerObj['ดอกเบี้ยทั้งหมด (Total Interest)']}} $$</p>
        `;
        ui.displayResult('fvOut', { answer, steps });
    });

    document.getElementById('calcPV').addEventListener('click', () => {
        const FV = parseFloat(document.getElementById('pv_fv').value);
        const r_percent = parseFloat(document.getElementById('pv_r').value);
        const n = parseFloat(document.getElementById('pv_n').value);
        const t = parseFloat(document.getElementById('pv_t').value);

        if (isNaN(FV) || isNaN(r_percent) || isNaN(n) || isNaN(t)) {
            ui.showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'pvOut'); return;
        }
        const r = r_percent / 100;
        if (FV < 0 || r_percent < 0 || n <= 0 || t < 0) {
            ui.showError('กรุณากรอกค่าที่ไม่ติดลบ (n ต้องมากกว่า 0)', 'pvOut'); return;
        }

        const PV = FV / Math.pow((1 + r / n), n * t);

        const answerObj = {
            'มูลค่าปัจจุบันที่ต้องใช้ (Present Value)': PV.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        };
        const answer = JSON.stringify(answerObj, null, 2);
        const steps = `
            <p>สูตรมูลค่าปัจจุบัน: PV = FV / (1 + r/n)<sup>(n*t)</sup></p>
            <p>PV = ${FV.toLocaleString()} / (1 + ${r}/${n})<sup>(${n}*${t})</sup></p>
            <p><b>PV = ${answerObj['มูลค่าปัจจุบันที่ต้องใช้ (Present Value)']}</b></p>`;
        ui.displayResult('pvOut', { answer, steps });
    });

    document.getElementById('calcLoan').addEventListener('click', () => {
        const P = parseFloat(document.getElementById('loan_p').value);
        const annualRate = parseFloat(document.getElementById('loan_r').value);
        const t = parseFloat(document.getElementById('loan_t').value);
        const nPerYear = parseFloat(document.getElementById('loan_n').value);

        if (isNaN(P) || isNaN(annualRate) || isNaN(t) || isNaN(nPerYear)) {
            ui.showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'loanOut'); return;
        }
        if (P <= 0 || annualRate < 0 || t <= 0 || nPerYear <= 0) {
            ui.showError('กรุณากรอกค่าที่เป็นบวก (ยกเว้นดอกเบี้ย) และมากกว่า 0', 'loanOut'); return;
        }

        const r = annualRate / 100 / nPerYear;
        const n = t * nPerYear;
        let pmt;
        let numerator, denominator;

        if (r === 0) { // No interest
            pmt = P / n;
        } else {
            numerator = r * Math.pow(1 + r, n);
            denominator = Math.pow(1 + r, n) - 1;
            pmt = P * (numerator / denominator);
        }
        
        const totalPayment = pmt * n;
        const totalInterest = totalPayment - P;

        const answerObj = {
            'ค่างวด (Payment)': pmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'ยอดชำระทั้งหมด': totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'ดอกเบี้ยทั้งหมด': totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        };
        const answer = JSON.stringify(answerObj, null, 2);
        const steps = `
            <p><b>1. เตรียมตัวแปร:</b></p>
            <p>P (เงินต้น) = ${P.toLocaleString()}</p>
            <p>r (อัตราดอกเบี้ยต่องวด) = ${annualRate}% / ${nPerYear} = ${r.toFixed(8)}</p>
            <p>n (จำนวนงวดทั้งหมด) = ${t} ปี * ${nPerYear} = ${n}</p>
            <br>
            <p><b>2. คำนวณค่างวด (PMT):</b></p>
            <p>สูตรค่างวด: PMT = P * [r(1+r)ⁿ] / [(1+r)ⁿ - 1]</p>
            ${r > 0 ? `
            <p>คำนวณตัวเศษของเศษส่วน: r(1+r)ⁿ = ${r.toFixed(8)} * (1+${r.toFixed(8)})<sup>${n}</sup> = ${numerator.toFixed(8)}</p>
            <p>คำนวณตัวส่วนของเศษส่วน: (1+r)ⁿ - 1 = (1+${r.toFixed(8)})<sup>${n}</sup> - 1 = ${denominator.toFixed(8)}</p>
            <p>แทนค่า: PMT = ${P.toLocaleString()} * (${numerator.toFixed(8)} / ${denominator.toFixed(8)})</p>
            ` : ''}
            <p><b>PMT = ${pmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></p>
            <br>
            <p><b>3. คำนวณยอดรวม:</b></p>
            <p>ยอดชำระทั้งหมด = PMT * n = ${pmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} * ${n} = <b>${totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></p>
            <p>ดอกเบี้ยทั้งหมด = ยอดชำระทั้งหมด - P = ${totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - ${P.toLocaleString()} = <b>${totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></p>
        `;
        ui.displayResult('loanOut', { answer, steps });
    });

    // --- NPV UI Builder ---
    const npvCfContainer = document.getElementById('npv-cashflows-container');
    let npvCfCount = 5; // Initial number of cash flow inputs (0 to 4)

    document.getElementById('addNpvCf').addEventListener('click', () => {
        npvCfCount++;
        ui.buildNpvInputs(npvCfCount);
        // Focus the last added input
        const lastInput = document.getElementById(`npv_cf_${npvCfCount - 1}`);
        if (lastInput) {
            lastInput.focus();
            lastInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    document.getElementById('removeNpvCf').addEventListener('click', () => {
        if (npvCfCount > 2) {
            npvCfCount--;
            ui.buildNpvInputs(npvCfCount);
        }
    });


    document.getElementById('calcNPV').addEventListener('click', () => {
      const rate = parseFloat(document.getElementById('npv_rate').value) / 100;
      const cashFlowInputs = document.querySelectorAll('.npv-cf-input');
      const cashFlows = Array.from(cashFlowInputs).map(input => parseFloat(input.value));
      if (isNaN(rate) || cashFlows.length === 0) {
          ui.showError('กรุณากรอกข้อมูล Discount Rate และ Cash Flows ให้ครบถ้วน', 'npvOut');
          return;
      }
      if (rate < -1) { // Rate can be negative, but not <= -100%
          ui.showError('Discount Rate ต้องมากกว่าหรือเท่ากับ -100%', 'npvOut');
          return;
      }
      if (cashFlows.some(isNaN)) {
        ui.showError('กรุณากรอกข้อมูลกระแสเงินสดให้ครบทุกช่องและเป็นตัวเลข', 'npvOut');
        return;
      }
      if (cashFlows[0] > 0) {
        ui.showError('เงินลงทุนปีที่ 0 (CF₀) ควรเป็นค่าลบเพื่อการวิเคราะห์ที่สมบูรณ์', 'npvOut');
        return;
      }

      // --- NPV Calculation ---
      let npv = 0;
      const pv_terms = [];
      cashFlows.forEach((cf, index) => {
          const pv = cf / Math.pow(1 + rate, index);
          pv_terms.push(pv);
          npv += pv;
      });

      // --- IRR Calculation ---
      const irr = utils.solveIRR(cashFlows);
      const irr_string = irr === null ? 'คำนวณไม่ได้' : `${(irr * 100).toFixed(2)}%`;

      // --- Profitability Index (PI) Calculation ---
      const initialInvestment = -cashFlows[0];
      let pi_string = 'N/A (เงินลงทุนต้องเป็นบวก)';
      if (initialInvestment > 0) {
          const pvOfFutureCFs = npv + initialInvestment;
          const pi = pvOfFutureCFs / initialInvestment;
          pi_string = pi.toFixed(4);
      }

      // --- Discounted Payback Period Calculation ---
      let discountedPaybackPeriod = 'ไม่คุ้มทุนภายในระยะเวลาโครงการ';
      let cumulativeDiscountedCF = 0;
      let paybackSteps = [];
      let paybackFound = false;
      for (let t = 0; t < cashFlows.length; t++) {
          const discountedCF = cashFlows[t] / Math.pow(1 + rate, t);
          const prevCumulative = cumulativeDiscountedCF;
          cumulativeDiscountedCF += discountedCF;
          paybackSteps.push(`<tr><td>${t}</td><td>${cashFlows[t].toLocaleString()}</td><td>${discountedCF.toFixed(2)}</td><td>${cumulativeDiscountedCF.toFixed(2)}</td></tr>`);

          if (cumulativeDiscountedCF >= 0 && !paybackFound) {
              paybackFound = true;
              const unrecoveredAmount = -prevCumulative;
              const payback = t - 1 + (unrecoveredAmount / discountedCF);
              discountedPaybackPeriod = `${payback.toFixed(2)} ปี`;
          }
      }

      const answerObj = {
          'มูลค่าปัจจุบันสุทธิ (NPV)': `${npv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          'อัตราผลตอบแทนภายใน (IRR)': irr_string,
          'ดัชนีความสามารถในการทำกำไร (PI)': pi_string,
          'ระยะเวลาคืนทุนคิดลด (Discounted Payback)': discountedPaybackPeriod,
          'สรุป': npv > 0 ? 'ควรยอมรับโครงการ (Accept)' : 'ควรปฏิเสธโครงการ (Reject)'
      };
      const answer = JSON.stringify(answerObj, null, 2);

      const steps = `
        <b>1. มูลค่าปัจจุบันสุทธิ (Net Present Value - NPV)</b>
        <p>คำนวณมูลค่าปัจจุบัน (PV) ของกระแสเงินสดแต่ละงวดแล้วนำมารวมกัน</p>
        <p>สูตร: $$ NPV = \\sum_{t=0}^{n} \\frac{CF_t}{(1+r)^t} $$</p>
        <table class="steps-table">
            <thead><tr><th>ปี (t)</th><th>CFₜ</th><th>PV ของ CFₜ</th></tr></thead>
            <tbody>
            ${cashFlows.map((cf, t) => `<tr><td>${t}</td><td>${cf.toLocaleString()}</td><td>${pv_terms[t].toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>`).join('')}
            </tbody>
            <tfoot><tr><td colspan="2"><b>ผลรวม (NPV)</b></td><td><b>${npv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td></tr></tfoot>
        </table>
        <br>

        <b>2. อัตราผลตอบแทนภายใน (Internal Rate of Return - IRR)</b>
        <p>IRR คืออัตราคิดลด (r) ที่ทำให้ NPV ของโครงการเท่ากับ 0. คำนวณโดยใช้วิธีเชิงตัวเลข (Newton-Raphson)</p>
        <p><b>IRR = ${irr_string}</b></p>
        <br>

        <b>3. ดัชนีความสามารถในการทำกำไร (Profitability Index - PI)</b>
        <p>PI คืออัตราส่วนของมูลค่าปัจจุบันของกระแสเงินสดในอนาคตต่อเงินลงทุนเริ่มต้น</p>
        <p>สูตร: $$ PI = \\frac{\\text{PV of future cash flows}}{|\\text{Initial Investment}|} = \\frac{NPV - CF_0}{|CF_0|} $$</p>
        ${initialInvestment > 0 ? `<p>$$ PI = \\frac{${(npv + initialInvestment).toLocaleString(undefined, {minimumFractionDigits: 2})}}{${initialInvestment.toLocaleString()}} = \\mathbf{${pi_string}} $$</p>` : ''}
        <br>

        <b>4. ระยะเวลาคืนทุนคิดลด (Discounted Payback Period)</b>
        <p>คือระยะเวลาที่กระแสเงินสดคิดลดสะสมมีค่าเท่ากับเงินลงทุนเริ่มต้น</p>
        <table class="steps-table">
            <thead><tr><th>ปี (t)</th><th>CFₜ</th><th>Discounted CFₜ</th><th>Cumulative Discounted CF</th></tr></thead>
            <tbody>${paybackSteps.join('')}</tbody>
        </table>
        <p><b>ระยะเวลาคืนทุนคิดลด ≈ ${discountedPaybackPeriod}</b></p>
      `;
      ui.displayResult('npvOut', { answer, steps });
    });

    // --- IRR UI Builder ---
    const irrCfContainer = document.getElementById('irr-cashflows-container');
    let irrCfCount = 5; // Initial number of cash flow inputs (0 to 4)

    document.getElementById('addIrrCf').addEventListener('click', () => {
        irrCfCount++;
        ui.buildIrrInputs(irrCfCount);
        const lastInput = document.getElementById(`irr_cf_${irrCfCount - 1}`);
        if (lastInput) {
            lastInput.focus();
            lastInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    document.getElementById('removeIrrCf').addEventListener('click', () => {
        if (irrCfCount > 2) {
            irrCfCount--;
            ui.buildIrrInputs(irrCfCount);
        }
    });

    document.getElementById('calcIRR').addEventListener('click', () => {
        const cashFlowInputs = document.querySelectorAll('.irr-cf-input');
        const cashFlows = Array.from(cashFlowInputs).map(input => parseFloat(input.value));
        if (cashFlows.length < 2 || cashFlows[0] >= 0) {
            ui.showError('ต้องมีกระแสเงินสดอย่างน้อย 2 ค่า และค่าแรก (เงินลงทุน) ต้องเป็นค่าลบ', 'irrOut');
            return;
        }

        const irr = utils.solveIRR(cashFlows);

        if (irr === null) {
            ui.showError('ไม่สามารถคำนวณ IRR ได้ อาจเป็นเพราะกระแสเงินสดไม่ปกติ หรือไม่สามารถหาคำตอบได้', 'irrOut');
        } else {
            const answer = `Internal Rate of Return (IRR): ${(irr * 100).toFixed(4)} %`;
            const steps = `
                <p>IRR คืออัตรา (r) ที่ทำให้ NPV = 0</p>
                <p>0 = Σ [CFₜ / (1+IRR)ᵗ]</p>
                <p>ใช้วิธีคำนวณเชิงตัวเลข (Newton-Raphson) เพื่อหาค่า IRR</p>`;
            ui.displayResult('irrOut', { answer, steps });
        }
    });

    // --- INFERENCE TAB ---
    document.getElementById('calcTTest').addEventListener('click', () => {
        try {
            const samp1 = utils.parseNums(document.getElementById('ttest_samp1').value);
            const samp2 = utils.parseNums(document.getElementById('ttest_samp2').value);

            if (samp1.length < 2 || samp2.length < 2) {
                throw new utils.ValidationError('แต่ละกลุ่มต้องมีข้อมูลอย่างน้อย 2 ค่า');
            }

            const n1 = samp1.length;
            const n2 = samp2.length;
            const mean1 = utils.mean(samp1);
            const mean2 = utils.mean(samp2);
            const var1 = utils.sampleVariance(samp1);
            const var2 = utils.sampleVariance(samp2);

            const t_stat = (mean1 - mean2) / Math.sqrt(var1 / n1 + var2 / n2);

            const df_num = Math.pow(var1 / n1 + var2 / n2, 2);
            const df_den = (Math.pow(var1 / n1, 2) / (n1 - 1)) + (Math.pow(var2 / n2, 2) / (n2 - 1));
            const df = df_num / df_den;
            const p_value = 2 * (1 - jStat.studentt.cdf(Math.abs(t_stat), df));

            const answerObj = {
                't-statistic': t_stat.toFixed(4),
                'Degrees of Freedom (df)': df.toFixed(4),
                'P-value (two-tailed)': p_value.toFixed(4),
                'คำแนะนำ': `โดยทั่วไป หาก p-value < 0.05 (ระดับนัยสำคัญ 5%) จะถือว่ามีนัยสำคัญทางสถิติและปฏิเสธสมมติฐานหลัก (H₀) ซึ่งหมายความว่าค่าเฉลี่ยของสองกลุ่มแตกต่างกันอย่างมีนัยสำคัญ`
            };
            const answer = JSON.stringify(answerObj, null, 2);
            const steps = `
                <p><b>1. คำนวณค่าสถิติพื้นฐานของแต่ละกลุ่ม:</b></p>
                <p><u>กลุ่มที่ 1:</u></p>
                <p>ขนาดตัวอย่าง (n₁): ${n1}</p>
                <p>ค่าเฉลี่ย (x̄₁): ${mean1.toFixed(4)}</p>
                <p>ความแปรปรวนของกลุ่มตัวอย่าง (s₁²): ${var1.toFixed(4)}</p>
                <p><u>กลุ่มที่ 2:</u></p>
                <p>ขนาดตัวอย่าง (n₂): ${n2}</p>
                <p>ค่าเฉลี่ย (x̄₂): ${mean2.toFixed(4)}</p>
                <p>ความแปรปรวนของกลุ่มตัวอย่าง (s₂²): ${var2.toFixed(4)}</p>
                <br>
                <p><b>2. คำนวณค่าสถิติทดสอบ (t-statistic):</b></p>
                <p>สูตร: t = (x̄₁ - x̄₂) / √(s₁²/n₁ + s₂²/n₂)</p>
                <p>t = (${mean1.toFixed(4)} - ${mean2.toFixed(4)}) / √(${var1.toFixed(4)}/${n1} + ${var2.toFixed(4)}/${n2})</p>
                <p><b>t = ${t_stat.toFixed(4)}</b></p>
                <br>
                <p><b>3. คำนวณองศาอิสระ (Degrees of Freedom):</b></p>
                <p>ใช้สูตรของ Welch-Satterthwaite:</p>
                <p>$$ df \\approx \\frac{(s_1^2/n_1 + s_2^2/n_2)^2}{\\frac{(s_1^2/n_1)^2}{n_1-1} + \\frac{(s_2^2/n_2)^2}{n_2-1}} $$</p>
                <p><b>df ≈ ${df.toFixed(4)}</b></p>
                <br><p><b>4. คำนวณ P-value (Two-tailed):</b></p>
                <p>P-value คือความน่าจะเป็นที่จะได้ค่า t-statistic ที่สุดโต่งเท่ากับหรือมากกว่าค่าที่สังเกตได้</p><p><b>P-value ≈ ${p_value.toFixed(4)}</b></p>
            `;
            ui.displayResult('ttestOut', { answer, steps });
        } catch (e) {
            if (e instanceof utils.ValidationError) {
                ui.showError(e.message, 'ttestOut');
            } else {
                console.error('An unexpected error occurred in t-Test:', e);
                ui.showError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาตรวจสอบ Console สำหรับข้อมูลเพิ่มเติม', 'ttestOut');
            }
        }
    });

    document.getElementById('calcChiSquare').addEventListener('click', () => {
        const obs = utils.parseNums(document.getElementById('chi_obs').value);
        const exp = utils.parseNums(document.getElementById('chi_exp').value);

        if (obs.length === 0 || exp.length === 0) {
            ui.showError('กรุณากรอกข้อมูลความถี่ที่สังเกตและคาดหวัง', 'chiOut'); return;
        }
        if (obs.length !== exp.length) {
            ui.showError('จำนวนกลุ่มของความถี่ที่สังเกตและคาดหวังต้องเท่ากัน', 'chiOut'); return;
        }
        if (exp.some(e => e <= 0)) {
            ui.showError('ความถี่ที่คาดหวังทุกค่าต้องเป็นบวก', 'chiOut'); return;
        }
        const sumObs = obs.reduce((a, b) => a + b, 0);
        const sumExp = exp.reduce((a, b) => a + b, 0);
        if (Math.abs(sumObs - sumExp) > 1e-6) {
            ui.showError(`ผลรวมความถี่ที่สังเกต (${sumObs}) ไม่เท่ากับผลรวมความถี่ที่คาดหวัง (${sumExp})`, 'chiOut');
        }

        let chi2_stat = 0;
        const terms = [];
        for (let i = 0; i < obs.length; i++) {
            const term = Math.pow(obs[i] - exp[i], 2) / exp[i];
            terms.push(term);
            chi2_stat += term;
        }
        const df = obs.length - 1;
        const answerObj = {
            'Chi-Square Statistic (χ²)': chi2_stat.toFixed(4),
            'Degrees of Freedom (df)': df,
            'คำแนะนำ': 'นำค่า Chi-Square Statistic ไปเปรียบเทียบกับค่าวิกฤตจากตาราง Chi-Square ที่ระดับนัยสำคัญ (alpha) และ df ที่คำนวณได้ เพื่อทดสอบ Goodness-of-Fit'
        };
        const answer = JSON.stringify(answerObj, null, 2);
        const steps = `
            <p><b>1. คำนวณค่า (Oᵢ - Eᵢ)² / Eᵢ สำหรับแต่ละกลุ่ม:</b></p>
            ${obs.map((o, i) => `<p>กลุ่มที่ ${i+1}: (${o} - ${exp[i]})² / ${exp[i]} = ${terms[i].toFixed(4)}</p>`).join('')}
            <br>
            <p><b>2. คำนวณค่าสถิติไคสแควร์ (χ²):</b></p>
            <p>สูตร: χ² = Σ [ (Oᵢ - Eᵢ)² / Eᵢ ]</p>
            <p>χ² = ${terms.map(t => t.toFixed(4)).join(' + ')}</p>
            <p><b>χ² = ${chi2_stat.toFixed(4)}</b></p>
            <br>
            <p><b>3. คำนวณองศาอิสระ (df):</b></p>
            <p>df = k - 1 (เมื่อ k คือจำนวนกลุ่ม)</p>
            <p>df = ${obs.length} - 1 = <b>${df}</b></p>
        `;
        ui.displayResult('chiOut', { answer, steps });
    });

    document.getElementById('addAnovaGroup').addEventListener('click', () => {
        const container = document.getElementById('anova-groups-container');
        const groupCount = container.children.length + 1;
        const newGroupDiv = document.createElement('div');
        newGroupDiv.className = 'anova-group';
        newGroupDiv.innerHTML = `
            <label>ข้อมูลกลุ่มที่ ${groupCount}</label>
            <input type="text" class="anova-group-input" placeholder="17.5 18.2 19.1 16.9 18.8">
        `;
        container.appendChild(newGroupDiv);
        ui.updateAnovaButtons();
    });

    document.getElementById('removeAnovaGroup').addEventListener('click', () => {
        const container = document.getElementById('anova-groups-container');
        if (container.children.length > 2) {
            container.removeChild(container.lastElementChild);
            ui.updateAnovaButtons();
        }
    });

    // --- ANOVA Calculation Logic ---
    const ANOVA_IDS = {
        CONTAINER: 'anova-groups-container',
        INPUT_CLASS: 'anova-group-input',
        ALPHA: 'anova_alpha',
        OUTPUT: 'anovaOut',
        PLOT: 'anovaPlot',
        ADD_BTN: 'addAnovaGroup',
        REMOVE_BTN: 'removeAnovaGroup',
        CALC_BTN: 'calcAnova'
    };

    function getAnovaInputs() {
        const groupInputs = document.querySelectorAll(`.${ANOVA_IDS.INPUT_CLASS}`);
        const alpha = parseFloat(document.getElementById(ANOVA_IDS.ALPHA).value);
        const groups = Array.from(groupInputs).map(input => utils.parseNums(input.value)).filter(g => g.length > 0);

        if (groups.length < 2) throw new utils.ValidationError('ต้องมีข้อมูลอย่างน้อย 2 กลุ่มเพื่อทำการวิเคราะห์ ANOVA');
        if (groups.some(g => g.length < 2)) throw new utils.ValidationError('แต่ละกลุ่มต้องมีข้อมูลอย่างน้อย 2 ค่า');
        if (isNaN(alpha) || alpha <= 0 || alpha >= 1) throw new utils.ValidationError('Alpha (α) ต้องเป็นค่าระหว่าง 0 และ 1');

        return { groups, alpha };
    }

    function performAnovaCalculation({ groups }) {
        const k = groups.length;
        const allData = [].concat(...groups);
        const N = allData.length;
        const grandMean = utils.mean(allData);

        const ssb = groups.reduce((sum, group) => sum + group.length * Math.pow(utils.mean(group) - grandMean, 2), 0);
        const ssw = groups.reduce((sum, group) => {
            const groupMean = utils.mean(group);
            return sum + group.reduce((groupSum, val) => groupSum + Math.pow(val - groupMean, 2), 0);
        }, 0);

        const df_between = k - 1;
        const df_within = N - k;
        const msb = ssb / df_between;
        const msw = ssw / df_within;
        const f_stat = msb / msw;
        const p_value = 1 - jStat.centralF.cdf(f_stat, df_between, df_within);

        return { k, N, ssb, ssw, df_between, df_within, msb, msw, f_stat, p_value };
    }

    function generateAnovaSteps({ groups, alpha, ...stats }) {
        let steps = `
            <p><b>ตารางสรุปผลการวิเคราะห์ความแปรปรวน (ANOVA Table)</b></p>
            <table class="steps-table anova-table">
                <thead><tr><th>Source</th><th>Sum of Squares (SS)</th><th>df</th><th>Mean Square (MS)</th><th>F-statistic</th><th>P-value</th></tr></thead>
                <tbody>
                    <tr><td>Between Groups</td><td>${stats.ssb.toFixed(4)}</td><td>${stats.df_between}</td><td>${stats.msb.toFixed(4)}</td><td class="result-value">${stats.f_stat.toFixed(4)}</td><td class="result-value">${stats.p_value.toFixed(4)}</td></tr>
                    <tr><td>Within Groups</td><td>${stats.ssw.toFixed(4)}</td><td>${stats.df_within}</td><td>${stats.msw.toFixed(4)}</td><td></td><td></td></tr>
                </tbody>
                <tfoot><tr><td>Total</td><td>${(stats.ssb + stats.ssw).toFixed(4)}</td><td>${stats.N - 1}</td><td></td><td></td><td></td></tr></tfoot>
            </table><br>
            <p><b>คำอธิบาย:</b> F-statistic = MS(between) / MS(within)</p>`;

        if (stats.p_value < alpha) {
            steps += `<hr><p><b>การทดสอบ Post-hoc: Tukey's HSD (α = ${alpha})</b></p><p>เนื่องจากผล ANOVA มีนัยสำคัญ (p < ${alpha}) เราจึงทำการทดสอบเพื่อเปรียบเทียบค่าเฉลี่ยของแต่ละคู่กลุ่ม:</p>
            <table class="steps-table"><thead><tr><th>การเปรียบเทียบ</th><th>ผลต่างค่าเฉลี่ย</th><th>q-statistic</th><th>P-value</th><th>มีนัยสำคัญ</th></tr></thead><tbody>`;
            
            const groupMeans = groups.map(g => utils.mean(g));
            for (let i = 0; i < stats.k; i++) {
                for (let j = i + 1; j < stats.k; j++) {
                    const mean_diff = Math.abs(groupMeans[i] - groupMeans[j]);
                    const se = Math.sqrt(stats.msw / 2 * (1 / groups[i].length + 1 / groups[j].length));
                    const q_statistic = mean_diff / se;
                    const tukey_p_value = 1 - jStat.studentizedRange.cdf(q_statistic, stats.k, stats.df_within);
                    const significant = tukey_p_value < alpha;
                    steps += `<tr><td>กลุ่ม ${i + 1} vs กลุ่ม ${j + 1}</td><td>${mean_diff.toFixed(4)}</td><td>${q_statistic.toFixed(4)}</td><td>${tukey_p_value.toFixed(4)}</td><td class="${significant ? 'significant' : 'not-significant'}"><b>${significant ? 'ใช่' : 'ไม่'}</b></td></tr>`;
                }
            }
            steps += `</tbody></table>`;
        } else {
            steps += `<hr><p>เนื่องจากผล ANOVA ไม่มีนัยสำคัญทางสถิติ (p ≥ ${alpha}) จึงไม่จำเป็นต้องทำการทดสอบ Post-hoc</p>`;
        }
        return steps;
    }

    function plotAnovaResults(groups) {
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
        const traces = groups.map((group, i) => ({
            y: group, type: 'box', name: `กลุ่มที่ ${i + 1}`,
            boxpoints: 'all', jitter: 0.3, pointpos: -1.8,
            marker: { color: accentColor }
        }));
        const layout = ui.getPlotlyLayout('Box Plot เปรียบเทียบข้อมูลแต่ละกลุ่ม', 'กลุ่ม', 'ค่า');
        layout.xaxis.showticklabels = false; 
        Plotly.newPlot(ANOVA_IDS.PLOT, traces, layout, ui.plotlyConfig);
    }

    function handleAnovaCalculation() {
        try {
            Plotly.purge(ANOVA_IDS.PLOT);
            const { groups, alpha } = getAnovaInputs();
            const stats = performAnovaCalculation({ groups });
            
            const answerObj = {
                'F-statistic': stats.f_stat.toFixed(4),
                'Degrees of Freedom': `(${stats.df_between}, ${stats.df_within})`,
                'P-value': stats.p_value.toFixed(4),
                'คำแนะนำ': `หาก p-value < ${alpha} จะปฏิเสธสมมติฐานหลัก (H₀) และสรุปได้ว่ามีค่าเฉลี่ยของกลุ่มอย่างน้อยหนึ่งกลุ่มที่แตกต่างจากกลุ่มอื่นอย่างมีนัยสำคัญ`
            };
            const answer = JSON.stringify(answerObj, null, 2);
            const steps = generateAnovaSteps({ groups, alpha, ...stats });

            ui.displayResult(ANOVA_IDS.OUTPUT, { answer, steps });
            plotAnovaResults(groups);
        } catch (e) {
            Plotly.purge(ANOVA_IDS.PLOT);
            if (e instanceof utils.ValidationError) { ui.showError(e.message, ANOVA_IDS.OUTPUT); } 
            else { console.error('An unexpected error in ANOVA:', e); ui.showError('เกิดข้อผิดพลาดที่ไม่คาดคิด', ANOVA_IDS.OUTPUT); }
        }
    }
    document.getElementById(ANOVA_IDS.CALC_BTN).addEventListener('click', handleAnovaCalculation);

    function setInitialValues() {
        document.getElementById('nums').value = '10 20 20 30 40';
        document.getElementById('xs').value = '1 2 3 4 5';
        document.getElementById('ys').value = '2 4 5 4 5';
        document.getElementById('ev_outcomes').value = '100 200';
        document.getElementById('ev_probs').value = '0.5 0.5';

        const corrDataTextareas = document.querySelectorAll('.corr-var-data');
        if (corrDataTextareas.length >= 2) {
            corrDataTextareas[0].value = '10 8 13 9 11 14 6 4 12 7 5';
            corrDataTextareas[1].value = '8.04 6.95 7.58 8.81 8.33 9.96 7.24 4.26 10.84 4.82 5.68';
        }
        ui.updateCorrVarButtons();

        ui.buildPayoffGrid(payoffStateCount, payoffAltCount);
        const initialPayoffValues = [120, 40, 70, 80];
        document.querySelectorAll('.payoff-value').forEach((input, i) => {
            if (initialPayoffValues[i] !== undefined) {
                input.value = initialPayoffValues[i];
            }
        });
        document.querySelectorAll('.payoff-state-name').forEach((input, i) => {
            const names = ['ตลาดดี', 'ตลาดแย่'];
            if (names[i]) input.value = names[i];
        });
        document.querySelectorAll('.payoff-alt-name').forEach((input, i) => {
            const names = ['สร้างโรงงาน', 'ไม่สร้าง'];
            if (names[i]) input.value = names[i];
        });

        document.getElementById('func_expr').value = '-0.1*x^3 + x^2 + 5*x - 4';
        document.getElementById('func_min_x').value = '-10';
        document.getElementById('func_max_x').value = '15';

        document.getElementById('bino_n').value = '10';
        document.getElementById('bino_p').value = '0.5';
        document.getElementById('bino_x').value = '5';
        document.getElementById('poisson_l').value = '3';
        document.getElementById('poisson_x').value = '2';

        document.getElementById('si_p').value = '50000';
        document.getElementById('si_r').value = '3.5';
        document.getElementById('si_t').value = '5';

        ui.buildNpvInputs(npvCfCount);
        const initialNpvValues = [-10000, 2500, 3000, 3500, 4000];
        document.querySelectorAll('.npv-cf-input').forEach((input, i) => {
            if (initialNpvValues[i] !== undefined) {
                input.value = initialNpvValues[i];
            }
        });

        ui.buildIrrInputs(irrCfCount);
        const initialIrrValues = [-10000, 3000, 4000, 5000, 2000];
        document.querySelectorAll('.irr-cf-input').forEach((input, i) => {
            if (initialIrrValues[i] !== undefined) {
                input.value = initialIrrValues[i];
            }
        });

        document.getElementById('pow_base').value = '2';
        document.getElementById('pow_exp').value = '10';
        document.getElementById('log_base').value = '10';
        document.getElementById('log_num').value = '1000';

        document.getElementById('arith_a1').value = '1';
        document.getElementById('arith_d').value = '2';
        document.getElementById('arith_n').value = '10';
        document.getElementById('geo_a1').value = '3';
        document.getElementById('geo_r').value = '2';
        document.getElementById('geo_n').value = '8';

        document.getElementById('loan_p').value = '1000000';
        document.getElementById('loan_r').value = '3';
        document.getElementById('loan_t').value = '30';
        document.getElementById('loan_n').value = '12';

        document.getElementById('ttest_samp1').value = '20.5 18.7 19.8 21.1 22.0';
        document.getElementById('ttest_samp2').value = '24.1 23.5 25.0 22.9 24.8';
        document.getElementById('chi_obs').value = '48 35 17';
        document.getElementById('chi_exp').value = '50 30 20';
    }

    // --- FINAL SETUP ---
    // Load saved state or set initial values
    if (!stateManager.load()) {
        setInitialValues();
    }
    stateManager.initAutoSave();

    // --- CLEAR DATA BUTTON ---
    dom.clearDataBtn.addEventListener('click', () => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลที่บันทึกไว้ทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            // Also clear the theme setting to reset everything
            localStorage.clear(); // Clears all data for this domain, including state and theme
            alert('ข้อมูลถูกล้างเรียบร้อยแล้ว หน้าเว็บจะทำการโหลดใหม่');
            location.reload();
        }
    });
});
