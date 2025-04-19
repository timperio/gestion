document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti agli elementi del DOM
    const addForm = document.getElementById('add-client-form');
    const clientNameInput = document.getElementById('client-name');
    const monthlyPriceInput = document.getElementById('monthly-price');
    const clientListBody = document.getElementById('client-list-body');
    const monthlyTotalSpan = document.getElementById('monthly-total');
    const annualTotalSpan = document.getElementById('annual-total');

    // Riferimenti Modale
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-client-form');
    const editClientIdInput = document.getElementById('edit-client-id');
    const editClientNameInput = document.getElementById('edit-client-name');
    const editMonthlyPriceInput = document.getElementById('edit-monthly-price');
    const closeButton = document.querySelector('.close-button');

    // ----- Gestione Dati -----
    let clients = [];

    // Funzione per caricare i clienti da Local Storage
    function loadClients() {
        const storedClients = localStorage.getItem('clients');
        if (storedClients) {
            clients = JSON.parse(storedClients);
        } else {
            // Dati di esempio se non c'è nulla nello storage
            clients = [
                { id: Date.now() + 1, name: "Azienda Alfa Srl", monthlyPrice: 250.00 },
                { id: Date.now() + 2, name: "Beta Services Sas", monthlyPrice: 120.50 },
                { id: Date.now() + 3, name: "Gamma Solutions", monthlyPrice: 300.00 }
            ];
        }
        renderClients();
    }

    // Funzione per salvare i clienti in Local Storage
    function saveClients() {
        localStorage.setItem('clients', JSON.stringify(clients));
    }

    // ----- Rendering e Calcoli -----

    // Funzione per formattare i prezzi come valuta
    function formatCurrency(amount) {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    // Funzione per calcolare e mostrare i totali
    function calculateTotals() {
        const monthlyTotal = clients.reduce((sum, client) => sum + parseFloat(client.monthlyPrice || 0), 0);
        const annualTotal = monthlyTotal * 12;

        monthlyTotalSpan.textContent = formatCurrency(monthlyTotal);
        annualTotalSpan.textContent = formatCurrency(annualTotal);
    }

    // Funzione principale per renderizzare la tabella dei clienti
    function renderClients() {
        clientListBody.innerHTML = ''; // Pulisce la tabella

        if (clients.length === 0) {
            const emptyRow = clientListBody.insertRow();
            const cell = emptyRow.insertCell();
            cell.colSpan = 3;
            cell.textContent = 'Nessun cliente aggiunto.';
            cell.style.textAlign = 'center';
            cell.style.fontStyle = 'italic';
        } else {
            clients.forEach((client, index) => {
                const row = clientListBody.insertRow();
                row.setAttribute('draggable', true);
                row.dataset.id = client.id; // Usa l'ID univoco
                row.dataset.index = index; // Mantiene anche l'indice per facilitare riordino

                // Cella Nome
                const nameCell = row.insertCell();
                nameCell.textContent = client.name;

                // Cella Prezzo
                const priceCell = row.insertCell();
                priceCell.textContent = formatCurrency(client.monthlyPrice);
                priceCell.style.textAlign = 'right'; // Allinea prezzi a destra

                // Cella Azioni (Bottoni)
                const actionsCell = row.insertCell();
                actionsCell.style.whiteSpace = 'nowrap'; // Evita wrap bottoni

                const editButton = document.createElement('button');
                editButton.textContent = 'Modifica';
                editButton.classList.add('btn', 'btn-edit');
                editButton.dataset.id = client.id;
                editButton.addEventListener('click', () => openEditModal(client.id));
                actionsCell.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Elimina';
                deleteButton.classList.add('btn', 'btn-delete');
                deleteButton.dataset.id = client.id;
                deleteButton.addEventListener('click', () => deleteClient(client.id));
                actionsCell.appendChild(deleteButton);

                // Aggiungi Event Listener per Drag & Drop alla riga
                addDragDropListeners(row);
            });
        }

        calculateTotals();
    }

    // ----- Gestione Eventi Form -----

    // Aggiunta nuovo cliente
    addForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Impedisce ricaricamento pagina

        const name = clientNameInput.value.trim();
        const price = parseFloat(monthlyPriceInput.value);

        if (name && !isNaN(price) && price >= 0) {
            const newClient = {
                id: Date.now(), // ID univoco basato sul timestamp
                name: name,
                monthlyPrice: price
            };
            clients.push(newClient);
            saveClients();
            renderClients();

            // Resetta il form
            addForm.reset();
        } else {
            alert('Per favore, inserisci un nome valido e un prezzo numerico non negativo.');
        }
    });

    // ----- Gestione Eliminazione -----
    function deleteClient(id) {
        if (confirm('Sei sicuro di voler eliminare questo cliente?')) {
            clients = clients.filter(client => client.id !== id);
            saveClients();
            renderClients();
        }
    }

    // ----- Gestione Modifica (Modale) -----
    function openEditModal(id) {
        const client = clients.find(c => c.id === id);
        if (client) {
            editClientIdInput.value = client.id;
            editClientNameInput.value = client.name;
            editMonthlyPriceInput.value = client.monthlyPrice;
            editModal.style.display = 'flex'; // Mostra la modale
        }
    }

    function closeEditModal() {
        editModal.style.display = 'none'; // Nasconde la modale
        editForm.reset(); // Resetta i campi della modale
    }

    // Salva modifiche dalla modale
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(editClientIdInput.value); // Assicura che l'ID sia un numero se necessario (qui usiamo quello originale)
        const name = editClientNameInput.value.trim();
        const price = parseFloat(editMonthlyPriceInput.value);

        if (name && !isNaN(price) && price >= 0) {
            clients = clients.map(client =>
                client.id === id ? { ...client, name: name, monthlyPrice: price } : client
            );
            saveClients();
            renderClients();
            closeEditModal();
        } else {
            alert('Per favore, inserisci un nome valido e un prezzo numerico non negativo.');
        }
    });

    // Chiudi modale cliccando sul bottone 'X'
    closeButton.addEventListener('click', closeEditModal);

    // Chiudi modale cliccando fuori dall'area del contenuto
    window.addEventListener('click', (event) => {
        if (event.target === editModal) {
            closeEditModal();
        }
    });

    // ----- Gestione Drag and Drop -----
    let draggedItem = null; // Elemento TR trascinato
    let originalIndex = -1;

    function addDragDropListeners(row) {
        row.addEventListener('dragstart', handleDragStart);
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('dragleave', handleDragLeave);
        row.addEventListener('drop', handleDrop);
        row.addEventListener('dragend', handleDragEnd);
    }

    function handleDragStart(e) {
        draggedItem = this; // 'this' si riferisce alla riga (TR)
        originalIndex = parseInt(this.dataset.index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML); // Non strettamente necessario, ma buona pratica
        // Aggiunge stile visivo leggero all'elemento trascinato
        setTimeout(() => this.classList.add('dragging'), 0);
    }

    function handleDragOver(e) {
        e.preventDefault(); // Necessario per permettere il drop
        e.dataTransfer.dropEffect = 'move';
        this.classList.add('drag-over'); // Evidenzia la riga sotto il cursore
    }

     function handleDragLeave(e) {
        this.classList.remove('drag-over'); // Rimuove l'evidenziazione
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation(); // Impedisce la gestione dell'evento da elementi parent

        const targetRow = this;
        const targetIndex = parseInt(targetRow.dataset.index);

        if (draggedItem !== targetRow) {
            // Rimuovi l'elemento dalla sua posizione originale nell'array
            const [movedClient] = clients.splice(originalIndex, 1);

            // Inseriscilo nella nuova posizione
            clients.splice(targetIndex, 0, movedClient);

            // Salva e ri-renderizza per aggiornare l'ordine e gli indici
            saveClients();
            renderClients(); // Render aggiornerà anche gli stili e gli indici data-*
        }
        targetRow.classList.remove('drag-over');
    }

    function handleDragEnd(e) {
        // Rimuovi tutte le classi di stile temporanee dal drag&drop
        const rows = clientListBody.querySelectorAll('tr');
        rows.forEach(row => {
            row.classList.remove('dragging');
            row.classList.remove('drag-over');
        });
        draggedItem = null;
        originalIndex = -1;
    }

    // ----- Inizializzazione -----
    loadClients(); // Carica i dati all'avvio
});