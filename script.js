document.addEventListener('DOMContentLoaded', () => {

    // --- UTILITY FUNCTIONS ---
    function parseNums(s){ if(!s) return []; return s.replace(/,/g,' ').trim().split(/\s+/).map(x=>parseFloat(x)).filter(x=>!isNaN(x)); }
    function mean(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length }
    function median(arr){ const s=arr.slice().sort((a,b)=>a-b); const m=Math.floor(s.length/2); return s.length%2? s[m]:(s[m-1]+s[m])/2 }
    function mode(arr){ const m = {}; arr.forEach(x=>m[x]=(m[x]||0)+1); let max=0, val=null; for(const k in m){ if(m[k]>max){max=m[k]; val=Number(k)} } const counts = Object.values(m); if(counts.filter(v=>v===max).length>1) return 'ไม่มีโหมดที่ชัดเจน'; return val }
    function variance(arr){ if(arr.length===0) return NaN; const mu=mean(arr); return arr.reduce((a,b)=>a+(b-mu)**2,0)/arr.length }
    function stddev(arr){ return Math.sqrt(variance(arr)) }
    function sampleVariance(arr) { if (arr.length < 2) return NaN; const mu = mean(arr); return arr.reduce((a, b) => a + (b - mu) ** 2, 0) / (arr.length - 1); }
    function factorial(n) {
        if (n < 0 || !Number.isInteger(n)) return NaN;
        if (n > 170) return Infinity;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    }
    function combinations(n, k) {
        if (k < 0 || k > n || !Number.isInteger(n) || !Number.isInteger(k)) return 0;
        if (k === 0 || k === n) return 1;
        if (k > n / 2) k = n - k;
        let res = 1;
        for (let i = 1; i <= k; i++) {
            res = res * (n - i + 1) / i;
        }
        return res;
    }
    function gcd(a, b) { while(b) { [a, b] = [b, a % b]; } return a; }
    function solveIRR(cashFlows, guess = 0.1) {
        const MAX_ITER = 100;
        const TOLERANCE = 1e-7;
        let x0 = guess;

        for (let i = 0; i < MAX_ITER; i++) {
            let npv = 0;
            let derivative = 0;
            cashFlows.forEach((cf, t) => {
                npv += cf / Math.pow(1 + x0, t);
                if (t > 0) {
                    derivative -= t * cf / Math.pow(1 + x0, t + 1);
                }
            });

            if (Math.abs(npv) < TOLERANCE) return x0; // Success
            if (derivative === 0) return null; // No solution
            
            const x1 = x0 - npv / derivative; // Newton-Raphson step
            if (Math.abs(x1 - x0) < TOLERANCE) return x1; // Converged
            x0 = x1;
        }
        return null; // Failed to converge
    }

    function displayResult(elementId, result) {
        const el = document.getElementById(elementId);
        if (!el) return;

        el.innerHTML = ''; // Clear previous content

        const container = document.createElement('div');

        const answerPre = document.createElement('pre');
        // The result can be a string or an object with answer/steps
        if (typeof result === 'string') {
            answerPre.textContent = result;
        } else if (result && typeof result.answer !== 'undefined') {
            answerPre.textContent = result.answer;
        } else {
            // Fallback for old JSON objects
            answerPre.textContent = JSON.stringify(result, null, 2);
        }
        container.appendChild(answerPre);

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

    function showError(message, elementId) {
      const el = document.getElementById(elementId);
      if (!el) return;
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      el.innerHTML = ''; // Clear previous content
      el.appendChild(errorDiv);
    }

    const plotLayout = {
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        font: { color: 'var(--muted)' },
        xaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
        yaxis: { gridcolor: 'rgba(255,255,255,0.05)' }
    };

    // --- TAB NAVIGATION ---
    document.querySelectorAll('.tabbtn').forEach(button => button.addEventListener('click', () => {
      // Remove 'active' class from all tab buttons
      document.querySelectorAll('.tabbtn').forEach(btn => btn.classList.remove('active'));
      // Add 'active' class to the clicked button
      button.classList.add('active');
      
      // Hide all panels
      document.querySelectorAll('section.panel').forEach(panel => panel.style.display = 'none');
      // Show the target panel
      document.getElementById(button.dataset.tab).style.display = 'block';
    }));

    // --- STATS TAB ---
    document.getElementById('calcStats').addEventListener('click', ()=>{
      const arr = parseNums(document.getElementById('nums').value);
      if(arr.length===0){ showError('กรุณากรอกตัวเลขอย่างน้อยหนึ่งตัว', 'statsOut'); return }
      const mu = mean(arr);
      const v = variance(arr);
      const s = stddev(arr);
      const out = {
        'ค่าเฉลี่ย (Mean)': mu.toFixed(4),
        'มัธยฐาน (Median)': median(arr).toFixed(4),
        'ฐานนิยม (Mode)': mode(arr),
        'ความแปรปรวน (Variance)': v.toFixed(4),
        'ส่วนเบี่ยงเบนมาตรฐาน (StdDev)': s.toFixed(4),
        'จำนวนข้อมูล (Count)': arr.length
      };
      const answer = JSON.stringify(out, null, 2);
      const steps = `
          <b>ค่าเฉลี่ย (Mean):</b> $$ \\mu = \\frac{\\sum x_i}{n} $$
          <p>$$ \\mu = \\frac{${arr.join(' + ')}}{${arr.length}} $$</p>
          <p>$$ \\mu = \\frac{${arr.reduce((a,b)=>a+b,0)}}{${arr.length}} = \\mathbf{${mu.toFixed(4)}} $$</p>
          <br>
          <b>ความแปรปรวน (Variance):</b>
          $$ \\sigma^2 = \\frac{\\sum(x_i - \\mu)^2}{n} $$
          <p>$$ \\sigma^2 = \\frac{${arr.map(x => `(${x.toFixed(2)} - ${mu.toFixed(2)})^2`).join(' + ')}}{${arr.length}} $$</p>
          <p>$$ \\sigma^2 = \\mathbf{${v.toFixed(4)}} $$</p>
          <br>
          <b>ส่วนเบี่ยงเบนมาตรฐาน (StdDev):</b>
          $$ \\sigma = \\sqrt{\\sigma^2} $$
          <p>$$ \\sigma = \\sqrt{${v.toFixed(4)}} = \\mathbf{${s.toFixed(4)}} $$</p>
      `;
      displayResult('statsOut', { answer, steps });
    });
    document.getElementById('calcMA').addEventListener('click', ()=>{
      const arr = parseNums(document.getElementById('nums').value);
      const w = parseInt(document.getElementById('maWindow').value)||3;
      if(arr.length===0){ showError('กรุณากรอกข้อมูล', 'statsOut'); return }
      if(w<=0 || w>arr.length){ showError('ขนาดของ Window ต้องเป็นจำนวนเต็มบวก และไม่เกินจำนวนข้อมูลที่มี', 'statsOut'); return }
      const ma = []; const stepsArr = [];
      for(let i=0;i<=arr.length-w;i++){ const win=arr.slice(i,i+w); const winSum = win.reduce((a,b)=>a+b,0); const winMean = (winSum/w).toFixed(4); ma.push(winMean); stepsArr.push(`<p>MA<sub>${i+1}</sub> = (${win.join(' + ')}) / ${w} = ${winMean}</p>`); }
      const answer = `ค่าเฉลี่ยเคลื่อนที่ (MA, window=${w}):\n${ma.join(', ')}`;
      const steps = stepsArr.join('');
      displayResult('statsOut', { answer, steps });
    });

    // --- QUANT TAB ---
    function linearRegression(x, y){ const n=x.length; const xm = mean(x); const ym = mean(y); let num=0, den=0; for(let i=0;i<n;i++){ num += (x[i]-xm)*(y[i]-ym); den += (x[i]-xm)**2; } if(den===0) return null; const slope = num/den; const intercept = ym - slope*xm; return {slope, intercept}; }
    
    document.getElementById('runLR').addEventListener('click', ()=>{
      const xs = parseNums(document.getElementById('xs').value);
      const ys = parseNums(document.getElementById('ys').value);
      const predXVal = document.getElementById('predX').value.trim();
      if(xs.length!==ys.length || xs.length<2){ showError('กรุณาใส่ข้อมูล X และ Y ให้มีจำนวนเท่ากัน และต้องมีข้อมูลอย่างน้อย 2 ชุด', 'lrResult'); return }
      const lr = linearRegression(xs, ys);
      if (!lr) {
        showError('ไม่สามารถคำนวณ Regression ได้ เนื่องจากค่า X ทั้งหมดมีค่าเท่ากัน', 'lrResult');
        return;
      }
      const xm = mean(xs);
      const ym = mean(ys);
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
      displayResult('lrResult', { answer, steps });

      const lineY = xs.map(x=>lr.slope*x + lr.intercept);
      const trace1 = { x: xs, y: ys, mode: 'markers', name:'ข้อมูล' };
      const trace2 = { x: xs, y: lineY, mode: 'lines', name:'เส้นถดถอย' };
      const layout = {...plotLayout, title:'แผนภาพการกระจายและเส้นถดถอย', xaxis:{...plotLayout.xaxis, title:'X'}, yaxis:{...plotLayout.yaxis, title:'Y'}};
      Plotly.newPlot('lrPlot', [trace1, trace2], layout);
    });

    document.getElementById('calcEV').addEventListener('click', ()=>{
      const outcomes = parseNums(document.getElementById('ev_outcomes').value);
      const probs = parseNums(document.getElementById('ev_probs').value);
      if(outcomes.length!==probs.length){ showError('จำนวน Outcomes และ Probabilities ต้องเท่ากัน', 'evOut'); return }
      const sumP = probs.reduce((a,b)=>a+b,0);
      if(Math.abs(sumP-1)>1e-6){ showError('ผลรวมของ Probabilities ทั้งหมดต้องเท่ากับ 1', 'evOut'); return }
      let ev = 0;
      let steps = '<p>EV = Σ(xᵢ * P(xᵢ))</p>';
      let stepCalc = [];
      for(let i=0;i<outcomes.length;i++) {
        ev += outcomes[i]*probs[i];
        stepCalc.push(`(${outcomes[i]} * ${probs[i]})`);
      }
      steps += `<p>EV = ${stepCalc.join(' + ')} = <b>${ev.toFixed(4)}</b></p>`;
      displayResult('evOut', { answer: `ค่าคาดหวัง (EV): ${ev.toFixed(4)}`, steps });
    });

    document.getElementById('calcPayoff').addEventListener('click', () => {
        const matrixText = document.getElementById('payoff_matrix').value.trim();
        const alpha = parseFloat(document.getElementById('hurwicz_alpha').value);
        if (!matrixText) {
            showError('กรุณาป้อนข้อมูล Payoff Matrix', 'payoffOut'); return;
        }
        if (isNaN(alpha) || alpha < 0 || alpha > 1) {
            showError('ค่า Alpha สำหรับ Hurwicz ต้องอยู่ระหว่าง 0 และ 1', 'payoffOut'); return;
        }

        const matrix = matrixText.split('\n').map(row => parseNums(row));
        const numAlternatives = matrix.length;
        if (numAlternatives === 0 || matrix.some(row => row.length !== matrix[0].length)) {
            showError('ข้อมูล Payoff Matrix ไม่ถูกต้อง ทุกแถวต้องมีจำนวนคอลัมน์เท่ากัน', 'payoffOut'); return;
        }

        // Maximax (Optimistic)
        const maximaxValues = matrix.map(row => Math.max(...row));
        const maximaxChoice = maximaxValues.indexOf(Math.max(...maximaxValues));

        // Maximin (Pessimistic)
        const maximinValues = matrix.map(row => Math.min(...row));
        const maximinChoice = maximinValues.indexOf(Math.max(...maximinValues));

        // Laplace
        const laplaceValues = matrix.map(row => mean(row));
        const laplaceChoice = laplaceValues.indexOf(Math.max(...laplaceValues));

        // Hurwicz
        const hurwiczValues = matrix.map(row => alpha * Math.max(...row) + (1 - alpha) * Math.min(...row));
        const hurwiczChoice = hurwiczValues.indexOf(Math.max(...hurwiczValues));

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

        const results = {
            'Maximax (มองโลกในแง่ดี)': `เลือกทางเลือกที่ ${maximaxChoice + 1} (ค่า Payoff สูงสุดคือ ${maximaxValues[maximaxChoice].toLocaleString()})`,
            'Maximin (มองโลกในแง่ร้าย)': `เลือกทางเลือกที่ ${maximinChoice + 1} (ค่า Payoff ต่ำสุดที่สูงที่สุดคือ ${maximinValues[maximinChoice].toLocaleString()})`,
            'Laplace (ความน่าจะเป็นเท่ากัน)': `เลือกทางเลือกที่ ${laplaceChoice + 1} (ค่าเฉลี่ยสูงสุดคือ ${laplaceValues[laplaceChoice].toFixed(2).toLocaleString()})`,
            [`Hurwicz (alpha=${alpha})`]: `เลือกทางเลือกที่ ${hurwiczChoice + 1} (ค่าถ่วงน้ำหนักสูงสุดคือ ${hurwiczValues[hurwiczChoice].toFixed(2).toLocaleString()})`,
            'Minimax Regret (เสียโอกาสน้อยสุด)': `เลือกทางเลือกที่ ${minimaxRegretChoice + 1} (ค่าเสียโอกาสสูงสุดที่น้อยที่สุดคือ ${maxRegretInRows[minimaxRegretChoice].toLocaleString()})`
        };
        const answer = JSON.stringify(results, null, 2);

        let regretTableHtml = '<table class="steps-table"><thead><tr><th>ทางเลือก</th>';
        for(let j=0; j<numStates; j++) { regretTableHtml += `<th>สภาวะที่ ${j+1}</th>`; }
        regretTableHtml += '</tr></thead><tbody>';
        regretMatrix.forEach((row, i) => {
            regretTableHtml += `<tr><td>ทางเลือกที่ ${i+1}</td>`;
            row.forEach(val => { regretTableHtml += `<td>${val.toLocaleString()}</td>`; });
            regretTableHtml += '</tr>';
        });
        regretTableHtml += '</tbody></table>';

        const steps = `
            <b>1. Maximax (มองโลกในแง่ดี)</b>
            <p>หาค่าสูงสุดของแต่ละทางเลือก แล้วเลือกทางเลือกที่ให้ค่าสูงสุด</p>
            <ul>${maximaxValues.map((v, i) => `<li>ทางเลือกที่ ${i+1}: ค่าสูงสุดคือ ${v.toLocaleString()}</li>`).join('')}</ul>
            <p>ค่าที่มากที่สุดคือ ${Math.max(...maximaxValues).toLocaleString()} ดังนั้น <b>${results['Maximax (มองโลกในแง่ดี)']}</b></p>
            <br>
            <b>2. Maximin (มองโลกในแง่ร้าย)</b>
            <p>หาค่าต่ำสุดของแต่ละทางเลือก แล้วเลือกทางเลือกที่ให้ค่าสูงสุดในบรรดาค่าต่ำสุดเหล่านั้น</p>
            <ul>${maximinValues.map((v, i) => `<li>ทางเลือกที่ ${i+1}: ค่าต่ำสุดคือ ${v.toLocaleString()}</li>`).join('')}</ul>
            <p>ค่าที่มากที่สุดในกลุ่มนี้คือ ${Math.max(...maximinValues).toLocaleString()} ดังนั้น <b>${results['Maximin (มองโลกในแง่ร้าย)']}</b></p>
            <br>
            <b>3. Laplace (ความน่าจะเป็นเท่ากัน)</b>
            <p>หาค่าเฉลี่ยของแต่ละทางเลือก แล้วเลือกทางเลือกที่ให้ค่าเฉลี่ยสูงสุด</p>
            <ul>${laplaceValues.map((v, i) => `<li>ทางเลือกที่ ${i+1}: ค่าเฉลี่ยคือ ${v.toFixed(2).toLocaleString()}</li>`).join('')}</ul>
            <p>ค่าเฉลี่ยสูงสุดคือ ${Math.max(...laplaceValues).toFixed(2).toLocaleString()} ดังนั้น <b>${results['Laplace (ความน่าจะเป็นเท่ากัน)']}</b></p>
            <br>
            <b>4. Hurwicz (alpha=${alpha})</b>
            <p>คำนวณค่าถ่วงน้ำหนัก [α * (ค่าสูงสุด)] + [(1-α) * (ค่าต่ำสุด)] ของแต่ละทางเลือก แล้วเลือกค่าสูงสุด</p>
            <ul>${hurwiczValues.map((v, i) => `<li>ทางเลือกที่ ${i+1}: (${alpha}*${Math.max(...matrix[i])}) + (${1-alpha}*${Math.min(...matrix[i])}) = ${v.toFixed(2).toLocaleString()}</li>`).join('')}</ul>
            <p>ค่าถ่วงน้ำหนักสูงสุดคือ ${Math.max(...hurwiczValues).toFixed(2).toLocaleString()} ดังนั้น <b>${results[`Hurwicz (alpha=${alpha})`]}</b></p>
            <br>
            <b>5. Minimax Regret (ค่าเสียโอกาสน้อยที่สุด)</b>
            <p>ขั้นตอนที่ 1: หาค่าที่ดีที่สุด (สูงสุด) ของแต่ละสภาวะการณ์ (แต่ละคอลัมน์): [${maxInCols.join(', ')}]</p>
            <p>ขั้นตอนที่ 2: สร้างตารางค่าเสียโอกาส (Regret Matrix) โดยนำค่าที่ดีที่สุดของคอลัมน์นั้นๆ ลบด้วยค่าในแต่ละช่อง</p>
            ${regretTableHtml}
            <p>ขั้นตอนที่ 3: หาค่าเสียโอกาสที่สูงสุดของแต่ละทางเลือก (แต่ละแถว): [${maxRegretInRows.join(', ')}]</p>
            <p>ขั้นตอนที่ 4: เลือกทางเลือกที่มีค่าเสียโอกาสสูงสุดที่น้อยที่สุด คือ ${Math.min(...maxRegretInRows).toLocaleString()} ดังนั้น <b>${results['Minimax Regret (เสียโอกาสน้อยสุด)']}</b></p>
        `;
        displayResult('payoffOut', { answer, steps });
    });

    document.getElementById('plotFunc').addEventListener('click', () => {
        const expr = document.getElementById('func_expr').value;
        const minX = parseFloat(document.getElementById('func_min_x').value);
        const maxX = parseFloat(document.getElementById('func_max_x').value);

        if (!expr || isNaN(minX) || isNaN(maxX) || minX >= maxX) {
            showError('กรุณากรอกนิพจน์และช่วงของ x ให้ถูกต้อง', 'funcPlot'); return;
        }

        try {
            const sanitizedExpr = expr.replace(/\^/g, '**');
            const func = new Function('x', `return ${sanitizedExpr}`);
            
            const steps = 200;
            const stepSize = (maxX - minX) / steps;
            const xVals = [];
            const yVals = [];
            let minY = Infinity, maxY = -Infinity;
            let minX_val = minX, maxX_val = minX;

            for (let i = 0; i <= steps; i++) {
                const x = minX + i * stepSize;
                const y = func(x);
                if (isNaN(y) || !isFinite(y)) continue;
                xVals.push(x);
                yVals.push(y);
                if (y < minY) { minY = y; minX_val = x; }
                if (y > maxY) { maxY = y; maxX_val = x; }
            }

            const trace = { x: xVals, y: yVals, mode: 'lines', name: 'f(x)' };
            const layout = {...plotLayout, title: `กราฟของ f(x) = ${expr}`};
            layout.annotations = [
                { x: maxX_val, y: maxY, text: `Max: (${maxX_val.toFixed(2)}, ${maxY.toFixed(2)})`, showarrow: true, arrowhead: 4, ax: 0, ay: -40 },
                { x: minX_val, y: minY, text: `Min: (${minX_val.toFixed(2)}, ${minY.toFixed(2)})`, showarrow: true, arrowhead: 4, ax: 0, ay: 40 }
            ];
            Plotly.newPlot('funcPlot', [trace], layout);
        } catch (e) {
            showError(`นิพจน์ไม่ถูกต้อง: ${e.message}`, 'funcPlot');
        }
    });

    document.getElementById('calcBino').addEventListener('click', () => {
        const n = parseInt(document.getElementById('bino_n').value);
        const p = parseFloat(document.getElementById('bino_p').value);
        const x = parseInt(document.getElementById('bino_x').value);

        if (isNaN(n) || isNaN(p) || isNaN(x)) {
            showError('กรุณากรอกข้อมูล n, p, และ x ให้ครบถ้วน', 'binoOut'); return;
        }
        if (n <= 0 || !Number.isInteger(n) || x < 0 || !Number.isInteger(x) || x > n) {
            showError('n ต้องเป็นจำนวนเต็มบวก, x ต้องเป็นจำนวนเต็มไม่ติดลบและไม่เกิน n', 'binoOut'); return;
        }
        if (p < 0 || p > 1) {
            showError('p ต้องมีค่าระหว่าง 0 และ 1', 'binoOut'); return;
        }

        const prob = combinations(n, x) * Math.pow(p, x) * Math.pow(1 - p, n - x);
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
            <p>P(X=${x}) = ${combinations(n,x)} * ${Math.pow(p,x).toFixed(4)} * ${Math.pow(1-p, n-x).toFixed(4)} = <b>${prob.toFixed(6)}</b></p>
            <br>
            <p>E(X) = n * p = ${n} * ${p} = <b>${meanVal.toFixed(4)}</b></p>
            <p>Var(X) = n * p * (1-p) = ${n} * ${p} * ${1-p} = <b>${varianceVal.toFixed(4)}</b></p>
        `;
        displayResult('binoOut', { answer, steps });
    });

    document.getElementById('calcPoisson').addEventListener('click', () => {
        const lambda = parseFloat(document.getElementById('poisson_l').value);
        const x = parseInt(document.getElementById('poisson_x').value);

        if (isNaN(lambda) || isNaN(x)) {
            showError('กรุณากรอกข้อมูล λ และ x ให้ครบถ้วน', 'poissonOut'); return;
        }
        if (lambda <= 0 || x < 0 || !Number.isInteger(x)) {
            showError('λ ต้องเป็นค่าบวก, x ต้องเป็นจำนวนเต็มไม่ติดลบ', 'poissonOut'); return;
        }

        const fact_x = factorial(x);
        if (fact_x === Infinity) {
            showError('ค่า x ใหญ่เกินไป ไม่สามารถคำนวณ Factorial ได้', 'poissonOut'); return;
        }
        const prob = (Math.pow(lambda, x) * Math.exp(-lambda)) / fact_x;
        const answer = `P(X = ${x}) = ${prob.toFixed(6)}`;
        const steps = `
            <p>P(X=x) = (λˣ * e⁻ˡ) / x!</p>
            <p>P(X=${x}) = (${lambda}<sup>${x}</sup> * e<sup>-${lambda}</sup>) / ${x}!</p>
            <p>P(X=${x}) = (${Math.pow(lambda, x).toFixed(4)} * ${Math.exp(-lambda).toFixed(4)}) / ${fact_x}</p>
            <p>P(X=${x}) = <b>${prob.toFixed(6)}</b></p>`;
        displayResult('poissonOut', { answer, steps });
    });

    // --- ECON TAB ---
    document.getElementById('calcEq').addEventListener('click', ()=>{
      const a= parseFloat(document.getElementById('ea').value);
      const b= parseFloat(document.getElementById('eb').value);
      const c= parseFloat(document.getElementById('ec').value);
      const d= parseFloat(document.getElementById('ed').value);
      const denom = b + d; if(denom===0){ showError('พารามิเตอร์ไม่ถูกต้อง ทำให้ไม่สามารถหาจุดสมดุลได้ (b + d ต้องไม่เท่ากับ 0)', 'econOut'); return }
      const P_eq = (a - c)/denom;
      const Q_eq = a - b*P_eq;
      const answer = JSON.stringify({'ราคาดุลยภาพ (P*)':P_eq.toFixed(4),'ปริมาณดุลยภาพ (Q*)':Q_eq.toFixed(4)},null,2);
      const steps = `
        <p>ตั้งสมการ Qd = Qs</p>
        <p>${a} - ${b}P = ${c} + ${d}P</p>
        <p>${a-c} = ${b+d}P</p>
        <p>P* = ${a-c} / ${b+d} = <b>${P_eq.toFixed(4)}</b></p>
        <p>Q* = ${a} - ${b}(${P_eq.toFixed(4)}) = <b>${Q_eq.toFixed(4)}</b></p>`;
      displayResult('econOut', { answer, steps });
    });

    document.getElementById('calcElas').addEventListener('click', ()=>{
        const a = parseFloat(document.getElementById('ea').value);
      const b = parseFloat(document.getElementById('eb').value);
      const P = parseFloat(document.getElementById('elasP').value);
      const Q = a - b*P; if(Q===0){ showError('ที่ราคานี้ ปริมาณ (Q) เท่ากับ 0 ทำให้ไม่สามารถคำนวณความยืดหยุ่นได้', 'econOut'); return }
      const elas = (-b) * (P / Q);
      const answer = `ความยืดหยุ่นของอุปสงค์ (Ed) = ${elas.toFixed(4)}`;
      const steps = `
        <p>Ed = (dQ/dP) * (P/Q)</p>
        <p>จาก Qd = ${a} - ${b}P, dQ/dP คือ -b = ${-b}</p>
        <p>ที่ P = ${P}, Q = ${a} - ${b}(${P}) = ${Q}</p>
        <p>Ed = ${-b} * (${P} / ${Q}) = <b>${elas.toFixed(4)}</b></p>`;
      displayResult('econOut', { answer, steps });
    });

    document.getElementById('calcBE').addEventListener('click', ()=>{
        const fc = parseFloat(document.getElementById('fc').value);
      const vc = parseFloat(document.getElementById('vc').value);
      const ppu = parseFloat(document.getElementById('ppu').value);
      const margin = ppu - vc; if(margin<=0){ showError('ราคาต่อหน่วย (Price per Unit) ต้องมากกว่าต้นทุนผันแปร (Variable Cost)', 'beOut'); return }
      const units = fc / margin; 
      const answer = `จุดคุ้มทุน (หน่วย) = ${units.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}`;
      const steps = `
        <p>BE (Units) = Fixed Costs / (Price per Unit - Variable Cost per Unit)</p>
        <p>BE (Units) = ${fc.toLocaleString()} / (${ppu.toLocaleString()} - ${vc.toLocaleString()})</p>
        <p>BE (Units) = ${fc.toLocaleString()} / ${margin.toLocaleString()}</p>
        <p><b>BE (Units) = ${answer.split('= ')[1]}</b></p>
    `;
      displayResult('beOut', { answer, steps });
    });
    document.getElementById('plotDS').addEventListener('click', ()=>{
      const a= parseFloat(document.getElementById('ea').value);
      const b= parseFloat(document.getElementById('eb').value);
      const c= parseFloat(document.getElementById('ec').value);
      const d= parseFloat(document.getElementById('ed').value);
      const P_eq = (a - c)/(b + d);
      const Pmax = Math.max(P_eq*1.6, 50);
      const P = Array.from({length:100}, (_,i)=>i*(Pmax/99));
      const Qd = P.map(p=>a - b*p);
      const Qs = P.map(p=>c + d*p);
      const traces = [ {x:P, y:Qd, mode:'lines', name:'อุปสงค์ (Qd)'}, {x:P, y:Qs, mode:'lines', name:'อุปทาน (Qs)'}, {x:[P_eq], y:[a - b*P_eq], mode:'markers', name:'จุดดุลยภาพ', marker:{color:'var(--accent)', size:10}} ];
      const layout = {...plotLayout, title:'กราฟอุปสงค์และอุปทาน', xaxis:{...plotLayout.xaxis, title:'ราคา (P)'}, yaxis:{...plotLayout.yaxis, title:'ปริมาณ (Q)'}};
      Plotly.newPlot('dsPlot', traces, layout);
    });

    document.getElementById('calcEOQ').addEventListener('click', () => {
      const D = parseFloat(document.getElementById('eoq_d').value);
      const S = parseFloat(document.getElementById('eoq_s').value);
      const H = parseFloat(document.getElementById('eoq_h').value);

      if (isNaN(D) || isNaN(S) || isNaN(H)) {
          showError('กรุณากรอกข้อมูล Demand, Ordering Cost, และ Holding Cost ให้ครบถ้วน', 'eoqOut');
          return;
      }
      if (D <= 0 || S <= 0 || H <= 0) {
          showError('ค่า D, S, และ H ต้องเป็นค่าบวก', 'eoqOut');
          return;
      }
      const eoq = Math.sqrt((2 * D * S) / H);
      const answer = `ปริมาณสั่งซื้อที่ประหยัดที่สุด (EOQ): ${eoq.toFixed(4)}`;
      const steps = `
        <p>EOQ = √((2 * D * S) / H)</p>
        <p>EOQ = √((2 * ${D} * ${S}) / ${H})</p>
        <p>EOQ = <b>${eoq.toFixed(4)}</b></p>`;
      displayResult('eoqOut', { answer, steps });
    });

    // --- ALGEBRA TAB ---
    document.getElementById('calcLinEq').addEventListener('click', () => {
        const a = parseFloat(document.getElementById('lin_a').value);
        const b = parseFloat(document.getElementById('lin_b').value);
        const c = parseFloat(document.getElementById('lin_c').value);
        if (isNaN(a) || isNaN(b) || isNaN(c)) {
            showError('กรุณากรอกค่า a, b, และ c ให้ครบถ้วน', 'linEqOut');
            return;
        }
        if (a === 0) {
            if (c - b === 0) {
                displayResult('linEqOut', 'สมการเป็นจริงสำหรับทุกค่า x (0 = 0)');
            } else {
                displayResult('linEqOut', 'สมการไม่มีคำตอบ (ขัดแย้ง)');
            }
            return;
        }
        const x = (c - b) / a;
        const answer = `ผลลัพธ์:\nx = ${x.toFixed(4)}`;
        const steps = `
            <p>${a}x + ${b} = ${c}</p>
            <p>${a}x = ${c} - ${b}</p>
            <p>x = ${c-b} / ${a} = <b>${x.toFixed(4)}</b></p>`;
        displayResult('linEqOut', { answer, steps });
    });

    document.getElementById('calcQuadEq').addEventListener('click', () => {
        const a = parseFloat(document.getElementById('quad_a').value);
        const b = parseFloat(document.getElementById('quad_b').value);
        const c = parseFloat(document.getElementById('quad_c').value);
        if (isNaN(a) || isNaN(b) || isNaN(c)) {
            showError('กรุณากรอกค่า a, b, และ c ให้ครบถ้วน', 'quadEqOut');
            return;
        }
        if (a === 0) {
            showError('นี่คือสมการเชิงเส้น ไม่ใช่สมการกำลังสอง (a ต้องไม่เท่ากับ 0)', 'quadEqOut');
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
        displayResult('quadEqOut', { answer, steps });
    });

    document.getElementById('calcPow').addEventListener('click', () => {
        const base = parseFloat(document.getElementById('pow_base').value);
        const exp = parseFloat(document.getElementById('pow_exp').value);
        if (isNaN(base) || isNaN(exp)) {
            showError('กรุณากรอกค่าฐานและเลขชี้กำลัง', 'powOut');
            return;
        }
        const result = Math.pow(base, exp);
        if (isNaN(result) || !isFinite(result)) {
            showError('ไม่สามารถคำนวณได้ (อาจเกิดจาก 0^0 หรือกรณีอื่นๆ)', 'powOut');
            return;
        }
        const answer = `${base} ^ ${exp} = ${result}`;
        const steps = `<p>คำนวณ ${base} คูณกัน ${exp} ครั้ง.</p>`;
        displayResult('powOut', { answer, steps });
    });

    document.getElementById('calcLog').addEventListener('click', () => {
        const base = parseFloat(document.getElementById('log_base').value);
        const num = parseFloat(document.getElementById('log_num').value);
        if (isNaN(base) || isNaN(num)) {
            showError('กรุณากรอกค่าฐานและตัวเลข', 'logOut');
            return;
        }
        if (num <= 0 || base <= 0) {
            showError('ค่าฐานและตัวเลขในลอการิทึมต้องเป็นค่าบวก', 'logOut');
            return;
        }
        if (base === 1) {
            showError('ฐานของลอการิทึมต้องไม่เท่ากับ 1', 'logOut');
            return;
        }
        const result = Math.log(num) / Math.log(base);
        const answer = `log${base}(${num}) = ${result.toFixed(6)}`;
        const steps = `<p>logₐ(b) = log(b) / log(a)</p>
        <p>log${base}(${num}) = log(${num}) / log(${base})</p>
        <p>log${base}(${num}) = ${Math.log(num).toFixed(4)} / ${Math.log(base).toFixed(4)} = <b>${result.toFixed(6)}</b></p>`;
        displayResult('logOut', { answer, steps });
    });

    document.getElementById('calcArith').addEventListener('click', () => {
        const a1 = parseFloat(document.getElementById('arith_a1').value);
        const d = parseFloat(document.getElementById('arith_d').value);
        const n = parseInt(document.getElementById('arith_n').value);
        if (isNaN(a1) || isNaN(d) || isNaN(n)) {
            showError('กรุณากรอกข้อมูล a₁, d, และ n ให้ครบถ้วน', 'arithOut'); return;
        }
        if (n <= 0 || !Number.isInteger(n)) {
            showError('จำนวนพจน์ (n) ต้องเป็นจำนวนเต็มบวก', 'arithOut'); return;
        }
        const sum = (n / 2) * (2 * a1 + (n - 1) * d);
        const answer = `ผลบวก ${n} พจน์แรก (Sₙ) = ${sum.toLocaleString()}`;
        const steps = `
            <p>Sₙ = n/2 * (2a₁ + (n-1)d)</p>
            <p>Sₙ = ${n}/2 * (2*${a1} + (${n}-1)*${d})</p>
            <p>Sₙ = ${n/2} * (${2*a1} + ${n-1}*${d}) = <b>${sum.toLocaleString()}</b></p>`;
        displayResult('arithOut', { answer, steps });
    });

    document.getElementById('calcGeo').addEventListener('click', () => {
        const a1 = parseFloat(document.getElementById('geo_a1').value);
        const r = parseFloat(document.getElementById('geo_r').value);
        const n = parseInt(document.getElementById('geo_n').value);
        if (isNaN(a1) || isNaN(r) || isNaN(n)) {
            showError('กรุณากรอกข้อมูล a₁, r, และ n ให้ครบถ้วน', 'geoOut'); return;
        }
        if (n <= 0 || !Number.isInteger(n)) {
            showError('จำนวนพจน์ (n) ต้องเป็นจำนวนเต็มบวก', 'geoOut'); return;
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
            showError('ไม่สามารถคำนวณได้ ผลลัพธ์มีขนาดใหญ่เกินไป', 'geoOut'); return;
        }
        const answer = `ผลบวก ${n} พจน์แรก (Sₙ) = ${sum.toLocaleString()}`;
        displayResult('geoOut', { answer, steps });
    });

    // --- FINANCE TAB ---
    document.getElementById('calcPerc1').addEventListener('click', () => {
        const p = parseFloat(document.getElementById('perc1_p').value);
        const val = parseFloat(document.getElementById('perc1_val').value);
        if (isNaN(p) || isNaN(val)) {
            showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'perc1Out'); return;
        }
        const result = (p / 100) * val;
        const answer = `ผลลัพธ์: ${result.toLocaleString()}`;
        const steps = `<p>(${p} / 100) * ${val} = <b>${result.toLocaleString()}</b></p>`;
        displayResult('perc1Out', { answer, steps });
    });

    document.getElementById('calcPerc2').addEventListener('click', () => {
        const part = parseFloat(document.getElementById('perc2_part').value);
        const total = parseFloat(document.getElementById('perc2_total').value);
        if (isNaN(part) || isNaN(total)) {
            showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'perc2Out'); return;
        }
        if (total === 0) {
            showError('ตัวหาร (ค่าทั้งหมด) ต้องไม่เป็น 0', 'perc2Out'); return;
        }
        const result = (part / total) * 100;
        const answer = `ผลลัพธ์: ${result.toFixed(4)} %`;
        const steps = `<p>(${part} / ${total}) * 100 = <b>${result.toFixed(4)} %</b></p>`;
        displayResult('perc2Out', { answer, steps });
    });

    document.getElementById('calcRatio').addEventListener('click', () => {
        const a = parseInt(document.getElementById('ratio_a').value);
        const b = parseInt(document.getElementById('ratio_b').value);
        if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
            showError('กรุณากรอกตัวเลขจำนวนเต็มบวกสำหรับอัตราส่วน', 'ratioOut'); return;
        }
        if (a === 0 && b === 0) {
            displayResult('ratioOut', '0 : 0'); return;
        }
        const commonDivisor = gcd(a, b);
        const answer = `อัตราส่วนอย่างต่ำ: ${a / commonDivisor} : ${b / commonDivisor}`;
        const steps = `<p>หา ห.ร.ม. ของ ${a} และ ${b} คือ ${commonDivisor}</p><p>(${a} / ${commonDivisor}) : (${b} / ${commonDivisor}) = <b>${a / commonDivisor} : ${b / commonDivisor}</b></p>`;
        displayResult('ratioOut', { answer, steps });
    });

    document.getElementById('calcSI').addEventListener('click', () => {
        const P = parseFloat(document.getElementById('si_p').value);
        const r = parseFloat(document.getElementById('si_r').value) / 100;
        const t = parseFloat(document.getElementById('si_t').value);

        if (isNaN(P) || isNaN(r) || isNaN(t)) {
            showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'siOut'); return;
        }
        if (P < 0 || r < 0 || t < 0) {
            showError('กรุณากรอกค่าที่ไม่ติดลบ', 'siOut'); return;
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
        displayResult('siOut', { answer, steps });
    });

    document.getElementById('calcFV').addEventListener('click', () => {
        const P = parseFloat(document.getElementById('fv_p').value);
        const r_percent = parseFloat(document.getElementById('fv_r').value);
        const n = parseFloat(document.getElementById('fv_n').value);
        const t = parseFloat(document.getElementById('fv_t').value);

        if (isNaN(P) || isNaN(r_percent) || isNaN(n) || isNaN(t)) {
            showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'fvOut'); return;
        }
        if (P < 0 || r_percent < 0 || n <= 0 || t < 0) {
            showError('กรุณากรอกค่าที่ไม่ติดลบ (n ต้องมากกว่า 0)', 'fvOut'); return;
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
        displayResult('fvOut', { answer, steps });
    });

    document.getElementById('calcPV').addEventListener('click', () => {
        const FV = parseFloat(document.getElementById('pv_fv').value);
        const r_percent = parseFloat(document.getElementById('pv_r').value);
        const n = parseFloat(document.getElementById('pv_n').value);
        const t = parseFloat(document.getElementById('pv_t').value);

        if (isNaN(FV) || isNaN(r) || isNaN(n) || isNaN(t)) {
            showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'pvOut'); return;
        }
        if (FV < 0 || r < 0 || n <= 0 || t < 0) {
            showError('กรุณากรอกค่าที่ไม่ติดลบ (n ต้องมากกว่า 0)', 'pvOut'); return;
        }

        const r = r_percent / 100;
        const PV = FV / Math.pow((1 + r / n), n * t);

        const answerObj = {
            'มูลค่าปัจจุบันที่ต้องใช้ (Present Value)': PV.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        };
        const answer = JSON.stringify(answerObj, null, 2);
        const steps = `
            <p>สูตรมูลค่าปัจจุบัน: PV = FV / (1 + r/n)<sup>(n*t)</sup></p>
            <p>PV = ${FV.toLocaleString()} / (1 + ${r}/${n})<sup>(${n}*${t})</sup></p>
            <p><b>PV = ${answerObj['มูลค่าปัจจุบันที่ต้องใช้ (Present Value)']}</b></p>`;
        displayResult('pvOut', { answer, steps });
    });

    document.getElementById('calcLoan').addEventListener('click', () => {
        const P = parseFloat(document.getElementById('loan_p').value);
        const annualRate = parseFloat(document.getElementById('loan_r').value);
        const t = parseFloat(document.getElementById('loan_t').value);
        const nPerYear = parseFloat(document.getElementById('loan_n').value);

        if (isNaN(P) || isNaN(annualRate) || isNaN(t) || isNaN(nPerYear)) {
            showError('กรุณากรอกข้อมูลให้ครบถ้วน', 'loanOut'); return;
        }
        if (P <= 0 || annualRate < 0 || t <= 0 || nPerYear <= 0) {
            showError('กรุณากรอกค่าที่เป็นบวก (ยกเว้นดอกเบี้ย) และมากกว่า 0', 'loanOut'); return;
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
        displayResult('loanOut', { answer, steps });
    });

    document.getElementById('calcNPV').addEventListener('click', () => {
      const rate = parseFloat(document.getElementById('npv_rate').value) / 100;
      const cashFlows = parseNums(document.getElementById('npv_cfs').value);

      if (isNaN(rate) || cashFlows.length === 0) {
          showError('กรุณากรอกข้อมูล Discount Rate และ Cash Flows ให้ครบถ้วน', 'npvOut');
          return;
      }
      if (rate < -1) { // Rate can be negative, but not <= -100%
          showError('Discount Rate ต้องมากกว่าหรือเท่ากับ -100%', 'npvOut');
          return;
      }

      let npv = 0;
      const pv_terms = [];
      cashFlows.forEach((cf, index) => {
          const pv = cf / Math.pow(1 + rate, index);
          pv_terms.push(pv);
          npv += pv;
      });
      const answer = `มูลค่าปัจจุบันสุทธิ (NPV): ${npv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const steps = `
        <p><b>1. คำนวณมูลค่าปัจจุบัน (PV) ของกระแสเงินสดแต่ละงวด:</b></p>
        <p>สูตร: PV = CFₜ / (1+r)ᵗ</p>
        ${cashFlows.map((cf, t) => `<p>งวดที่ ${t}: ${cf.toLocaleString()} / (1 + ${rate})<sup>${t}</sup> = ${pv_terms[t].toLocaleString(undefined, {minimumFractionDigits: 4})}</p>`).join('')}
        <br>
        <p><b>2. รวมมูลค่าปัจจุบันทั้งหมดเพื่อหา NPV:</b></p>
        <p>NPV = ${pv_terms.map(pv => pv.toLocaleString(undefined, {minimumFractionDigits: 4})).join(' + ')}</p>
        <p><b>NPV = ${npv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></p>
        <br>
        <p><b>3. สรุปผล:</b></p>
        <p>${npv > 0 ? 'NPV > 0: โครงการน่าลงทุน' : (npv < 0 ? 'NPV < 0: โครงการไม่น่าลงทุน' : 'NPV = 0: จุดคุ้มทุน')}</p>
      `;
      displayResult('npvOut', { answer, steps });
    });

    document.getElementById('calcIRR').addEventListener('click', () => {
        const cashFlows = parseNums(document.getElementById('irr_cfs').value);
        if (cashFlows.length < 2 || cashFlows[0] >= 0) {
            showError('ต้องมีกระแสเงินสดอย่างน้อย 2 ค่า และค่าแรก (เงินลงทุน) ต้องเป็นค่าลบ', 'irrOut');
            return;
        }

        const irr = solveIRR(cashFlows);

        if (irr === null) {
            showError('ไม่สามารถคำนวณ IRR ได้ อาจเป็นเพราะกระแสเงินสดไม่ปกติ หรือไม่สามารถหาคำตอบได้', 'irrOut');
        } else {
            const answer = `Internal Rate of Return (IRR): ${(irr * 100).toFixed(4)} %`;
            const steps = `
                <p>IRR คืออัตรา (r) ที่ทำให้ NPV = 0</p>
                <p>0 = Σ [CFₜ / (1+IRR)ᵗ]</p>
                <p>ใช้วิธีคำนวณเชิงตัวเลข (Newton-Raphson) เพื่อหาค่า IRR</p>`;
            displayResult('irrOut', { answer, steps });
        }
    });

    // --- INFERENCE TAB ---
    document.getElementById('calcTTest').addEventListener('click', () => {
        const samp1 = parseNums(document.getElementById('ttest_samp1').value);
        const samp2 = parseNums(document.getElementById('ttest_samp2').value);

        if (samp1.length < 2 || samp2.length < 2) {
            showError('แต่ละกลุ่มต้องมีข้อมูลอย่างน้อย 2 ค่า', 'ttestOut'); return;
        }

        const n1 = samp1.length;
        const n2 = samp2.length;
        const mean1 = mean(samp1);
        const mean2 = mean(samp2);
        const var1 = sampleVariance(samp1);
        const var2 = sampleVariance(samp2);

        const t_stat = (mean1 - mean2) / Math.sqrt(var1 / n1 + var2 / n2);

        const df_num = Math.pow(var1 / n1 + var2 / n2, 2);
        const df_den = (Math.pow(var1 / n1, 2) / (n1 - 1)) + (Math.pow(var2 / n2, 2) / (n2 - 1));
        const df = df_num / df_den;
        const answerObj = {
            't-statistic': t_stat.toFixed(4),
            'Degrees of Freedom (df)': df.toFixed(4),
            'คำแนะนำ': 'นำค่า t-statistic ไปเปรียบเทียบกับค่าวิกฤต (critical value) จากตาราง t-distribution ที่ระดับนัยสำคัญ (alpha) และ df ที่คำนวณได้ เพื่อตัดสินใจปฏิเสธหรือยอมรับสมมติฐานหลัก (H₀: μ₁ = μ₂)'
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
            <p>df ≈ (s₁²/n₁ + s₂²/n₂)² / [ (s₁²/n₁)²/(n₁-1) + (s₂²/n₂)²/(n₂-1) ]</p>
            <p><b>df ≈ ${df.toFixed(4)}</b></p>
        `;
        displayResult('ttestOut', { answer, steps });
    });

    document.getElementById('calcChiSquare').addEventListener('click', () => {
        const obs = parseNums(document.getElementById('chi_obs').value);
        const exp = parseNums(document.getElementById('chi_exp').value);

        if (obs.length === 0 || exp.length === 0) {
            showError('กรุณากรอกข้อมูลความถี่ที่สังเกตและคาดหวัง', 'chiOut'); return;
        }
        if (obs.length !== exp.length) {
            showError('จำนวนกลุ่มของความถี่ที่สังเกตและคาดหวังต้องเท่ากัน', 'chiOut'); return;
        }
        if (exp.some(e => e <= 0)) {
            showError('ความถี่ที่คาดหวังทุกค่าต้องเป็นบวก', 'chiOut'); return;
        }
        const sumObs = obs.reduce((a, b) => a + b, 0);
        const sumExp = exp.reduce((a, b) => a + b, 0);
        if (Math.abs(sumObs - sumExp) > 1e-6) {
            showError(`ผลรวมความถี่ที่สังเกต (${sumObs}) ไม่เท่ากับผลรวมความถี่ที่คาดหวัง (${sumExp})`, 'chiOut');
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
        displayResult('chiOut', { answer, steps });
    });

    // --- INITIAL VALUES ---
    document.getElementById('nums').value = '10 20 20 30 40';
    document.getElementById('xs').value = '1 2 3 4 5';
    document.getElementById('ys').value = '2 4 5 4 5';
    document.getElementById('ev_outcomes').value = '100 200';
    document.getElementById('ev_probs').value = '0.5 0.5';

    document.getElementById('payoff_matrix').value = '100 50 -20\n80 60 40\n-10 70 90';
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
    document.getElementById('irr_cfs').value = '-10000, 3000, 4000, 5000, 2000';

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
  });
