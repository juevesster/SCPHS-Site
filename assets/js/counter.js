// assets/js/counter.js
(function () {
  const API_URL = '/api/counter.php'; // works once uploaded to hosting with PHP

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  fetch(API_URL, { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      setText('views-today', data.today ?? '0');
      setText('views-total', data.total ?? '0');
    })
    .catch(() => {
      setText('views-today', '0');
      setText('views-total', '0');
    });
})();