import { useAuth } from '../context/AuthContext'
import { useParams } from 'react-router-dom'

/**
 * Hook defensivo para determinar se o usuário atual é o proprietário do perfil.
 * Evita ReferenceError e garante escopo correto da variável.
 * @param {string} ownerType - 'candidato' ou 'empresa'
 * @returns {boolean}
 */
export function useIsOwner(ownerType = 'candidato') {
  const { id } = useParams()
  const { candidato, empresa } = useAuth()

  try {
    if (ownerType === 'candidato') {
      const meuCandidato = candidato
      return meuCandidato ? (!id || String(meuCandidato.id) === String(id)) : !id
    } else if (ownerType === 'empresa') {
      const minhaEmpresa = empresa
      return !id && !!minhaEmpresa
    }
    return false
  } catch (err) {
    console.warn(`useIsOwner error (${ownerType}):`, err)
    return false
  }
}
