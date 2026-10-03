const exercises = [
  {
    id: "m1-e1",
    moduleId: 1,
    type: "single-choice",
    title: "¿Cuál letra escuchaste?",
    instruction: "Escucha con mucha atención. ¿Cuál letra suena como m de mesa?",
    prompt: "Selecciona la letra correcta.",
    options: ["M", "P", "S", "T"],
    correctAnswer: "M",
    feedback: {
      correct: "🌟 ¡Excelente! Esa es la letra M.",
      incorrect: "💡 ¡Inténtalo otra vez! Escucha el sonido y piensa en la primera letra de mesa."
    }
  },
  {
    id: "m2-e1",
    moduleId: 2,
    type: "single-choice",
    title: "Encuentra la letra",
    instruction: "Toca la letra que suena como b de bota.",
    prompt: "Elige la letra correcta.",
    options: ["b", "d"],
    correctAnswer: "b",
    feedback: {
      correct: "🌟 ¡Muy bien! Elegiste la b.",
      incorrect: "💡 Casi. Mira hacia qué lado está la pancita de la letra y escucha otra vez."
    }
  },
  {
    id: "m3-e1",
    moduleId: 3,
    type: "build-syllable",
    title: "Construye la sílaba",
    instruction: "Une la M con la A para formar MA.",
    prompt: "Selecciona la vocal que completa M + __ = MA.",
    options: ["A", "E", "I", "O"],
    correctAnswer: "A",
    feedback: {
      correct: "🌟 ¡Lo lograste! M más A forman MA.",
      incorrect: "💡 Esa vocal forma otra sílaba. Busca la A para formar MA."
    }
  },
  {
    id: "m4-e1",
    moduleId: 4,
    type: "order-syllables",
    title: "Construye la palabra",
    instruction: "Mira la imagen y ordena las sílabas para formar MESA.",
    prompt: "Ordena las sílabas.",
    options: ["SA", "ME"],
    correctAnswer: ["ME", "SA"],
    visualHint: "🪑",
    wordHint: "mesa",
    feedback: {
      correct: "🎉 ¡Excelente! Formaste ME-SA: MESA.",
      incorrect: "💡 Escucha: ME-SA. Intenta poner primero ME y después SA."
    }
  }
];

module.exports = exercises;
