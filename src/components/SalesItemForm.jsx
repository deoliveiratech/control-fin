import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../firebase/AuthProvider';

function SalesItemForm({ itemEdit, setItemEdit }) {
    const [nome, setNome] = useState('');
    const [valor, setValor] = useState('');
    const [observacao, setObservacao] = useState('');
    const [status, setStatus] = useState('Pendente');
    const { user } = useAuth();

    // Quando clicar no nome, preenche os campos
    useEffect(() => {
        if (itemEdit) {
            setNome(itemEdit.nome);
            setValor(itemEdit.valor);
            setObservacao(itemEdit.observacao || '');
            setStatus(itemEdit.status);
        }
    }, [itemEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nome || !valor || !user) return;

        const itemData = {
            nome,
            valor: parseFloat(valor),
            observacao,
            status,
            uid: user.uid,
        };

        if (itemEdit) {
            // Atualizar item existente
            const docRef = doc(db, 'items', itemEdit.id);
            await updateDoc(docRef, itemData);

            // Se mudou para vendido agora, ou se já era vendido e foi editado (opcional, mas vamos focar na transição ou novo)
            // Para simplificar, se o status final for Vendido, e for uma transição ou novo, lançamos.
            // No entanto, o usuário pediu: "nos registros de vendas que eu marcar como vendido, esse registro com os dados e valor ser lançado automaticamente nas receitas"
            if (status === 'Vendido' && itemEdit.status !== 'Vendido') {
                await addDoc(collection(db, 'finance'), {
                    tipo: 'Receita',
                    data: new Date(),
                    descricao: `Venda: ${nome}`,
                    valor: parseFloat(valor),
                    status: 'Pago',
                    uid: user.uid,
                    createdAt: serverTimestamp(),
                });
            }
            setItemEdit(null); // limpa o modo de edição
        } else {
            // Cadastrar novo
            await addDoc(collection(db, 'items'), {
                ...itemData,
                createdAt: serverTimestamp(),
            });

            if (status === 'Vendido') {
                await addDoc(collection(db, 'finance'), {
                    tipo: 'Receita',
                    data: new Date(),
                    descricao: `Venda: ${nome}`,
                    valor: parseFloat(valor),
                    status: 'Pago',
                    uid: user.uid,
                    createdAt: serverTimestamp(),
                });
            }
        }

        // Limpar campos
        setNome('');
        setValor('');
        setObservacao('');
        setStatus('Pendente');
    };

    const handleCancelEdit = () => {
        setItemEdit(null);
        setNome('');
        setValor('');
        setObservacao('');
        setStatus('Pendente');
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-400 ml-1">Item</label>
                        <input
                            type="text"
                            placeholder="Nome do produto"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-400 ml-1">Valor</label>
                        <input
                            type="number"
                            placeholder="0,00"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-zinc-400 ml-1">Observação</label>
                    <input
                        type="text"
                        placeholder="Detalhes, estado de conservação..."
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-zinc-400 ml-1">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="Pendente">Pendente</option>
                        <option value="Anunciado">Anunciado</option>
                        <option value="Vendido">Vendido</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                    >
                        {itemEdit ? 'Atualizar Item' : 'Cadastrar Item'}
                    </button>
                    {itemEdit && (
                        <button
                            onClick={handleCancelEdit}
                            type="button"
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl transition-colors"
                        >
                            Cancelar Edição
                        </button>
                    )}
                </div>
            </form>
        </>
    );
}

export default SalesItemForm;
