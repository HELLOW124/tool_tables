import './App.css';
import { useMemo, useState } from 'react';
import toolsData from './data/tools.json';

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
});

function App() {
  const [orderIds, setOrderIds] = useState(toolsData.map((tool) => tool.id));
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pageSize, setPageSize] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTool, setActiveTool] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  const toolsById = useMemo(() => {
    const map = new Map();
    toolsData.forEach((tool) => map.set(tool.id, tool));
    return map;
  }, []);

  const orderedTools = useMemo(
    () => orderIds.map((id) => toolsById.get(id)).filter(Boolean),
    [orderIds, toolsById]
  );

  const categories = useMemo(
    () => ['all', ...new Set(toolsData.map((tool) => tool.category))],
    []
  );

  const filteredTools = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return orderedTools.filter((tool) => {
      const matchesSearch =
        search.length === 0 ||
        tool.name.toLowerCase().includes(search) ||
        String(tool.id).includes(search);
      const matchesCategory =
        categoryFilter === 'all' || tool.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [orderedTools, searchTerm, categoryFilter]);

  const totalPages =
    pageSize === 'all'
      ? 1
      : Math.max(1, Math.ceil(filteredTools.length / Number(pageSize)));
  const currentSafePage = Math.min(currentPage, totalPages);
  const start = pageSize === 'all' ? 0 : (currentSafePage - 1) * Number(pageSize);
  const end = pageSize === 'all' ? filteredTools.length : start + Number(pageSize);
  const pagedTools = filteredTools.slice(start, end);

  const handleDrop = (targetId) => {
    if (draggedId === null || draggedId === targetId) {
      return;
    }

    setOrderIds((prev) => {
      const updated = [...prev];
      const fromIndex = updated.indexOf(draggedId);
      const toIndex = updated.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }
      updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, draggedId);
      return updated;
    });
    setDraggedId(null);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (event) => {
    setCategoryFilter(event.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(event.target.value);
    setCurrentPage(1);
  };

  const toggleDetails = (tool) => {
    setActiveTool((prev) => (prev?.id === tool.id ? null : tool));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className={`app-shell ${activeTool ? 'has-open-sidebar' : ''}`}>
      <div className="layout">
        <section className="panel">
          <header className="panel-header">
            <h1>Tools Table</h1>
            <p>Minimal inventory list with drag reorder and quick details.</p>
          </header>

          <div className="toolbar">
            <input
              type="text"
              className="input"
              placeholder="Search by tool id or name..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <select
              className="select"
              value={categoryFilter}
              onChange={handleCategoryChange}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All categories' : category}
                </option>
              ))}
            </select>
            <button type="button" className="btn-secondary" onClick={resetFilters}>
              Clear
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>id</th>
                  <th>name</th>
                  <th>price</th>
                  <th>category</th>
                  <th>details</th>
                </tr>
              </thead>
              <tbody>
                {pagedTools.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty">
                      No tools found.
                    </td>
                  </tr>
                )}
                {pagedTools.map((tool) => (
                  <tr
                    className="data-row"
                    key={tool.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(tool.id)}
                  >
                    <td data-label="ID">
                      <button
                        type="button"
                        className={`drag-id ${draggedId === tool.id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={() => setDraggedId(tool.id)}
                        onDragEnd={() => setDraggedId(null)}
                        title="Drag up or down to reorder by id"
                      >
                        {tool.id}
                      </button>
                    </td>
                    <td data-label="Name">{tool.name}</td>
                    <td data-label="Price">{pesoFormatter.format(tool.price)}</td>
                    <td data-label="Category">{tool.category}</td>
                    <td data-label="Details">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => toggleDetails(tool)}
                      >
                        {activeTool?.id === tool.id ? 'Close' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="table-footer">
            <div className="pagination-left">
              <label htmlFor="page-size">Rows:</label>
              <select
                id="page-size"
                className="select"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="all">All</option>
              </select>
            </div>

            <div className="pagination-right">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={pageSize === 'all' || currentSafePage === 1}
              >
                Prev
              </button>
              <span>
                Page {pageSize === 'all' ? 1 : currentSafePage} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={pageSize === 'all' || currentSafePage === totalPages}
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      </div>

      <button
        type="button"
        className={`sidebar-overlay ${activeTool ? 'show' : ''}`}
        onClick={() => setActiveTool(null)}
        aria-label="Close tool details"
      />

      <aside className={`sidebar ${activeTool ? 'open' : ''}`}>
        <div className="sidebar-head">
          <h2>Tool Details</h2>
          <button
            type="button"
            className="close-btn"
            onClick={() => setActiveTool(null)}
          >
            x
          </button>
        </div>
        {activeTool ? (
          <div className="sidebar-content">
            <img
              className="tool-image"
              src={activeTool.image}
              alt={activeTool.name}
              loading="lazy"
            />
            <p>
              <strong>id:</strong> {activeTool.id}
            </p>
            <p>
              <strong>name:</strong> {activeTool.name}
            </p>
            <p>
              <strong>description:</strong> {activeTool.description}
            </p>
          </div>
        ) : (
          <p className="sidebar-placeholder">
            Select a tool to view where and how it can be used.
          </p>
        )}
      </aside>
    </div>
  );
}

export default App;
