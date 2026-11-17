/* =====================================================================
   journal.js — moteur commun des exercices de journalisation
   ---------------------------------------------------------------------
   Chaque page d'exercice définit simplement :

       const EXERCICE = {
           comptes:   { "ACTIF": [...], "PASSIF": [...], ... },
           ecritures: [ { description: "...", solution: [ ... ] }, ... ],
           messageFin: "..."   // facultatif
       };

   puis charge ce fichier :  <script src="journal.js"></script>

   Corriger un bug ou changer un comportement ICI le corrige pour
   toutes les pages qui utilisent journal.js.
   ===================================================================== */

(function () {

    // ----- Blocage F12 / Ctrl+U (facultatif : supprimer ce bloc pour le désactiver)
    document.addEventListener('keydown', function (e) {
        if (e.keyCode == 123 ||                                  // F12
            (e.ctrlKey && e.shiftKey && e.keyCode == 73) ||      // Ctrl+Shift+I
            (e.ctrlKey && e.keyCode == 85)) {                    // Ctrl+U
            e.preventDefault();
        }
    });

    // ----- Construction de la page à partir de EXERCICE
    const zone = document.getElementById('exercice');
    zone.innerHTML = `
        <div class="stats">
            <div id="remaining"></div>
            <div id="score"></div>
        </div>

        <div class="entry-description" id="entry-description"></div>

        <form id="accounting-form" onsubmit="return false">
            <table id="entries-table">
                <thead>
                    <tr>
                        <th>Comptes débités</th>
                        <th>Comptes crédités</th>
                        <th>Montant débité</th>
                        <th>Montant crédité</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </form>

        <div class="buttons">
            <button id="add-line-btn" type="button">Ajouter une ligne</button>
            <div>
                <button id="quit-btn" type="button" onclick="window.close()">Quitter</button>
            </div>
            <div>
                <button id="validate-btn" type="button">Valider</button>
                <button id="next-btn" type="button" disabled>Ecriture suivante</button>
            </div>
        </div>

        <div id="feedback" class="feedback"></div>

        <table id="solution-table" class="solution-table">
            <thead>
                <tr>
                    <th>Comptes débités</th>
                    <th>Comptes crédités</th>
                    <th>Montant débité (CHF)</th>
                    <th>Montant crédité (CHF)</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>

        <div id="completion-message" class="completion-message">
            <h3>Félicitations ! Vous avez terminé toutes les écritures.</h3>
            <p>A vous de juger votre score : <span id="final-score">0</span></p>
            <h3>${EXERCICE.messageFin || `N'oubliez pas : "Je fais de la compta et c'est ma joie"`}</h3>
        </div>
        <button id="restart-btn" type="button">Recommencer</button>
    `;

    // Menu déroulant des comptes, construit une seule fois depuis EXERCICE.comptes
    let optionsComptes = '<option value=""></option>';
    for (const groupe in EXERCICE.comptes) {
        optionsComptes += `<optgroup label="${groupe}">`;
        EXERCICE.comptes[groupe].forEach(c => {
            optionsComptes += `<option value="${c}">${c}</option>`;
        });
        optionsComptes += '</optgroup>';
    }

    // Contrôle pour l'auteur : signale dans la console (F12) un compte
    // utilisé dans une solution mais absent du menu
    const tousLesComptes = Object.values(EXERCICE.comptes).flat();
    EXERCICE.ecritures.forEach((e, i) => e.solution.forEach(l => {
        [l.debit, l.credit].forEach(c => {
            if (c && !tousLesComptes.includes(c)) {
                console.warn(`Écriture ${i + 1} : le compte "${c}" n'est pas dans le menu.`);
            }
        });
    }));

    // ----- Données et état
    // Mélanger les écritures (copie, pour ne pas toucher aux données de la page)
    let accountingEntries = [...EXERCICE.ecritures].sort(() => Math.random() - 0.5);

    let currentEntryIndex = 0;
    let remainingEntries = accountingEntries.length;
    let score = 0;
    let isValidationDone = false;

    // ----- Éléments DOM
    const $ = id => document.getElementById(id);
    const entryDescription = $('entry-description');
    const entriesTable = $('entries-table');
    const validateBtn = $('validate-btn');
    const nextBtn = $('next-btn');
    const addLineBtn = $('add-line-btn');
    const feedback = $('feedback');
    const solutionTable = $('solution-table');
    const remainingSpan = $('remaining');
    const scoreSpan = $('score');
    const completionMessage = $('completion-message');
    const finalScoreSpan = $('final-score');
    const restartBtn = $('restart-btn');

    // Arrondi au centime : évite qu'un 0.1 + 0.2 = 0.30000000000000004
    // fasse refuser une réponse juste
    const cts = x => Math.round(x * 100);

    function updateStats() {
        remainingSpan.textContent = `Écritures restantes: ${remainingEntries}`;
        scoreSpan.textContent = `Score: ${score}/${accountingEntries.length}`;
    }

    function loadEntry(index) {
        if (index >= accountingEntries.length) {
            showCompletionMessage();
            return;
        }
        entryDescription.textContent = accountingEntries[index].description;

        entriesTable.querySelector('tbody').innerHTML = '';
        addNewLine();

        feedback.style.display = 'none';
        solutionTable.style.display = 'none';
        validateBtn.disabled = false;
        nextBtn.disabled = true;
        isValidationDone = false;
    }

    function showCompletionMessage() {
        entriesTable.style.display = 'none';
        validateBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        addLineBtn.style.display = 'none';
        entryDescription.style.display = 'none';
        document.querySelector('.stats').style.display = 'none';

        finalScoreSpan.textContent = `${score}/${accountingEntries.length}`;
        completionMessage.style.display = 'block';
        restartBtn.style.display = 'block';
    }

    function restartGame() {
        accountingEntries = [...EXERCICE.ecritures].sort(() => Math.random() - 0.5);
        currentEntryIndex = 0;
        remainingEntries = accountingEntries.length;
        score = 0;

        // '' = revenir à l'affichage prévu par style.css
        entriesTable.style.display = '';
        validateBtn.style.display = '';
        nextBtn.style.display = '';
        addLineBtn.style.display = '';
        entryDescription.style.display = '';
        document.querySelector('.stats').style.display = '';

        completionMessage.style.display = 'none';
        restartBtn.style.display = 'none';

        updateStats();
        loadEntry(currentEntryIndex);
    }

    function addNewLine() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><select class="debit-account">${optionsComptes}</select></td>
            <td><select class="credit-account">${optionsComptes}</select></td>
            <td><input type="number" class="debit-amount" min="0" step="100" style="text-align: right;"></td>
            <td><input type="number" class="credit-amount" min="0" step="100" style="text-align: right;"></td>
        `;
        entriesTable.querySelector('tbody').appendChild(row);
        row.querySelector('.debit-account').focus();
    }

    function validateAnswer() {
        if (isValidationDone) return;

        const correctSolution = accountingEntries[currentEntryIndex].solution;

        if (checkSolution(getUserEntries(), correctSolution)) {
            feedback.textContent = "Bravo ! Votre réponse est correcte.";
            feedback.className = "feedback correct";
            score++;
        } else {
            feedback.textContent = "Voici la bonne réponse :";
            feedback.className = "feedback incorrect";
            showSolution(correctSolution);
            markIncorrectCells(correctSolution);
        }

        feedback.style.display = 'block';
        validateBtn.disabled = true;
        nextBtn.disabled = false;
        isValidationDone = true;
        remainingEntries--;
        updateStats();
    }

    function getUserEntries() {
        const entries = [];
        entriesTable.querySelectorAll('tbody tr').forEach(row => {
            const debitAccount = row.querySelector('.debit-account').value;
            const creditAccount = row.querySelector('.credit-account').value;
            const debitAmount = parseFloat(row.querySelector('.debit-amount').value) || 0;
            const creditAmount = parseFloat(row.querySelector('.credit-amount').value) || 0;

            if (debitAccount && debitAmount > 0) {
                entries.push({ account: debitAccount, type: 'debit', amount: debitAmount });
            }
            if (creditAccount && creditAmount > 0) {
                entries.push({ account: creditAccount, type: 'credit', amount: creditAmount });
            }
        });
        return entries;
    }

    // Compare, compte par compte, les totaux débit et crédit (en centimes)
    function checkSolution(userEntries, correctSolution) {
        const user = {}, correct = {};
        const add = (obj, account, side, amount) => {
            if (!obj[account]) obj[account] = { debit: 0, credit: 0 };
            obj[account][side] += cts(amount);
        };

        userEntries.forEach(e => add(user, e.account, e.type, e.amount));
        correctSolution.forEach(e => {
            if (e.debit) add(correct, e.debit, 'debit', e.amount);
            if (e.credit) add(correct, e.credit, 'credit', e.amount);
        });

        const comptes = new Set([...Object.keys(user), ...Object.keys(correct)]);
        for (const c of comptes) {
            if (!user[c] || !correct[c] ||
                user[c].debit !== correct[c].debit ||
                user[c].credit !== correct[c].credit) {
                return false;
            }
        }
        return true;
    }

    // Colore en rouge les cases fausses et signale les écritures manquantes
    function markIncorrectCells(correctSolution) {
        // Lignes attendues encore "disponibles" (une ligne juste ne sert qu'une fois)
        const attendues = [];
        correctSolution.forEach(e => {
            if (e.debit) attendues.push({ account: e.debit, type: 'debit', amount: cts(e.amount) });
            if (e.credit) attendues.push({ account: e.credit, type: 'credit', amount: cts(e.amount) });
        });
        const verifier = (account, type, amount) => {
            const i = attendues.findIndex(e =>
                e.account === account && e.type === type && e.amount === cts(amount));
            if (i === -1) return false;
            attendues.splice(i, 1);
            return true;
        };

        entriesTable.querySelectorAll('tbody tr').forEach(row => {
            ['debit', 'credit'].forEach(type => {
                const compte = row.querySelector(`.${type}-account`);
                const montant = row.querySelector(`.${type}-amount`);
                const valeur = parseFloat(montant.value) || 0;
                if (compte.value && valeur > 0 && !verifier(compte.value, type, valeur)) {
                    compte.style.backgroundColor = '#ffcccc';
                    montant.style.backgroundColor = '#ffcccc';
                }
            });
        });

        if (attendues.length > 0) {
            feedback.textContent += ` Il manque ${attendues.length} écriture(s).`;
        }
    }

    function showSolution(solution) {
        const tbody = solutionTable.querySelector('tbody');
        tbody.innerHTML = '';
        solution.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.debit || ''}</td>
                <td>${entry.credit || ''}</td>
                <td style="text-align: right;">${entry.debit ? formatAmount(entry.amount) : ''}</td>
                <td style="text-align: right;">${entry.credit ? formatAmount(entry.amount) : ''}</td>
            `;
            tbody.appendChild(row);
        });
        solutionTable.style.display = 'table';
    }

    // Montant avec apostrophe : 12'345.60
    function formatAmount(amount) {
        const [ent, dec] = Number(amount).toFixed(2).split('.');
        return `${ent.replace(/\B(?=(\d{3})+(?!\d))/g, "'")}.${dec}`;
    }

    function nextEntry() {
        currentEntryIndex++;
        loadEntry(currentEntryIndex);
    }

    validateBtn.addEventListener('click', validateAnswer);
    nextBtn.addEventListener('click', nextEntry);
    addLineBtn.addEventListener('click', addNewLine);
    restartBtn.addEventListener('click', restartGame);

    updateStats();
    loadEntry(currentEntryIndex);
})();
