const principles = [
    "Adesão Livre e Voluntária",
    "Gestão Democrática",
    "Participação Econômica",
    "Autonomia e Independência",
    "Educação, Formação e Informação",
    "Intercooperação",
    "Interesse pela Comunidade"
];

// Cores para cada princípio
const principleColors = [
    "#90EE90", // PaleGreen
    "#8FBC8F", // LightGreen
    "#70EE70", // Dodger Blue
    "#8FBC8F", // Sea Green
    "#50EE50", // Blue
    "#8FBC8F", // Medium Blue
    "#90EE90",  // Dark Blue
];

const tableBody = document.getElementById('comparisonRows');
const form = document.getElementById('comparisonForm');

function createComparisonRow(principleA, principleB) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="radio" name="comparison_${principleA}_${principleB}" value="A" checked> ${principleA}</td>
        <td><input type="radio" name="comparison_${principleA}_${principleB}" value="B"> ${principleB}</td>
        <td>
            <input type="checkbox" name="equal_${principleA}_${principleB}" value="1"> Sim
        </td>
        <td>
            <select name="av_${principleA}_${principleB}" required style="text-align: center;">
                <option value="" disabled selected><strong>Quanto mais importante?</option>
                <option value="2">2</option>
                <option value="3">3 - Importância moderada</option>
                <option value="4">4</option>
                <option value="5">5 - Forte importância</option>
                <option value="6">6</option>
                <option value="7">7 - Importância muito forte</option>
                <option value="8">8</option>
                <option value="9">9 - Extrema importância</option>
            </select>
        </td>
    `;

    const equalCheckbox = row.querySelector(`[name="equal_${principleA}_${principleB}"]`);
    const importanceSelect = row.querySelector(`[name="av_${principleA}_${principleB}"]`);

    equalCheckbox.addEventListener('change', function(event) {
        if (event.target.checked) {
            importanceSelect.disabled = true;
        } else {
            importanceSelect.disabled = false;
        }
    });

    return row;
}

principles.forEach((principleA, indexA) => {
    principles.slice(indexA + 1).forEach(principleB => {
        const comparisonRow = createComparisonRow(principleA, principleB);
        comparisonRow.style.backgroundColor = principleColors[indexA];
        tableBody.appendChild(comparisonRow);
    });
});

function buildMatrix() {
    const n = principles.length;
    let matrix = Array.from({ length: n }, () => Array(n).fill(1));

    principles.forEach((principleA, indexA) => {
        principles.slice(indexA + 1).forEach((principleB, indexB) => {
            const selected = document.querySelector(`input[name="comparison_${principleA}_${principleB}"]:checked`).value;
            const isEqual = document.querySelector(`input[name="equal_${principleA}_${principleB}"]`).checked;
            const value = parseFloat(document.querySelector(`select[name="av_${principleA}_${principleB}"]`).value);

            const i = principles.indexOf(principleA);
            const j = principles.indexOf(principleB);

            if (isEqual) {
                matrix[i][j] = 1;
                matrix[j][i] = 1;
            } else if (selected === 'A') {
                matrix[i][j] = value;
                matrix[j][i] = 1 / value;
            } else {
                matrix[i][j] = 1 / value;
                matrix[j][i] = value;
            }
        });
    });

    return matrix;
}

function displayMatrix(matrix) {
    let result = '<h3>Matriz de Comparação Pareada</h3><table border="1"><thead><tr><th></th>';

    principles.forEach(principle => {
        result += `<th>${principle}</th>`;
    });

    result += '</tr></thead><tbody>';

    matrix.forEach((row, i) => {
        result += `<tr><th>${principles[i]}</th>`;
        row.forEach(value => {
            result += `<td>${value.toFixed(2)}</td>`;
        });
        result += '</tr>';
    });

    result += '</tbody></table>';
    document.getElementById('matrixResult').innerHTML = result;
}

document.getElementById('buildMatrixButton').addEventListener('click', function() {
    const matrix = buildMatrix();
    displayMatrix(matrix);
});

document.getElementById('calculateResultsButton').addEventListener('click', function() {
    const matrix = buildMatrix();
    const weights = calculateAHP(matrix);
    displayResults(weights);
    drawChart(weights.weights);
});

function calculateAHP(matrix) {
    const n = matrix.length;
    let sumColumns = Array(n).fill(0);
    let normalizedMatrix = Array.from({ length: n }, () => Array(n).fill(0));
    let weights = Array(n).fill(0);

    // Soma das colunas
    for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
            sumColumns[j] += matrix[i][j];
        }
    }

    // Normalização da matriz
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            normalizedMatrix[i][j] = matrix[i][j] / sumColumns[j];
        }
    }

    // Cálculo dos pesos (média das linhas da matriz normalizada)
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            weights[i] += normalizedMatrix[i][j];
        }
        weights[i] /= n;
    }

    // Cálculo do coeficiente de consistência (CR)
    let lambdaMax = 0;
    for (let i = 0; i < n; i++) {
        let rowSum = 0;
        for (let j = 0; j < n; j++) {
            rowSum += matrix[i][j] * weights[j];
        }
        lambdaMax += rowSum / weights[i];
    }
    lambdaMax /= n;

    const ci = (lambdaMax - n) / (n - 1);
    const ri = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45];  // Valores de RI para matrizes de 1 a 9
    const cr = ci / ri[n - 1];

    return { weights, cr };
}

function displayResults({ weights, cr }) {
    let result = '<h3>Resultado da Análise AHP</h3><table border="2">';

    result += '<thead><tr><th>Princípio</th><th>Peso</th></tr></thead><tbody>';

    weights.forEach((weight, i) => {
        result += `<tr><td><strong>${principles[i]}</strong></td><td><strong>${(weight * 100).toFixed(2)}%</strong></td></tr>`;
    });

    result += '</tbody></table>';
    result += `<p><h3><strong>Coeficiente de Consistência (CR):</strong> ${cr.toFixed(3)}</h3></p>`;
        if (cr > 0.1) {
    result += '<p style="color:red;"><strong>O julgamento entres pares É INCONSISTENTE</strong>. Por favor, REVISE suas comparações.</strong></p>';
    }
        if (cr < 0.1) {
    result += '<p style="color:green;"><strong>O julgamento entres pares É CONSISTENTE!</strong></p>';
    }
    document.getElementById('results').innerHTML = result;
}

function drawChart(weights) {
    const ctx = document.getElementById('resultsChart').getContext('3d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: principles,
            datasets: [{
                label: 'Peso dos Princípios',
                data: weights.map(weight => weight * 100),
                backgroundColor: principleColors,
                borderColor: principleColors,
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                datalabels: {
                    color: 'black',
                    formatter: (value) => value.toFixed(2) + '%'
                }
            }
        }
    });
}
