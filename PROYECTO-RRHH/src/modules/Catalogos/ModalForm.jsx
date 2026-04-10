import React from 'react';

const ModalForm = ({ isOpen, onClose, title, onSave, children }) => {
    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '450px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                <h3 style={{ marginTop: 0 }}>{title}</h3>
                <hr />
                <div style={{ margin: '1.5rem 0' }}>
                    {children}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 15px', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={onSave} style={{ padding: '8px 15px', borderRadius: '6px', border: 'none', background: '#4e73df', color: 'white', cursor: 'pointer' }}>Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

export default ModalForm;