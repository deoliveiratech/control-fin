import { useState } from 'react';
import { cadastrar, logar } from '../firebase/auth';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await logar(email, senha);
        navigate('/dash');
      } else {
        await cadastrar(email, senha);
      }
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

  return (
    <div className="container-login">
      <h1>{isLogin ? 'Login' : 'Cadastro'}</h1>
      <form onSubmit={handleSubmit} className="form-login">
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button type="submit">{isLogin ? 'Entrar' : 'Cadastrar'}</button>
      </form>
      <p>
        {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
        <button className='btnCadastroUser' onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Cadastrar' : 'Fazer Login'}
        </button>
      </p>
    </div>
  );
}

export default Login;
