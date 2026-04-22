import { IndividuoInterno } from "./Poblacion";

export class Seleccion {

  // Torneo (k=3): compara k individuos al azar y devuelve el de mayor fitness.
  static torneo(poblacion: IndividuoInterno[], k = 3): IndividuoInterno {
    let mejor = poblacion[Math.floor(Math.random() * poblacion.length)];
    for (let i = 1; i < k; i++) {
      const candidato = poblacion[Math.floor(Math.random() * poblacion.length)];
      if (candidato.fitness > mejor.fitness) mejor = candidato;
    }
    return mejor;
  }

  // Ruleta: probabilidad de selección proporcional al fitness (maneja negativos).
  static ruleta(poblacion: IndividuoInterno[]): IndividuoInterno {
    const minFitness = Math.min(...poblacion.map(i => i.fitness));
    const offset = minFitness < 0 ? -minFitness + 1 : 0;
    const total = poblacion.reduce((s, i) => s + i.fitness + offset, 0);
    let rand = Math.random() * total;
    for (const individuo of poblacion) {
      rand -= individuo.fitness + offset;
      if (rand <= 0) return individuo;
    }
    return poblacion[poblacion.length - 1];
  }

  // Selecciona n individuos aplicando torneo o ruleta con reemplazo.
  static seleccionarN(
    poblacion: IndividuoInterno[],
    n: number,
    metodo: 'torneo' | 'ruleta',
  ): IndividuoInterno[] {
    const resultado: IndividuoInterno[] = [];
    for (let i = 0; i < n; i++) {
      resultado.push(
        metodo === 'ruleta'
          ? Seleccion.ruleta(poblacion)
          : Seleccion.torneo(poblacion),
      );
    }
    return resultado;
  }
}
