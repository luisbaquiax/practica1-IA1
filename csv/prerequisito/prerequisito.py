import pandas as pd
import os

def generar_csv_prerequisitos():
    # 1. Lista de archivos de prerequisitos
    archivos_prre = [
        'prre_civil.csv',
        'prre_industrial.csv',
        'prre_mecanica.csv',
        'prre_sistemas.csv'
    ]

    # Estructuras para los datos
    lista_prerequisitos = []
    # Usamos un set para rastrear combinaciones únicas (curso, prerequisito)
    # y evitar filas repetidas si varias carreras comparten la misma regla
    combinaciones_vistas = set()
    id_counter = 1

    print("Iniciando procesamiento de prerequisitos...")

    # 2. Iterar sobre cada archivo
    for nombre_archivo in archivos_prre:
        if not os.path.exists(nombre_archivo):
            print(f"Advertencia: No se encontró el archivo {nombre_archivo}")
            continue
        
        # Leer el CSV
        # Nota: si los archivos tienen separadores distintos o encodings, ajustarlos aquí
        df = pd.read_csv(nombre_archivo)

        for _, fila in df.iterrows():
            try:
                # Extraer valores según la estructura: carrera,curso,prerequisito,id_carrera
                codigo_curso = int(fila['curso'])
                codigo_prre = int(fila['prerequisito'])

                # 3. Validar si la combinación ya existe para no duplicar en la tabla SQL
                par_relacion = (codigo_curso, codigo_prre)

                if par_relacion not in combinaciones_vistas:
                    lista_prerequisitos.append({
                        'id': id_counter,
                        'codigo_curso_id': codigo_curso,
                        'codigo_curso_prre': codigo_prre
                    })
                    combinaciones_vistas.add(par_relacion)
                    id_counter += 1
            except ValueError:
                # Por si hay valores nulos o no numéricos en los códigos
                continue

    # 4. Crear DataFrame y exportar
    if lista_prerequisitos:
        df_final = pd.DataFrame(lista_prerequisitos)
        
        # Guardar el CSV resultante
        nombre_salida = 'tabla_prerequisitos.csv'
        df_final.to_csv(nombre_salida, index=False, encoding='utf-8')
        
        print(f"\n¡Proceso completado con éxito!")
        print(f"Archivo generado: {nombre_salida}")
        print(f"Total de reglas de prerequisitos únicas: {len(df_final)}")
    else:
        print("No se encontraron datos para procesar.")

if __name__ == "__main__":
    generar_csv_prerequisitos()