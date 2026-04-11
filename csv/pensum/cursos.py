import pandas as pd
import os

def procesar_pensums():
    # 1. Definición de las rutas y los IDs según tu tabla de Carreras
    archivos_carreras = {
        'pensum_sistemas.csv': 1,
        'pensum_mecanica.csv': 2,
        'pensum_industrial.csv': 3,
        'pensum_civil.csv': 4
    }

    # Estructuras para almacenar los datos transformados
    lista_cursos_unicos = {} # Usamos dict para evitar duplicados por código
    lista_carrera_cursos = []
    relacion_id_counter = 1

    # 2. Iterar sobre cada archivo
    for nombre_archivo, carrera_id in archivos_carreras.items():
        if not os.path.exists(nombre_archivo):
            print(f"Advertencia: No se encontró {nombre_archivo}")
            continue

        print(f"Procesando {nombre_archivo}...")
        
        # Leer el CSV (asumiendo encoding utf-8 o latin-1)
        df = pd.read_csv(nombre_archivo)

        for _, fila in df.iterrows():
            codigo = int(fila['codigo'])
            nombre = fila['nombre']
            creditos = int(fila['creditos'])
            semestre = int(fila['semestre'])
            # Convertir "SI" a True, "NO" a False
            es_obligatorio = True if str(fila['obligatorio']).strip().upper() == 'SI' else False

            # A. Llenar diccionario de Cursos (si el código ya existe, no se sobrescribe)
            if codigo not in lista_cursos_unicos:
                lista_cursos_unicos[codigo] = {
                    'codigo': codigo,
                    'nombre': nombre,
                    'creditos': creditos,
                    'semestre': semestre,
                    'es_obligatorio': es_obligatorio
                }

            # B. Llenar lista de Carrera_Cursos (Relación)
            lista_carrera_cursos.append({
                'id': relacion_id_counter,
                'carrera_id': carrera_id,
                'codigo_curso_id': codigo
            })
            relacion_id_counter += 1

    # 3. Crear DataFrames finales
    df_cursos = pd.DataFrame(list(lista_cursos_unicos.values()))
    df_relaciones = pd.DataFrame(lista_carrera_cursos)

    # 4. Exportar a CSV
    df_cursos.to_csv('tabla_cursos.csv', index=False, encoding='utf-8')
    df_relaciones.to_csv('tabla_carrera_cursos.csv', index=False, encoding='utf-8')

    print("\n¡Proceso completado!")
    print(f"Total cursos únicos encontrados: {len(df_cursos)}")
    print(f"Total relaciones carrera-curso creadas: {len(df_relaciones)}")

if __name__ == "__main__":
    procesar_pensums()