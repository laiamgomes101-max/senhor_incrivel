// Página: Candidato
// Propósito: Visualizar e editar perfil do candidato; candidaturas e currículos.
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import flaskClient from '../api/flaskClient'
import api from '../api/client'
import Tooltip from '../components/Tooltip'
import ProgressIndicator from '../components/ProgressIndicator'
import ProfileUpload from '../components/ProfileUpload'
import AvailabilityStatus from '../components/AvailabilityStatus'
import CertificatesManager from '../components/CertificatesManager'
import './Candidato.css'

export default function Candidato() {
  const { id } = useParams()
  const { candidato: meuCandidato, empresa } = useAuth()
  const navigate = useNavigate()
  const [candidato, setCandidato] = useState(null)
  const [listaCandidatos, setListaCandidatos] = useState([])
  const [vagas, setVagas] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [activeTab, setActiveTab] = useState('resumo')
  const [deleting, setDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState({
    nome: '',
    headline: '',
    localizacao: '',
    sobre: '',
    foto_url: '',
    disponibilidade: 'disponivel',
    curriculo: {
      habilidades: [],
      idiomas: [],
      experiencia: [],
      educacao: [],
      certificados: []
    }
  })

  const flaskApiUrl = import.meta.env.VITE_FLASK_URL || import.meta.env.VITE_API_URL || ''
  const souEu = !id && meuCandidato
  const endpoint = souEu ? '/candidatos/me' : `/candidatos/${id}`
  const listarCandidatos = !id && empresa
  // Currículo agora é manual: não usar upload/preview de arquivo automático
  const arquivoUrl = null
  const arquivoLink = null
  const hasCurriculoData = candidato?.curriculo && (
    (candidato.curriculo.habilidades?.length > 0) ||
    (candidato.curriculo.idiomas?.length > 0) ||
    (candidato.curriculo.experiencia?.length > 0) ||
    (candidato.curriculo.educacao?.length > 0)
  )

  useEffect(() => {
    if (souEu || id) {
      const promises = [flaskClient.get(`/api${endpoint}`)]
      if (souEu) promises.push(flaskClient.get('/api/vagas/'))
      Promise.all(promises)
        .then(([perfilRes, vagasRes]) => {
          const data = perfilRes.data
          setCandidato(data)
          setForm({
            nome: data.nome || '',
            headline: data.headline || '',
            localizacao: data.localizacao || '',
            sobre: data.sobre || '',
            foto_url: data.foto_url || '',
            disponibilidade: data.disponibilidade || 'disponivel',
            curriculo: data.curriculo || {
              habilidades: [],
              idiomas: [],
              experiencia: [],
              educacao: [],
              certificados: []
            }
          })
          if (vagasRes) setVagas(vagasRes.data.vagas || [])
        })
        .catch((err) => {
          const status = err?.response?.status
          if (status === 404) {
            setErrorMsg('Candidato não encontrado.')
          } else if (status === 401) {
            // não autorizado: levar para tela de login
            navigate('/login')
            return
          } else {
            setErrorMsg('Erro ao carregar perfil do candidato.')
            console.error(err)
          }
        })
        .finally(() => setLoading(false))
    } else if (listarCandidatos) {
      flaskClient.get('/api/candidatos/').then(({ data }) => setListaCandidatos(data.candidatos || []))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id, souEu, endpoint, listarCandidatos, navigate])

  const salvarPerfil = async (e) => {
    e.preventDefault()
    setSaveError('')
    setSaveMessage('')
    setSaving(true)
    try {
      await flaskClient.put('/api/candidatos/me', form)
      setCandidato(prev => ({ ...prev, ...form }))
      setEditando(false)
      setSaveMessage('Perfil atualizado com sucesso.')
    } catch (err) {
      console.error(err)
      setSaveError(err.message || 'Erro ao salvar o perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const salvarFoto = async (dataUrl) => {
    // Persiste a foto imediatamente para evitar perda ao navegar
    setSaveError('')
    setSaveMessage('')
    setSaving(true)
    try {
      await flaskClient.put('/api/candidatos/me', { foto_url: dataUrl })
      setCandidato(prev => ({ ...prev, foto_url: dataUrl }))
      setForm(f => ({ ...f, foto_url: dataUrl }))
      setSaveMessage('Foto salva com sucesso.')
    } catch (err) {
      console.error('Erro ao salvar foto:', err)
      setSaveError(err.message || 'Erro ao salvar a foto. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const updateExperienceField = (index, field, value) => {
    setForm(f => {
      const experiencia = Array.isArray(f.curriculo?.experiencia) ? [...f.curriculo.experiencia] : []
      experiencia[index] = { ...experiencia[index], [field]: value }
      return { ...f, curriculo: { ...f.curriculo, experiencia } }
    })
  }

  const addExperience = () => {
    setForm(f => ({
      ...f,
      curriculo: {
        ...f.curriculo,
        experiencia: [...(Array.isArray(f.curriculo?.experiencia) ? f.curriculo.experiencia : []), { titulo: '', empresa: '' }]
      }
    }))
  }

  const removeExperience = (index) => {
    setForm(f => {
      const experiencia = Array.isArray(f.curriculo?.experiencia) ? [...f.curriculo.experiencia] : []
      experiencia.splice(index, 1)
      return { ...f, curriculo: { ...f.curriculo, experiencia } }
    })
  }

  const updateEducationField = (index, field, value) => {
    setForm(f => {
      const educacao = Array.isArray(f.curriculo?.educacao) ? [...f.curriculo.educacao] : []
      educacao[index] = { ...educacao[index], [field]: value }
      return { ...f, curriculo: { ...f.curriculo, educacao } }
    })
  }

  const addEducation = () => {
    setForm(f => ({
      ...f,
      curriculo: {
        ...f.curriculo,
        educacao: [...(Array.isArray(f.curriculo?.educacao) ? f.curriculo.educacao : []), { curso: '', instituicao: '' }]
      }
    }))
  }

  const removeEducation = (index) => {
    setForm(f => {
      const educacao = Array.isArray(f.curriculo?.educacao) ? [...f.curriculo.educacao] : []
      educacao.splice(index, 1)
      return { ...f, curriculo: { ...f.curriculo, educacao } }
    })
  }

  const candidatar = async (vagaId) => {
    const hasCurriculo = candidato?.curriculo && (
      candidato.curriculo.arquivo_url ||
      (Array.isArray(candidato.curriculo.habilidades) && candidato.curriculo.habilidades.length > 0) ||
      (Array.isArray(candidato.curriculo.idiomas) && candidato.curriculo.idiomas.length > 0) ||
      (Array.isArray(candidato.curriculo.experiencia) && candidato.curriculo.experiencia.length > 0) ||
      (Array.isArray(candidato.curriculo.educacao) && candidato.curriculo.educacao.length > 0)
    )

    if (!hasCurriculo) {
      alert('É necessário ter um currículo no seu perfil antes de se candidatar a uma vaga.')
      return
    }

    try {
      await flaskClient.post('/api/vagas/candidaturas', { vaga_id: vagaId })
      alert('Candidatura enviada com sucesso!')
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao candidatar')
    }
  }

  const handleDeleteCurriculo = async () => {
    if (!candidato?.curriculo?.id) return
    const confirmRemove = window.confirm('Tem certeza que deseja remover seu currículo do perfil? Esta ação não poderá ser desfeita.')
    if (!confirmRemove) return

    setDeleting(true)
    setDeleteMessage('')
    try {
      await flaskClient.delete(`/api/curriculos/${candidato.curriculo.id}`)
      setDeleteMessage('Currículo removido com sucesso.')
      setCandidato(prev => ({
        ...prev,
        curriculo: {
          id: null,
          arquivo_url: '',
          habilidades: [],
          idiomas: [],
          experiencia: [],
          educacao: [],
          certificados: []
        }
      }))
    } catch (err) {
      console.error(err)
      setDeleteMessage(err.response?.data?.error || 'Erro ao remover currículo. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="loading">Carregando...</p>

  if (errorMsg) return (
    <div className="candidato-page">
      <h1>Erro</h1>
      <div className="alert error">{errorMsg}</div>
    </div>
  )

  if (listarCandidatos) {
    return (
      <div className="candidato-page">
        <h1>Candidatos</h1>
        <p className="subtitle">Explore perfis de candidatos na plataforma</p>
        <div className="vagas-grid candidatos-grid">
          {listaCandidatos.map(c => (
            <Link key={c.id} to={`/app/candidato/${c.id}`} className="vaga-card candidato-card">
              <div className="perfil-avatar pequeno">{c.nome?.[0] || '?'}</div>
              <h3>{c.nome}</h3>
              <p className="local">{c.localizacao}</p>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="candidato-page">
      <div className="perfil-card">
        <div className="perfil-header">
          <div className="perfil-avatar">
            {candidato?.foto_url ? (
              <img src={candidato.foto_url} alt={candidato?.nome ? `${candidato.nome} — foto` : 'Foto de perfil'} />
            ) : (
              candidato?.nome?.[0] || '?'
            )}
          </div>
          <div>
            {souEu && (
              <div className="profile-header">
                <div className="profile-info">
                  <h1>Meu Perfil</h1>
                  <p>Complete suas informações para aumentar suas chances</p>
                </div>
                <button
                  className={`edit-btn ${editando ? 'active' : ''}`}
                  onClick={() => setEditando(!editando)}
                >
                  {editando ? 'Cancelar' : 'Editar Perfil'}
                </button>
              </div>
            )}

            {souEu && (
              <div className="progress-section">
                <ProgressIndicator 
                  userType="candidato" 
                  data={form} 
                  showDetails={false}
                />
              </div>
            )}

            {souEu && (
              <section className="profile-card profile-settings">
                <h3>Configurações</h3>
                <p>Gerencie informações de login e notificações em sua conta.</p>
                <Link to="/app/settings" className="btn-secondary">Ir para Configurações</Link>
              </section>
            )}

            <div className="tabs">
              {[
                { key: 'resumo', label: 'Resumo' },
                { key: 'habilidades', label: 'Habilidades' },
                { key: 'experiencia', label: 'Experiência' },
                { key: 'educacao', label: 'Educação' },
                { key: 'curriculo', label: 'Currículo' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {editando ? (
          <form onSubmit={salvarPerfil} className="form-edit">
            <h3>Informações Básicas</h3>
            <ProfileUpload
              currentPhoto={form.foto_url}
              onPhotoChange={(value) => {
                setForm(f => ({ ...f, foto_url: value }))
                salvarFoto(value)
              }}
            />
            <input
              value={form.nome}
              onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Nome"
            />
            <input
              value={form.headline}
              onChange={(e) => setForm(f => ({ ...f, headline: e.target.value }))}
              placeholder="Headline (ex: Desenvolvedor Frontend)"
            />
            <input
              value={form.localizacao}
              onChange={(e) => setForm(f => ({ ...f, localizacao: e.target.value }))}
              placeholder="Localização (ex: angola\benfica)"
            />
            <textarea
              value={form.sobre}
              onChange={(e) => setForm(f => ({ ...f, sobre: e.target.value }))}
              placeholder="Sobre você"
              rows={4}
            />

            <h3>Habilidades</h3>
            <input
              value={(form.curriculo?.habilidades || []).join(', ')}
              onChange={(e) => setForm(f => ({
                ...f,
                curriculo: { ...f.curriculo, habilidades: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
              }))}
              placeholder="JavaScript, React, Python, etc. (separadas por vírgula)"
            />

            <h3>Idiomas</h3>
            <input
              value={(form.curriculo?.idiomas || []).join(', ')}
              onChange={(e) => setForm(f => ({
                ...f,
                curriculo: { ...f.curriculo, idiomas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
              }))}
              placeholder="Português, Inglês, Espanhol, etc."
            />

            <h3>Experiência</h3>
            {(form.curriculo?.experiencia || []).map((item, index) => (
              <div key={index} className="experience-input-group">
                <input
                  value={item.titulo || ''}
                  onChange={(e) => updateExperienceField(index, 'titulo', e.target.value)}
                  placeholder="Título / cargo"
                />
                <input
                  value={item.empresa || ''}
                  onChange={(e) => updateExperienceField(index, 'empresa', e.target.value)}
                  placeholder="Empresa"
                />
                <button type="button" className="btn-remove" onClick={() => removeExperience(index)}>
                  Remover experiência
                </button>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addExperience}>
              Adicionar experiência
            </button>

            <h3>Educação</h3>
            {(form.curriculo?.educacao || []).map((item, index) => (
              <div key={index} className="experience-input-group">
                <input
                  value={item.curso || ''}
                  onChange={(e) => updateEducationField(index, 'curso', e.target.value)}
                  placeholder="Curso"
                />
                <input
                  value={item.instituicao || ''}
                  onChange={(e) => updateEducationField(index, 'instituicao', e.target.value)}
                  placeholder="Instituição"
                />
                <button type="button" className="btn-remove" onClick={() => removeEducation(index)}>
                  Remover educação
                </button>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addEducation}>
              Adicionar educação
            </button>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            {saveMessage && <div className="alert success" style={{ marginTop: '1rem' }}>{saveMessage}</div>}
            {saveError && <div className="alert error" style={{ marginTop: '1rem' }}>{saveError}</div>}
          </form>
        ) : (
          <>
            <div className={`tab-panel ${activeTab === 'resumo' ? 'active' : ''}`}>
              <section>
                <h3>Resumo</h3>
                <div className="info-grid">
                  {candidato?.headline && <div className="info-item"><strong>Profissão:</strong> {candidato.headline}</div>}
                  {candidato?.localizacao && <div className="info-item"><strong>Local:</strong> {candidato.localizacao}</div>}
                </div>
              </section>

              {candidato?.sobre && (
                <section>
                  <h3>Sobre</h3>
                  <p>{candidato.sobre}</p>
                </section>
              )}
            </div>

            <div className={`tab-panel ${activeTab === 'habilidades' ? 'active' : ''}`}>
              {(candidato?.curriculo?.habilidades?.length > 0 || candidato?.curriculo?.idiomas?.length > 0) ? (
                <>
                  {candidato?.curriculo?.habilidades?.length > 0 ? (
                    <section>
                      <h3>Habilidades</h3>
                      <div className="badges">
                        {candidato.curriculo.habilidades.map((skill, i) => (
                          <span key={i} className="badge">{skill}</span>
                        ))}
                      </div>
                    </section>
                  ) : <p className="text-muted">Nenhuma habilidade definida.</p>}

                  {candidato?.curriculo?.idiomas?.length > 0 ? (
                    <section>
                      <h3>Idiomas</h3>
                      <div className="badges">
                        {candidato.curriculo.idiomas.map((idioma, i) => (
                          <span key={i} className="badge">{idioma}</span>
                        ))}
                      </div>
                    </section>
                  ) : <p className="text-muted">Nenhum idioma definido.</p>}
                </>
              ) : <p className="text-muted">Sem dados de habilidades ou idiomas.</p>}
            </div>

            <div className={`tab-panel ${activeTab === 'experiencia' ? 'active' : ''}`}>
              <section>
                <h3>Experiência</h3>
                {candidato?.curriculo?.experiencia?.length > 0 ? (
                  <div className="experience-grid">
                    {candidato.curriculo.experiencia.map((exp, i) => (
                      <div key={i} className="item-box">
                        <h4>{exp.titulo || `Experiência ${i + 1}`}</h4>
                        <p>{exp.empresa || 'Empresa não informada'}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted">Nenhuma experiência cadastrada.</p>}
              </section>
            </div>

            <div className={`tab-panel ${activeTab === 'educacao' ? 'active' : ''}`}>
              <section>
                <h3>Educação</h3>
                {candidato?.curriculo?.educacao?.length > 0 ? (
                  <div className="experience-grid">
                    {candidato.curriculo.educacao.map((edu, i) => (
                      <div key={i} className="item-box">
                        <h4>{edu.curso || edu.instituicao || `Educação ${i + 1}`}</h4>
                        <p>{edu.instituicao || 'Instituição não informada'}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted">Nenhuma educação cadastrada.</p>}
              </section>
            </div>

            <div className={`tab-panel ${activeTab === 'curriculo' ? 'active' : ''}`}>
              <section>
                <h3>Currículo (preenchimento manual)</h3>
                <p className="profile-note">Preencha abaixo as informações do seu currículo. Não é necessário enviar arquivo.</p>
                {candidato?.curriculo?.habilidades && (
                  <div>
                    <h4>Habilidades</h4>
                    <p>{Array.isArray(candidato.curriculo.habilidades) ? candidato.curriculo.habilidades.join(', ') : candidato.curriculo.habilidades}</p>
                  </div>
                )}
                {candidato?.curriculo?.idiomas && (
                  <div>
                    <h4>Idiomas</h4>
                    <p>{Array.isArray(candidato.curriculo.idiomas) ? candidato.curriculo.idiomas.join(', ') : candidato.curriculo.idiomas}</p>
                  </div>
                )}
                {candidato?.curriculo?.experiencia?.length > 0 && (
                  <div>
                    <h4>Experiência</h4>
                    {candidato.curriculo.experiencia.map((exp, i) => (
                      <div key={i} className="item-box">
                        <h4>{exp.titulo || `Experiência ${i + 1}`}</h4>
                        <p>{exp.empresa || 'Empresa não informada'}</p>
                      </div>
                    ))}
                  </div>
                )}
                {souEu && (
                  <p className="text-muted">Para atualizar estas informações, clique em <strong>Editar Perfil</strong>.</p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
