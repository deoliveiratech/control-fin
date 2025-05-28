import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { deslogar } from '../firebase/auth';
import { useAuth } from '../firebase/AuthProvider';

function Dashboard() {
  const [data, setData] = useState([]);
  const [tipo, setTipo] = useState('Receita');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState('Pendente');
  const navigate = useNavigate();
  const [dataLancamento, setDataLancamento] = useState('');
  const { user } = useAuth();



  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'finance'), (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setData(items);
    });
    return () => unsub();
  }, []);

  const receitas = data.filter((i) => i.tipo === 'Receita');
  const despesas = data.filter((i) => i.tipo === 'Despesa');

  const totalReceitas = receitas.reduce((sum, i) => sum + (i.valor || 0), 0);
  const totalDespesas = despesas.reduce((sum, i) => sum + (i.valor || 0), 0);

  const pendReceber = receitas.filter((i) => i.status === 'Pendente').reduce((sum, i) => sum + (i.valor || 0), 0);
  const pendPagar = despesas.filter((i) => i.status === 'Pendente').reduce((sum, i) => sum + (i.valor || 0), 0);

  const saldo = totalReceitas - totalDespesas;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descricao || !valor) return;

    await addDoc(collection(db, 'finance'), {
      tipo,
      data: new Date(dataLancamento + 'T00:00:00'),
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
  };

  const handleNavigate = (type) => {
    navigate(`/list/${type}`);
  };

  return (
    <div className="container">
      <h1>CtrlFin</h1>
      <button onClick={deslogar}>Sair</button>

      <div className="dashboard">
        <div className="card" onClick={() => handleNavigate('receitas')}>
          Receitas:
          <strong style={{color: 'green'}}> R$ {totalReceitas.toFixed(2)}</strong>
        </div>
        <div className="card" onClick={() => handleNavigate('despesas')}>
          Despesas:
          <strong style={{color: '#ff3e3e'}}> R$ {totalDespesas.toFixed(2)}</strong>
        </div>
        <div className="card" onClick={() => handleNavigate('pendentes-receber')}>
          À Receber:
          <strong style={{color: '#dd5400'}}> R$ {pendReceber.toFixed(2)}</strong>
        </div>
        <div className="card" onClick={() => handleNavigate('pendentes-pagar')}>
          À Pagar:
          <strong style={{color: '#dd5400'}}> R$ {pendPagar.toFixed(2)}</strong>
        </div>
        <div className="card">
          <h3>Saldo</h3>
          <strong style={{color: '#6b6bff', fontSize: '1.1rem'}}>R$ {saldo.toFixed(2)}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="Receita">Receita</option>
          <option value="Despesa">Despesa</option>
        </select>

        <input
            type="date"
            value={dataLancamento}
            placeholder="Data do Lançamento"
            onChange={(e) => setDataLancamento(e.target.value)}
            />


        <input
          type="text"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <input
          type="number"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Pendente">Pendente</option>
          <option value="Pago">Pago</option>
        </select>

        <button type="submit">Adicionar</button>
      </form>
    </div>
  );
}

export default Dashboard;
