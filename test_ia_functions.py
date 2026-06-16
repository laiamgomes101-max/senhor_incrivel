


import requests
import json
import time

BASE_URL = "http://localhost:5000"


TOKEN = None

def test_login():

    global TOKEN

    print("\n🔐 TESTANDO LOGIN...")


    email = "candidato@teste.com"
    password = "teste123"

    def attempt_login():
        global TOKEN
        login_data = {"email": email, "password": password}
        res = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if res.status_code == 200:
            TOKEN = res.json().get('token')
            print(f"✅ Login bem-sucedido! Token: {TOKEN[:20]}...")
            return True
        return res

    try:
        res = attempt_login()
        if res is True:
            return True


        if res.status_code in (401, 404):
            print("⚠️ Usuário não encontrado ou credenciais inválidas. Tentando criar usuário de teste...")
            reg = requests.post(
                f"{BASE_URL}/api/auth/register/candidato",
                json={
                    "email": email,
                    "password": password,
                    "nome": "Candidato Teste"
                }
            )
            if reg.status_code in (200, 201):
                print("✅ Usuário de teste criado. Tentando login novamente...")
                return attempt_login() is True
            if reg.status_code == 409:
                print("⚠️ Usuário já existe; tentando login novamente...")
                return attempt_login() is True
            print(f"❌ Falha ao criar usuário: {reg.status_code} - {reg.json()}")
            return False

        print(f"❌ Login falhou: {res.status_code} - {res.json()}")
        return False
    except Exception as e:
        print(f"❌ Erro ao fazer login: {e}")
        return False

def test_ia_function(funcao, message):

    global TOKEN

    if not TOKEN:
        print("⚠️  Token não disponível. Pulando teste de IA.")
        return

    print(f"\n📝 TESTANDO FUNÇÃO: {funcao.upper()}")
    print(f"Mensagem: {message}")

    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "message": message,
        "funcao": funcao
    }

    try:
        res = requests.post(f"{BASE_URL}/api/curriculos/ia/chat", json=payload, headers=headers)

        if res.status_code == 200:
            response = res.json().get('response', 'Sem resposta')
            print(f"✅ Resposta recebida:")
            print(f"   {response[:200]}..." if len(response) > 200 else f"   {response}")
            return True
        else:
            print(f"❌ Erro: {res.status_code} - {res.json()}")
            return False
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return False

def main():

    print("=" * 60)
    print("🤖 TESTE DAS 4 FUNÇÕES DE IA DO CANDIDATO")
    print("=" * 60)


    if not test_login():
        print("\n❌ Não foi possível fazer login. Encerrando testes.")
        return

    time.sleep(1)


    test_ia_function(
        "analisar",
        "Gostaria de analisar meu currículo"
    )
    time.sleep(1)


    test_ia_function(
        "sugerir",
        "Que melhorias você sugere para meu currículo?"
    )
    time.sleep(1)


    test_ia_function(
        "vagas",
        "Que tipos de vagas me recomendam?"
    )
    time.sleep(1)


    test_ia_function(
        "entrevista",
        "começar"
    )

    print("\n" + "=" * 60)
    print("✅ TESTES CONCLUÍDOS!")
    print("=" * 60)

if __name__ == "__main__":
    main()