// Página: UploadCV
// Propósito: Formulário para enviar currículo do candidato.
import { useState } from 'react'
import api from '../api/client'
import flaskClient from '../api/flaskClient'
import './UploadCV.css'

export default function UploadCV() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files))
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (files.length === 0) return
    setLoading(true)
    setMessage('')

    try {
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        await flaskClient.post('/api/curriculos/upload', form)
      }
      setMessage('Currículo enviado com sucesso! Vá para Meu Perfil para visualizar.')
      setFiles([])
    } catch (err) {
      console.error(err)
      setMessage('Erro ao enviar arquivo. Verifique se é PDF ou DOCX e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-page">
      <h1>Enviar Currículo</h1>
      <p className="upload-note">
        O currículo enviado será associado ao seu perfil de candidato e ficará disponível para empresas visualizarem e analisarem.
      </p>
      <form onSubmit={handleUpload} className="upload-form">
        <input type="file" multiple onChange={handleFileChange} />
        <button type="submit" disabled={loading || files.length === 0}>Enviar</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  )
}
