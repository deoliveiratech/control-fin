import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, orderBy, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../firebase/AuthProvider';

function FinanceList() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const monthParam = searchParams.get('month'); // YYYY-MM

  useEffect(() => {

    const fetchData = async () => {
      const q = query(
        collection(db, 'finance'),
        where('uid', '==', user.uid)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setData([]);
        return;
      }

      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(items);

    };

    fetchData();

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
    filtered.sort((a, b) => b.data.toDate() - a.data.toDate());

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
    await deleteDoc(doc(db, 'finance', id));
  };

  const handleStatusChange = async (id, status) => {
    await updateDoc(doc(db, 'finance', id), { status });
  };

  const titleMap = {
    receitas: 'Receitas',
    despesas: 'Despesas',
    'pendentes-receber': 'Pendentes de Receber',
    'pendentes-pagar': 'Pendentes de Pagar',
  };

  const formatDate = (date) => {
    const d = date.toDate(); // Converte do Firebase Timestamp
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center py-4 border-b border-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-100">{titleMap[type]}</h1>
          <button
            onClick={() => navigate('/dash')}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
          >
            ← Voltar
          </button>
        </header>

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
    </div>
  );
}

export default FinanceList;
