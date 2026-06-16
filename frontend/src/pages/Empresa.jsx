// Página: Empresa
// Propósito: Visualizar/editar perfil da empresa e gerenciar vagas.
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import flaskClient from '../api/flaskClient'
import ProfileUpload from '../components/ProfileUpload'
import './Empresa.css'

export default function Empresa() {
  const { id } = useParams()
  const { empresa: minhaEmpresa, candidato } = useAuth()
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState(null)
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ nome: '', setor: '', localizacao: '', sobre: '', site_url: '', logo_url: '' })
  const [novaVaga, setNovaVaga] = useState({ titulo: '', descricao: '', tipo_contrato: '' })
  const [editandoVaga, setEditandoVaga] = useState(null)
  const [vagaForm, setVagaForm] = useState({ titulo: '', descricao: '', tipo_contrato: '' })
  const [filterText, setFilterText] = useState('')
  const [formError, setFormError] = useState('')
  const [vagaError, setVagaError] = useState('')
  const [candidaturas, setCandidaturas] = useState([])
  const [candidaturasLoading, setCandidaturasLoading] = useState(false)

  const souEu = !id && minhaEmpresa
  const [activeTab, setActiveTab] = useState('visao')
  const endpoint = souEu ? '/empresas/me' : `/empresas/${id}`

  const displaySite = (url) => url?.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const totalVagas = empresa?.vagas?.length || 0
  const vagasAtivas = totalVagas
  const filteredEmpresas = empresas.filter((empresa) => {
    const search = filterText.toLowerCase().trim()
    if (!search) return true
    return [empresa.nome, empresa.setor, empresa.localizacao]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(search))
  })

  useEffect(() => {
    if (souEu || id) {
      flaskClient.get(`/api${endpoint}`)
        .then(({ data }) => {
          setEmpresa(data)
          setForm({
            nome: data.nome || '',
            setor: data.setor || '',
            localizacao: data.localizacao || '',
            sobre: data.sobre || '',
            site_url: data.site_url || '',
            logo_url: data.logo_url || ''
          })
        })
        .catch(() => navigate('/app'))
        .finally(() => setLoading(false))
    } else {
      flaskClient.get('/api/empresas/').then(({ data }) => setEmpresas(data.empresas || []))
      setLoading(false)
    }
  }, [id, souEu, endpoint, navigate])

  useEffect(() => {
    const fetchCandidaturas = async () => {
      if (!souEu || !empresa?.id) return
      setCandidaturasLoading(true)

      try {
        const { data } = await flaskClient.get(`/api/vagas/candidaturas/by_empresa/${empresa.id}`)
        setCandidaturas(data.candidaturas || [])
      } catch (err) {
        console.error(err)
        setCandidaturas([])
      } finally {
        setCandidaturasLoading(false)
      }
    }

    fetchCandidaturas()
  }, [empresa?.id, souEu])

  const salvarEmpresa = async (e) => {
    e.preventDefault()
    try {
      await flaskClient.put('/api/empresas/me', form)
      setEmpresa(prev => ({ ...prev, ...form }))
      setEditando(false)
    } catch (err) {
      console.error(err)
    }
  }

  const salvarLogo = async (dataUrl) => {
    try {
      await flaskClient.put('/api/empresas/me', { logo_url: dataUrl })
      setEmpresa(prev => ({ ...prev, logo_url: dataUrl }))
      setForm((f) => ({ ...f, logo_url: dataUrl }))
    } catch (err) {
      console.error('Erro ao salvar logo:', err)
    }
  }

  const criarVaga = async (e) => {
    e.preventDefault()
    if (!novaVaga.titulo.trim() || !novaVaga.descricao.trim() || !novaVaga.tipo_contrato.trim()) {
      setVagaError('Preencha título, descrição e tipo de contrato para publicar a vaga.')
      return
    }

    setVagaError('')
    try {
      await flaskClient.post('/api/vagas/', novaVaga)
      setNovaVaga({ titulo: '', descricao: '', tipo_contrato: '' })
      const { data } = await flaskClient.get(`/api${endpoint}`)
      setEmpresa(data)
    } catch (err) {
      setVagaError(err.response?.data?.error || 'Erro ao criar vaga')
    }
  }

  const startEditVaga = (vaga) => {
    setEditandoVaga(vaga.id)
    setVagaForm({ titulo: vaga.titulo, descricao: vaga.descricao, tipo_contrato: vaga.tipo_contrato })
  }

  const saveVaga = async (e, id) => {
    e.preventDefault()
    if (!vagaForm.titulo.trim() || !vagaForm.descricao.trim() || !vagaForm.tipo_contrato.trim()) {
      setVagaError('Preencha título, descrição e tipo de contrato para atualizar a vaga.')
      return
    }

    setVagaError('')
    await flaskClient.patch(`/api/vagas/${id}`, vagaForm)
    const { data } = await flaskClient.get(`/api${endpoint}`)
    setEmpresa(data)
    setEditandoVaga(null)
  }

  const cancelEditVaga = () => {
    setEditandoVaga(null)
    setVagaError('')
  }

  const deleteVaga = async (id) => {
    if (!window.confirm('Tem certeza?')) return
    await flaskClient.delete(`/api/vagas/${id}`)
    const { data } = await flaskClient.get(`/api${endpoint}`)
    setEmpresa(data)
  }

  const closeVaga = async (id) => {
    await flaskClient.patch(`/api/vagas/${id}`, { ativa: false })
    const { data } = await flaskClient.get(`/api${endpoint}`)
    setEmpresa(data)
  }

  if (loading) return <p className="loading">Carregando...</p>

  if (!souEu && !id) {
    return (
      <div className="empresa-page">
        <header className="empresa-hero">
          <div>
            <h1>Empresas</h1>
            <p className="subtitle">Encontre empresas e explore perfis cadastrados.</p>
          </div>
          <div className="empresa-search-row">
            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Buscar por empresa, setor ou cidade"
              className="filter-input"
            />
            <span className="empresa-count">{filteredEmpresas.length} empresa(s) encontrada(s)</span>
          </div>
        </header>

        <div className="empresas-grid">
          {filteredEmpresas.length > 0 ? filteredEmpresas.map((e) => (
            <Link key={e.id} to={`/app/empresa/${e.id}`} className="empresa-card">
              <div className="empresa-logo">{e.nome?.[0] || 'E'}</div>
              <div className="empresa-card-body">
                <h3>{e.nome}</h3>
                <p className="empresa-card-setor">{e.setor}</p>
                <p className="local">{e.localizacao}</p>
              </div>
            </Link>
          )) : (
            <div className="empty-state">
              <p>Nenhuma empresa encontrada. Tente outro termo de busca.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="empresa-page">
      <div className="empresa-hero-card">
        <div className="perfil-header">
          <div className="empresa-logo grande">
            {empresa?.logo_url ? (
              <img src={empresa.logo_url} alt={empresa?.nome ? `${empresa.nome} — logo` : 'Logo da empresa'} />
            ) : (
              empresa?.nome?.[0] || 'E'
            )}
          </div>
          <div className="empresa-header-content">
            <div className="empresa-title-row">
              <div>
                <h1>{empresa?.nome}</h1>
                <p className="setor">{empresa?.setor}</p>
              </div>
              {souEu && (
                <button onClick={() => setEditando(!editando)} className="btn-edit">
                  {editando ? 'Cancelar edição' : 'Editar perfil'}
                </button>
              )}
            </div>
            <div className="empresa-meta">
              <span>{empresa?.localizacao || 'Localização não informada'}</span>
              {empresa?.site_url && (
                <a href={empresa.site_url} target="_blank" rel="noopener noreferrer" className="company-link">
                  {displaySite(empresa.site_url)}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total de vagas</span>
            <strong>{totalVagas}</strong>
            <p>{vagasAtivas} vagas abertas</p>
          </div>
          <div className="stat-card">
            <span className="stat-label">Setor</span>
            <strong>{empresa?.setor || '—'}</strong>
            <p>Posição da empresa</p>
          </div>
          <div className="stat-card">
            <span className="stat-label">Candidaturas</span>
            <strong>{souEu ? candidaturas.length : '—'}</strong>
            <p>{souEu ? 'Recebidas no perfil' : 'Apenas para proprietários'}</p>
          </div>
          <div className="stat-card">
            <span className="stat-label">Perfil</span>
            <strong>{empresa?.nome ? empresa.nome.split(' ').slice(0, 2).join(' ') : '—'}</strong>
            <p>Visão geral da empresa</p>
          </div>
        </div>
      </div>

      <div className="tabs">
        {[
          { key: 'visao', label: 'Visão Geral' },
          { key: 'vagas', label: 'Vagas' },
          { key: 'candidatos', label: 'Candidatos' },
          { key: 'config', label: 'Configurações' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {editando ? (
        <form onSubmit={salvarEmpresa} className="form-edit">
          <h3>Editar Dados da Empresa</h3>
          {formError && <p className="form-error">{formError}</p>}
          <ProfileUpload
            currentPhoto={form.logo_url}
            onPhotoChange={(value) => {
              setForm((f) => ({ ...f, logo_url: value }))
              salvarLogo(value)
            }}
            size={120}
          />
          <input
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            placeholder="Nome da empresa"
          />
          <input
            value={form.setor}
            onChange={(e) => setForm((f) => ({ ...f, setor: e.target.value }))}
            placeholder="Setor (ex: Tecnologia, Saúde, etc.)"
          />
          <input
            value={form.localizacao}
            onChange={(e) => setForm((f) => ({ ...f, localizacao: e.target.value }))}
            placeholder="Localização (ex: São Paulo, SP)"
          />
          <input
            value={form.site_url}
            onChange={(e) => setForm((f) => ({ ...f, site_url: e.target.value }))}
            placeholder="Site (URL completa, ex: https://example.com)"
          />
          <textarea
            value={form.sobre}
            onChange={(e) => setForm((f) => ({ ...f, sobre: e.target.value }))}
            placeholder="Sobre a empresa"
            rows={5}
          />
          <button type="submit" className="btn-primary">Salvar alterações</button>
        </form>
      ) : (
        <>
          <div className={`tab-panel ${activeTab === 'visao' ? 'active' : ''}`}>
            <div className="section-card">
              <div className="section-header">
                <h3>Resumo</h3>
                <span className="subtle">Informações principais do perfil</span>
              </div>
              <div className="info-grid">
                {empresa?.setor && <div className="info-item"><strong>Setor</strong><span>{empresa.setor}</span></div>}
                {empresa?.localizacao && <div className="info-item"><strong>Localização</strong><span>{empresa.localizacao}</span></div>}
                {empresa?.site_url && <div className="info-item"><strong>Site</strong><span><a href={empresa.site_url} target="_blank" rel="noopener noreferrer">{displaySite(empresa.site_url)}</a></span></div>}
                <div className="info-item"><strong>Total de vagas</strong><span>{totalVagas}</span></div>
                <div className="info-item"><strong>Vagas ativas</strong><span>{vagasAtivas}</span></div>
              </div>
            </div>

            {empresa?.sobre && (
              <div className="section-card">
                <div className="section-header">
                  <h3>Sobre a empresa</h3>
                </div>
                <p>{empresa.sobre}</p>
              </div>
            )}
          </div>

          <div className={`tab-panel ${activeTab === 'vagas' ? 'active' : ''}`}>
            {souEu && (
              <section className="section-card">
                <div className="section-header">
                  <h3>Publicar nova vaga</h3>
                  <span className="subtle">Adicione vagas e gerencie oportunidades.</span>
                </div>
                <form onSubmit={criarVaga} className="form-vaga">
                  <input
                    value={novaVaga.titulo}
                    onChange={(e) => setNovaVaga((v) => ({ ...v, titulo: e.target.value }))}
                    placeholder="Título da vaga"
                    required
                  />
                  <textarea
                    value={novaVaga.descricao}
                    onChange={(e) => setNovaVaga((v) => ({ ...v, descricao: e.target.value }))}
                    placeholder="Descrição da vaga"
                    rows={4}
                    required
                  />
                  <input
                    value={novaVaga.tipo_contrato}
                    onChange={(e) => setNovaVaga((v) => ({ ...v, tipo_contrato: e.target.value }))}
                    placeholder="Tipo de contrato (Permanente, Termo Certo, Termo Incerto, Prestação de Serviços, Estágio)"
                    required
                  />
                  {vagaError && <p className="form-error">{vagaError}</p>}
                  <button type="submit" className="btn-primary">Publicar vaga</button>
                </form>
              </section>
            )}

            <section className="section-card">
              <div className="section-header">
                <h3>Vagas</h3>
                <span className="subtle">{totalVagas} oportunidade(s) cadastrada(s)</span>
              </div>
              {empresa?.vagas?.length > 0 ? (
                        <div className="vagas-list">
                    {empresa.vagas.map((v) => (
                      <div key={v.id} className="vacancy-card">
                        {editandoVaga === v.id ? (
                          <form onSubmit={(e) => saveVaga(e, v.id)} className="form-vaga edit-vaga-form">
                            <input
                              value={vagaForm.titulo}
                              onChange={(e) => setVagaForm((prev) => ({ ...prev, titulo: e.target.value }))}
                              placeholder="Título da vaga"
                              required
                            />
                            <textarea
                              value={vagaForm.descricao}
                              onChange={(e) => setVagaForm((prev) => ({ ...prev, descricao: e.target.value }))}
                              placeholder="Descrição da vaga"
                              rows={4}
                              required
                            />
                            <input
                              value={vagaForm.tipo_contrato}
                              onChange={(e) => setVagaForm((prev) => ({ ...prev, tipo_contrato: e.target.value }))}
                              placeholder="Tipo de contrato (Permanente, Termo Certo, Termo Incerto, Prestação de Serviços, Estágio)"
                              required
                            />
                            {vagaError && <p className="form-error">{vagaError}</p>}
                            <div className="vaga-actions">
                              <button type="submit" className="btn-primary">Salvar alterações</button>
                              <button type="button" onClick={cancelEditVaga}>Cancelar</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div>
                              <div className="vacancy-header">
                                <h4>{v.titulo}</h4>
                                <span className={`status-badge ${v.ativa ? 'active' : 'closed'}`}>{v.ativa ? 'Aberta' : 'Fechada'}</span>
                              </div>
                              <p>{v.descricao?.slice(0, 160)}{v.descricao?.length > 160 ? '...' : ''}</p>
                              <p className="vacancy-meta">{v.tipo_contrato || 'Tipo não informado'}</p>
                            </div>
                            {souEu && (
                              <div className="vaga-actions">
                                <button type="button" onClick={() => startEditVaga(v)}>Editar</button>
                                <button type="button" onClick={() => deleteVaga(v.id)}>Excluir</button>
                                {v.ativa && <button type="button" onClick={() => closeVaga(v.id)}>Fechar</button>}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
              ) : (
                <p className="text-muted">Nenhuma vaga cadastrada no momento.</p>
              )}
            </section>
          </div>

          <div className={`tab-panel ${activeTab === 'candidatos' ? 'active' : ''}`}>
            <section className="section-card">
              <div className="section-header">
                <h3>Candidatos</h3>
                <span className="subtle">Acompanhe as candidaturas recebidas pela empresa.</span>
              </div>
              {souEu ? (
                candidaturasLoading ? (
                  <p className="text-muted">Carregando candidaturas...</p>
                ) : candidaturas.length > 0 ? (
                  <div className="candidatos-grid">
                    {candidaturas.map((item) => (
                      <div key={item.id} className="candidate-card">
                        <div className="candidate-avatar">{item.candidato?.nome?.[0] || 'C'}</div>
                        <div>
                          <h4>{item.candidato?.nome || 'Candidato'}</h4>
                          <p>{item.candidato?.email || 'Email não disponível'}</p>
                          <p className="candidate-meta">{item.vaga?.titulo || 'Vaga desconhecida'} • {item.status || 'Novo'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">Nenhuma candidatura recebida. As candidaturas aparecem aqui quando um candidato se inscreve nas suas vagas.</p>
                )
              ) : (
                <p className="text-muted">Candidaturas são visíveis apenas para a própria empresa.</p>
              )}
            </section>
          </div>

          <div className={`tab-panel ${activeTab === 'config' ? 'active' : ''}`}>
            <section className="section-card">
              <div className="section-header">
                <h3>Configurações</h3>
              </div>
              {souEu ? (
                <>
                  <p>Edite dados da empresa, e-mail e senha na tela de configurações.</p>
                  <Link to="/app/settings" className="link-button">Ir para configurações</Link>
                </>
              ) : (
                <p className="text-muted">Apenas a empresa proprietária pode editar as configurações deste perfil.</p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
