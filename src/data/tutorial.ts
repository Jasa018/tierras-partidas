/**
 * Campo de entrenamiento: pisos fijos (no aleatorios) con carteles que explican cada mecánica al pisarlos.
 * Generado por un script a partir del plano; leyenda en DungeonRun.buildFixedFloor.
 *   # muro · . suelo · @ inicio · > escaleras · s limo · l lobo · p pan · o poción · b bomba · g oro · k llave roja
 *   x poción mayor · D puerta roja · ^ trampa visible · v trampa oculta · % grieta · H muralla · L palanca
 *   " hierba · ~ agua · , barro · * hielo · } corriente al este · f niebla · 1-9 cartel
 */
export interface FixedFloor {
  name: string;
  rows: string[];
  /** Salas [x, y, ancho, alto]. */
  rooms: [number, number, number, number][];
  /** Salas secretas (tras una muralla). */
  secrets: [number, number, number, number][];
  signs: Record<string, { title: string; lines: string[] }>;
}

export const TUTORIAL_FLOORS: FixedFloor[] = [
  {
    "name": "Lo básico",
    "rows": [
      "##################################",
      "##################################",
      "##....1..#####.........###########",
      "##.......#####.3.......####.....##",
      "##..@......2.......s...####.5...##",
      "##.......#####..........4.....>.##",
      "##.p.....#####.........####.....##",
      "##############..o......####.....##",
      "##################################",
      "##################################"
    ],
    "rooms": [
      [
        2,
        2,
        7,
        5
      ],
      [
        14,
        2,
        9,
        6
      ],
      [
        27,
        3,
        5,
        5
      ]
    ],
    "secrets": [],
    "signs": {
      "1": {
        "title": "Moverse y mirar",
        "lines": [
          "Muévete con las flechas o WASD; en diagonal con Q, E, Z y C.",
          "La flecha roja indica hacia dónde miras. Mantén Mayús para girar sin moverte.",
          "Pisa cada cartel como este para aprender algo nuevo."
        ]
      },
      "2": {
        "title": "Los turnos",
        "lines": [
          "Cada cosa que haces es un turno, y entonces todos se mueven: aliados y monstruos.",
          "En un pasillo solo te puede atacar un enemigo de frente."
        ]
      },
      "3": {
        "title": "Atacar y recoger",
        "lines": [
          "Ataca al frente con Espacio, o chocando con el enemigo.",
          "Al pisar un objeto lo recoges. La bolsa (I) tiene pociones y comida.",
          "Prueba a beber la poción si te hieren."
        ]
      },
      "4": {
        "title": "Hambre y provisiones",
        "lines": [
          "Las provisiones bajan cada turno, más deprisa cuanto más grande es el grupo.",
          "A 0, todos pierden vida. Lleva siempre comida: el pan de la primera sala sirve."
        ]
      },
      "5": {
        "title": "Las escaleras y el mapa",
        "lines": [
          "Pisa la casilla dorada para bajar. Con V cambias el mapa: en la esquina, a pantalla completa u oculto.",
          "Normalmente, a los 3 minutos llega la Parca a cada piso: baja antes. Aquí no viene."
        ]
      }
    }
  },
  {
    "name": "Terrenos y trampas",
    "rows": [
      "####################################",
      "####################################",
      "##.......####.....****####....fff###",
      "##....1..####2....****####.5...ff###",
      "##..@.................####.....>.###",
      "##.......####..~~~~.3.4.%........###",
      "##\"\".....####..~~~~...####}}}}}}}###",
      "##\"\"\"....####,,.....^.####}}}}}}}###",
      "#############,,..v....####.......###",
      "####################################",
      "####################################"
    ],
    "rooms": [
      [
        2,
        2,
        7,
        6
      ],
      [
        13,
        2,
        9,
        7
      ],
      [
        26,
        2,
        7,
        7
      ]
    ],
    "secrets": [],
    "signs": {
      "1": {
        "title": "Hierba alta",
        "lines": [
          "El suelo cambia. En la hierba alta (abajo a la izquierda) los monstruos no te ven de lejos... ni tú a ellos."
        ]
      },
      "2": {
        "title": "Agua, barro y hielo",
        "lines": [
          "El agua apaga el fuego. Salir del barro cuesta un turno más. En el hielo resbalas en línea recta hasta chocar.",
          "Cada terreno explica lo que hace la primera vez que lo pisas."
        ]
      },
      "3": {
        "title": "Trampas",
        "lines": [
          "Las trampas son invisibles hasta que alguien las pisa. Esa de pinchos ya la ves: rodéala.",
          "Hay otra escondida en esta sala. Pip, más adelante, las descubre antes de pisarlas."
        ]
      },
      "4": {
        "title": "Paredes agrietadas",
        "lines": [
          "Esa pared tiene grietas: mírala y golpéala con Espacio para abrir paso.",
          "A veces las grietas son atajos; otras veces tapan la sala de las escaleras."
        ]
      },
      "5": {
        "title": "Corrientes y niebla",
        "lines": [
          "Las corrientes empujan cada dos turnos. En la niebla solo ves lo que tienes al lado."
        ]
      }
    }
  },
  {
    "name": "Llaves, condiciones y secretos",
    "rows": [
      "######################################",
      "######################################",
      "##.......####.......H.g.##############",
      "##.......####.2.....#..x#.......##...#",
      "##..@...............#####.3.....##...#",
      "##.......####.......#####........4.>.#",
      "##...1...####..b.k......D.......##...#",
      "##.......####.......#####.......##...#",
      "#########################....L..######",
      "#########################.......######",
      "######################################",
      "######################################"
    ],
    "rooms": [
      [
        2,
        2,
        7,
        6
      ],
      [
        13,
        2,
        7,
        6
      ],
      [
        25,
        3,
        7,
        7
      ],
      [
        34,
        3,
        3,
        5
      ]
    ],
    "secrets": [
      [
        21,
        2,
        3,
        2
      ]
    ],
    "signs": {
      "1": {
        "title": "Candados y llaves",
        "lines": [
          "Más adelante hay una puerta con candado. Su llave está en este mismo piso, en otra sala.",
          "Las llaves solo sirven en su piso: salen arriba, bajo el resumen."
        ]
      },
      "2": {
        "title": "Murallas y salas secretas",
        "lines": [
          "Esa muralla reforzada (arriba a la derecha) no se rompe a golpes: hace falta una bomba.",
          "Coge la bomba, mira hacia la muralla y lánzala desde la bolsa (I). Detrás hay tesoro."
        ]
      },
      "3": {
        "title": "Condiciones de las escaleras",
        "lines": [
          "A veces las escaleras están cerradas hasta cumplir algo: una palanca, braseros, una llave, cazar monstruos...",
          "Aquí basta con la palanca de esta sala. Arriba en pantalla siempre sale lo que falta."
        ]
      },
      "4": {
        "title": "El informante",
        "lines": [
          "Más adelante, antes de cada mazmorra, un informante os venderá datos: escaleras, trampas, llaves, el jefe...",
          "Pagas solo lo que quieras saber."
        ]
      }
    }
  },
  {
    "name": "Compañeros y combate",
    "rows": [
      "####################################",
      "####################################",
      "##........####...........###########",
      "##....1...####........l..###########",
      "##........####.....s.....####.....##",
      "##..@.......3............####.5...##",
      "##........####.......s..........>.##",
      "##......2.####....s......####.....##",
      "##........####.4.........####.....##",
      "##############...........###########",
      "####################################",
      "####################################"
    ],
    "rooms": [
      [
        2,
        2,
        8,
        7
      ],
      [
        14,
        2,
        11,
        8
      ],
      [
        29,
        4,
        5,
        5
      ]
    ],
    "secrets": [],
    "signs": {
      "1": {
        "title": "Habilidades y equipo",
        "lines": [
          "Las teclas 1 a 4 usan habilidades; gastan energía, que se recupera poco a poco. T abre la ficha del grupo.",
          "Cada elemento hace ×1,5 de daño contra el que es débil: mira el elemento de cada monstruo."
        ]
      },
      "2": {
        "title": "Los compañeros",
        "lines": [
          "Tus aliados actúan solos según su táctica (Esc → Tácticas). Con L cambias de líder sin gastar turno.",
          "Si cae un compañero, vuelve al descansar. Si cae Aren, la incursión termina."
        ]
      },
      "3": {
        "title": "Piloto automático",
        "lines": [
          "Con P el líder juega solo: explora, recoge, combate y baja. Cualquier tecla lo detiene.",
          "Úsalo para pisos fáciles; en los difíciles, mejor tú."
        ]
      },
      "4": {
        "title": "Grupos de enemigos",
        "lines": [
          "Contra varios a la vez, retrocede a un pasillo o usa habilidades que golpean a todos los que tienes alrededor."
        ]
      },
      "5": {
        "title": "Fin del entrenamiento",
        "lines": [
          "¡Ya conoces lo básico! Las mazmorras de verdad se generan al azar cada vez que entras.",
          "Puedes repetir este campo desde el gremio cuando quieras."
        ]
      }
    }
  }
];
