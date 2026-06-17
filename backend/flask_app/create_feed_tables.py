"""
Script para criar as tabelas de curtidas e comentários no banco de dados
Executar: python create_feed_tables.py
"""

import os
import sys

base_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, base_dir)

from app import app, db
from models import Post, Curtida, Comentario, CurtidaComentario

def criar_tabelas():
    with app.app_context():
        # Criar todas as tabelas que não existem
        db.create_all()
        print("✅ Tabelas criadas com sucesso!")
        print("- Tabela 'curtidas' criada")
        print("- Tabela 'comentarios' criada")
        print("- Tabela 'curtidas_comentarios' criada")
        return True

if __name__ == '__main__':
    try:
        criar_tabelas()
    except Exception as e:
        print(f"❌ Erro ao criar tabelas: {e}")
        sys.exit(1)
