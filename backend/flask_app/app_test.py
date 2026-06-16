




from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)


cors_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://localhost:3001').split(',')
CORS(app, resources={r"/api/*": {"origins": cors_origins}})



@app.route('/', methods=['GET'])
def health():

    return jsonify({
        'message': 'Flask - Motor de IA rodando!',
        'status': 'ok',
        'version': '2.0',
        'servico': 'análise de currículo'
    }), 200

@app.route('/api/analisar', methods=['POST'])
def analisar():



    try:
        data = request.get_json()


        if not data:
            return jsonify({'error': 'Corpo da requisição vazio'}), 400

        curriculo_texto = data.get('curriculo_texto', '')
        vaga_requisitos = data.get('vaga_requisitos', [])

        if not curriculo_texto or not isinstance(curriculo_texto, str):
            return jsonify({'error': 'curriculo_texto é obrigatório (string)'}), 400

        if not isinstance(vaga_requisitos, list):
            return jsonify({'error': 'vaga_requisitos deve ser uma lista'}), 400


        resultado = {
            'compatibilidade_pct': 85.0,
            'recomendacao': 'Compatível',
            'skills_encontrados': ['Python', 'SQL'],
            'skills_faltando': ['Machine Learning'],
            'experiencia_anos': 5.0,
            'formacao': ['bacharel'],
            'pontos_fortes': ['Experiência sólida', 'Skills relevantes'],
            'pontos_falta': ['Falta Machine Learning']
        }

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({
            'error': str(e),
            'tipo': 'erro_analise'
        }), 500

@app.route('/api/extrair-skills', methods=['POST'])
def extrair_skills():

    try:
        data = request.get_json()
        curriculo_texto = data.get('curriculo_texto', '')

        if not curriculo_texto:
            return jsonify({'error': 'curriculo_texto é obrigatório'}), 400


        skills = ['python', 'java', 'django', 'react', 'sql']

        return jsonify({
            'skills': skills,
            'total': len(skills)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    print(f"Flask API rodando na porta {port}")
    app.run(host='0.0.0.0', port=port, debug=True)