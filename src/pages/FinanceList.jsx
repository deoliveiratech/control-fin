import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { useAuth } from '../firebase/AuthProvider';

function FinanceList() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const monthParam = searchParams.get('month'); // YYYY-MM

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editTipo, setEditTipo] = useState('Receita');
  const [editDescricao, setEditDescricao] = useState('');
  const [editValor, setEditValor] = useState('');
  const [editStatus, setEditStatus] = useState('Pendente');
  const [editDataLancamento, setEditDataLancamento] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'finance'),
      where('uid', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setData([]);
        return;
      }
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(items);
    }, (error) => {
      console.error("Erro no onSnapshot da lista:", error);
    });

    return () => unsub();
  }, [user]);

  const filterData = () => {
    let filtered = data;

    // Filter by month if param exists
    if (monthParam) {
      const [year, month] = monthParam.split('-');
      filtered = filtered.filter(item => {
        if (!item.data) return false;
        const itemDate = item.data.toDate();
        return itemDate.getMonth() === parseInt(month) - 1 &&
          itemDate.getFullYear() === parseInt(year);
      });
    }

    // Sort by date desc
    filtered.sort((a, b) => {
      if (!a.data || !b.data) return 0;
      return b.data.toDate() - a.data.toDate();
    });

    switch (type) {
      case 'receitas':
        return filtered.filter((i) => i.tipo === 'Receita');
      case 'despesas':
        return filtered.filter((i) => i.tipo === 'Despesa');
      case 'pendentes-receber':
        return filtered.filter((i) => i.tipo === 'Receita' && i.status === 'Pendente');
      case 'pendentes-pagar':
        return filtered.filter((i) => i.tipo === 'Despesa' && i.status === 'Pendente');
      default:
        return filtered;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        await deleteDoc(doc(db, 'finance', id));
      } catch (error) {
        console.error("Erro ao excluir registro:", error);
        alert("Erro ao excluir registro: " + error.message);
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateDoc(doc(db, 'finance', id), { status });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditTipo(item.tipo);
    setEditDescricao(item.descricao);
    setEditValor(item.valor.toString());
    setEditStatus(item.status);

    if (item.data) {
      const d = item.data.toDate();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setEditDataLancamento(`${year}-${month}-${day}`);
    } else {
      setEditDataLancamento('');
    }
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editDescricao || !editValor) return;

    try {
      const dateToSave = editDataLancamento ? new Date(editDataLancamento + 'T12:00:00') : new Date();

      await updateDoc(doc(db, 'finance', editingItem.id), {
        tipo: editTipo,
        data: dateToSave,
        descricao: editDescricao,
        valor: parseFloat(editValor),
        status: editStatus,
      });

      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Erro ao atualizar registro:", error);
      alert("Erro ao atualizar registro: " + error.message);
    }
  };

  const titleMap = {
    receitas: 'Receitas',
    despesas: 'Despesas',
    'pendentes-receber': 'Pendentes de Receber',
    'pendentes-pagar': 'Pendentes de Pagar',
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate(); // Converte do Firebase Timestamp
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-4 mb-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-zinc-100">{titleMap[type]}</h1>
          <button
            onClick={() => {
              if (monthParam) {
                navigate(`/dash?month=${monthParam}`);
              } else {
                navigate('/dash');
              }
            }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
          >
            ← Voltar
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 px-4">
        <div className="space-y-3">
          {filterData().length === 0 && (
            <div className="text-center py-10 text-zinc-500">
              Nenhum registro encontrado para este período.
            </div>
          )}
          {filterData().map((item) => (
            <div key={item.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${item.tipo === 'Receita' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                    {item.tipo}
                  </span>
                  <span className="text-xs text-zinc-500">{formatDate(item.data)}</span>
                </div>
                <p className="font-semibold text-zinc-100">{item.descricao}</p>
                <p className={`text-lg font-bold ${item.tipo === 'Receita' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                  R$ {item.valor.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className={`bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 transition-colors ${item.status === 'Pago' ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                </select>
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-zinc-500 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Editar Lançamento */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold">Editar Lançamento</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400 ml-1">Tipo</label>
                  <select
                    value={editTipo}
                    onChange={(e) => setEditTipo(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="Receita">Receita</option>
                    <option value="Despesa">Despesa</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-400 ml-1">Data</label>
                  <input
                    type="date"
                    value={editDataLancamento}
                    onChange={(e) => setEditDataLancamento(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-400 ml-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Aluguel, Supermercado..."
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400 ml-1">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={editValor}
                    onChange={(e) => setEditValor(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-400 ml-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 px-4 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceList;
