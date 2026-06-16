/**
 * Validações e Formatações para Angola
 * - Números de telefone angolanos
 * - Moeda em Kwanza (AOA)
 * - Províncias de Angola
 * - Formatação local
 */

// ========== CONFIGURAÇÕES ANGOLA ==========
export const ANGOLA_CONFIG = {
  country: 'Angola',
  countryCode: 'AO',
  currency: {
    code: 'AOA',
    symbol: 'Kz',
    name: 'Kwanza',
    decimals: 2
  },
  phoneCountryCode: '+244',
  timeZone: 'Africa/Luanda'
};

// ========== PROVÍNCIAS DE ANGOLA ==========
export const PROVINCIAS_ANGOLA = [
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando Cubango',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Luanda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Namibe',
  'Uíge',
  'Zaire'
];

// ========== VALIDAÇÃO DE TELEFONE ANGOLA ==========
/**
 * Valida número de telefone angolano
 * Formatos aceitos:
 * - +244 9XXXXXXXX
 * - 009 9XXXXXXXX
 * - 9XXXXXXXX
 * - +244-9-XXXXXXXX
 */
export function validarTelefoneAngola(telefone) {
  if (!telefone) return false;

  // Remover espaços, hífens e parenteses
  const cleaned = telefone.replace(/[\s\-()]/g, '');

  // Patterns válidos para Angola
  const patterns = [
    /^\+2449\d{8}$/, // +244 9XXXXXXXX
    /^00949\d{8}$/,  // 009 9XXXXXXXX
    /^9\d{8}$/,      // 9XXXXXXXX
    /^\+244\d{9}$/, // +244 com 9 dígitos
  ];

  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Formata número de telefone angolano
 * Saída: +244 9XX XXX XXX
 */
export function formatarTelefoneAngola(telefone) {
  if (!telefone) return '';

  // Remover caracteres não numéricos
  let cleaned = telefone.replace(/\D/g, '');

  // Remover prefixo 244 se presente
  if (cleaned.startsWith('244')) {
    cleaned = cleaned.substring(3);
  }

  // Se não começar com 9, é inválido
  if (!cleaned.startsWith('9')) {
    return '';
  }

  // Formatar: +244 9XX XXX XXX
  return `+244 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)}`;
}

/**
 * Extrai número de telefone limpo
 * Retorna: 9XXXXXXXX
 */
export function extrairTelefoneAngola(telefone) {
  if (!telefone) return '';

  let cleaned = telefone.replace(/\D/g, '');

  if (cleaned.startsWith('244')) {
    cleaned = cleaned.substring(3);
  }

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  return cleaned.length === 9 && cleaned.startsWith('9') ? cleaned : '';
}

// ========== VALIDAÇÃO E FORMATAÇÃO DE SALÁRIO (KWANZA) ==========
/**
 * Valida e formata valor em Kwanza
 * Aceita: 1000000, 1.000.000, 1,000,000, 1000000.00
 */
export function validarSalariaKwanza(valor) {
  if (valor === null || valor === undefined) return false;

  const num = parseFloat(String(valor).replace(/[^\d.,-]/g, '').replace(/,/g, '.'));
  return !isNaN(num) && num > 0;
}

/**
 * Formata valor em Kwanza
 * Saída: 1.000.000 Kz ou $1.000.000,00
 */
export function formatarSalariaKwanza(valor, formato = 'pt') {
  if (!validarSalariaKwanza(valor)) return '0 Kz';

  const num = parseFloat(String(valor).replace(/[^\d.,-]/g, '').replace(/,/g, '.'));

  const opcoes = {
    pt: {
      separadorMilhares: '.',
      separadorDecimais: ',',
      simbolo: ' Kz',
      posicao: 'direita'
    },
    en: {
      separadorMilhares: ',',
      separadorDecimais: '.',
      simbolo: 'AOA ',
      posicao: 'esquerda'
    }
  };

  const config = opcoes[formato] || opcoes.pt;

  const partes = num.toFixed(0).split('.');
  const inteiro = partes[0];

  // Adicionar separador de milhares
  const formatado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, config.separadorMilhares);

  return config.posicao === 'esquerda' 
    ? `${config.simbolo}${formatado}`
    : `${formatado}${config.simbolo}`;
}

/**
 * Retorna range de salário formatado
 * Saída: "1.000.000 - 2.500.000 Kz"
 */
export function formatarRangeSalariaKwanza(min, max, formato = 'pt') {
  const minFormatado = formatarSalariaKwanza(min, formato).replace(' Kz', '').replace('AOA ', '');
  const maxFormatado = formatarSalariaKwanza(max, formato).replace(' Kz', '').replace('AOA ', '');

  const simbolo = formato === 'pt' ? ' Kz' : ' AOA';
  return `${minFormatado} - ${maxFormatado}${simbolo}`;
}

// ========== VALIDAÇÃO DE LOCALIZAÇÃO ==========
export function validarProvinciaAngola(provincia) {
  if (!provincia) return false;
  return PROVINCIAS_ANGOLA.some(p => 
    p.toLowerCase() === provincia.toLowerCase()
  );
}

// ========== VALIDAÇÃO ANGOLANA COMBINADA ==========
export const validacaoAngola = {
  telefone: {
    validar: validarTelefoneAngola,
    formatar: formatarTelefoneAngola,
    extrair: extrairTelefoneAngola,
    placeholder: '+244 9XX XXX XXX',
    exemplo: '+244 912 345 678'
  },
  salario: {
    validar: validarSalariaKwanza,
    formatar: formatarSalariaKwanza,
    formatarRange: formatarRangeSalariaKwanza,
    moeda: 'AOA',
    simbolo: 'Kz',
    exemplo: '1.000.000 Kz'
  },
  provincia: {
    validar: validarProvinciaAngola,
    opcoes: PROVINCIAS_ANGOLA,
    padrao: 'Luanda'
  }
};

// ========== MENSAGENS DE ERRO LOCALIZADAS ==========
export const MENSAGENS_ANGOLA = {
  telefone: {
    obrigatorio: 'Número de telefone é obrigatório',
    invalido: 'Número de telefone inválido. Use: +244 9XX XXX XXX',
    formato: 'Formato esperado: +244 912 345 678'
  },
  salario: {
    obrigatorio: 'Salário é obrigatório',
    invalido: 'Salário deve ser um valor maior que 0',
    intervalo: 'Salário máximo deve ser maior que o mínimo',
    moeda: 'Valores em Kwanza (Kz)'
  },
  provincia: {
    obrigatorio: 'Província é obrigatória',
    invalida: 'Província não encontrada. Verifique a lista de províncias válidas',
    opcoes: PROVINCIAS_ANGOLA
  }
};

// ========== EXPORTAÇÕES ==========
export default {
  ANGOLA_CONFIG,
  PROVINCIAS_ANGOLA,
  validarTelefoneAngola,
  formatarTelefoneAngola,
  extrairTelefoneAngola,
  validarSalariaKwanza,
  formatarSalariaKwanza,
  formatarRangeSalariaKwanza,
  validarProvinciaAngola,
  validacaoAngola,
  MENSAGENS_ANGOLA
};
