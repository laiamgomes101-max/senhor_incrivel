from app import app
from extensions import db
from models import Vaga, Empresa, User
from werkzeug.security import generate_password_hash

if __name__ == '__main__':
    with app.app_context():

        emp = db.session.query(Empresa).first()

        if not emp:
            print('Nenhuma empresa encontrada. Criando empresa de teste...')


            test_user = db.session.query(User).filter(User.email == 'teste@empresa.com').first()
            if not test_user:
                test_user = User(
                    email='teste@empresa.com',
                    senha_hash=generate_password_hash('senha123'),
                    nome='Empresa Teste',
                    tipo='empresa'
                )
                db.session.add(test_user)
                db.session.commit()
                print(f'User criado: id={test_user.id}, email=teste@empresa.com')


            emp = Empresa(
                user_id=test_user.id,
                nome='Empresa de Teste',
                setor='Tecnologia',
                localizacao='Remoto',
                sobre='Empresa de teste para validar a plataforma.'
            )
            db.session.add(emp)
            db.session.commit()
            print(f'Empresa criada: id={emp.id}')

        print(f'\nEmprresa selecionada: id={emp.id}, nome={emp.nome}')


        existing = db.session.query(Vaga).filter(Vaga.empresa_id == emp.id, Vaga.titulo == 'Vaga de Teste').first()
        if existing:
            print(f'Vaga de teste já existe: id={existing.id} (ativa={existing.ativa})')
        else:
            v = Vaga(
                empresa_id=emp.id,
                titulo='Vaga de Teste',
                descricao='Esta é uma vaga de teste para validar o fluxo de listagem e análise de candidatos. Procuramos um desenvolvedor full-stack com experiência em Python e JavaScript.',
                requisitos=['Python', 'JavaScript', 'SQL', 'Git'],
                tipo_contrato='CLT',
                localizacao='Remoto',
                salario_min=3000,
                salario_max=7000,
                ativa=True
            )
            db.session.add(v)
            db.session.commit()
            print(f'Vaga de teste criada: id={v.id}, titulo={v.titulo}')


        vagas = db.session.query(Vaga).filter(Vaga.empresa_id == emp.id, Vaga.ativa == True).all()
        print(f'\nTotal de vagas ativas da empresa: {len(vagas)}')
        for vaga in vagas:
            print(f'  - {vaga.titulo} (id={vaga.id})')

        print('\n✓ Seed concluído com sucesso!')