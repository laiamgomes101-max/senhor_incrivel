



import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

try:
    from app import app
    print("✅ Flask carregado com sucesso!")


    with app.app_context():
        print("✅ Contexto da aplicação criado com sucesso!")

    print("🎉 Todos os testes passaram! Flask está funcionando.")
    sys.exit(0)

except Exception as e:
    print(f"❌ Erro ao carregar Flask: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)