import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deslogar } from '../firebase/auth';
import { useAuth } from '../firebase/AuthProvider';
import InstallButton from '../components/InstallButton';

function Dashboard() {
  const [data, setData] = useState([]);
  const [tipo, setTipo] = useState('Receita');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState('Pendente');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get('month');
  const [dataLancamento, setDataLancamento] = useState('');
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for current month selection
  const [currentDate, setCurrentDate] = useState(() => {
    if (monthParam) {
      const [year, month] = monthParam.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
    return new Date();
  });

  // Sync date selection with query param updates (e.g. back button navigation)
  useEffect(() => {
    if (monthParam) {
      const [year, month] = monthParam.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      if (!isNaN(d.getTime())) {
        setCurrentDate(prev => {
          if (prev.getFullYear() !== d.getFullYear() || prev.getMonth() !== d.getMonth()) {
            return d;
          }
          return prev;
        });
      }
    }
  }, [monthParam]);

  useEffect(() => {
    if (!user) {
      console.log("Dashboard: Nenhum usuário logado");
      return;
    }


    const q = query(
      collection(db, 'finance'),
      where('uid', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setData([]);
        return;
      }
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setData(items);
    }, (error) => {
      console.error("Dashboard: Erro no onSnapshot:", error);
      console.error("Dashboard: Código do erro:", error.code);
      console.error("Dashboard: Mensagem do erro:", error.message);
    });
    return () => unsub();
  }, [user]);

  // Filter and Sort in memory to avoid composite index requirements
  const filteredData = data
    .filter(item => {
      if (!item.data) return false;
      const itemDate = item.data.toDate();
      return itemDate.getMonth() === currentDate.getMonth() &&
        itemDate.getFullYear() === currentDate.getFullYear();
    })
    .sort((a, b) => b.data.toDate() - a.data.toDate());

  const receitas = filteredData.filter((i) => i.tipo === 'Receita');
  const despesas = filteredData.filter((i) => i.tipo === 'Despesa');

  const totalReceitas = receitas.reduce((sum, i) => sum + (i.valor || 0), 0);
  const totalDespesas = despesas.reduce((sum, i) => sum + (i.valor || 0), 0);

  const pendReceber = receitas.filter((i) => i.status === 'Pendente').reduce((sum, i) => sum + (i.valor || 0), 0);
  const pendPagar = despesas.filter((i) => i.status === 'Pendente').reduce((sum, i) => sum + (i.valor || 0), 0);

  const saldo = totalReceitas - totalDespesas;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descricao || !valor) return;

    // If date is not provided, use today. 
    // Note: The user might want to add a record for a different month than the selected one.
    // Ideally, we should default to the selected month or today. Let's stick to user input or today.
    const dateToSave = dataLancamento ? new Date(dataLancamento + 'T12:00:00') : new Date();

    await addDoc(collection(db, 'finance'), {
      tipo,
      data: dateToSave,
      descricao,
      valor: parseFloat(valor),
      status,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });

    setDescricao('');
    setDataLancamento('');
    setValor('');
    setStatus('Pendente');
    setIsModalOpen(false);
  };

  const handleNavigate = (type) => {
    // Pass the current month to the list view
    const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    navigate(`/list/${type}?month=${monthStr}`);
  };

  const handleLogout = async () => {
    try {
      await deslogar();
      navigate('/');

    } catch (error) {
      console.log('Erro ao deslogar: ', error);
    }
  }

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
    const monthStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setSearchParams({ month: monthStr });
  };

  const copyToNextMonth = async () => {
    if (filteredData.length === 0) {
      alert("Não há lançamentos para copiar neste mês.");
      return;
    }

    if (!window.confirm(`Deseja copiar ${filteredData.length} lançamentos para o próximo mês?`)) {
      return;
    }

    try {
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

      const promises = filteredData.map(item => {
        // Create a new date for the next month, keeping the same day if possible
        const itemDate = item.data.toDate();
        const newDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), itemDate.getDate());

        // Ensure the day is valid for the next month (e.g., Jan 31 -> Feb 28)
        if (newDate.getMonth() !== nextMonth.getMonth()) {
          newDate.setDate(0); // Last day of the intended month
        }

        return addDoc(collection(db, 'finance'), {
          tipo: item.tipo,
          data: newDate,
          descricao: item.descricao,
          valor: item.valor,
          status: 'Pendente',
          uid: user.uid,
          createdAt: serverTimestamp(),
        });
      });

      await Promise.all(promises);
      alert("Lançamentos copiados com sucesso!");
      changeMonth(1);
    } catch (error) {
      console.error("Erro ao copiar lançamentos:", error);
      alert("Erro ao copiar lançamentos.");
    }
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Simple Bar Chart Calculation
  const maxVal = Math.max(totalReceitas, totalDespesas, 1); // Avoid division by zero
  const receitaHeight = (totalReceitas / maxVal) * 100;
  const despesaHeight = (totalDespesas / maxVal) * 100;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Sticky Header + Month Selector */}
      <div className="sticky top-0 z-40 bg-zinc-950/80 border-b border-zinc-800/60 backdrop-blur-md px-4 pt-4 pb-2">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Header */}
          <header className="flex justify-between items-center py-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              CtrlFin
            </h1>
            <div className="flex items-center gap-4">
              <InstallButton />
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </header>

          {/* Month Selector */}
          <div className="flex items-center justify-between bg-zinc-900/50 p-2 rounded-xl border border-zinc-800 gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              <h2 className="text-lg font-semibold capitalize">
                {formatMonthYear(currentDate)}
              </h2>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <span className="text-xl">→</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors text-xs font-bold flex items-center gap-2"
              >
                <span>➕</span>
                <span className="hidden sm:inline">Novo Lançamento</span>
              </button>

              <button
                onClick={copyToNextMonth}
                className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg transition-colors text-xs font-bold flex items-center gap-2"
              >
                <span>📋</span>
                <span className="hidden sm:inline">Copiar para Próximo Mês</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4 px-4 pt-4">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleNavigate('receitas')}
            className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-left hover:border-emerald-500/50 transition-colors group"
          >
            <p className="text-xs text-zinc-400 mb-1">Receitas</p>
            <p className="text-lg font-bold text-emerald-500">R$ {totalReceitas.toFixed(2)}</p>
          </button>

          <button
            onClick={() => handleNavigate('despesas')}
            className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-left hover:border-rose-500/50 transition-colors group"
          >
            <p className="text-xs text-zinc-400 mb-1">Despesas</p>
            <p className="text-lg font-bold text-rose-500">R$ {totalDespesas.toFixed(2)}</p>
          </button>

          <button
            onClick={() => handleNavigate('pendentes-receber')}
            className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-left hover:border-amber-500/50 transition-colors group"
          >
            <p className="text-xs text-zinc-400 mb-1">À Receber</p>
            <p className="text-lg font-bold text-amber-500">R$ {pendReceber.toFixed(2)}</p>
          </button>

          <button
            onClick={() => handleNavigate('pendentes-pagar')}
            className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-left hover:border-amber-500/50 transition-colors group"
          >
            <p className="text-xs text-zinc-400 mb-1">À Pagar</p>
            <p className="text-lg font-bold text-amber-500">R$ {pendPagar.toFixed(2)}</p>
          </button>
        </div>

        {/* Saldo Card */}
        <div className="p-5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl shadow-indigo-500/10">
          <p className="text-indigo-100 text-sm font-medium opacity-80">Saldo do Mês</p>
          <h2 className="text-3xl font-bold text-white mt-1">R$ {saldo.toFixed(2)}</h2>
        </div>

        {/* Visual Chart
        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-zinc-400">Visão Mensal</h3>
          </div>
          <div className="flex justify-around items-end h-24 gap-4">
            <div className="flex flex-col items-center flex-1 max-w-[100px]">
              <div
                style={{ height: `${receitaHeight}%` }}
                className="w-full bg-emerald-500/20 border-t-2 border-emerald-500 rounded-t-lg transition-all duration-500 min-h-[4px]"
              />
              <span className="mt-2 text-xs text-zinc-400">Receitas</span>
            </div>
            <div className="flex flex-col items-center flex-1 max-w-[100px]">
              <div
                style={{ height: `${despesaHeight}%` }}
                className="w-full bg-rose-500/20 border-t-2 border-rose-500 rounded-t-lg transition-all duration-500 min-h-[4px]"
              />
              <span className="mt-2 text-xs text-zinc-400">Despesas</span>
            </div>
          </div>
        </div> */}



        {/* Modal Novo Lançamento */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                <h3 className="text-xl font-bold">Novo Lançamento</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400 ml-1">Tipo</label>
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
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
                      value={dataLancamento}
                      onChange={(e) => setDataLancamento(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-400 ml-1">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Aluguel, Supermercado..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400 ml-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
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
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                  >
                    Adicionar Registro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
