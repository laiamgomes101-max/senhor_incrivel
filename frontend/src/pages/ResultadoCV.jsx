// Página: ResultadoCV
// Propósito: Exibir o resultado da análise do currículo.
import { useState, useEffect } from 'react'
import api from '../api/client'
import flaskClient from '../api/flaskClient'
import './ResultadoCV.css'

export default function ResultadoCV() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        // Buscar perfil do candidato que inclui o currículo e o status
        const res = await flaskClient.get('/api/candidatos/me')
        const perfil = res.data || {}
        const curriculo = perfil.curriculo || null
        if (!curriculo) {
          setAnalysis(null)
        } else {
          setAnalysis({
            status: curriculo.status_resultado || 'pendente',
            motivo: curriculo.status_motivo || null,
            arquivo_url: curriculo.arquivo_url || null
          })
        }
      } catch (err) {
        console.error(err)
        setError('Não foi possível obter o resultado do currículo.')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalysis()
  }, [])

  if (loading) return <p className="loading">Carregando...</p>
  if (error) return <p className="error">{error}</p>
  if (!analysis) return <p>Nenhuma análise disponível.</p>

  return (
    <div className="resultado-page">
      <h1>Resultado da Análise</h1>
      <section className="skills">
        <h3>Skills detectadas</h3>
        <ul>
          {(analysis.skills || []).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </section>
      <section className="status">
        <h3>Status do Currículo</h3>
        <p>{analysis.status === 'aprovado' ? 'Aprovado' : analysis.status === 'reprovado' ? 'Reprovado' : 'Pendente'}</p>
        {analysis.motivo && <p><strong>Motivo:</strong> {analysis.motivo}</p>}
      </section>
      <section className="suggestions">
        <h3>Sugestões</h3>
        <p>{analysis.recomendacao || 'Sem sugestões.'}</p>
      </section>
    </div>
  )
}
