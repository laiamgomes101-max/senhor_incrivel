import sys
from app import app
from extensions import db
from models import Vaga, Empresa

def usage():
    print('Uso: python seed_vaga_for_empresa.py <empresa_id>')

def main():
    if len(sys.argv) < 2:
        usage()
        return

    try:
        empresa_id = int(sys.argv[1])
    except ValueError:
        usage()
        return

    with app.app_context():
        empresa = db.session.get(Empresa, empresa_id)
        if not empresa:
            print(f'Empresa com id={empresa_id} não encontrada.')
            return

        existing = db.session.query(Vaga).filter(Vaga.empresa_id == empresa_id, Vaga.titulo == 'Vaga de Teste (para empresa atual)').first()
        if existing:
            print(f'Vaga já existe: id={existing.id}')
            return

        vaga = Vaga(
            empresa_id=empresa_id,
            titulo='Vaga de Teste (para empresa atual)',
            descricao='Vaga criada automaticamente para testes (empresa especificada).',
            requisitos=['Testes', 'Comunicação'],
            tipo_contrato='CLT',
            localizacao='Remoto',
            salario_min=2000,
            salario_max=5000,
            ativa=True
        )
        db.session.add(vaga)
        db.session.commit()
        print(f'Vaga criada com id={vaga.id} para empresa id={empresa_id}')

if __name__ == '__main__':
    main()