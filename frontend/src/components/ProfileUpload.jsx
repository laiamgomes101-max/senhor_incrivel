import { useState, useRef, useEffect } from 'react'
import './ProfileUpload.css'

export default function ProfileUpload({ currentPhoto, onPhotoChange, size = 120 }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentPhoto || '')
  const fileInputRef = useRef(null)

  useEffect(() => {
    setPreview(currentPhoto || '')
  }, [currentPhoto])

  const getDataUrlFromBlob = async (blob) => {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const resizeImage = async (file) => {
    const imgBitmap = await createImageBitmap(file)
    const maxDimension = 640
    let width = imgBitmap.width
    let height = imgBitmap.height
    const ratio = Math.min(1, maxDimension / Math.max(width, height))
    width = Math.floor(width * ratio)
    height = Math.floor(height * ratio)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(imgBitmap, 0, 0, width, height)

    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const qualities = [0.65, 0.55, 0.45]
    const maxDataUrlLength = 900000

    for (const quality of qualities) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality))
      if (!blob) {
        throw new Error('Falha ao processar imagem')
      }
      const dataUrl = await getDataUrlFromBlob(blob)
      if (dataUrl.length <= maxDataUrlLength || quality === qualities[qualities.length - 1]) {
        return dataUrl
      }
    }

    throw new Error('A imagem é muito grande após compressão. Tente outra imagem menor.')
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tipo e tamanho
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem (JPG, PNG, etc.)')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    setUploading(true)

    try {
      const resizedDataUrl = await resizeImage(file)
      setPreview(resizedDataUrl)
      onPhotoChange(resizedDataUrl)
    } catch (error) {
      console.error(error)
      alert('Erro ao processar imagem')
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPreview('')
    onPhotoChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="profile-upload">
      <div 
        className="profile-avatar"
        style={{ width: size, height: size }}
        onClick={handleClick}
      >
        {preview ? (
          <img src={preview} alt="Foto de perfil" />
        ) : (
          <div className="avatar-placeholder">
            <span className="avatar-icon">+</span>
            <span className="avatar-text">Foto</span>
          </div>
        )}
        {uploading && (
          <div className="upload-overlay">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      
      <div className="profile-upload-actions">
        <button 
          type="button" 
          className="btn-upload"
          onClick={handleClick}
          disabled={uploading}
        >
          {uploading ? 'Enviando...' : preview ? 'Trocar Foto' : 'Adicionar Foto'}
        </button>
        
        {preview && (
          <button 
            type="button" 
            className="btn-remove"
            onClick={handleRemove}
          >
            Remover
          </button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <p className="upload-hint">
        Formatos: JPG, PNG. Máximo: 5MB
      </p>
    </div>
  )
}
