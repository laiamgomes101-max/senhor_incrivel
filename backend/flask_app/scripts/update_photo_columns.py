from config import Config
from sqlalchemy import create_engine, text


def main():
    if Config.db_type != 'mysql':
        print('Banco de dados não é MySQL; não é necessária alteração de coluna.')
        return

    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE candidatos MODIFY foto_url LONGTEXT"))
        conn.execute(text("ALTER TABLE empresas MODIFY logo_url LONGTEXT"))
        conn.commit()
    print('Colunas foto_url e logo_url atualizadas para LONGTEXT.')


if __name__ == '__main__':
    main()
