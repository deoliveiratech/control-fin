import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
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
  const [dataLancamento, setDataLancamento] = useState('');
  const { user } = useAuth();

  useEffect(() => {

    if(!user) return;

    const q = query(
      collection(db, 'finance'),
      where('uid', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if(snapshot.empty){
        console.log('Nenhum registro encontrado!')
        setData([]);
        return;
      }
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setData(items);
    });
    return () => unsub();
  }, [user]);

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

  const handleLogout = async () => {
    try { await deslogar();
      navigate('/');
      
    } catch (error) {
      console.log('Erro ao deslogar: ', error);
    }
  }

  return (
    <div className="container">
      <div className="install-button-container">
        <InstallButton />
      </div>            
      <div className='dash-header'>
        <h1>CtrlFin</h1>
      <button onClick={handleLogout}>Sair</button>
      </div>
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
