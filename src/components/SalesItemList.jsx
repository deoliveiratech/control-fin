import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../firebase/AuthProvider';

function SalesItemList({ setItemEdit }) {
    const [items, setItems] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'items'),
            where('uid', '==', user.uid)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setItems(data);
        });
        return () => unsub();
    }, [user]);

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este item?')) {
            try {
                await deleteDoc(doc(db, 'items', id));
                console.log("Item excluído com sucesso:", id);
            } catch (error) {
                console.error("Erro ao excluir item:", error);
                alert("Erro ao excluir item. Verifique o console.");
            }
        }
    };

    const handleStatusChange = async (item, newStatus) => {
        const oldStatus = item.status;
        await updateDoc(doc(db, 'items', item.id), { status: newStatus });

        if (newStatus === 'Vendido' && oldStatus !== 'Vendido') {
            await addDoc(collection(db, 'finance'), {
                tipo: 'Receita',
                data: new Date(),
                descricao: `Venda: ${item.nome}`,
                valor: item.valor,
                status: 'Pago',
                uid: user.uid,
                createdAt: serverTimestamp(),
            });
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-100 px-1">Itens Cadastrados</h2>
            {items.length === 0 && (
                <div className="text-center py-10 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
                    Nenhum item cadastrado.
                </div>
            )}
            <div className="grid grid-cols-1 gap-3">
                {items.map((item) => (
                    <div key={item.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${item.status === 'Vendido' ? 'bg-emerald-500/10 text-emerald-500' :
                                    item.status === 'Anunciado' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>
                            <p
                                onClick={() => setItemEdit(item)}
                                className="font-semibold text-zinc-100 cursor-pointer hover:text-indigo-400 transition-colors"
                            >
                                {item.nome}
                            </p>
                            <p className="text-lg font-bold text-zinc-100">
                                R$ {item.valor.toFixed(2)}
                            </p>
                            <p className="text-xs text-zinc-500 italic">
                                Obs: {item.observacao || '---'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item, e.target.value)}
                                className={`bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 transition-colors ${item.status === 'Vendido' ? 'text-emerald-500' :
                                    item.status === 'Anunciado' ? 'text-indigo-500' : 'text-amber-500'
                                    }`}
                            >
                                <option value="Pendente">Pendente</option>
                                <option value="Anunciado">Anunciado</option>
                                <option value="Vendido">Vendido</option>
                            </select>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SalesItemList;
