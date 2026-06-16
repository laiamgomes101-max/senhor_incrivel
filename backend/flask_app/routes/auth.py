from flask import Blueprint, request, jsonify
import logging

from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt



from extensions import db

from models import User, Candidato, Empresa

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)



@auth_bp.route('/register/candidato', methods=['POST'])

def register_candidato():
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password'):

            return jsonify({'error': 'Email e senha são obrigatórios'}), 400



        if db.session.execute(db.select(User).where(User.email == data['email'])).scalar_one_or_none():

            return jsonify({'error': 'Email já cadastrado'}), 409



        user = User(email=data['email'], tipo='candidato')

        user.set_password(data['password'])

        db.session.add(user)

        db.session.commit()



        candidato = Candidato(user_id=user.id, nome=data.get('nome', 'Candidato'))

        db.session.add(candidato)

        db.session.commit()



        token = create_access_token(identity=str(user.id), additional_claims={'tipo': 'candidato', 'candidato_id': candidato.id})

        return jsonify({

            'token': token,

            'user': {'id': user.id, 'email': user.email, 'tipo': 'candidato'},

            'candidato': {'id': candidato.id, 'nome': candidato.nome}

        }), 201
    except Exception as e:
        logger.error(f'Erro ao registar candidato: {str(e)}', exc_info=True)
        raise



@auth_bp.route('/register/empresa', methods=['POST'])

def register_empresa():
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password'):

            return jsonify({'error': 'Email e senha são obrigatórios'}), 400



        if db.session.execute(db.select(User).where(User.email == data['email'])).scalar_one_or_none():

            return jsonify({'error': 'Email já cadastrado'}), 409



        user = User(email=data['email'], tipo='empresa')

        user.set_password(data['password'])

        db.session.add(user)

        db.session.commit()



        empresa = Empresa(user_id=user.id, nome=data.get('nome', 'Empresa'))

        db.session.add(empresa)

        db.session.commit()



        token = create_access_token(identity=str(user.id), additional_claims={'tipo': 'empresa', 'empresa_id': empresa.id})

        return jsonify({

            'token': token,

            'user': {'id': user.id, 'email': user.email, 'tipo': 'empresa'},

            'empresa': {'id': empresa.id, 'nome': empresa.nome}

        }), 201
    except Exception as e:
        logger.error(f'Erro ao registar empresa: {str(e)}', exc_info=True)
        raise



@auth_bp.route('/login', methods=['POST'])

def login():

    try:

        data = request.get_json()

        if not data or not data.get('email') or not data.get('password'):

            return jsonify({'error': 'Email e senha são obrigatórios'}), 400



        user = db.session.execute(db.select(User).where(User.email == data['email'])).scalar_one_or_none()

        if not user or not user.check_password(data['password']):

            return jsonify({'error': 'Credenciais inválidas'}), 401



        claims = {'tipo': user.tipo}

        if user.tipo == 'candidato':

            if user.candidato:

                claims['candidato_id'] = user.candidato.id

        else:

            if user.empresa:

                claims['empresa_id'] = user.empresa.id



        token = create_access_token(identity=str(user.id), additional_claims=claims)

        response = {'token': token, 'user': {'id': user.id, 'email': user.email, 'tipo': user.tipo}}



        if user.tipo == 'candidato' and user.candidato:

            response['candidato'] = {'id': user.candidato.id, 'nome': user.candidato.nome}

        elif user.tipo == 'empresa' and user.empresa:

            response['empresa'] = {'id': user.empresa.id, 'nome': user.empresa.nome}



        return jsonify(response)

    except Exception as e:

        print(f"Erro ao fazer login: {e}")

        import traceback

        traceback.print_exc()

        return jsonify({'error': f'Erro ao processar login: {str(e)}'}), 500



@auth_bp.route('/me', methods=['GET'])

@jwt_required()

def me():

    user_id = get_jwt_identity()

    claims = get_jwt()

    user = db.session.get(User, user_id)

    if not user:

        return jsonify({'error': 'Usuário não encontrado'}), 404



    response = {'user': {'id': user.id, 'email': user.email, 'tipo': user.tipo}}

    if user.tipo == 'candidato':

        c = user.candidato

        response['candidato'] = {'id': c.id, 'nome': c.nome, 'headline': c.headline}

    else:

        e = user.empresa

        response['empresa'] = {'id': e.id, 'nome': e.nome, 'setor': e.setor}



    return jsonify(response)



@auth_bp.route('/change-email', methods=['POST'])

@jwt_required()

def change_email():

    user_id = get_jwt_identity()

    user = db.session.get(User, user_id)

    if not user:

        return jsonify({'error': 'Usuário não encontrado'}), 404



    data = request.get_json()

    if not data or not data.get('new_email') or not data.get('password'):

        return jsonify({'error': 'Email e senha são obrigatórios'}), 400





    if not user.check_password(data['password']):

        return jsonify({'error': 'Senha incorreta'}), 401





    existing = db.session.execute(db.select(User).where(User.email == data['new_email'])).scalar_one_or_none()

    if existing and existing.id != user.id:

        return jsonify({'error': 'Email já cadastrado'}), 409



    user.email = data['new_email']

    db.session.commit()



    return jsonify({'message': 'Email alterado com sucesso', 'email': user.email})



@auth_bp.route('/change-password', methods=['POST'])

@jwt_required()

def change_password():

    user_id = get_jwt_identity()

    user = db.session.get(User, user_id)

    if not user:

        return jsonify({'error': 'Usuário não encontrado'}), 404



    data = request.get_json()

    if not data or not data.get('current_password') or not data.get('new_password'):

        return jsonify({'error': 'Senhas são obrigatórias'}), 400





    if not user.check_password(data['current_password']):

        return jsonify({'error': 'Senha atual incorreta'}), 401





    if len(data['new_password']) < 6:

        return jsonify({'error': 'Nova senha deve ter pelo menos 6 caracteres'}), 400



    user.set_password(data['new_password'])

    db.session.commit()



    return jsonify({'message': 'Senha alterada com sucesso'})