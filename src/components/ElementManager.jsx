import React, { useState } from 'react';

const ElementManager = ({ title, items, onAdd, onRemove, placeholder }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="element-manager">
      <div className="manager-header">
        <h3>{title}</h3>
      </div>
      <div className="manager-input">
        <input
          type="text"
          placeholder={placeholder || 'Ajouter un nouvel élément...'}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button type="button" className="btn" onClick={handleAdd}>
          + Ajouter
        </button>
      </div>
      <div className="manager-list">
        {items.length === 0 ? (
          <p className="empty-message">Aucun élément pour le moment.</p>
        ) : (
          <ul>
            {items.map((item, index) => (
              <li key={index} className="manager-item">
                <span>{item}</span>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => onRemove(index)}
                  title="Supprimer"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ElementManager;
