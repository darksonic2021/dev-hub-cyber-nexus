/* =========================================================
   Dev HUB SENATI — Cyber Nexus
   js/app.js — Buscador, filtros y menú móvil del catálogo
   Autor: Aydan Ormeño · JavaScript · Funcionalidades
   ========================================================= */

(function () {
  "use strict";

  /* ---------- 1. Selección segura de elementos ----------
     Todos los accesos se comprueban antes de usarse para que
     la ausencia de un elemento opcional no detenga el resto. */
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearch");
  const resultsCount = document.getElementById("resultsCount");
  const categoryFilters = document.getElementById("categoryFilters");
  const resourcesGrid = document.getElementById("resourcesGrid");
  const emptyState = document.getElementById("emptyState");
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  // Tarjetas existentes del HTML (no se crean ni se reemplazan)
  const cards = resourcesGrid
    ? Array.from(resourcesGrid.querySelectorAll(".resource-card"))
    : [];

  const TOTAL = cards.length;
  let activeCategory = "all"; // "all" = sin filtro de categoría

  /* ---------- 2. Normalización: sin mayúsculas ni tildes ---------- */
  function normalizar(texto) {
    return (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // elimina diacríticos (á, é, ñ, ü...)
      .trim();
  }

  // Precarga (una sola vez) de los datos normalizados de cada tarjeta
  const recursos = cards.map(function (card) {
    const h3 = card.querySelector("h3");
    return {
      card: card,
      categoria: normalizar(card.dataset.category),
      titulo: normalizar(card.dataset.title || (h3 ? h3.textContent : "")),
    };
  });

  /* ---------- 3. Filtrado combinado (búsqueda + categoría) ---------- */
  function aplicarFiltros() {
    const consulta = normalizar(searchInput ? searchInput.value : "");
    let visibles = 0;

    recursos.forEach(function (recurso) {
      const coincideTexto =
        consulta === "" || recurso.titulo.indexOf(consulta) !== -1;
      const coincideCategoria =
        activeCategory === "all" || recurso.categoria === activeCategory;
      const mostrar = coincideTexto && coincideCategoria;

      // Se oculta con el atributo hidden (semántica/accesibilidad) y con
      // display en línea, porque .resource-card { display: flex } del CSS
      // anula el estilo [hidden] del navegador.
      recurso.card.hidden = !mostrar;
      recurso.card.style.display = mostrar ? "" : "none";

      if (mostrar) visibles++;
    });

    actualizarContador(visibles, consulta);
    mostrarEstadoVacio(visibles);
    sincronizarBotonLimpiar();
  }

  /* ---------- 4. Contador de recursos visibles (#resultsCount) ---------- */
  function actualizarContador(visibles, consulta) {
    if (!resultsCount) return; // opcional

    const hayFiltro = consulta !== "" || activeCategory !== "all";

    if (visibles === 0) {
      resultsCount.textContent = "Sin coincidencias";
    } else if (!hayFiltro) {
      resultsCount.textContent = `Mostrando todos los recursos (${TOTAL})`;
    } else {
      resultsCount.textContent = `Mostrando ${visibles} de ${TOTAL} recursos`;
    }
  }

  /* ---------- 5. Estado vacío (#emptyState) ---------- */
  function mostrarEstadoVacio(visibles) {
    if (!emptyState) return; // opcional
    emptyState.hidden = visibles !== 0;
  }

  /* ---------- 6. Botón limpiar (#clearSearch) ---------- */
  function sincronizarBotonLimpiar() {
    if (!clearSearchBtn || !searchInput) return; // opcionales
    clearSearchBtn.hidden = searchInput.value.trim() === "";
  }

  /* ---------- 7. Chips de categoría (aria-pressed + is-active) ---------- */
  function marcarCategoriaActiva() {
    if (!categoryFilters) return;

    const chips = categoryFilters.querySelectorAll(".filter-chip");
    chips.forEach(function (chip) {
      const activo = (chip.dataset.category || "all") === activeCategory;
      chip.classList.toggle("is-active", activo);
      chip.setAttribute("aria-pressed", activo ? "true" : "false");
    });
  }

  /* ---------- 8. Menú hamburguesa (celulares) ---------- */
  function alternarMenu(forzar) {
    if (!mainNav || !navToggle) return;

    const abrir =
      typeof forzar === "boolean"
        ? forzar
        : !mainNav.classList.contains("is-open");

    mainNav.classList.toggle("is-open", abrir);
    navToggle.setAttribute("aria-expanded", abrir ? "true" : "false");
    navToggle.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
  }

  /* ---------- 9. Registro de eventos ---------- */

  // Búsqueda en tiempo real
  if (searchInput) {
    searchInput.addEventListener("input", aplicarFiltros);
    // Botón "✕" nativo del input type="search"
    searchInput.addEventListener("search", aplicarFiltros);
  }

  // Limpiar búsqueda y restablecer la categoría "all"
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", function () {
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus(); // devuelve el foco al buscador
      }
      activeCategory = "all";
      marcarCategoriaActiva();
      aplicarFiltros();
    });
  }

  // Filtros por categoría (delegación de eventos)
  if (categoryFilters) {
    categoryFilters.addEventListener("click", function (evento) {
      const chip = evento.target.closest(".filter-chip");
      if (!chip || !categoryFilters.contains(chip)) return;

      activeCategory = chip.dataset.category || "all";
      marcarCategoriaActiva();
      aplicarFiltros();
    });
  }

  // Menú hamburguesa
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      alternarMenu();
    });

    // Cerrar el menú al pulsar un enlace
    mainNav.addEventListener("click", function (evento) {
      if (evento.target.closest("a")) alternarMenu(false);
    });

    // Escape cierra el menú y regresa el foco al botón
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && mainNav.classList.contains("is-open")) {
        alternarMenu(false);
        navToggle.focus();
      }
    });

    // Al volver a tamaño escritorio, el menú queda cerrado por completo
    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 769px)").matches) alternarMenu(false);
    });
  }

  /* ---------- 10. Estado inicial ---------- */
  function init() {
    marcarCategoriaActiva();
    aplicarFiltros();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
