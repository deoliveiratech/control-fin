import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, orderBy, query, where, getDocs  } from 'firebase/firestore';
import { useAuth } from '../firebase/AuthProvider';

function FinanceList() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const { user } = useAuth();

  useEffect(() => {

  const fetchData = async () => {
  const q = query(
    collection(db, 'finance'),
    where('uid', '==', user.uid)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log('Nenhum dado encontrado');
    return;
  }

  const items = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  setData(items);

};

fetchData();

  }, []);

  const filterData = () => {
    switch (type) {
      case 'receitas':
        return data.filter((i) => i.tipo === 'Receita');
      case 'despesas':
        return data.filter((i) => i.tipo === 'Despesa');
      case 'pendentes-receber':
        return data.filter((i) => i.tipo === 'Receita' && i.status === 'Pendente');
      case 'pendentes-pagar':
        return data.filter((i) => i.tipo === 'Despesa' && i.status === 'Pendente');
      default:
        return data;
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
    <div className="container">
      <h1>{titleMap[type]}</h1>
      <button onClick={() => navigate('/dash')}>← Voltar</button>

      <div className="list">
        {filterData().map((item) => (
          <div key={item.id} className="list-item">
             <div>Data: {formatDate(item.data) || 'Sem data'}</div>
            <strong>{item.descricao}</strong> - R$ {item.valor.toFixed(2)}
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(item.id, e.target.value)}
            >
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
            </select>
            <button onClick={() => handleDelete(item.id)}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FinanceList;
