









import re

import os

from typing import Dict, List, Tuple, Any

import nltk

from nltk.corpus import stopwords

from nltk.tokenize import word_tokenize









try:

    stopwords.words('portuguese')

except LookupError:

    nltk.download('stopwords')





try:

    nltk.data.find('tokenizers/punkt')

except LookupError:

    nltk.download('punkt')





class CurriculumAnalyzer:







    TECH_KEYWORDS = {

        'linguagens': ['python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift', 'sql', 'r', 'scala', 'perl'],

        'frameworks': ['django', 'flask', 'fastapi', 'react', 'vue', 'angular', 'nodejs', 'express', 'spring', 'hibernate', 'rails'],

        'bancos': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sql server', 'dynamodb', 'cassandra'],

        'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'heroku', 'firebase'],

        'devops': ['git', 'jenkins', 'docker', 'kubernetes', 'terraform', 'ansible', 'cicd', 'gitlab', 'github', 'devops'],

        'dados': ['machine learning', 'deep learning', 'tensorflow', 'keras', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'spark', 'hadoop', 'etl', 'bi', 'tableau', 'power bi'],

        'web': ['html', 'css', 'rest', 'api', 'graphql', 'websocket', 'http', 'responsive'],

    }





    EXPERIENCE_PATTERNS = [

        r'(\d+)\s*(?:anos?|years?)',

        r'(?:desde|from)\s*(\d{4})',

        r'(\d{4})\s*[-â€“]\s*(\d{4})',

    ]





    EDUCATION_PATTERNS = [

        r'(?:bacharel|bachelor|bacharelado)',

        r'(?:mestrado|master)',

        r'(?:doutorado|phd|doctorate)',

        r'(?:especializaÃ§Ã£o|specialization)',

        r'(?:tÃ©cnico|technical)',

    ]



    def __init__(self):

        self.stop_words = set(stopwords.words('portuguese'))



    def extract_text_from_file(self, filepath: str) -> str:



        if filepath.endswith('.pdf'):

            return self._extract_from_pdf(filepath)

        elif filepath.endswith('.docx'):

            return self._extract_from_docx(filepath)

        else:

            return self._extract_from_text(filepath)



    def _extract_from_pdf(self, filepath: str) -> str:



        try:

            import pdfplumber

            text = ""

            with pdfplumber.open(filepath) as pdf:

                for page in pdf.pages:

                    text += page.extract_text() or ""

            return text

        except ImportError:
            pass

        except Exception:
            pass

        try:
            from pdfminer.high_level import extract_text
            text = extract_text(filepath)
            return self.clean_text(text)
        except ImportError:
            raise ImportError("pdfplumber ou pdfminer.six não estão instalados. Execute: pip install pdfplumber pdfminer.six")
        except Exception as e:
            raise Exception(f"Erro ao extrair PDF: {e}")


    def _extract_from_docx(self, filepath: str) -> str:



        try:

            from docx import Document

            doc = Document(filepath)

            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])

            return text

        except ImportError:

            raise ImportError("python-docx nÃ£o estÃ¡ instalado. Execute: pip install python-docx")

        except Exception as e:

            raise Exception(f"Erro ao extrair DOCX: {e}")



    def _extract_from_text(self, filepath: str) -> str:



        try:

            with open(filepath, 'r', encoding='utf-8') as f:

                return f.read()

        except Exception as e:

            raise Exception(f"Erro ao ler arquivo: {e}")



    def extract_skills(self, text: str) -> List[str]:



        text_lower = text.lower()

        skills = set()





        for category, keywords in self.TECH_KEYWORDS.items():

            for keyword in keywords:

                if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):

                    skills.add(keyword)



        return sorted(list(skills))



    def extract_experience_years(self, text: str) -> float:



        total_years = 0.0

        matches = re.findall(r'(\d+)\s*(?:anos?|years?)', text.lower())



        if matches:



            for match in matches[:3]:

                try:

                    total_years += float(match)

                except ValueError:

                    continue





        date_matches = re.findall(r'(\d{4})\s*[-â€“]\s*(\d{4})', text)

        if date_matches:

            for start, end in date_matches:

                try:

                    total_years += float(end) - float(start)

                except ValueError:

                    continue



        return min(total_years, 50.0)  



    def extract_education(self, text: str) -> List[str]:



        education = []

        text_lower = text.lower()



        edu_map = {

            'doutorado': r'(?:doutorado|phd|doctorate)',

            'mestrado': r'(?:mestrado|master)',

            'bacharel': r'(?:bacharel|bachelor|bacharelado)',

            'especializaÃ§Ã£o': r'(?:especializaÃ§Ã£o|specialization)',

            'tÃ©cnico': r'(?:tÃ©cnico|technical)',

        }



        for label, pattern in edu_map.items():

            if re.search(pattern, text_lower):

                education.append(label)



        return education



    def extract_keywords(self, text: str, limit: int = 20) -> List[str]:





        try:

            tokens = word_tokenize(text.lower())

        except Exception:



            tokens = re.findall(r"[\wÃ¡Ã Ã¢Ã£Ã©Ã¨ÃªÃ­Ã¯Ã³Ã´ÃµÃ¶ÃºÃ§Ã±]+", text.lower())



        keywords = [

            w for w in tokens

            if w.isalpha() and len(w) > 3 and w not in self.stop_words

        ]





        from collections import Counter

        counter = Counter(keywords)

        return [word for word, _ in counter.most_common(limit)]



    def analyze_curriculum(self, text: str, vaga_requisitos: List[str]) -> Dict[str, Any]:
        text = self.clean_text(text or "")

































        skills = self.extract_skills(text)

        experience_years = self.extract_experience_years(text)

        education = self.extract_education(text)

        keywords = self.extract_keywords(text)





        vaga_requisitos_lower = [

            str(r).strip().lower() for r in (vaga_requisitos or []) if r

        ]

        vaga_keywords = set(vaga_requisitos_lower)

        matched_requisitos = []
        missing_requisitos = []
        if vaga_keywords:
            for req in vaga_requisitos_lower:
                if re.search(r'\b' + re.escape(req) + r'\b', text.lower()):
                    matched_requisitos.append(req)
                else:
                    missing_requisitos.append(req)

        skills_lower = [s.lower() for s in skills]

        skills_match = set(skills_lower) & vaga_keywords

        skills_missing = vaga_keywords - set(skills_lower)





        if vaga_keywords:
            req_score = (len(matched_requisitos) / len(vaga_keywords)) * 60
            skills_score = (len(skills_match) / len(vaga_keywords)) * 30
        else:
            req_score = 40.0
            skills_score = 50.0





        exp_bonus = min((experience_years / 5.0) * 20, 20)  





        edu_bonus = 0

        if 'mestrado' in education or 'doutorado' in education:

            edu_bonus = 10

        elif 'bacharel' in education:

            edu_bonus = 5





        compatibility = min(req_score + exp_bonus + edu_bonus, 100)

        compatibility = round(compatibility, 2)





        if compatibility >= 80:
            recomendacao = "Alto potencial de compatibilidade"
            recomendacao_text = "O currículo mostra boa aderência à vaga, com habilidades, formação e experiência alinhadas."
        elif compatibility >= 55:
            recomendacao = "Compatibilidade moderada"
            recomendacao_text = "Há pontos fortes claros, mas é recomendável aumentar os detalhes de experiência e destacar habilidades-chave para a vaga."
        else:
            recomendacao = "Compatibilidade baixa"
            recomendacao_text = "Recomenda-se revisar o currículo, incluindo mais exemplos de experiência relevante e habilidades ligadas à vaga."





        pontos_fortes = []
        if skills_match:
            pontos_fortes.append("Habilidades alinhadas: " + ", ".join(sorted(skills_match)))
        if education:
            pontos_fortes.append("Formação: " + ", ".join(education))
        if experience_years > 0:
            pontos_fortes.append(f"Experiência: {experience_years:.1f} anos")
        if matched_requisitos and not skills_match:
            pontos_fortes.append("Requisitos textuais identificados: " + ", ".join(matched_requisitos))
        if not pontos_fortes:
            pontos_fortes.append("Nenhum ponto forte específico foi identificado a partir do currículo.")

        pontos_falta = []
        if missing_requisitos:
            pontos_falta.append("Requisitos não mencionados: " + ", ".join(missing_requisitos))
        elif skills_missing:
            pontos_falta.append("Habilidades sugeridas para destacar: " + ", ".join(sorted(skills_missing)))
        else:
            pontos_falta.append("Os requisitos da vaga parecem estar cobertos ou não foram especificados.")
        if experience_years < 2:
            pontos_falta.append("Considere detalhar mais seus projetos e resultados se você tiver menos de 2 anos de experiência.")
        if not education:
            pontos_falta.append("Inclua sua formação acadêmica ou cursos relevantes.")



        summary = (
            f"Compatibilidade geral: {compatibility}%. {recomendacao_text} "
            f"Fortalezas: {pontos_fortes[0]}. "
            f"Melhorias sugeridas: {pontos_falta[0]}."
        )

        return {
            'compatibilidade_pct': compatibility,
            'recomendacao': recomendacao,
            'recomendacao_text': recomendacao_text,
            'summary': summary,
            'pontos_fortes': pontos_fortes[:10],
            'pontos_falta': pontos_falta[:10],
            'skills_encontrados': skills[:15],
            'skills_faltando': list(skills_missing),
            'experiencia_anos': round(experience_years, 1),
            'formacao': education,
            'requisitos_encontrados': matched_requisitos,
            'requisitos_faltando': missing_requisitos,
            'contato': self.extract_contact_info(text),
            'detalhes': {
                'req_score': round(req_score, 2),
                'exp_bonus': round(exp_bonus, 2),
                'edu_bonus': round(edu_bonus, 2),
                'total_keywords': len(keywords),
            }
        }





    def extract_information(self, text: str) -> Dict[str, Any]:







        info = {}

        info['skills'] = self.extract_skills(text)  

        info['keywords'] = self.extract_keywords(text, limit=50)

        info['experiencia_anos'] = self.extract_experience_years(text)

        info['formacao'] = self.extract_education(text)

        info['area'] = self.classify_area(text)
        info['contato'] = self.extract_contact_info(text)

        return info

    def analyze_curriculum_v2(self, text: str, vaga_requisitos: List[str]) -> Dict[str, Any]:
        text = self.clean_text(text or "")

        skills = self.extract_skills(text)
        experience_years = self.extract_experience_years(text)
        education = self.extract_education(text)
        keywords = self.extract_keywords(text)

        text_lower = text.lower()
        vaga_requisitos_lower = [str(r).strip().lower() for r in (vaga_requisitos or []) if r]
        vaga_keywords = set(vaga_requisitos_lower)

        matched_requisitos = []
        missing_requisitos = []
        if vaga_keywords:
            for req in vaga_requisitos_lower:
                if re.search(r'\\b' + re.escape(req) + r'\\b', text_lower):
                    matched_requisitos.append(req)
                else:
                    missing_requisitos.append(req)

        skills_lower = [s.lower() for s in skills]
        skills_match = sorted(list(set(skills_lower) & vaga_keywords))
        skills_missing = sorted(list(vaga_keywords - set(skills_lower)))

        req_score = (len(matched_requisitos) / len(vaga_keywords)) * 60 if vaga_keywords else 40.0
        skills_score = (len(skills_match) / len(vaga_keywords)) * 30 if vaga_keywords else 50.0

        exp_bonus = min((experience_years / 5.0) * 20, 20)

        edu_bonus = 0
        if any('doutorado' in e or 'phd' in e for e in education):
            edu_bonus = 10
        elif any('mestrado' in e or 'master' in e for e in education):
            edu_bonus = 7
        elif any('bacharel' in e for e in education):
            edu_bonus = 5

        compatibility = round(min(req_score + skills_score + exp_bonus + edu_bonus, 100), 2)

        if compatibility >= 80:
            recomendacao = "Alto potencial de compatibilidade"
            recomendacao_text = "O currículo mostra boa aderência à vaga, com habilidades, formação e experiência alinhadas."
        elif compatibility >= 55:
            recomendacao = "Compatibilidade moderada"
            recomendacao_text = "Há pontos fortes claros, mas é recomendável aumentar os detalhes de experiência e destacar habilidades-chave para a vaga."
        else:
            recomendacao = "Compatibilidade baixa"
            recomendacao_text = "Recomenda-se revisar o currículo, incluindo mais exemplos de experiência relevante e habilidades ligadas à vaga."

        pontos_fortes = []
        if skills_match:
            pontos_fortes.append("Habilidades alinhadas: " + ", ".join(skills_match))
        if education:
            pontos_fortes.append("Formação: " + ", ".join(education))
        if experience_years > 0:
            pontos_fortes.append(f"Experiência: {experience_years:.1f} anos")
        if matched_requisitos and not skills_match:
            pontos_fortes.append("Requisitos textuais identificados: " + ", ".join(matched_requisitos))
        if not pontos_fortes:
            pontos_fortes.append("Nenhum ponto forte específico foi identificado a partir do currículo.")

        pontos_falta = []
        if missing_requisitos:
            pontos_falta.append("Requisitos não mencionados: " + ", ".join(missing_requisitos))
        elif skills_missing:
            pontos_falta.append("Habilidades sugeridas para destacar: " + ", ".join(skills_missing))
        else:
            pontos_falta.append("Os requisitos da vaga parecem estar cobertos ou não foram especificados.")
        if experience_years < 2:
            pontos_falta.append("Considere detalhar mais seus projetos e resultados se você tiver menos de 2 anos de experiência.")
        if not education:
            pontos_falta.append("Inclua sua formação acadêmica ou cursos relevantes.")

        summary = (
            f"Compatibilidade geral: {compatibility}%. {recomendacao_text} "
            f"Fortalezas: {pontos_fortes[0]}. "
            f"Melhorias sugeridas: {pontos_falta[0]}."
        )

        return {
            'compatibilidade_pct': compatibility,
            'recomendacao': recomendacao,
            'recomendacao_text': recomendacao_text,
            'summary': summary,
            'pontos_fortes': pontos_fortes[:10],
            'pontos_falta': pontos_falta[:10],
            'skills_encontrados': skills[:15],
            'skills_faltando': skills_missing,
            'experiencia_anos': round(experience_years, 1),
            'formacao': education,
            'requisitos_encontrados': matched_requisitos,
            'requisitos_faltando': missing_requisitos,
            'contato': self.extract_contact_info(text),
            'detalhes': {
                'req_score': round(req_score, 2),
                'skills_score': round(skills_score, 2),
                'exp_bonus': round(exp_bonus, 2),
                'edu_bonus': round(edu_bonus, 2),
                'total_keywords': len(keywords),
            }
        }

    def extract_contact_info(self, text: str) -> Dict[str, str]:
        text_lower = text or ""
        email_match = re.search(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', text_lower)
        phone_match = re.search(r'(?:\+?\d{2,3}[ \-.]*)?(?:\(?\d{2,3}\)?[ \-.]*)?\d{4,5}[ \-.]?\d{4}', text_lower)
        return {
            'email': email_match.group(0) if email_match else '',
            'telefone': phone_match.group(0) if phone_match else ''
        }


    def classify_area(self, text: str) -> str:







        areas = {

            'tecnologia': ['python', 'javascript', 'engenharia de software', 'desenvolvedor', 'java', 'sql'],

            'saude': ['enfermagem', 'hospital', 'saude', 'mÃ©dico', 'biomedicina', 'farmacia'],

            'administrativa': ['excel', 'contabilidade', 'gestÃ£o', 'administraÃ§Ã£o', 'rh', 'financeiro'],

            'construcao': ['eletricidade', 'carpintaria', 'soldagem', 'obras', 'construÃ§Ã£o'],



        }

        text_lower = text.lower()

        for area, keywords in areas.items():

            for kw in keywords:

                if kw in text_lower:

                    return area

        return 'geral'



    def compute_compatibility(self, cv_info: Dict[str, Any], vaga_info: Dict[str, Any]) -> float:







        cv_skills = {s.lower() for s in cv_info.get('skills', [])}

        vaga_skills = {s.lower() for s in vaga_info.get('skills', [])}

        if vaga_skills:

            skills_score = (len(cv_skills & vaga_skills) / len(vaga_skills)) * 100

        else:

            skills_score = 50.0



        exp_diff = cv_info.get('experiencia_anos', 0) - vaga_info.get('experiencia_anos', 0)

        exp_bonus = min(max(exp_diff, 0) * 5, 20)  



        edu_bonus = 0

        cv_form = cv_info.get('formacao', [])

        if any('mestrado' in f or 'doutorado' in f for f in cv_form):

            edu_bonus = 10

        elif any('bacharel' in f for f in cv_form):

            edu_bonus = 5



        total = min(skills_score + exp_bonus + edu_bonus, 100)

        return round(total, 2)



    def recommend_vagas(self, curriculum_text: str, vagas: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:



        cv_info = self.extract_information(curriculum_text)

        results = []

        for vaga in vagas:

            vaga_info = {

                'skills': vaga.get('requisitos', []),

                'experiencia_anos': vaga.get('experiencia', 0),

                'formacao': vaga.get('formacao', [])

            }

            score = self.compute_compatibility(cv_info, vaga_info)

            results.append({**vaga, 'compatibilidade_pct': score})



        results_sorted = sorted(results, key=lambda x: x['compatibilidade_pct'], reverse=True)

        return results_sorted[:top_k]





    def extract_info(self, text: str) -> Dict[str, Any]:



        skills = self.extract_skills(text)

        experience_years = self.extract_experience_years(text)

        education = self.extract_education(text)

        keywords = self.extract_keywords(text)

        return {

            'skills': skills,

            'experience_years': experience_years,

            'education': education,

            'keywords': keywords,

        }



    def score_compatibility(self, skills: List[str], requisitos: List[str]) -> float:



        skills_lower = [s.lower() for s in skills]

        req_lower = [r.lower() for r in requisitos]

        if not req_lower:

            return 0.0

        matches = set(skills_lower) & set(req_lower)

        return round((len(matches) / len(req_lower)) * 100, 2)



    def recommend_vagas(self, text: str, vagas: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:



        info = self.extract_info(text)

        skills = info['skills']

        scored = []

        for vaga in vagas:

            reqs = vaga.get('requisitos', [])

            score = self.score_compatibility(skills, reqs)

            scored.append({**vaga, 'compatibility': score})

        scored.sort(key=lambda v: v['compatibility'], reverse=True)

        return scored[:top_k]





analyzer = CurriculumAnalyzer()





class ChatIA:

    def __init__(self):
        self.curriculum_texts = []
        self.analyses = []
        self.requisitos = []
        self.context = {}
        self.funcao_ativa = None
        self.user_tipo = 'candidato'

    def _build_system_prompt(self) -> str:
        return (
            "Você é um assistente de recrutamento e análise de currículos em português. "
            "Responda com sugestões práticas, orientações de melhoria e análise objetiva do documento enviado. "
            "Ajude o usuário a analisar currículos, comparar perfis com vagas e responder dúvidas sobre recrutamento. "
            "Use o contexto dos currículos carregados quando for útil. Responda de forma direta e clara."
        )

    def _get_loaded_curriculum_context(self) -> str:
        if not self.curriculum_texts:
            return ""

        snippets = []
        for idx, text in enumerate(self.curriculum_texts[:3]):
            snippet = text.strip().replace("\\n", " ")
            snippets.append(f"Currículo {idx + 1}: {snippet[:1500]}")

        return "Contexto dos currículos carregados:\n" + "\n\n".join(snippets) + "\n\n"

    def set_funcao_ativa(self, funcao: str):
        if funcao in ['analisar', 'sugerir', 'vagas', 'entrevista', 'resumo', 'comparar_vaga', 'carta_apresentacao']:
            self.funcao_ativa = funcao

    def set_user_tipo(self, tipo: str):
        tipo_norm = (tipo or '').lower().strip()
        if tipo_norm == 'empresa':
            self.user_tipo = 'empresa'
        else:
            self.user_tipo = 'candidato'

    def _map_area_description(self, area: str) -> str:
        mapping = {
            'tecnologia': 'Tecnologia e Desenvolvimento de Software',
            'saude': 'Saúde e Ciências da Vida',
            'administrativa': 'Administração e Finanças',
            'construcao': 'Engenharia e Construção',
            'geral': 'Perfil profissional geral',
        }
        return mapping.get((area or '').lower().strip(), 'Perfil profissional geral')

    def process_message_with_funcao(self, message: str, funcao: str) -> str:
        funcao = funcao.lower().strip()

        if funcao == 'analisar':
            return self._handle_analisar(message)
        elif funcao == 'sugerir':
            return self._handle_sugerir(message)
        elif funcao == 'vagas':
            return self._handle_vagas(message)
        elif funcao == 'entrevista':
            return self._handle_entrevista(message)
        elif funcao == 'resumo':
            return self._handle_gerar_resumo(message)
        elif funcao == 'comparar_vaga':
            return self._handle_comparar_vaga(message)
        elif funcao == 'comparar_curriculos' or funcao == 'comparar_currículos':
            return self._handle_comparar_curriculos(message)
        elif funcao == 'carta_apresentacao':
            return self._handle_carta_apresentacao(message)
        else:
            return self.process_message(message)

    def _handle_analisar(self, message: str) -> str:
        if not self.curriculum_texts:
            if self.user_tipo == 'empresa':
                return "Por favor, envie os currículos dos candidatos para que eu possa analisá-los."
            return "Por favor, envie seu currículo para que eu possa analisá-lo."

        self.analyses = []
        for idx, text in enumerate(self.curriculum_texts):
            analysis = analyzer.analyze_curriculum_v2(text, self.requisitos)
            self.analyses.append({'index': idx, **analysis})

        if not self.analyses:
            return "Desculpe, houve um erro ao analisar os currículos. Tente novamente mais tarde."

        summary = "📊 **ANÁLISE DE CURRÍCULOS**\n\n"
        if self.requisitos:
            summary += f"Requisitos considerados: {', '.join(self.requisitos)}\n\n"

        for analysis in self.analyses:
            summary += f"🔹 Currículo #{analysis['index'] + 1}: {analysis['compatibilidade_pct']}% compatibilidade — {analysis['recomendacao']}\n"
            summary += f"  • Principais pontos fortes: {', '.join(analysis.get('pontos_fortes', [])) or 'N/A'}\n"
            summary += f"  • Oportunidades de melhoria: {', '.join(analysis.get('pontos_falta', [])) or 'N/A'}\n"
            summary += f"  • Habilidades encontradas: {', '.join(analysis.get('skills_encontrados', [])) or 'N/A'}\n"
            summary += f"  • Requisitos atendidos: {', '.join(analysis.get('requisitos_encontrados', [])) or 'Nenhum'}\n"
            summary += f"  • Requisitos ausentes: {', '.join(analysis.get('requisitos_faltando', [])) or 'Nenhum'}\n\n"

        summary += "Próximo passo: use 'sugerir' para receber dicas de melhoria focadas ou 'filtrar X' para separar os melhores perfis."
        return summary

    def _handle_sugerir(self, message: str) -> str:
        if not self.curriculum_texts:
            if self.user_tipo == 'empresa':
                return "Por favor, carregue os currículos dos candidatos para que eu possa sugerir feedback específico."
            return "Por favor, envie seu currículo primeiro para que eu possa sugerir melhorias precisas."

        if not self.analyses:
            self.analyses = []
            for idx, text in enumerate(self.curriculum_texts):
                analysis = analyzer.analyze_curriculum_v2(text, self.requisitos)
                self.analyses.append({'index': idx, **analysis})

        def keyword_recommendations(analysis):
            recomendacoes = []
            missing_reqs = analysis.get('requisitos_faltando', [])
            skills_missing = analysis.get('skills_faltando', [])
            if missing_reqs:
                recomendacoes.append(f"Inclua ou destaque: {', '.join(missing_reqs)}")
            if skills_missing:
                recomendacoes.append(f"Use termos como: {', '.join(skills_missing)}")
            return recomendacoes

        if self.user_tipo == 'empresa':
            feedback = "✨ **FEEDBACK PARA CANDIDATOS**\n\n"
            for analysis in self.analyses:
                missing = analysis.get('pontos_falta', [])
                strengths = analysis.get('pontos_fortes', [])
                feedback += f"🔹 Currículo #{analysis['index'] + 1}: {analysis['compatibilidade_pct']}% compatibilidade\n"
                if strengths:
                    feedback += f"  • Destaques do candidato: {', '.join(strengths)}\n"
                if missing:
                    feedback += "  • Pontos a melhorar:\n"
                    for skill in missing:
                        feedback += f"    - {skill}\n"
                else:
                    feedback += "  • Perfil equilibrado. Verifique se o candidato adiciona resultados mensuráveis para fortalecer a candidatura.\n"

                recs = keyword_recommendations(analysis)
                if recs:
                    feedback += "  • Palavras-chave recomendadas: " + "; ".join(recs) + "\n"

                feedback += "\n"

            feedback += "💡 Sugestão de uso: compartilhe essas observações com o recrutador ou com o próprio candidato para direcionar ajustes rápidos no currículo.\n\n"
            feedback += "✉️ **Modelo de mensagem pronta para envio ao candidato:**\n"
            feedback += (
                "Prezado(a),\n\n"
                "Obrigado por enviar seu currículo. Avaliei seu perfil e identifiquei os seguintes pontos que podem ser melhorados para aumentar suas chances na vaga desejada:\n"
                "- Destaques atuais: [inserir pontos fortes]\n"
                "- Itens a reforçar: [inserir pontos de melhoria]\n\n"
                "Sugiro que você inclua mais detalhes sobre resultados obtidos, use palavras-chave da vaga e destaque responsabilidades com números claros.\n"
                "Se quiser, posso revisar o currículo novamente após essas mudanças.\n\n"
                "Atenciosamente,\n[Seu nome]"
            )
            return feedback

        suggestions = "✨ **SUGESTÕES DE MELHORIA DE CURRÍCULO**\n\n"
        for analysis in self.analyses:
            missing = analysis.get('pontos_falta', [])
            strengths = analysis.get('pontos_fortes', [])
            suggestions += f"🔹 Currículo #{analysis['index'] + 1}: {analysis['compatibilidade_pct']}% compatibilidade\n"
            if strengths:
                suggestions += f"  • Pontos Fortes: {', '.join(strengths)}\n"
            if missing:
                suggestions += "  • Áreas para reforçar:\n"
                for skill in missing:
                    suggestions += f"    - {skill}\n"
            else:
                suggestions += "  • Bom currículo! Agora é importante garantir clareza, impacto e organização.\n"

            recs = keyword_recommendations(analysis)
            if recs:
                suggestions += "  • Palavras-chave para incluir: " + "; ".join(recs) + "\n"

            suggestions += "\n"

        suggestions += "💡 Dicas gerais:\n"
        suggestions += "  • Destaque resultados e impacto em cada experiência.\n"
        suggestions += "  • Use verbos de ação e dados sempre que possível.\n"
        suggestions += "  • Organize o currículo por seções claras e com títulos visíveis.\n"
        suggestions += "  • Mostre a tecnologia e as responsabilidades em cada função.\n"
        suggestions += "\n✉️ Modelo de mensagem pronta para usar no seu currículo ou carta de apresentação:\n"
        suggestions += (
            "Olá,\n\n"
            "Sou um profissional com foco em [área] e experiências em [principais tecnologias]. Estou em busca de oportunidades em que eu possa contribuir com [resultado esperado] e desenvolver projetos de alto impacto.\n\n"
            "Meu currículo destaca [principais habilidades] e [experiências relevantes]. Estou disponível para conversar sobre como posso ajudar sua empresa.\n\n"
            "Atenciosamente,\n[Seu Nome]"
        )
        return suggestions

    def _handle_gerar_resumo(self, message: str) -> str:
        if not self.curriculum_texts:
            return "Por favor, envie seu currículo primeiro para que eu possa gerar um resumo claro e objetivo."

        text = self.curriculum_texts[0]
        info = analyzer.extract_information(text)

        area = info.get('area', 'geral')
        area_description = self._map_area_description(area)
        experience = info.get('experiencia_anos', '?')
        skills = info.get('skills', [])
        education = info.get('formacao', [])

        suggested_roles = {
            'backend': ['Desenvolvedor Backend', 'Engenheiro de Software', 'Arquiteto de APIs'],
            'frontend': ['Desenvolvedor Frontend', 'Especialista em UI/UX', 'Engenheiro de Interface'],
            'mobile': ['Desenvolvedor Mobile', 'Engenheiro Android/iOS', 'Desenvolvedor React Native/Flutter'],
            'data': ['Cientista de Dados', 'Analista de Dados', 'Engenheiro de Machine Learning'],
            'devops': ['Engenheiro DevOps', 'Especialista em Cloud', 'Administrador de Infraestrutura'],
            'saude': ['Profissional de Saúde', 'Analista Clínico', 'Coordenador de Saúde'],
            'administrativa': ['Analista Administrativo', 'Assistente Financeiro', 'Coordenador de RH'],
            'construcao': ['Engenheiro de Obras', 'Técnico de Edificações', 'Supervisor de Construção'],
            'geral': ['Profissional', 'Especialista', 'Consultor'],
        }

        roles = suggested_roles.get(area, suggested_roles['geral'])

        resumo = "📝 **RESUMO PROFISSIONAL**\n\n"
        resumo += f"Segmento de perfil detectado: {area_description}.\n"
        resumo += f"Profissional com aproximadamente {experience} anos de experiência.\n"
        if skills:
            resumo += f"Principais competências: {', '.join(skills[:7])}.\n"
        if education:
            resumo += f"Formação relevante: {', '.join(education[:2])}.\n"

        resumo += "\nTenho foco em entregar resultados mensuráveis, adaptando soluções conforme a necessidade do projeto e comunicando o valor das minhas entregas de forma clara.\n"
        resumo += f"\nPosições ideais para este perfil: {', '.join(roles[:3])}.\n"
        resumo += "\nEste texto pode ser usado como introdução no currículo, no LinkedIn ou em propostas de candidatura."
        return resumo

    def _handle_comparar_vaga(self, message: str) -> str:
        if not self.curriculum_texts:
            if self.user_tipo == 'empresa':
                return "Por favor, envie os currículos dos candidatos antes de comparar perfis com a vaga."
            return "Por favor, envie seu currículo primeiro para que eu possa comparar com uma vaga ou perfil desejado."

        if self.user_tipo == 'empresa':
            return (
                "🔎 **COMPARAÇÃO DE VAGA PARA EMPRESAS**\n\n"
                "Carregue os currículos dos candidatos e informe os requisitos da vaga usando 'requisitos: ...'.\n"
                "Assim posso mostrar quais candidatos têm melhor fit e quais pontos ajustar na seleção."
            )

        text = self.curriculum_texts[0]
        info = analyzer.extract_information(text)
        skills = [s.lower() for s in info.get('skills', [])]

        comparacao = "🔍 **COMPARAÇÃO COM VAGA**\n\n"
        if skills:
            comparacao += f"Seu currículo destaca principalmente: {', '.join(skills[:6])}.\n"
            comparacao += "Para melhorar o fit com vagas de tecnologia, sugiro enfatizar as seguintes áreas:\n"
            if 'python' not in skills:
                comparacao += "• Python e frameworks relacionados\n"
            if 'sql' not in skills and 'postgresql' not in skills and 'mysql' not in skills:
                comparacao += "• Banco de dados e consultas SQL\n"
            if 'docker' not in skills and 'kubernetes' not in skills:
                comparacao += "• Docker ou ferramentas de containerização\n"
            comparacao += "• Resultados mensuráveis em projetos anteriores\n"
        else:
            comparacao += "Ainda não consegui extrair competências claras do seu currículo. Por favor, verifique se o texto está carregado corretamente.\n"

        comparacao += "\nSe quiser, posso ajudar a transformar isso em um texto de apresentação ou resumo de vaga."
        return comparacao

    def _handle_comparar_curriculos(self, message: str) -> str:
        if not self.curriculum_texts:
            if self.user_tipo == 'empresa':
                return "Por favor, envie os currículos dos candidatos para que eu possa compará-los."
            return "Por favor, envie seu currículo para que eu possa compará-lo com outros ou dar sugestões."

        comparisons = []
        skills_sets = []
        for idx, text in enumerate(self.curriculum_texts):
            skills = analyzer.extract_skills(text)
            experience_years = analyzer.extract_experience_years(text)
            compat = 0.0
            if self.requisitos:
                compat = analyzer.analyze_curriculum_v2(text, self.requisitos).get('compatibilidade_pct', 0.0)
            skills_sets.append({s.lower() for s in skills})
            skill_count = len(skills)
            if self.requisitos:
                score = round(
                    min(experience_years, 15) / 15 * 40 +
                    min(skill_count, 20) / 20 * 40 +
                    compat * 0.2,
                    2
                )
            else:
                score = round(
                    min(experience_years, 15) / 15 * 50 +
                    min(skill_count, 20) / 20 * 50,
                    2
                )

            comparisons.append({
                'index': idx,
                'experience_years': experience_years,
                'skills': skills,
                'skills_count': skill_count,
                'compatibility_pct': compat,
                'score': score,
                'education': analyzer.extract_education(text),
            })

        def jaccard(a: set, b: set) -> float:
            if not a and not b:
                return 1.0
            inter = len(a & b)
            union = len(a | b)
            return round(inter / union, 3) if union > 0 else 0.0

        n = len(comparisons)
        common = set.intersection(*skills_sets) if skills_sets and len(skills_sets) > 0 else set()
        ranking = sorted(comparisons, key=lambda x: x['score'], reverse=True)

        resp = "🔎 **COMPARAÇÃO ENTRE CURRÍCULOS CARREGADOS**\n\n"
        resp += f"Foram carregados {n} currículos. A comparação foi feita com base em experiência, competências extraídas e, quando aplicável, compatibilidade com os requisitos definidos.\n\n"
        if self.requisitos:
            resp += f"Requisitos usados na avaliação: {', '.join(self.requisitos)}\n\n"

        resp += "Ranking de candidatos (maior score → menor):\n"
        for item in ranking:
            resp += (
                f"• Currículo #{item['index'] + 1}: score {item['score']} /100 — "
                f"Experiência: {item['experience_years']} anos, "
                f"Competências: {item['skills_count']}, "
                f"Compatibilidade: {item['compatibility_pct']}%\n"
            )
            if item['skills']:
                resp += f"  Principais habilidades extraídas: {', '.join(item['skills'][:6])}.\n"
            if item['education']:
                resp += f"  Formação identificada: {', '.join(item['education'][:2])}.\n"
            resp += "\n"

        if common:
            resp += f"Habilidades comuns entre os currículos: {', '.join(sorted(common))}.\n\n"
        else:
            resp += "Não foram encontradas habilidades comuns a todos os currículos.\n\n"

        if n > 1:
            resp += "Sugestão: foque nos candidatos com maior score, mas verifique também se os melhores perfis possuem experiência relevante para a vaga específica.\n"
        resp += "Se quiser, posso gerar um resumo detalhado de cada currículo ou indicar quais candidatos têm melhor fit para requisitos específicos."
        return resp

    def _handle_carta_apresentacao(self, message: str) -> str:
        if not self.curriculum_texts:
            return "Por favor, envie seu currículo primeiro para que eu possa criar uma carta de apresentação personalizada."

        text = self.curriculum_texts[0]
        info = analyzer.extract_information(text)
        skills = info.get('skills', [])[:5]
        area = info.get('area', 'profissional')

        carta = "💼 **CARTA DE APRESENTAÇÃO**\n\n"
        carta += "Olá,\n\n"
        carta += f"Tenho experiência sólida na área de {area} e estou animado para contribuir com sua equipe. "
        carta += "Minha trajetória inclui experiências relevantes em "
        carta += f"{', '.join(skills)}" if skills else "áreas técnicas e de projetos relevantes"
        carta += ".\n\n"
        carta += "Sou dedicado a entregar soluções com qualidade, foco em resultado e trabalho colaborativo. "
        carta += "Estou disponível para conversar sobre como meu histórico pode ajudar sua empresa a atingir seus objetivos.\n\n"
        carta += "Atenciosamente,\n[Seu Nome]"
        return carta

    def _handle_vagas(self, message: str) -> str:
        if not self.curriculum_texts:
            if self.user_tipo == 'empresa':
                return "Para recomendar candidatos, carregue os currículos dos candidatos e use 'analisar' para comparar os perfis."
            return "Para recomendar vagas, preciso conhecer seu perfil. Por favor, envie seu currículo.\n\nQuais são suas áreas de interesse? (ex: Backend, Frontend, DevOps, Data Science)"

        if self.user_tipo == 'empresa':
            return "Como empresa, você pode usar os resultados da análise para identificar os melhores candidatos para a vaga e ajustar os requisitos."

        if self.analyses and self.analyses[0].get('skills_encontrados'):
            skills = self.analyses[0]['skills_encontrados']
        else:
            analysis = analyzer.analyze_curriculum_v2(self.curriculum_texts[0], self.requisitos)
            skills = analysis.get('skills_encontrados', [])

        recommendations = "💼 **VAGAS RECOMENDADAS**\n\n"
        recommendations += f"Com base no seu perfil: {', '.join(skills[:3]) if skills else 'experiência geral'}\n\n"
        recommendations += "**Tipos de Posições Ideais:**\n"
        if 'python' in str(skills).lower() or 'django' in str(skills).lower():
            recommendations += "• Desenvolvedor Python (Backend/Django)\n"
        if 'javascript' in str(skills).lower() or 'react' in str(skills).lower():
            recommendations += "• Desenvolvedor Frontend (React/Vue/Angular)\n"
        if 'devops' in str(skills).lower() or 'kubernetes' in str(skills).lower():
            recommendations += "• Engenheiro DevOps / SRE\n"
        if not any(x in str(skills).lower() for x in ['python', 'javascript', 'devops']):
            recommendations += "• Analista de Sistemas\n"
            recommendations += "• Consultor Técnico\n"

        recommendations += "\nQual tipo de vaga te interessa mais?"
        return recommendations

    def _handle_entrevista(self, message: str) -> str:
        questions = [
            "Qual foi seu maior desafio em um projeto? Como você o resolveu?",
            "Descreva uma situação em que você teve que aprender uma nova tecnologia rapidamente.",
            "Como você lida com feedback construtivo de colegas ou gestores?",
            "Qual é sua estratégia para manter-se atualizado tecnicamente?",
            "Conte-me sobre um projeto do qual você se sinta particularmente orgulhoso."
        ]

        if not self.context.get('interview_started') or 'começar' in message.lower():
            self.context['interview_started'] = True
            self.context['question_count'] = 0
            return (
                "🎯 **PREPARAÇÃO PARA ENTREVISTA**\n\n"
                f"Vamos começar. {questions[0]}\n\n"
                "Responda com seu exemplo ou digite 'próxima' para receber a próxima pergunta."
            )

        question_count = self.context.get('question_count', 0) + 1
        self.context['question_count'] = question_count

        if question_count >= len(questions):
            feedback = "🏁 **FEEDBACK DA ENTREVISTA**\n\n"
            feedback += "✅ Pontos Positivos:\n"
            feedback += "• Boa comunicação detectada\n"
            feedback += "• Experiência relevante apresentada\n"
            feedback += "• Atitude de aprendizado contínuo\n\n"
            feedback += "💡 Áreas de Melhoria:\n"
            feedback += "• Use a metodologia STAR para estruturar respostas.\n"
            feedback += "• Procure ser mais objetivo e focar em resultados.\n"
            feedback += "• Prepare exemplos claros de desafios e soluções.\n\n"
            feedback += "Se quiser, podemos treinar mais uma pergunta específica ou revisar seu currículo."
            return feedback

        return (
            f"**Pergunta {question_count + 1} de {len(questions)}:** {questions[question_count]}\n\n"
            "Responda com seu exemplo ou digite 'próxima'."
        )

    def process_message(self, message: str) -> str:
        msg_lower = message.lower().strip()

        if 'examinar' in msg_lower or 'analisar' in msg_lower or 'avaliar' in msg_lower:
            return self._handle_analyze()
        if 'filtrar' in msg_lower:
            return self._handle_filter(message)
        if 'requisitos' in msg_lower or 'criterios' in msg_lower:
            return self._handle_set_requirements(message)
        if 'carregar' in msg_lower or 'upload' in msg_lower:
            return "Por favor, envie os arquivos de currículo primeiro através do botão 'Enviar currículos'."
        if 'exportar' in msg_lower or 'salvar' in msg_lower:
            return "Use os botões 'Exportar CSV' ou 'Exportar PDF' para salvar os resultados."
        if 'ajuda' in msg_lower or 'help' in msg_lower:
            return self._get_help()
        if 'status' in msg_lower:
            return self._get_status()
        if 'entrevista' in msg_lower:
            return self._handle_entrevista(message)
        if 'resumo' in msg_lower or 'gerar resumo' in msg_lower or 'resuma' in msg_lower:
            return self._handle_gerar_resumo(message)
        if 'carta' in msg_lower and 'apresenta' in msg_lower:
            return self._handle_carta_apresentacao(message)
        if 'comparar' in msg_lower or 'fit' in msg_lower or 'perfil' in msg_lower:
            return self._handle_comparar_vaga(message)
        if 'sugerir' in msg_lower or 'melhorar' in msg_lower or 'melhoria' in msg_lower or 'otimizar' in msg_lower or 'refinar' in msg_lower:
            return self._handle_sugerir(message)
        if 'vagas' in msg_lower:
            return self._handle_vagas(message)

        return self._get_professional_fallback()

    def _get_professional_fallback(self) -> str:
        if self.user_tipo == 'empresa':
            return (
                "Não entendi exatamente sua solicitação, mas posso ajudar de forma clara e focada. "
                "Como recrutador, você pode usar este assistente para analisar currículos, sugerir feedback com base no perfil dos candidatos, comparar fit com vagas e gerar mensagens profissionais. "
                "Se quiser, digite uma das opções abaixo ou reformule com mais detalhes:\n"
                "- \"analisar\" para avaliar currículos carregados\n"
                "- \"sugerir\" para receber feedback para candidatos\n"
                "- \"comparar\" para comparar perfis com uma vaga\n"
                "- \"resumo\" para criar um texto de apresentação ou resumo de vaga\n"
            )
        return (
            "Não entendi exatamente sua solicitação, mas posso ajudar com seu perfil profissional de forma objetiva. "
            "Como candidato, você pode pedir para melhorar seu currículo, gerar um resumo, criar uma carta de apresentação ou comparar seu perfil com vagas. "
            "Por favor, reformule sua pergunta ou escolha uma opção:\n"
            "- \"melhorar\" para receber sugestões de melhoria no currículo\n"
            "- \"resumo\" para gerar uma descrição profissional\n"
            "- \"carta\" para criar uma carta de apresentação\n"
            "- \"vagas\" para ver recomendações de posições ideais\n"
        )

    def _handle_analyze(self) -> str:
        if not self.curriculum_texts:
            return "Nenhum currículo carregado. Por favor, envie os arquivos primeiro."

        self.analyses = []
        for idx, text in enumerate(self.curriculum_texts):
            analysis = analyzer.analyze_curriculum(text, self.requisitos)
            self.analyses.append({'index': idx, **analysis})

        if not self.analyses:
            return "Erro ao analisar currículos."

        summary = f"Análise completa de {len(self.analyses)} currículo(s).\n\n"
        for analysis in self.analyses:
            summary += f"Currículo #{analysis['index'] + 1}: {analysis['compatibilidade_pct']}% compatibilidade - {analysis['recomendacao']}\n"
        summary += "Deseja filtrar os resultados ou ajustar os critérios?"
        return summary

    def _handle_filter(self, message: str) -> str:
        if not self.analyses:
            return "Nenhuma análise disponível. Execute 'analisar' primeiro."

        import re
        match = re.search(r'(\d+)', message)
        threshold = int(match.group(1)) if match else 70

        filtered = [a for a in self.analyses if a.get('compatibilidade_pct', 0) >= threshold]
        self.analyses = filtered

        if not filtered:
            return f"Nenhum currículo passou no filtro de {threshold}% compatibilidade."

        summary = f"Filtrados {len(filtered)} currículo(s) com compatibilidade >= {threshold}%:\n\n"
        for analysis in filtered:
            summary += f"Currículo #{analysis['index'] + 1}: {analysis['compatibilidade_pct']}%\n"
        return summary

    def _handle_set_requirements(self, message: str) -> str:
        import re
        reqs = re.split(r'[,.]', message)
        reqs = [r.strip() for r in reqs if r.strip() and len(r.strip()) > 2]

        if not reqs:
            return "Não consegui identificar requisitos. Tente: 'requisitos: python, django, 3 anos experiência'"

        self.requisitos = reqs
        return f"Requisitos definidos: {', '.join(reqs)}. Execute 'analisar' para reavaliar os currículos."

    def _handle_general_query(self, message: str) -> str:
        if 'quantos' in message.lower() or 'quantidade' in message.lower():
            if self.analyses:
                return f"Temos {len(self.analyses)} análises realizadas."
            return f"Temos {len(self.curriculum_texts)} currículos carregados."
        if 'melhor' in message.lower() or 'top' in message.lower():
            if not self.analyses:
                return "Nenhuma análise realizada ainda."

            best = max(self.analyses, key=lambda x: x.get('compatibilidade_pct', 0))
            return f"Melhor currículo: #{best['index'] + 1} com {best['compatibilidade_pct']}% compatibilidade."
        return "Desculpe, não entendi. Digite 'ajuda' para ver os comandos disponíveis."

    def _get_help(self) -> str:
        if self.user_tipo == 'empresa':
            return (
                "**Ajuda para Empresas**\n"
                "1. Envie currículos de candidatos para analisar e comparar perfis.\n"
                "2. Use 'analisar' para gerar compatibilidade e recomendações.\n"
                "3. Use 'filtrar X' para manter apenas candidatos com compatibilidade >= X%.\n"
                "4. Defina requisitos com 'requisitos: python, django, 3 anos experiência'.\n"
                "5. Use 'status' para ver quantos currículos e análises estão carregados.\n"
            )

        return (
            "**Ajuda para Candidatos**\n"
            "1. Envie seu currículo para obter análise de compatibilidade e feedback.\n"
            "2. Use 'analisar' para avaliar seu perfil em relação aos requisitos definidos.\n"
            "3. Use 'sugerir' para receber dicas de melhoria do currículo.\n"
            "4. Use 'vagas' para receber sugestões de posições com base nas habilidades encontradas.\n"
        )

    def _get_status(self) -> str:
        status = f"Tipo de usuário: {self.user_tipo}\n"
        status += f"Currículos carregados: {len(self.curriculum_texts)}\n"
        status += f"Análises realizadas: {len(self.analyses)}\n"
        if self.requisitos:
            status += f"Requisitos atuais: {', '.join(self.requisitos)}\n"
        else:
            status += "Nenhum requisito definido\n"
        return status

    def load_curriculums(self, texts: list):
        self.curriculum_texts = texts

    def get_analyses(self) -> list:
        return self.analyses
