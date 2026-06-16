import { useState } from 'react'
import './CertificatesManager.css'

export default function CertificatesManager({ certificates, onCertificatesChange }) {
  const [newCert, setNewCert] = useState({
    nome: '',
    instituicao: '',
    data_conclusao: '',
    link_certificado: '',
    descricao: ''
  })
  const [showForm, setShowForm] = useState(false)

  const handleAddCertificate = () => {
    if (!newCert.nome.trim()) return

    const certificado = {
      id: Date.now(),
      ...newCert,
      verified: false
    }

    onCertificatesChange([...(certificates || []), certificado])
    setNewCert({
      nome: '',
      instituicao: '',
      data_conclusao: '',
      link_certificado: '',
      descricao: ''
    })
    setShowForm(false)
  }

  const handleRemoveCertificate = (id) => {
    onCertificatesChange(certificates.filter(cert => cert.id !== id))
  }

  const handleVerifyCertificate = (id) => {
    onCertificatesChange(
      certificates.map(cert => 
        cert.id === id ? { ...cert, verified: !cert.verified } : cert
      )
    )
  }

  return (
    <div className="certificates-manager">
      <div className="certificates-header">
        <h3>Certificações e Cursos</h3>
        <button 
          className="btn-add-cert"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : '+ Adicionar'}
        </button>
      </div>

      {showForm && (
        <div className="cert-form">
          <div className="form-grid">
            <input
              type="text"
              placeholder="Nome do curso/certificação"
              value={newCert.nome}
              onChange={(e) => setNewCert({...newCert, nome: e.target.value})}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Instituição"
              value={newCert.instituicao}
              onChange={(e) => setNewCert({...newCert, instituicao: e.target.value})}
              className="form-input"
            />
            <input
              type="month"
              placeholder="Data de conclusão"
              value={newCert.data_conclusao}
              onChange={(e) => setNewCert({...newCert, data_conclusao: e.target.value})}
              className="form-input"
            />
            <input
              type="url"
              placeholder="Link do certificado (opcional)"
              value={newCert.link_certificado}
              onChange={(e) => setNewCert({...newCert, link_certificado: e.target.value})}
              className="form-input"
            />
          </div>
          <textarea
            placeholder="Descrição (opcional)"
            value={newCert.descricao}
            onChange={(e) => setNewCert({...newCert, descricao: e.target.value})}
            className="form-textarea"
            rows={3}
          />
          <button 
            className="btn-save-cert"
            onClick={handleAddCertificate}
            disabled={!newCert.nome.trim()}
          >
            Salvar Certificação
          </button>
        </div>
      )}

      <div className="certificates-list">
        {certificates?.length === 0 ? (
          <p className="empty-state">Nenhuma certificação adicionada ainda.</p>
        ) : (
          certificates.map((cert) => (
            <div key={cert.id} className="certificate-card">
              <div className="cert-header">
                <div className="cert-info">
                  <h4 className="cert-name">{cert.nome}</h4>
                  <p className="cert-institution">{cert.instituicao}</p>
                  {cert.data_conclusao && (
                    <span className="cert-date">
                      Concluído: {new Date(cert.data_conclusao).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                <div className="cert-actions">
                  <button
                    className={`btn-verify ${cert.verified ? 'verified' : ''}`}
                    onClick={() => handleVerifyCertificate(cert.id)}
                  >
                    {cert.verified ? 'Verificado' : 'Verificar'}
                  </button>
                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveCertificate(cert.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
              {cert.descricao && (
                <p className="cert-description">{cert.descricao}</p>
              )}
              {cert.link_certificado && (
                <a 
                  href={cert.link_certificado} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cert-link"
                >
                  Ver Certificado
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
