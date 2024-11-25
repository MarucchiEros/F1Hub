document.addEventListener('DOMContentLoaded', () => {

  // Gestione del cambiamento delle tab
  document.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const selectedTab = e.target.getAttribute('data-tab');

      // Nascondi tutte le tab
      document.querySelectorAll('.data-tab').forEach(tab => {
        tab.style.display = 'none';
      });

      // Mostra la tab selezionata
      document.getElementById(`${selectedTab}-data`).style.display = 'block';

      // Rimuovi la classe 'selected' da tutte le tab
      document.querySelectorAll('.tab-link').forEach(tab => {
        tab.classList.remove('selected');
      });

      // Aggiungi la classe 'selected' alla tab selezionata
      e.target.classList.add('selected');
    });
  });

  // Gestione della visualizzazione del dropdown
  document.querySelectorAll('.dropdown-toggle').forEach(item => {
    item.addEventListener('click', event => {
      const target = event.target.closest('.dropdown-toggle');
      if (target) {
        target.classList.toggle('toggle-change');
      }
    });
  });

  // Funzione per inviare la richiesta di eliminazione di un elemento
  document.querySelectorAll('.ri-delete-bin-line').forEach(button => {
    button.addEventListener('click', function () {
      const id = this.getAttribute('data-id');
      const type = this.getAttribute('data-type');

      if (confirm(`Sei sicuro di voler eliminare questa ${type}?`)) {
        fetch(`/delete/${type}/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then(response => {
            if (response.ok) {
              this.closest('tr').remove();
            } else {
              alert('Errore nell\'eliminazione');
            }
          })
          .catch(error => {
            console.error('Errore:', error);
            alert('Errore nell\'eliminazione');
          });
      }
    });
  });

  // Gestione dell'aggiunta ai preferiti
  document.querySelectorAll('.add-to-favorites').forEach(button => {
    button.addEventListener('click', function () {
      const elementoId = this.getAttribute('data-id');
      const tipoElemento = this.getAttribute('data-type');

      fetch('/preferiti/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elemento_id: elementoId,
          tipo_elemento: tipoElemento,
        }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            alert(data.message);
          } else {
            alert('Errore sconosciuto.');
          }
        })
        .catch(error => {
          console.error('Errore durante l\'aggiunta ai preferiti:', error);
          alert('Errore durante l\'aggiunta ai preferiti');
        });
    });
  });

  // Recupero e visualizzazione dei preferiti
  const preferitiLink = document.querySelector('.nav-links a[data-tab="preferiti"]');
  const preferitiTab = document.getElementById('preferiti-data');
  const preferitiList = document.getElementById('preferiti-list');

  preferitiLink.addEventListener('click', () => {
    fetch('/preferiti')
      .then(response => response.json())
      .then(preferiti => {
        preferitiList.innerHTML = ''; // Svuota la lista esistente

        if (preferiti.length === 0) {
          preferitiList.innerHTML = '<tr><td colspan="4">Non hai preferiti.</td></tr>';
        } else {
          preferiti.forEach(item => {
            const tr = document.createElement('tr');
            let nome = '';
            let dettagli = '';
            let tipo = '';

            if (item.tipo === 'scuderia') {
              tipo = 'Scuderia';
              nome = item.nome;
              dettagli = `Sede: ${item.sede}, Anno Fondazione: ${item.anno_fondazione}`;
            } else if (item.tipo === 'pilota') {
              tipo = 'Pilota';
              nome = `${item.nome} ${item.cognome}`;
              dettagli = `Numero: ${item.numero}`;
            } else if (item.tipo === 'pista') {
              tipo = 'Pista';
              nome = item.paese;
              dettagli = `Lunghezza: ${item.lunghezza}m, Numero Curve: ${item.numero_curve}`;
            }

            tr.innerHTML = `
              <td>${tipo}</td>
              <td>${nome}</td>
              <td>${dettagli}</td>
              <td>
                <button class="remove-from-favorites" data-id="${item.id}" data-type="${item.tipo}">Rimuovi</button>
              </td>
            `;
            preferitiList.appendChild(tr);
          });
        }

        // Mostra la tabella dei preferiti
        preferitiTab.style.display = 'block';
      })
      .catch(err => console.error('Errore nel recupero dei preferiti:', err));
  });

  // Rimozione dai preferiti
  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('remove-from-favorites')) {
      const elementoId = e.target.getAttribute('data-id');
      const tipoElemento = e.target.getAttribute('data-type');

      fetch('/preferiti/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elemento_id: elementoId,
          tipo_elemento: tipoElemento,
        }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === 'Preferito rimosso con successo!') {
            e.target.closest('tr').remove();  // Rimuovi la riga dalla tabella
          } else {
            alert('Errore nella rimozione del preferito.');
          }
        })
        .catch(err => console.error('Errore nella rimozione dal preferito:', err));
    }
  });

  // Funzione per ordinare le tabelle
  const sortTable = (table, columnIndex, isAscending) => {
    const rows = Array.from(table.querySelector('tbody').rows);
    rows.sort((a, b) => {
      const aText = a.cells[columnIndex].textContent.trim();
      const bText = b.cells[columnIndex].textContent.trim();

      return isAscending ? aText.localeCompare(bText) : bText.localeCompare(aText);
    });

    rows.forEach(row => table.querySelector('tbody').appendChild(row));
  };

  // Gestione dell'ordinamento delle colonne
  document.querySelectorAll('th.sortable').forEach(header => {
    header.addEventListener('click', function () {
      const columnIndex = Array.from(header.parentNode.children).indexOf(header);
      const table = header.closest('table');
      const isAscending = header.classList.contains('asc');

      // Aggiungi o rimuovi classi di ordinamento
      table.querySelectorAll('th.sortable').forEach(h => {
        h.classList.remove('asc', 'desc');
      });

      header.classList.toggle('asc', !isAscending);
      header.classList.toggle('desc', isAscending);

      // Ordinamento
      sortTable(table, columnIndex, !isAscending);
    });
  });

});


// Funzione per la modifica dei dati
document.addEventListener('DOMContentLoaded', function () {
  const tables = document.querySelectorAll('table');
  
  tables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      
      rows.forEach(row => {
          const cells = row.querySelectorAll('.editable');
          const editBtn = row.querySelector('.edit-btn');
          const saveBtn = row.querySelector('.save-btn');
          
          // Modifica la riga
          if (editBtn) {
              editBtn.addEventListener('click', function () {
                  const columns = row.querySelectorAll('.editable');
                  columns.forEach(cell => {
                      cell.contentEditable = true;
                      cell.style.backgroundColor = "#f9f9f9";  // Evidenzia la cella come modificabile
                  });

                  // Mostra il pulsante di salvataggio e nascondi quello di modifica
                  saveBtn.style.display = 'inline-block';
                  editBtn.style.display = 'none';
              });
          }

          // Salva la modifica
          if (saveBtn) {
              saveBtn.addEventListener('click', function () {
                  const rowId = row.getAttribute('data-id');  // Assicurati che la riga abbia un attributo 'data-id'
                  const columns = row.querySelectorAll('.editable');
                  const data = {};

                  columns.forEach(col => {
                      const columnName = col.getAttribute('data-column');  // Assicurati che ogni cella abbia 'data-column'
                      data[columnName] = col.innerText.trim();  // Prendi il valore da salvare
                  });

                  // Se la tabella è 'scuderie'
                  if (table.id === 'scuderie-table') {
                      fetch('/update/scuderie', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                              id: rowId,  // ID della riga da aggiornare
                              data: data   // I dati aggiornati
                          })
                      })
                      .then(response => response.json())
                      .then(result => {
                          if (result.success) {
                              alert('Dati salvati con successo!');
                              columns.forEach(col => col.contentEditable = false);  // Blocca l'editing
                              saveBtn.style.display = 'none';  // Nascondi il pulsante di salvataggio
                              editBtn.style.display = 'inline-block';  // Mostra il pulsante di modifica
                          } else {
                              alert('Errore nel salvataggio');
                          }
                      })
                      .catch(error => alert('Errore nella comunicazione con il server.'));
                  }

                  // Se la tabella è 'piste'
                  if (table.id === 'piste-table') {
                      fetch('/update/piste', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                              id: rowId,  // ID della riga da aggiornare
                              data: data   // I dati aggiornati
                          })
                      })
                      .then(response => response.json())
                      .then(result => {
                          if (result.success) {
                              alert('Dati salvati con successo!');
                              columns.forEach(col => col.contentEditable = false);  // Blocca l'editing
                              saveBtn.style.display = 'none';  // Nascondi il pulsante di salvataggio
                              editBtn.style.display = 'inline-block';  // Mostra il pulsante di modifica
                          } else {
                              alert('Errore nel salvataggio');
                          }
                      })
                      .catch(error => alert('Errore nella comunicazione con il server.'));
                  }

                  // Se la tabella è 'piloti'
                  if (table.id === 'piloti-table') {
                      fetch('/update/piloti', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                              id: rowId,  // ID della riga da aggiornare
                              data: data   // I dati aggiornati
                          })
                      })
                      .then(response => response.json())
                      .then(result => {
                          if (result.success) {
                              alert('Dati salvati con successo!');
                              columns.forEach(col => col.contentEditable = false);  // Blocca l'editing
                              saveBtn.style.display = 'none';  // Nascondi il pulsante di salvataggio
                              editBtn.style.display = 'inline-block';  // Mostra il pulsante di modifica
                          } else {
                              alert('Errore nel salvataggio');
                          }
                      })
                      .catch(error => alert('Errore nella comunicazione con il server.'));
                  }

                  // Se la tabella è 'utenti'
                  if (table.id === 'utenti-table') {
                      fetch('/update/utenti', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                              id: rowId,  // ID della riga da aggiornare
                              data: data   // I dati aggiornati
                          })
                      })
                      .then(response => response.json())
                      .then(result => {
                          if (result.success) {
                              alert('Dati salvati con successo!');
                              columns.forEach(col => col.contentEditable = false);  // Blocca l'editing
                              saveBtn.style.display = 'none';  // Nascondi il pulsante di salvataggio
                              editBtn.style.display = 'inline-block';  // Mostra il pulsante di modifica
                          } else {
                              alert('Errore nel salvataggio');
                          }
                      })
                      .catch(error => alert('Errore nella comunicazione con il server.'));
                  }
              });
          }
      });
  });
});

// Funzione per verificare la larghezza della finestra e mostrare il messaggio
function checkPageWidth() {
  const warningMessage = document.getElementById('page-warning');
  if (window.innerWidth < 1000) {
      warningMessage.style.display = 'block';  // Mostra il messaggio
  } else {
      warningMessage.style.display = 'none';  // Nascondi il messaggio
  }
}

// Esegui la funzione all'avvio della pagina e ogni volta che la finestra viene ridimensionata
window.addEventListener('load', checkPageWidth);
window.addEventListener('resize', checkPageWidth);

/*-----------------Cosa sarebbe bello implementare------------------------------*/

/*
function showErrorPopup(message) {
  console.log('Apertura popup con messaggio:', message);  // Aggiungi un log per verificare
  const popup = document.getElementById('error-popup');
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message; // Imposta il messaggio di errore
  popup.style.display = 'block'; // Mostra il popup
}

// Funzione per chiudere il popup di errore
function closeErrorPopup() {
  const popup = document.getElementById('error-popup');
  popup.style.display = 'none'; // Nasconde il popup
}

*/

