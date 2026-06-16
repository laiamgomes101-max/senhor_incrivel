



import sys
import json
from app import app
from extensions import db
from models import Vaga, Empresa

def main(empresa_id):
    with app.app_context():
        empresa = db.session.get(Empresa, int(empresa_id))
        if not empresa:
            print(f'Empresa id={empresa_id} não encontrada')
            return

        vaga = Vaga(
            empresa_id=empresa.id,
            titulo='Engenheiro de Software (Teste)',
            descricao='Vaga de teste criada via script',
            requisitos=['python','flask','sqlalchemy'],
            tipo_contrato='CLT',
            localizacao='Remoto',
            salario_min=3000,
            salario_max=7000,
            ativa=True
        )
        db.session.add(vaga)
        db.session.commit()
        print(f'Vaga criada: id={vaga.id}, titulo={vaga.titulo}')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python create_vaga.py <empresa_id>')
    else:
        main(sys.argv[1])