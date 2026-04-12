import { IndividuoInterno } from "./Poblacion";

export class Seleccion {

  /**
   * Selección por torneo (k=3).
   * Elige aleatoriamente k individuos y devuelve el de mayor fitness.
   */
  static torneo(poblacion: IndividuoInterno[], k = 3): IndividuoInterno {
    let mejor = poblacion[Math.floor(Math.random() * poblacion.length)];
    for (let i = 1; i < k; i++) {
      const candidato = poblacion[Math.floor(Math.random() * poblacion.length)];
      if (candidato.fitness > mejor.fitness) mejor = candidato;
    }
    return mejor;
  }

  /**
   * Selección por ruleta (fitness proporcional).
   * Maneja fitness negativos desplazando al mínimo.
   */
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
}
