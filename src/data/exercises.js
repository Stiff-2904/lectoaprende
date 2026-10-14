// Banco breve de actividades para primer grado. Las respuestas sólo se devuelven al servidor.
const make = (moduleId, n, title, instruction, prompt, options, correctAnswer, correct, incorrect, extra = {}) => ({
  id:`m${moduleId}-e${n}`, moduleId,
  type: moduleId === 4 ? 'order-syllables' : moduleId === 3 ? 'build-syllable' : 'single-choice',
  title, instruction, prompt, options, correctAnswer,
  feedback:{correct, incorrect}, ...extra
});
const exercises = [
  // Letras: el ejemplo oral contextualiza la letra sin fingir que el TTS pronuncia fonemas aislados.
  make(1,1,'M de mano','Busca la letra inicial de mano. Mano comienza con M.','¿Con qué letra empieza MANO?',['M','P','S','L'],'M','¡Muy bien! Mano comienza con M.','Escucha: mano comienza con M. Vuelve a mirar.'),
  make(1,2,'P de pato','Escucha la palabra pato. Pato comienza con P.','¿Con qué letra empieza PATO?',['B','P','T','M'],'P','¡Genial! Pato comienza con P.','Casi. La palabra pato comienza con P.'),
  make(1,3,'S de sol','Escucha: sol. Sol comienza con S.','¿Cuál es la primera letra de SOL?',['S','L','M','A'],'S','¡Exacto! S es la primera letra de sol.','Intenta de nuevo. Sol comienza con S.'),
  make(1,4,'L de luna','Escucha la palabra luna. Luna comienza con L.','¿Con qué letra empieza LUNA?',['P','T','L','S'],'L','¡Excelente! Luna empieza con L.','Muy cerca. Escucha: luna empieza con L.'),
  make(1,5,'T de taza','Escucha: taza. Taza comienza con T.','¿Con qué letra empieza TAZA?',['M','T','D','P'],'T','¡Fantástico! Taza comienza con T.','Puedes lograrlo. Taza comienza con T.'),
  // Discriminación visual (no se atribuyen sonidos distintos a b y v en español latinoamericano).
  make(2,1,'Encuentra la b','Observa las letras. Busca la b minúscula, como en bota.','Toca la letra b.',['b','d'],'b','¡Bien! Encontraste la b.','Mira con calma: la b tiene el palito primero.'),
  make(2,2,'Encuentra la d','Observa las letras. Busca la d minúscula, como en dado.','Toca la letra d.',['b','d'],'d','¡Perfecto! Encontraste la d.','Fíjate: en la d, el círculo va primero.'),
  make(2,3,'Encuentra la p','Busca la p minúscula, como en pato.','Toca la letra p.',['p','q'],'p','¡Lo conseguiste! Encontraste la p.','Observa la forma y vuelve a intentarlo.'),
  make(2,4,'Encuentra la q','Busca la q minúscula, como en queso.','Toca la letra q.',['p','q'],'q','¡Muy bien! Esa es la q.','Mira la dirección de su palito.'),
  make(2,5,'Encuentra la m','Busca la m minúscula, como en mamá.','Toca la letra m.',['n','m'],'m','¡Bravo! Encontraste la m.','La m tiene dos montañitas. Intenta otra vez.'),
  // Sílabas consonante-vocal. El texto explica la combinación con voz natural.
  make(3,1,'Formo MA','Junta M con A. M con A forma MA.','M + ___ = MA',['A','E','O','U'],'A','¡Muy bien! Formaste MA.','Escucha: M con A, MA. Busca A.'),
  make(3,2,'Formo PE','Junta P con E. P con E forma PE.','P + ___ = PE',['I','A','E','O'],'E','¡Excelente! Formaste PE.','Escucha: P con E, PE. Busca E.'),
  make(3,3,'Formo SI','Junta S con I. S con I forma SI.','S + ___ = SI',['I','U','O','A'],'I','¡Lo lograste! Formaste SI.','S con I forma SI. Busca I.'),
  make(3,4,'Formo LO','Junta L con O. L con O forma LO.','L + ___ = LO',['E','O','I','U'],'O','¡Genial! Formaste LO.','L con O forma LO. Busca O.'),
  make(3,5,'Formo TU','Junta T con U. T con U forma TU.','T + ___ = TU',['A','E','I','U'],'U','¡Perfecto! Formaste TU.','T con U forma TU. Busca U.'),
  // Palabras de dos sílabas; la pista textual y visual facilita comprensión.
  make(4,1,'La mesa','Ordena ME y SA para formar MESA.','Forma la palabra MESA.',['SA','ME'],['ME','SA'],'¡Excelente! Formaste MESA.','Prueba primero ME y después SA.',{visualHint:'🪑',wordHint:'MESA'}),
  make(4,2,'La sopa','Ordena SO y PA para formar SOPA.','Forma la palabra SOPA.',['PA','SO'],['SO','PA'],'¡Muy bien! Formaste SOPA.','Escucha: SO, PA. Intenta de nuevo.',{visualHint:'🥣',wordHint:'SOPA'}),
  make(4,3,'La luna','Ordena LU y NA para formar LUNA.','Forma la palabra LUNA.',['NA','LU'],['LU','NA'],'¡Qué bien! Formaste LUNA.','Escucha: LU, NA. Intenta otra vez.',{visualHint:'🌙',wordHint:'LUNA'}),
  make(4,4,'El sapo','Ordena SA y PO para formar SAPO.','Forma la palabra SAPO.',['PO','SA'],['SA','PO'],'¡Bravo! Formaste SAPO.','Escucha: SA, PO. Intenta otra vez.',{visualHint:'🐸',wordHint:'SAPO'}),
  make(4,5,'La pelota','Ordena PE, LO y TA para formar PELOTA.','Forma la palabra PELOTA.',['TA','PE','LO'],['PE','LO','TA'],'¡Fantástico! Formaste PELOTA.','Recuerda: PE, LO, TA.',{visualHint:'⚽',wordHint:'PELOTA'})
];
module.exports = exercises;
