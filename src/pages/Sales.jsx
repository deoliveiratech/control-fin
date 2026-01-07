import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SalesItemForm from '../components/SalesItemForm';
import SalesItemList from '../components/SalesItemList';

function Sales() {
    const [itemEdit, setItemEdit] = useState(null);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-20">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex justify-between items-center py-4 border-b border-zinc-800">
                    <h1 className="text-2xl font-bold text-zinc-100">Controle de Vendas</h1>
                    <button
                        onClick={() => navigate('/dash')}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
                    >
                        ← Voltar
                    </button>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    <SalesItemForm itemEdit={itemEdit} setItemEdit={setItemEdit} />
                    <SalesItemList setItemEdit={setItemEdit} />
                </div>
            </div>
        </div>
    );
}

export default Sales;
