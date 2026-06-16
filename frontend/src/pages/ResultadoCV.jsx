// Página: ResultadoCV
// Propósito: Exibir o resultado da análise do currículo.
import { useState, useEffect } from 'react'
import api from '../api/client'
import './ResultadoCV.css'

export default function ResultadoCV() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await api.get('/analisar/historico')
        const hist = res.data.historico || []
        if (hist.length) {
          const row = hist[0]
          let parsed = null
          if (row.resultado) {
            try {
              parsed = typeof row.resultado === 'string' ? JSON.parse(row.resultado) : row.resultado
            } catch (e) {
              console.warn('Falha ao parsear resultado da análise:', e)
              parsed = row.resultado
            }
            // anexa metadados se não existirem
            parsed.meta = parsed.meta || {
              user_id: row.user_id,
              curriculo_id: row.curriculo_id,
              vaga_id: row.vaga_id,
              data_analise: row.data_analise || null
            }
            setAnalysis(parsed)
          } else {
            setAnalysis(row)
          }
        } else setAnalysis(null)
      } catch (err) {
        console.error(err)
        setError('Não foi possível obter o resultado.')
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
      <section className="score">
        <h3>Score geral</h3>
        <p>{analysis.compatibilidade_pct ?? analysis.score}%</p>
      </section>
      <section className="suggestions">
        <h3>Sugestões</h3>
        <p>{analysis.recomendacao || 'Sem sugestões.'}</p>
      </section>
    </div>
  )
}
