/**
 * CurriculoAnalysisPanel.jsx
 * Componente para análise de currículo dentro do chat
 * Exibido para empresas quando visualizam candidatura
 */

import { useState } from 'react';
import api from '../api/client';
import './CurriculoAnalysisPanel.css';

export default function CurriculoAnalysisPanel({ candidaturaId, candidatoNome, role }) {
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState(null);
  const [erro, setErro] = useState(null);
  const [perguntaIA, setPerguntaIA] = useState('');
  const [respostaIA, setRespostaIA] = useState(null);
  const [enviandoPergunta, setEnviandoPergunta] = useState(false);

  // Apenas empresas podem analisar currículos
  if (role !== 'empresa') {
    return null;
  }

  const handleAnalizar = async () => {
    setLoading(true);
    setErro(null);
    setAnalise(null);

    try {
      const response = await api.post(
        `/curriculo-analysis/candidatura/${candidaturaId}/analisar`
      );

      if (response.data?.data?.analise) {
        setAnalise(response.data.data.analise);
      } else {
        setErro('Nenhuma análise disponível para este candidato');
      }
    } catch (error) {
      console.error('Erro ao analisar currículo:', error);
      setErro(error.response?.data?.error || 'Erro ao analisar currículo');
    } finally {
      setLoading(false);
    }
  };

  const handlePerguntaIA = async () => {
    if (!perguntaIA.trim()) return;

    setEnviandoPergunta(true);
    setErro(null);

    try {
      const response = await api.post(
        `/curriculo-analysis/candidatura/${candidaturaId}/chat-ia`,
        { pergunta: perguntaIA }
      );

      if (response.data?.data?.resposta) {
        setRespostaIA(response.data.data.resposta);
        setPerguntaIA('');
      }
    } catch (error) {
      console.error('Erro ao enviar pergunta à IA:', error);
      setErro(error.response?.data?.error || 'Erro ao processar pergunta');
    } finally {
      setEnviandoPergunta(false);
    }
  };

  return (
    <div className="curriculo-analysis-panel">
      <div className="panel-header">
        <h3>📄 Análise de Currículo</h3>
        <p className="candidate-name">{candidatoNome}</p>
      </div>

      {/* Botão de Análise Automática */}
      <div className="analysis-section">
        <button
          onClick={handleAnalizar}
          disabled={loading}
          className="btn-analyze"
        >
          {loading ? 'Analisando...' : '🔍 Analisar Currículo'}
        </button>

        {/* Resultados da Análise */}
        {analise && (
          <div className="analysis-result">
            <div className="result-header">
              {analise.score && (
                <div className="score-badge">
                  Score: <strong>{Math.round(analise.score * 100)}%</strong>
                </div>
              )}
            </div>

            {analise.resumo && (
              <div className="analysis-item">
                <strong>Resumo:</strong>
                <p>{analise.resumo}</p>
              </div>
            )}

            {analise.pontos_fortes && analise.pontos_fortes.length > 0 && (
              <div className="analysis-item">
                <strong>✅ Pontos Fortes:</strong>
                <ul>
                  {analise.pontos_fortes.map((ponto, idx) => (
                    <li key={idx}>{ponto}</li>
                  ))}
                </ul>
              </div>
            )}

            {analise.areas_melhoria && analise.areas_melhoria.length > 0 && (
              <div className="analysis-item">
                <strong>⚠️ Áreas de Melhoria:</strong>
                <ul>
                  {analise.areas_melhoria.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </div>
            )}

            {analise.compatibilidade && (
              <div className="analysis-item">
                <strong>🎯 Compatibilidade com Vaga:</strong>
                <p>{analise.compatibilidade}</p>
              </div>
            )}

            {analise.recomendacao && (
              <div className="analysis-item recommendation">
                <strong>💡 Recomendação:</strong>
                <p>{analise.recomendacao}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat com IA sobre o Currículo */}
      <div className="ia-chat-section">
        <h4>💬 Pergunte à IA sobre o candidato</h4>

        <div className="ia-input-group">
          <textarea
            value={perguntaIA}
            onChange={(e) => setPerguntaIA(e.target.value)}
            placeholder="Ex: Quais são as principais experiências deste candidato? Por que ele não é ideal para..."
            rows={3}
            className="ia-textarea"
          />

          <button
            onClick={handlePerguntaIA}
            disabled={enviandoPergunta || !perguntaIA.trim()}
            className="btn-send-question"
          >
            {enviandoPergunta ? 'Enviando...' : '📤 Enviar'}
          </button>
        </div>

        {/* Resposta da IA */}
        {respostaIA && (
          <div className="ia-response">
            <div className="response-header">Resposta da IA:</div>
            <div className="response-content">{respostaIA}</div>
          </div>
        )}
      </div>

      {/* Erro */}
      {erro && (
        <div className="error-message">
          ⚠️ {erro}
        </div>
      )}
    </div>
  );
}
