import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SalesItemForm from '../components/SalesItemForm';
import SalesItemList from '../components/SalesItemList';

function Sales() {
    const [itemEdit, setItemEdit] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const navigate = useNavigate();

    // Open form automatically when editing
    useEffect(() => {
        if (itemEdit) setIsFormOpen(true);
    }, [itemEdit]);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-20">
            <div className="max-w-4xl mx-auto space-y-4">
                <header className="flex justify-between items-center py-2 border-b border-zinc-800">
                    <h1 className="text-2xl font-bold text-zinc-100">Controle de Vendas</h1>
                    <button
                        onClick={() => navigate('/dash')}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
                    >
                        ← Voltar
                    </button>
                </header>

                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
                        <button
                            onClick={() => setIsFormOpen(!isFormOpen)}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{isFormOpen ? '📦' : '➕'}</span>
                                <span className="font-semibold">{itemEdit ? 'Editando Item' : 'Cadastrar Novo Item'}</span>
                            </div>
                            <span className={`text-zinc-500 transition-transform duration-200 ${isFormOpen ? 'rotate-180' : ''}`}>
                                ↓
                            </span>
                        </button>

                        {isFormOpen && (
                            <div className="p-6 pt-0 border-t border-zinc-800/50 animate-in slide-in-from-top-2 duration-200">
                                <SalesItemForm itemEdit={itemEdit} setItemEdit={setItemEdit} />
                            </div>
                        )}
                    </div>

                    <SalesItemList setItemEdit={setItemEdit} />
                </div>
            </div>
        </div>
    );
}

export default Sales;
