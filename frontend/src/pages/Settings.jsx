// Página: Settings
// Propósito: Definições de usuário e empresa (email, senha, perfil).
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import flaskClient from '../api/flaskClient'
import './Settings.css'

export default function Settings() {
  const { user, empresa, setUser, setEmpresa } = useAuth()
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [companyName, setCompanyName] = useState(empresa?.nome || '')
  const [companyLogo, setCompanyLogo] = useState(empresa?.logo_url || '')
  const [companyError, setCompanyError] = useState('')
  const [companySuccess, setCompanySuccess] = useState('')
  const [changingCompany, setChangingCompany] = useState(false)

  useEffect(() => {
    if (empresa) {
      setCompanyName(empresa.nome || '')
      setCompanyLogo(empresa.logo_url || '')
    }
  }, [empresa])

  // show/hide toggles for password fields with auto-hide
  const [showEmailPwd, setShowEmailPwd] = useState(false)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const emailHideRef = useRef(null)
  const currentHideRef = useRef(null)
  const newHideRef = useRef(null)
  const confirmHideRef = useRef(null)

  useEffect(() => {
    return () => {
      if (emailHideRef.current) clearTimeout(emailHideRef.current)
      if (currentHideRef.current) clearTimeout(currentHideRef.current)
      if (newHideRef.current) clearTimeout(newHideRef.current)
      if (confirmHideRef.current) clearTimeout(confirmHideRef.current)
    }
  }, [])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')

    if (!newEmail || !emailPassword) {
      setEmailError('Preencha o novo email e a senha para confirmar.')
      return
    }

    setChangingEmail(true)
    try {
      const res = await flaskClient.post('/api/auth/change-email', {
        new_email: newEmail,
        password: emailPassword
      })
      setEmailSuccess('Email alterado com sucesso!')
      // atualizar contexto
      setUser(prev => ({ ...prev, email: res.data.email }))
      setNewEmail('')
      setEmailPassword('')
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao alterar email'
      setEmailError(msg)
    } finally {
      setChangingEmail(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Preencha todos os campos.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (currentPassword === newPassword) {
      setPasswordError('A nova senha deve ser diferente da atual.')
      return
    }

    setChangingPassword(true)
    try {
      await flaskClient.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      })
      setPasswordSuccess('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao alterar senha'
      setPasswordError(msg)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleCompanySubmit = async (e) => {
    e.preventDefault()
    setCompanyError('')
    setCompanySuccess('')

    if (!companyName.trim()) {
      setCompanyError('O nome da empresa é obrigatório.')
      return
    }

    setChangingCompany(true)
    try {
      await flaskClient.put('/api/empresas/me', {
        nome: companyName.trim(),
        logo_url: companyLogo.trim() || null
      })
      setCompanySuccess('Perfil da empresa atualizado com sucesso!')
      setEmpresa(prev => prev ? ({ ...prev, nome: companyName.trim(), logo_url: companyLogo.trim() || null }) : prev)
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao atualizar perfil da empresa'
      setCompanyError(msg)
    } finally {
      setChangingCompany(false)
    }
  }

  return (
    <div className="settings-page">
      <h1>Definições</h1>
      {empresa && (
        <div className="section">
          <h2>Perfil da Empresa</h2>
          {companyError && <div className="alert error">{companyError}</div>}
          {companySuccess && <div className="alert success">{companySuccess}</div>}
          <form onSubmit={handleCompanySubmit} className="form">
            <label>Nome da empresa</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Nome da empresa"
              required
            />
            <label>URL da logo ou foto</label>
            <input
              type="url"
              value={companyLogo}
              onChange={e => setCompanyLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <button type="submit" disabled={changingCompany}>
              {changingCompany ? 'Salvando...' : 'Salvar perfil da empresa'}
            </button>
          </form>
        </div>
      )}

      <div className="section">
        <h2>Alterar Email</h2>
        <p className="info">Email atual: <strong>{user?.email || '-'}</strong></p>
        {emailError && <div className="alert error">{emailError}</div>}
        {emailSuccess && <div className="alert success">{emailSuccess}</div>}
        <form onSubmit={handleEmailSubmit} className="form">
          <label>Novo Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="novo@email.com"
            required
          />
          <label>Confirme sua Senha</label>
          <div className="pwd-row">
            <input
              type={showEmailPwd ? 'text' : 'password'}
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="show-pwd-btn"
              aria-pressed={showEmailPwd}
              onClick={() => {
                if (showEmailPwd) {
                  setShowEmailPwd(false)
                  if (emailHideRef.current) clearTimeout(emailHideRef.current)
                } else {
                  setShowEmailPwd(true)
                  if (emailHideRef.current) clearTimeout(emailHideRef.current)
                  emailHideRef.current = setTimeout(() => setShowEmailPwd(false), 5000)
                }
              }}
            >{showEmailPwd ? 'Ocultar' : 'Mostrar'}</button>
          </div>
          <button type="submit" disabled={changingEmail}>
            {changingEmail ? 'Alterando...' : 'Alterar Email'}
          </button>
        </form>
      </div>

      <div className="section">
        <h2>Alterar Senha</h2>
        {passwordError && <div className="alert error">{passwordError}</div>}
        {passwordSuccess && <div className="alert success">{passwordSuccess}</div>}
        <form onSubmit={handlePasswordSubmit} className="form">
          <label>Senha Atual</label>
          <div className="pwd-row">
            <input
              type={showCurrentPwd ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="show-pwd-btn"
              aria-pressed={showCurrentPwd}
              onClick={() => {
                if (showCurrentPwd) {
                  setShowCurrentPwd(false)
                  if (currentHideRef.current) clearTimeout(currentHideRef.current)
                } else {
                  setShowCurrentPwd(true)
                  if (currentHideRef.current) clearTimeout(currentHideRef.current)
                  currentHideRef.current = setTimeout(() => setShowCurrentPwd(false), 5000)
                }
              }}
            >{showCurrentPwd ? 'Ocultar' : 'Mostrar'}</button>
          </div>
          <label>Nova Senha</label>
          <div className="pwd-row">
            <input
              type={showNewPwd ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="show-pwd-btn"
              aria-pressed={showNewPwd}
              onClick={() => {
                if (showNewPwd) {
                  setShowNewPwd(false)
                  if (newHideRef.current) clearTimeout(newHideRef.current)
                } else {
                  setShowNewPwd(true)
                  if (newHideRef.current) clearTimeout(newHideRef.current)
                  newHideRef.current = setTimeout(() => setShowNewPwd(false), 5000)
                }
              }}
            >{showNewPwd ? 'Ocultar' : 'Mostrar'}</button>
          </div>
          <label>Confirmar Nova Senha</label>
          <div className="pwd-row">
            <input
              type={showConfirmPwd ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="show-pwd-btn"
              aria-pressed={showConfirmPwd}
              onClick={() => {
                if (showConfirmPwd) {
                  setShowConfirmPwd(false)
                  if (confirmHideRef.current) clearTimeout(confirmHideRef.current)
                } else {
                  setShowConfirmPwd(true)
                  if (confirmHideRef.current) clearTimeout(confirmHideRef.current)
                  confirmHideRef.current = setTimeout(() => setShowConfirmPwd(false), 5000)
                }
              }}
            >{showConfirmPwd ? 'Ocultar' : 'Mostrar'}</button>
          </div>
          <button type="submit" disabled={changingPassword}>
            {changingPassword ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}