import { useState } from 'react';
import { cadastrar, logar } from '../firebase/auth';
import { useNavigate } from 'react-router-dom';
import InstallPWA from '../components/InstallPWA';

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
        navigate('/dash');
      }
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
          </h1>
          <p className="text-zinc-400 text-sm">
            {isLogin ? 'Acesse sua conta para gerenciar suas finanças' : 'Comece a controlar suas finanças hoje mesmo'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 ml-1">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 ml-1">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] mt-2"
          >
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div className="text-center space-y-4">
          <p className="text-sm text-zinc-400">
            {isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              {isLogin ? 'Cadastre-se' : 'Faça Login'}
            </button>
          </p>

          <div className="pt-4 border-t border-zinc-800">
            <InstallPWA />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
