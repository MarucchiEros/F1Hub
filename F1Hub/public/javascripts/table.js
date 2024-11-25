document.addEventListener('DOMContentLoaded', function() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const dataTabs = document.querySelectorAll('.data-tab');
    const formSections = document.querySelectorAll('.form-data');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();

            // Nascondi tutte le tab di dati e form
            dataTabs.forEach(tab => {
                tab.style.display = 'none';
            });
            formSections.forEach(form => {
                form.style.display = 'none';
            });

            // Mostra la tab e il form selezionato
            const tabToShow = document.querySelector(`#${this.dataset.tab}-data`);
            const formToShow = document.querySelector(`#${this.dataset.tab}-form`);

            if (tabToShow) {
                tabToShow.style.display = 'block';
            }
            if (formToShow) {
                formToShow.style.display = 'block';
            }
        });
    });

    // Mostra la prima tab per default (opzionale)
    if (dataTabs.length > 0) {
        dataTabs[0].style.display = 'block';
        formSections[0].style.display = 'block';
    }

    // Funzione per ordinare le righe della tabella
    function sortTable(table, column, order) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((rowA, rowB) => {
            const cellA = rowA.children[column].textContent;
            const cellB = rowB.children[column].textContent;

            if (order === 'asc') {
                return cellA.localeCompare(cellB);
            } else {
                return cellB.localeCompare(cellA);
            }
        });

        // Aggiungi le righe ordinate di nuovo al tbody
        rows.forEach(row => tbody.appendChild(row));
    }

    // Gestisci il click sulle intestazioni delle tabelle
    document.querySelectorAll('.sortable').forEach(header => {
        let order = 'asc';
        
        header.addEventListener('click', () => {
            const table = header.closest('table'); // Trova la tabella associata
            const index = Array.from(header.parentNode.children).indexOf(header); // Trova l'indice della colonna

            sortTable(table, index, order);
            order = order === 'asc' ? 'desc' : 'asc'; // Alterna l'ordine
        });
    });
});